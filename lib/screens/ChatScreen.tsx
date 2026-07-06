import React, { useState } from 'react'
import {
  Alert, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import * as Haptics from 'expo-haptics'
import { ProfilePreviewSheet } from '../components/ProfilePreviewSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { s } from '../feed-styles'
import { prettyEventTime } from '../feed-helpers'
import { FLAG_MAP } from '../feed-constants'
import { supabase } from '../supabase'

const { width: W } = Dimensions.get('window')

const formatChatDateLabel = (dateStr: string) => {
  if (!dateStr) return ''
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const d = new Date(dateStr)
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function ChatScreen(props: any) {
  const {
    openChat, setOpenChat,
    chatInput, setChatInput,
    chatMessages, setChatMessages,
    replyTo, setReplyTo, replyToRef,
    chatList, setChatList,
    groupMembersOpen, setGroupMembersOpen,
    chatPartnerPreview, setChatPartnerPreview,
    chatKeyboardVisible, chatSpacerH,
    blockedIds, setReportTarget,
    scrollRef, chatBodyMaxH, chatBodyCurH,
    officialEventChatMapRef, cancelledEventIdsRef,
    userData,
    userCreatedEvents, setUserCreatedEvents,
    dbCommunityEvents, feedOfficialDbEvents,
    joinedEvents, setJoinedEvents,
    setPendingJoinRequests, setApprovedJoiners,
    setCancelledEventIds, setOfficialEventChatMap,
    insets,
    handleSend, handleBlock, showToast,
  } = props

  // Branded confirmation dialogs replace the native Alert flows the trash
  // icon used to trigger. Two mutually exclusive dialogs — hosted event
  // owner sees 'Cancel event?', member sees 'Leave chat?' — so a simple
  // union type keeps state minimal.
  const [chatMenuDialog, setChatMenuDialog] = useState<null | 'cancelEvent' | 'leaveChat'>(null)

  if (!openChat) return null

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={() => { setOpenChat(null); setReplyTo(null) }}>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent />
      <View style={{ flex: 1, backgroundColor: '#F0F2F5' }} onLayout={(e: any) => {
          const h = e.nativeEvent.layout.height
          chatBodyCurH.current = h
          if (h > chatBodyMaxH.current) chatBodyMaxH.current = h
        }}>
        {/* Header extends behind status bar */}
        <View style={{ backgroundColor: '#fff', paddingTop: insets.top, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }}>
          <View style={s.chatHeader}>
            <TouchableOpacity onPress={() => { setOpenChat(null); setReplyTo(null) }} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={26} color="#1E1B4B" />
            </TouchableOpacity>
            {openChat.type === 'duo' ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 6 }}
                onPress={() => { if (openChat.partnerProfile) { setChatPartnerPreview(openChat.partnerProfile); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) } }}
                activeOpacity={openChat.partnerProfile ? 0.7 : 1}
              >
                <View style={[s.chatHeaderAvatar, { backgroundColor: openChat.color, alignItems: 'center', justifyContent: 'center' }]}>
                  {openChat.photo ? <Image source={{ uri: openChat.photo }} style={{ width: '100%', height: '100%', borderRadius: 20 }} /> : <Text style={{ fontSize: 20 }}>👤</Text>}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E1B4B', letterSpacing: -0.2 }} numberOfLines={1}>
                    {`${openChat.name}, ${openChat.age}`}
                  </Text>
                  {(() => {
                    // Match the group-chat subtitle: event + date. Duo chats often miss
                    // eventRefId (older rows have no event_id), so fall back to title match.
                    const chatEvId = openChat.eventRefId || openChat.communityEventId || openChat.hostEventId
                    const pool = [...userCreatedEvents, ...dbCommunityEvents, ...feedOfficialDbEvents]
                    const ev = chatEvId
                      ? pool.find((e: any) => e.id === chatEvId || e._dbId === chatEvId)
                      : (openChat.event ? pool.find((e: any) => e.title === openChat.event) : null)
                    const dateStr = prettyEventTime(ev?.date_label || ev?.time_label || ev?.time) || ''
                    const subtitle = [openChat.event, dateStr].filter(Boolean).join(' · ')
                    return (
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                        {openChat.eventEmoji} {subtitle}
                      </Text>
                    )
                  })()}
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 6 }}
                onPress={async () => {
                  setGroupMembersOpen(true)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  // Fetch fresh transport for all members
                  const evRefId = openChat?.eventRefId || Object.entries(officialEventChatMapRef.current).find(([, cId]) => cId === openChat?.id)?.[0]
                  if (evRefId) {
                    const { data: att } = await supabase.from('event_attendees').select('profile_id, transport').eq('event_ref_id', Number(evRefId))
                    if (att) {
                      const tMap: Record<number, string> = Object.fromEntries(att.map((a: any) => [a.profile_id, a.transport]))
                      setOpenChat((cur: any) => cur ? { ...cur, memberProfiles: (cur.memberProfiles || []).map((p: any) => ({ ...p, transport: tMap[p.id] || p.transport || null })) } : cur)
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                {openChat.eventImage ? (
                  <Image source={{ uri: openChat.eventImage }} style={{ width: 42, height: 42, borderRadius: 12 }} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={[
                      ((openChat.colors || [])[0] && typeof (openChat.colors || [])[0] === 'string') ? (openChat.colors || [])[0] : '#818CF8',
                      ((openChat.colors || [])[1] && typeof (openChat.colors || [])[1] === 'string') ? (openChat.colors || [])[1] : '#6366F1',
                    ]}
                    style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{openChat.eventEmoji || '🎉'}</Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E1B4B', letterSpacing: -0.2 }} numberOfLines={1}>{openChat.event}</Text>
                  {(() => {
                    const chatEvId = openChat.hostEventId || openChat.communityEventId || openChat.eventRefId
                    const ev = chatEvId ? [...userCreatedEvents, ...dbCommunityEvents, ...feedOfficialDbEvents].find((e: any) => e.id === chatEvId || e._dbId === chatEvId) : null
                    const dateStr = prettyEventTime(ev?.date_label || ev?.time_label || ev?.time) || ''
                    const venueShort = (ev?.location || ev?.venue || '').split(',')[0].trim()
                    const dateAndVenue = [dateStr, venueShort].filter(Boolean).join(' · ')
                    // openChat.members is the TOTAL count (including me). memberProfiles
                    // is OTHERS (excluding me). Use members directly; falling back to
                    // memberProfiles+1 only when members is missing.
                    const totalCount = openChat.members ?? ((openChat.memberProfiles?.length || 0) + 1)
                    return (
                      <>
                        {!!dateAndVenue && (
                          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }} numberOfLines={1}>{dateAndVenue}</Text>
                        )}
                        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }} numberOfLines={1}>Crew chat · {totalCount} members</Text>
                      </>
                    )
                  })()}
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ padding: 6 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                setChatMenuDialog(openChat.hostEventId ? 'cancelEvent' : 'leaveChat')
              }}>
              <Feather name="more-vertical" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

          {(() => {
            const chatEvId = openChat.hostEventId || openChat.communityEventId
            const chatEv = chatEvId ? [...userCreatedEvents, ...dbCommunityEvents].find((e: any) => e.id === chatEvId) : null
            const isExpired = chatEv?.expiresAt > 0 && chatEv.expiresAt < Date.now()
            if (!isExpired) return null
            // Post-event grace: 7 days. Long enough for everyone to share photos
            // and chat about how it went, then chat auto-deletes. Users can also
            // long-press in the Chats list to leave manually before then.
            // Prefer event-based calculation — chatExpiresAt is stored at create
            // time and may carry a stale 24h value from earlier builds, so use it
            // only as a final fallback when we can't resolve the event.
            const expiresAt = (chatEv?.expiresAt ? chatEv.expiresAt + 7 * 24 * 60 * 60 * 1000 : 0) || openChat.chatExpiresAt || 0
            const msLeft = expiresAt ? Math.max(0, expiresAt - Date.now()) : 0
            const daysLeft = Math.ceil(msLeft / (24 * 3600 * 1000))
            const hoursLeft = Math.ceil(msLeft / 3600000)
            const expiryText =
              msLeft <= 0 ? 'This chat will be deleted soon.'
              : daysLeft > 1 ? `This event has ended. Chat deletes in ${daysLeft} days.`
              : hoursLeft <= 1 ? 'This event has ended. Chat deletes in less than 1 hour.'
              : `This event has ended. Chat deletes in ${hoursLeft}h.`
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(100,116,139,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                <Text style={{ fontSize: 14 }}>🗂️</Text>
                <Text style={{ fontSize: 12, color: '#64748B', flex: 1, lineHeight: 17 }}>{expiryText}</Text>
              </View>
            )
          })()}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
              {/* Pinned crew info block — group chats only */}
              {openChat.type !== 'duo' && (
                <View style={{ backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.18)', borderRadius: 16, padding: 14, marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#5B21B6', marginBottom: 4 }}>You matched for this event ✨</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: '#6D28D9', lineHeight: 17 }}>Use the chat to coordinate meeting and transport.</Text>
                </View>
              )}
              {(chatMessages[openChat.id] || []).map((msg: any, i: number) => {
                const allMsgs = (chatMessages[openChat.id] || [])
                const prevMsg = allMsgs[i - 1]
                const showDateSep = msg.date && msg.date !== prevMsg?.date
                // Blocked-sender messages stay in place (so replies keep context)
                // but their content is replaced with a neutral placeholder.
                const _senderId = msg._senderId ?? msg.senderId
                const isHidden = msg.from === 'them' && _senderId != null && blockedIds.has(_senderId)
                const bodyText = isHidden ? 'Hidden message' : msg.text
                return (
                <React.Fragment key={i}>
                  {showDateSep && (
                    <View style={{ alignItems: 'center', marginVertical: 8 }}>
                      <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(100,116,139,0.12)', borderRadius: 99 }}>
                        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>{formatChatDateLabel(msg.date)}</Text>
                      </View>
                    </View>
                  )}
                <View style={{ marginBottom: 10, alignItems: msg.from === 'system' ? 'center' : msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                  {msg.from === 'system' && (
                    <View style={{ paddingHorizontal: 14, paddingVertical: 5, backgroundColor: 'rgba(100,116,139,0.1)', borderRadius: 99 }}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>{msg.text}</Text>
                    </View>
                  )}

                  {msg.from === 'them' && openChat.type === 'group' && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                      <Image source={msg.senderPhoto ? { uri: msg.senderPhoto } : undefined} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: msg.senderColor || '#818CF8' }} />
                      <View style={{ maxWidth: W * 0.72 }}>
                        {msg.senderName && <Text style={{ fontSize: 11, color: msg.senderColor || '#818CF8', fontWeight: '600', marginBottom: 3, marginLeft: 4 }}>{isHidden ? 'Blocked user' : msg.senderName}</Text>}
                        <TouchableOpacity activeOpacity={0.8} disabled={isHidden} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const r = { text: msg.text, senderName: msg.senderName || 'them' }; replyToRef.current = r; setReplyTo(r) }}>
                          <View style={s.msgBubbleThem}>
                            {msg.replyTo && !isHidden && (
                              <View style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: 7, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: '#6366F1' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>{msg.replyTo.senderName}</Text>
                                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={2}>{msg.replyTo.text}</Text>
                              </View>
                            )}
                            <Text style={{ fontSize: 14, color: isHidden ? '#94A3B8' : '#1E1B4B', fontStyle: isHidden ? 'italic' : 'normal', lineHeight: 20 }}>{bodyText}</Text>
                            <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 2 }}>{msg.time}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {msg.from === 'them' && openChat.type === 'duo' && (
                    <View style={{ maxWidth: W * 0.72 }}>
                      <TouchableOpacity activeOpacity={0.8} disabled={isHidden} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const r = { text: msg.text, senderName: msg.senderName || openChat.name || 'them' }; replyToRef.current = r; setReplyTo(r) }}>
                        <View style={s.msgBubbleThem}>
                          {msg.replyTo && !isHidden && (
                            <View style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: 7, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: '#6366F1' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>{msg.replyTo.senderName}</Text>
                              <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={2}>{msg.replyTo.text}</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 14, color: isHidden ? '#94A3B8' : '#1E1B4B', fontStyle: isHidden ? 'italic' : 'normal', lineHeight: 20 }}>{bodyText}</Text>
                          <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 2 }}>{msg.time}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                  {msg.from === 'me' && (
                    <View style={{ maxWidth: W * 0.72 }}>
                      <TouchableOpacity activeOpacity={0.8} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const r = { text: msg.text, senderName: 'You' }; replyToRef.current = r; setReplyTo(r) }}>
                        <View style={s.msgBubbleMe}>
                          {msg.replyTo && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 7, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.6)' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{msg.replyTo.senderName}</Text>
                              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }} numberOfLines={2}>{msg.replyTo.text}</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 14, color: '#fff', lineHeight: 20 }}>{msg.text}</Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 2 }}>{msg.time}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                </React.Fragment>
                )
              })}
            </ScrollView>

            {blockedIds.has(openChat?.partnerProfile?.id) ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 14, paddingBottom: Math.max(insets.bottom + 14, 20), backgroundColor: '#FEF2F2', borderTopWidth: 1, borderTopColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name="slash" size={16} color="#EF4444" />
                <Text style={{ flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '600' }}>You've blocked this user. Unblock them in Settings to send messages.</Text>
              </View>
            ) : (
              <>
                {replyTo && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.15)', gap: 10 }}>
                    <View style={{ width: 3, borderRadius: 2, backgroundColor: '#6366F1', alignSelf: 'stretch' }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>{replyTo.senderName}</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }} numberOfLines={1}>{replyTo.text}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyTo(null)} style={{ padding: 4 }}>
                      <Feather name="x" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={[s.chatInputRow, { paddingBottom: Platform.OS === 'ios' ? (chatKeyboardVisible ? 8 : Math.max(insets.bottom + 6, 16)) : Math.max(insets.bottom, 8) }]}>
                  <TextInput
                    style={s.chatInput} value={chatInput} onChangeText={setChatInput}
                    placeholder={openChat.type === 'duo' ? 'Message...' : 'Message your crew...'} placeholderTextColor="#94A3B8" multiline />
                  <TouchableOpacity
                    style={[s.sendBtn, { backgroundColor: chatInput.trim() ? '#6366F1' : '#E2E8F0' }]}
                    onPress={handleSend} disabled={!chatInput.trim()}>
                    <Ionicons name="arrow-up" size={20} color={chatInput.trim() ? '#fff' : '#94A3B8'} />
                  </TouchableOpacity>
                </View>
                {Platform.OS === 'android' && <View style={{ height: chatSpacerH }} />}
              </>
            )}
          </KeyboardAvoidingView>
      {/* Group members sheet — RENDERED INSIDE chat Modal so it overlays on
          top of the chat on iOS (Modal-over-Modal doesn't work on iOS). */}
      {groupMembersOpen && openChat && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 100, elevation: 100 }}>
          <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }} activeOpacity={1} onPress={() => setGroupMembersOpen(false)} />
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' }}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
            </View>
            <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.08)' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B' }}>{openChat.event}</Text>
              <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '600', marginTop: 2 }}>
                {openChat.eventEmoji} {openChat.members} members
              </Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Math.max(insets.bottom + 16, 40) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.18)' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>😊</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#1E1B4B' }}>You</Text>
              </View>
              {(openChat.memberProfiles || []).map((p: any, i: number) => (
                <TouchableOpacity key={p.id || i} activeOpacity={0.8}
                  onPress={() => {
                    setChatPartnerPreview({
                      ...p,
                      colors: p.colors || [p.color, '#1E1B4B'],
                      flag: p.flag || FLAG_MAP[p.langs?.[0]] || '🌍',
                      langs: (p.langs || []).map((l: string) => FLAG_MAP[l] || l),
                      interests: p.interests || [],
                      goal: p.goal || 'chill',
                      emoji: p.emoji || '👤',
                    })
                    setGroupMembersOpen(false)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.04)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.1)' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: p.color }}>
                    {p.photo
                      ? <Image source={{ uri: p.photo }} style={{ width: '100%', height: '100%' }} />
                      : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>👤</Text></View>}
                  </View>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#1E1B4B' }}>{p.name}{p.age ? `, ${p.age}` : ''}</Text>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      {/* Chat partner profile preview rendered inside chat Modal as an inline
          View overlay (Modal-over-Modal isn't supported on iOS). */}
      {chatPartnerPreview && <ProfilePreviewSheet inline profile={chatPartnerPreview} onClose={() => setChatPartnerPreview(null)} onBlock={handleBlock} onReport={(p: any) => setReportTarget(p)} />}

      {/* Cancel-event confirmation for hosts — same content the previous
          Alert had ('all requests and chats removed'), just in the branded
          dialog. */}
      <ConfirmDialog
        visible={chatMenuDialog === 'cancelEvent'}
        title={`Cancel “${openChat.event || ''}”?`}
        body="All requests and chats will be removed."
        confirmText="Cancel event"
        cancelText="Keep"
        destructive
        onConfirm={() => {
          setChatMenuDialog(null)
          setUserCreatedEvents((prev: any[]) => prev.filter((e: any) => e.id !== openChat.hostEventId))
          setPendingJoinRequests((prev: any) => { const n = { ...prev }; delete n[openChat.hostEventId]; return n })
          setApprovedJoiners((prev: any) => { const n = { ...prev }; delete n[openChat.hostEventId]; return n })
          setChatList((prev: any[]) => prev.filter((c: any) => c.id !== openChat.id))
          setOpenChat(null)
          showToast('All requests and chats removed', 'Event cancelled 🗑️', '🗑️')
        }}
        onClose={() => setChatMenuDialog(null)}
      />

      {/* Leave-chat confirmation for non-host members. Body copy differs
          between duo (private message the partner sees) and group (system
          message the whole group sees). */}
      <ConfirmDialog
        visible={chatMenuDialog === 'leaveChat'}
        title={openChat.type === 'duo' ? `Leave chat with ${openChat.name}?` : `Leave “${openChat.event || ''}”?`}
        body={openChat.type === 'duo'
          ? `${openChat.name || 'They'} will see your plans changed.`
          : "The group will see you've left."}
        confirmText="Leave"
        cancelText="Stay"
        destructive
        onConfirm={() => {
          setChatMenuDialog(null)
          const chatId = openChat.id
          const evId = openChat.communityEventId
          const officialEvRefId = !evId && !openChat.hostEventId ? openChat.eventRefId : null
          if (evId && !openChat.hostEventId && userData?.dbId) {
            supabase.from('join_requests').delete().eq('event_id', evId).eq('requester_id', userData.dbId)
              .then(({ error }: any) => { if (error) console.warn('leave join_request error:', error.message) })
            if (typeof chatId === 'number' && chatId < 1e12) {
              supabase.from('chat_members')
                .delete().eq('chat_id', chatId).eq('profile_id', userData.dbId)
                .then(({ error }: any) => { if (error) console.warn('leave chat_members delete error:', error.message) })
            }
            supabase.from('messages').insert({ community_event_id: evId, sender_id: userData.dbId, text: `${userData.name || 'Someone'} left the group` })
              .then(({ error }: any) => { if (error) console.warn('leave msg error:', error.message) })
            cancelledEventIdsRef.current.add(evId)
            setCancelledEventIds((prev: number[]) => [...new Set([...prev, evId])])
            setJoinedEvents((prev: any) => { const n = { ...prev }; delete n[evId]; return n })
          } else if (officialEvRefId && typeof chatId === 'number' && chatId < 1e12 && userData?.dbId) {
            supabase.from('chat_members')
              .delete().eq('chat_id', chatId).eq('profile_id', userData.dbId)
              .then(async () => {
                const { data: remaining } = await supabase.from('chat_members')
                  .select('profile_id').eq('chat_id', chatId)
                if (!remaining || remaining.length === 0) {
                  supabase.from('chats').delete().eq('id', chatId)
                } else {
                  supabase.from('messages').insert({
                    chat_id: chatId, sender_id: userData.dbId,
                    text: `${userData.name || 'Someone'} left the group`,
                  }).then(({ error }: any) => { if (error) console.warn('leave system msg error:', error.message) })
                }
              })
            cancelledEventIdsRef.current.add(officialEvRefId)
            setCancelledEventIds((prev: number[]) => [...new Set([...prev, officialEvRefId])])
            setJoinedEvents((prev: any) => { const n = { ...prev }; delete n[officialEvRefId]; return n })
            setOfficialEventChatMap((prev: any) => { const n = { ...prev }; delete n[officialEvRefId]; return n })
          }
          setChatMessages((prev: any) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), { from: 'system', text: 'You changed your plans 📅', time: 'now' }],
          }))
          setChatList((prev: any[]) => prev.filter((c: any) => c.id !== chatId))
          setOpenChat(null)
          showToast("They've been notified", 'Plans changed 📅', '📅')
        }}
        onClose={() => setChatMenuDialog(null)}
      />
      </View>
    </Modal>
  )
}
