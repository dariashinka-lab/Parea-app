import { useEffect, useRef, useState } from 'react'
import { Alert, Keyboard, Platform } from 'react-native'
import { supabase } from '../supabase'
import { MOCK_CHATS, MOCK_MESSAGES } from '../feed-constants'
import { setActivePushChatId } from '../push'

// B1: state, refs, blocked-user logic, chat keyboard listener, hydrate-previews effect.
// Realtime subscriptions, fallback poll, broadcasts, invite-related effects stay in
// FeedScreen for now — they'll migrate in B2/B3. Hook surfaces setters so those
// effects can still update local state from outside.
export function useChats({ userDbId, userName, onChatRemoved, lastReadAtMap }: {
  userDbId: string | undefined;
  userName?: string;
  onChatRemoved?: (chat: any) => void;
  lastReadAtMap?: Record<number, number>;
}) {
  const [chatList, setChatList] = useState<any[]>(MOCK_CHATS)
  const [chatMessages, setChatMessages] = useState<Record<number, any[]>>({ ...MOCK_MESSAGES })
  const [openChat, setOpenChat] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatSpacerH, setChatSpacerH] = useState(0)
  const [chatKeyboardVisible, setChatKeyboardVisible] = useState(false)
  const [replyTo, setReplyTo] = useState<{ text: string; senderName: string } | null>(null)
  const [chatPartnerPreview, setChatPartnerPreview] = useState<any>(null)
  const [groupMembersOpen, setGroupMembersOpen] = useState(false)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  // Users who blocked ME — reverse direction. Needed so VibeCheck doesn't surface
  // me to someone who blocked me, and vice-versa: I don't see them as candidates.
  const [blockedByIds, setBlockedByIds] = useState<Set<string>>(new Set())
  const [reportTarget, setReportTarget] = useState<any>(null)

  const chatBodyMaxH = useRef(0)
  const chatBodyCurH = useRef(0)
  const chatListRef = useRef<any[]>([])
  const openChatRef = useRef<any>(null)
  const replyToRef = useRef<{ text: string; senderName: string } | null>(null)
  chatListRef.current = chatList
  openChatRef.current = openChat
  useEffect(() => { replyToRef.current = replyTo }, [replyTo])
  // Tell the push handler which chat is open so it can suppress a duplicate
  // banner for a message in that chat (cleared when the chat closes).
  useEffect(() => { setActivePushChatId(openChat?.id ?? null) }, [openChat])

  // Fetch block relationships involving me — both directions — once on login.
  // Realtime keeps both sides in sync: INSERT/DELETE on blocked_users updates
  // the right Set so the bidirectional filter in VibeCheck reacts immediately.
  useEffect(() => {
    if (!userDbId) return
    // Two queries instead of `.or()` — Supabase or-filter with UUIDs occasionally
    // returns empty even when matching rows exist; splitting is reliable.
    Promise.all([
      supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userDbId),
      supabase.from('blocked_users').select('blocker_id').eq('blocked_id', userDbId),
    ]).then(([{ data: iBlocked }, { data: blockedMe }]) => {
      setBlockedIds(new Set((iBlocked || []).map((r: any) => r.blocked_id)))
      setBlockedByIds(new Set((blockedMe || []).map((r: any) => r.blocker_id)))
    })
    const channel = supabase.channel(`blocked_users_${userDbId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blocked_users', filter: `blocked_id=eq.${userDbId}` }, (payload: any) => {
        const blockerId = payload.new?.blocker_id
        if (blockerId) setBlockedByIds(prev => new Set([...prev, blockerId]))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'blocked_users', filter: `blocked_id=eq.${userDbId}` }, (payload: any) => {
        const blockerId = payload.old?.blocker_id
        if (!blockerId) return
        setBlockedByIds(prev => { const n = new Set(prev); n.delete(blockerId); return n })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userDbId])

  // Chat-side cleanup for block. Returns affected chats so the caller can do
  // event-level cleanup (officialEventChatMap, joinedEvents, event_attendees).
  // Duo chats often miss `eventRefId` (DB rows have no event_id, local entries
  // only carry `event` title), so we pass the chats and let the caller resolve
  // the event by ID or title fallback. The "Blocked" alert fires in FeedScreen
  // after event cleanup completes.
  const blockClearChats = async (profile: any): Promise<{ duoChats: any[]; groupChats: any[] }> => {
    if (!userDbId || !profile?.id) return { duoChats: [], groupChats: [] }
    await supabase.from('blocked_users').upsert({ blocker_id: userDbId, blocked_id: profile.id }, { onConflict: 'blocker_id,blocked_id' })
    setBlockedIds(prev => new Set([...prev, profile.id]))
    // Duo chats with this person — delete entirely on both sides. Find them
    // by querying DB membership (more reliable than relying on local
    // chat.partnerProfile.id, which is sometimes missing after AsyncStorage
    // restore or for chats added via realtime).
    const { data: myMemberships } = await supabase
      .from('chat_members')
      .select('chat_id, chats:chat_id(id, type)')
      .eq('profile_id', userDbId)
    const myDuoChatIds = (myMemberships || [])
      .filter((m: any) => (m.chats as any)?.type === 'duo')
      .map((m: any) => m.chat_id as number)
    const { data: theirMemberships } = myDuoChatIds.length > 0
      ? await supabase.from('chat_members').select('chat_id').eq('profile_id', profile.id).in('chat_id', myDuoChatIds)
      : { data: [] as any[] }
    const sharedDuoChatIds = (theirMemberships || []).map((m: any) => m.chat_id as number)
    const duoChats = chatListRef.current.filter((c: any) =>
      c.type === 'duo' && (sharedDuoChatIds.includes(c.id) || c.partnerProfile?.id === profile.id)
    )
    const duoChatIdsToDelete = new Set([...sharedDuoChatIds, ...duoChats.map((c: any) => c.id)])
    for (const chatId of duoChatIdsToDelete) {
      await supabase.from('messages').delete().eq('chat_id', chatId)
      await supabase.from('chat_members').delete().eq('chat_id', chatId)
      await supabase.from('chats').delete().eq('id', chatId)
    }
    // Group chats: Option A (placeholder-hide). The blocker STAYS in the crew —
    // blocking one person shouldn't eject you from a 15-20 person event chat.
    // Their messages render as "Hidden message" for the blocker (ChatScreen reads
    // blockedIds), and the bidirectional VibeCheck filter keeps them from
    // re-matching. So we don't touch group membership here at all.
    setChatList(prev => prev.filter((c: any) => !duoChatIdsToDelete.has(c.id)))
    // Cancel any pending/accepted crew_invites between us. Without this, after
    // unblock there can be leftover 'pending' invites that resurrect waiting
    // states or "ghost" accepts. Two queries — Supabase or/and with UUIDs misparses.
    await Promise.all([
      supabase.from('crew_invites')
        .update({ status: 'cancelled' })
        .eq('inviter_id', userDbId).eq('invitee_id', profile.id)
        .in('status', ['pending', 'accepted']),
      supabase.from('crew_invites')
        .update({ status: 'cancelled' })
        .eq('inviter_id', profile.id).eq('invitee_id', userDbId)
        .in('status', ['pending', 'accepted']),
    ])
    // groupChats now always empty — we no longer leave groups on block (Option A).
    return { duoChats, groupChats: [] as any[] }
  }

  const handleReport = async (profile: any, reason: string, details?: string) => {
    if (!userDbId || !profile?.id) return
    await supabase.from('reports').insert({ reporter_id: userDbId, reported_id: profile.id, reason, details: details || null })
    Alert.alert('Report submitted', "Thank you. We'll review it shortly.")
  }

  // Realtime: when our chat_members row is deleted (e.g., the other user blocked
  // us and the blocker's handleBlock wiped all memberships + the chat row), drop
  // the chat from our local list immediately. Without this the blocked user keeps
  // a stale chat in their list and sees "can't write" errors only on send.
  useEffect(() => {
    if (!userDbId) return
    // Listen to chats DELETE — when blocker tears down a duo chat, the row
    // disappears here. We can't filter to "only my chats" because chats.event_id
    // realtime filtering requires REPLICA IDENTITY FULL; instead we filter
    // client-side via chatListRef. The payload includes the PK (id) which is
    // all we need to match.
    const channel = supabase.channel(`chats_delete_${userDbId}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chats' }, (payload: any) => {
        const chatId = payload.old?.id
        if (!chatId) return
        const removed = chatListRef.current.find((c: any) => c.id === chatId)
        if (!removed) return  // not one of ours, ignore
        setChatList(prev => prev.filter((c: any) => c.id !== chatId))
        setOpenChat((cur: any) => cur && cur.id === chatId ? null : cur)
        onChatRemoved?.(removed)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userDbId, onChatRemoved])

  // Chat-specific keyboard listener. Android: track spacer so input stays above kb
  // when the layout doesn't shrink under it. iOS: just track visibility.
  useEffect(() => {
    if (Platform.OS === 'android') {
      const show = Keyboard.addListener('keyboardDidShow', e => {
        const kbH = e.endCoordinates.height
        requestAnimationFrame(() => {
          const maxH = chatBodyMaxH.current
          const curH = chatBodyCurH.current
          const containerShrank = maxH > 0 && curH < maxH - 50
          if (!containerShrank) setChatSpacerH(kbH)
        })
      })
      const hide = Keyboard.addListener('keyboardDidHide', () => setChatSpacerH(0))
      return () => { show.remove(); hide.remove() }
    } else {
      const show = Keyboard.addListener('keyboardWillShow', () => setChatKeyboardVisible(true))
      const hide = Keyboard.addListener('keyboardWillHide', () => setChatKeyboardVisible(false))
      return () => { show.remove(); hide.remove() }
    }
  }, [])

  // Hydrate chat previews on mount: pull the latest message per chat so the Chats
  // tab shows accurate lastMsg/time immediately after login, no need to open each.
  useEffect(() => {
    if (!userDbId) return
    const chatIds = chatList.map((c: any) => c.id).filter((id: any) => typeof id === 'number' && id < 1e12)
    if (chatIds.length === 0) return
    let cancelled = false
    ;(async () => {
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('chat_id, text, sender_id, created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
      if (cancelled || !lastMsgs) return
      const latestByChat: Record<number, any> = {}
      for (const m of lastMsgs) if (!latestByChat[m.chat_id]) latestByChat[m.chat_id] = m
      setChatList(prev => prev.map((c: any) => {
        const last = latestByChat[c.id]
        if (!last) return c
        const isMe = last.sender_id === userDbId
        const isSystem = /(left|joined) the group/.test(last.text || '')
        // Telegram-style unread: chat is unread only if latest message is from
        // someone else AND was sent after we last read this chat.
        const lastReadMs = (lastReadAtMap || {})[c.id] || 0
        const lastMsgMs = new Date(last.created_at).getTime()
        const hasUnread = !isMe && !isSystem && lastMsgMs > lastReadMs
        if (isSystem) return { ...c, lastMsg: last.text, time: last.created_at, isNew: false }
        const sender = (c.memberProfiles || []).find((p: any) => p.id === last.sender_id)
        const previewText = isMe
          ? `You: ${last.text}`
          : (sender?.name ? `${sender.name}: ${last.text}` : last.text)
        return { ...c, lastMsg: previewText, time: last.created_at, isNew: hasUnread }
      }))
    })()
    return () => { cancelled = true }
  }, [chatList.map((c: any) => c.id).join(','), userDbId])

  return {
    chatList, setChatList,
    chatMessages, setChatMessages,
    openChat, setOpenChat,
    chatInput, setChatInput,
    chatSpacerH, setChatSpacerH,
    chatKeyboardVisible, setChatKeyboardVisible,
    replyTo, setReplyTo,
    chatPartnerPreview, setChatPartnerPreview,
    groupMembersOpen, setGroupMembersOpen,
    blockedIds, setBlockedIds,
    blockedByIds,
    reportTarget, setReportTarget,
    chatBodyMaxH, chatBodyCurH,
    chatListRef, openChatRef, replyToRef,
    blockClearChats, handleReport,
  }
}
