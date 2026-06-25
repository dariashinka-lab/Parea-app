import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import * as Haptics from 'expo-haptics'
import {
  CalendarDays, MessageCircle, Crown, Trash2, Users, ChevronRight, CheckCircle,
  Clock, X, Check, User,
} from 'lucide-react-native'
import { ChatTeardrop, Car as PhCar, MapPin as PhMapPin, Users as PhUsers, UsersThree as PhUsersThree, Confetti as PhConfetti, HandWaving as PhHand, Sparkle as PhSparkle } from '../phosphor-icons'
import { BoostIcon } from '../components/BoostIcon'
import { ProfilePreviewSheet } from '../components/ProfilePreviewSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MOCK_EVENTS, VIBE_FORMAT_MAX, VIBE_FORMAT_THRESHOLD, FLAG_MAP, CATEGORY_COLOR, CATEGORY_BG } from '../feed-constants'
import { isEventPast, prettyEventTime, parseEventDateTime } from '../feed-helpers'

// Transport chip — Phosphor icon (duotone) matching VibeCheck's RockingTransportPill,
// with the same playful rock on "Need a ride" so the row feels alive. Light theme.
function AnimatedTransportChip({ transportKey, label }: { transportKey: string; label: string }) {
  const rock = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (transportKey !== 'lift') return
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(rock, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(rock, { toValue: -1, duration: 280, useNativeDriver: true }),
      Animated.timing(rock, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.delay(3200),
    ]))
    anim.start()
    return () => anim.stop()
  }, [transportKey])
  const rotate = rock.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] })
  const Icon = transportKey === 'meet' ? PhMapPin : transportKey === 'lift' ? PhHand : PhCar
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(100,116,139,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
      <Animated.View style={transportKey === 'lift' ? { transform: [{ rotate }] } : undefined}>
        <Icon size={13} color="#64748B" weight="duotone" />
      </Animated.View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>{label}</Text>
    </View>
  )
}

// Event thumbnail in the chat list. Remote Storage URLs take a moment to fetch
// (and a freshly-uploaded photo even longer), which left a blank tile. Show a
// gradient + emoji placeholder with a spinner underneath, and fade the photo in
// once it loads so there's never an empty box.
function EventThumb({ uri, emoji, colors }: { uri: string; emoji?: string; colors?: string[] }) {
  const [loaded, setLoaded] = useState(false)
  const c0 = (colors?.[0] && typeof colors[0] === 'string') ? colors[0] : '#818CF8'
  const c1 = (colors?.[1] && typeof colors[1] === 'string') ? colors[1] : '#6366F1'
  return (
    <View style={{ width: 54, height: 54, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
      {!loaded && (
        <LinearGradient colors={[c0, c1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      )}
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%', opacity: loaded ? 1 : 0 }}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
      />
    </View>
  )
}

export function MessagesTab({ chatList, onOpenChat, onLeaveChat, joinedEvents = {}, userEventFormat = {}, userEventTransport = {}, crewsByEvent = {}, officialEventChatMap = {}, onVibeCheck, onLeaveEvent, onUpdatePlans, initialSubTab, hostedEvents = [], approvedJoiners = {}, hostConfirmedMembers = {}, approvedAtMap = {}, onCancelHostedEvent, onPlansOpen, allEvents = [], onEventDetail, eventAttendeesMap = {}, passedRequests = {}, onBlockUser, onReportUser, plansLoading = false, userDbId, boostedEvents = {}, freeBoostsLeft = 0, onBoostEvent }: {
  chatList: any[]; onOpenChat: (c: any) => void; onLeaveChat?: (id: number, addSystemMsg?: boolean) => void;
  plansLoading?: boolean;
  joinedEvents?: Record<number, string>; userEventFormat?: Record<number, string>; userEventTransport?: Record<number, string>; allEvents?: any[]; onEventDetail?: (ev: any) => void;
  crewsByEvent?: Record<number, Array<{ chatId: number; members: any[]; avgMatch: number; format?: string; maxSize?: number }>>;
  officialEventChatMap?: Record<number, number>;
  onVibeCheck?: (ev: any) => void; onLeaveEvent?: (ev: any) => void; onUpdatePlans?: (ev: any) => void;
  initialSubTab?: 'going' | 'messages'; hostedEvents?: any[]; approvedJoiners?: Record<number, any[]>; hostConfirmedMembers?: Record<number, any[]>; approvedAtMap?: Record<number, number>; onCancelHostedEvent?: (ev: any) => void; onPlansOpen?: () => void; eventAttendeesMap?: Record<number, any[]>; passedRequests?: Record<number, string[]>;
  onBlockUser?: (profile: any) => void; onReportUser?: (profile: any) => void;
  userDbId?: string;
  boostedEvents?: Record<number, number>;
  freeBoostsLeft?: number;
  onBoostEvent?: (ev: any) => void;
}) {
  const [subTab, setSubTab] = useState<'going' | 'messages'>(initialSubTab || 'going')
  useEffect(() => { if (initialSubTab) setSubTab(initialSubTab) }, [initialSubTab])
  const [crewSheet, setCrewSheet] = useState<{ ev: any; profiles: any[]; found: number; cap: number } | null>(null)

  const formatChatTime = (time: string) => {
    if (!time || time === 'now') return 'now'
    const d = new Date(time)
    if (isNaN(d.getTime())) return time
    const now = new Date()
    if (now.getTime() - d.getTime() < 60000) return 'now'
    const isToday = d.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isYesterday) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
  const crewSheetAnim = useRef(new Animated.Value(0)).current
  const hasNew = chatList.some(c => c.isNew)
  const [memberPreview, setMemberPreview] = useState<any>(null)
  // Branded cancel-event confirmation (replaces native Alert.alert).
  const [cancelEventTarget, setCancelEventTarget] = useState<any>(null)
  // Same pattern for the 'Can't make it' leave flow on attending events.
  const [leaveEventTarget, setLeaveEventTarget] = useState<any>(null)

  const openCrewSheet = (ev: any, profiles: any[], found: number, cap: number) => {
    setCrewSheet({ ev, profiles, found, cap })
    Animated.spring(crewSheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start()
  }
  const closeCrewSheet = () => {
    Animated.timing(crewSheetAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setCrewSheet(null))
  }

  const now = Date.now()
  // expiresAt > now is the primary check, but old events stored without expiresAt
  // (or with expiresAt=0 because the time string couldn't be parsed at fetch time)
  // need a fallback parse from `time` so a yesterday's event doesn't sit forever.
  // Official events keep their date in `date_label` and `time` is often a placeholder
  // like "-", so check both before falling back to "show it".
  const eventDateStr = (ev: any) => ev.date_label || ev.time || ''
  const isExpiredEv = (ev: any) => ev.expiresAt ? ev.expiresAt <= now : isEventPast(eventDateStr(ev))
  // Exclude events the user is *hosting* — they belong in the Hosting section,
  // not Attending. Without this filter, a host's own event appears twice (once
  // from hostedEvents, once from joinedEvents since the host is in their own
  // chat_members row and the backfill marks them 'confirmed').
  const hostedIds = new Set(hostedEvents.map((e: any) => e.id))
  const joinedAll = [...MOCK_EVENTS, ...allEvents.filter((e: any) => e._fromDb || e.type === 'community')]
    .filter(ev => ['joined', 'pending', 'confirmed'].includes(joinedEvents[ev.id]))
    .filter(ev => !hostedIds.has(ev.id))
  const myEvents = joinedAll.filter(ev => !isExpiredEv(ev))
  const expiredJoinedEvents = joinedAll.filter(ev => isExpiredEv(ev))
  const activeHostedEvents = hostedEvents.filter(ev => !isExpiredEv(ev))
  const expiredHostedEvents = hostedEvents.filter(ev => isExpiredEv(ev))
  const expiredAllEvents = [...expiredHostedEvents, ...expiredJoinedEvents.filter(je => !expiredHostedEvents.some(he => he.id === je.id))]

  // Hide events + chats whose event ended >7 days ago. DB cleanup runs
  // server-side (cron) for the rows themselves; this is a client-side guard so
  // stale data doesn't render even if the DB hasn't been pruned yet on this device.
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
  const isLongDeadEv = (ev: any) => {
    let evStartMs = 0
    if (ev?.expiresAt > 0) evStartMs = ev.expiresAt
    else {
      const parsed = parseEventDateTime(ev?.date_label || ev?.time || '')
      if (parsed) evStartMs = parsed.getTime()
    }
    return evStartMs > 0 && evStartMs + SEVEN_DAYS_MS < now
  }
  const eventPool = [...allEvents, ...hostedEvents]
  // Defensive dedup at render. Catches two patterns:
  //   1. Same chat.id appears twice (different state-update paths each pushed
  //      it without dedup).
  //   2. A local stable-id placeholder for an event sits next to a real DB
  //      chat for the same event — both pass id-dedup because their ids are
  //      different (negative vs positive), but they represent the same chat.
  //      Use the chat's event-pointing fields to fold them.
  // Prefer keeping positive (DB-backed) ids over negative stable-id
  // placeholders by sorting positive-id entries first before dedup.
  const seenChatIds = new Set<any>()
  const seenEventKeys = new Set<string>()
  const dedupedChatList = [...chatList]
    .sort((a: any, b: any) => {
      const aPos = typeof a.id === 'number' && a.id > 0
      const bPos = typeof b.id === 'number' && b.id > 0
      if (aPos && !bPos) return -1
      if (!aPos && bPos) return 1
      return 0
    })
    .filter((c: any) => {
      if (seenChatIds.has(c.id)) return false
      const evId = c.eventRefId ?? c.communityEventId ?? c.hostEventId
      const evKey = evId != null ? `${c.type || 'group'}:ev:${evId}` : null
      if (evKey && seenEventKeys.has(evKey)) return false
      seenChatIds.add(c.id)
      if (evKey) seenEventKeys.add(evKey)
      return true
    })
  const isLongDeadChat = (chat: any) => {
    const evId = chat.eventRefId || chat.communityEventId || chat.hostEventId
    // Try to resolve the linked event. For duo chats event_id is NULL in DB,
    // so fall back to a title match — same pattern as the Expiring badge below.
    const ev = evId
      ? eventPool.find((e: any) => e.id === evId)
      : (chat.event ? eventPool.find((e: any) => e.title === chat.event) : null)
    if (ev) return isLongDeadEv(ev)
    // No event found in the current feed → orphan (event was deleted /
    // unsubscribed / dropped by scraper). If the chat has no peers either
    // (members <= 1, just the user), it's a dead orphan — drop. A real
    // brand-new hosted event still resolves via chat.event title match
    // above, so we don't risk hiding those. We can't gate on chat age
    // because chat.time can be a pre-formatted locale string ('8 июн.')
    // that Date.parse rejects.
    const noPeers = (chat.members || 1) <= 1
    if (noPeers) return true
    return false
  }
  const visibleExpiredEvents = expiredAllEvents.filter((ev: any) => !isLongDeadEv(ev))
  const visibleChats = dedupedChatList.filter(c => !isLongDeadChat(c))

  const FORMAT_CHIP: Record<string, { emoji: string; label: string; color: string }> = {
    '1+1':   { emoji: '👥', label: 'Duo',   color: '#f472b6' },
    'squad': { emoji: '🫂', label: 'Squad', color: '#818CF8' },
    'party': { emoji: '🎉', label: 'Party', color: '#fb923c' },
  }
  const TRANSPORT_CHIP: Record<string, { emoji: string; label: string }> = {
    car:  { emoji: '🚗', label: 'Driving' },
    lift: { emoji: '🙋', label: 'Need a ride' },
    meet: { emoji: '📍', label: 'Meeting there' },
  }

  const todayIso = new Date().toISOString().split('T')[0]
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const isToday = (t: string) => !!t?.startsWith('Today') || !!t?.startsWith(todayIso)
  const isTomorrow = (t: string) => !!t?.startsWith('Tomorrow') || !!t?.startsWith(tomorrowIso)

  const PLANS_COLOR = '#F59E0B'
  const CHATS_COLOR = '#06B6D4'
  const tabAccent = subTab === 'going' ? PLANS_COLOR : CHATS_COLOR

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingTop: 18, paddingHorizontal: 20 }}>
        <View style={{ marginBottom: 22 }}>
          <MaskedView maskElement={
            <Text style={{ fontSize: 44, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, lineHeight: 50, backgroundColor: 'transparent' }}>
              {subTab === 'going' ? 'My Plans' : 'Chats'}
            </Text>
          }>
            <LinearGradient
              colors={subTab === 'going' ? ['#F59E0B', '#FBBF24'] : ['#06B6D4', '#22D3EE']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ fontSize: 44, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, lineHeight: 50, opacity: 0 }}>
                {subTab === 'going' ? 'My Plans' : 'Chats'}
              </Text>
            </LinearGradient>
          </MaskedView>
          <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 8 }}>
            {subTab === 'going'
              ? `${myEvents.length + activeHostedEvents.length} upcoming`
              : `${visibleChats.length} conversation${visibleChats.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 14, padding: 4, marginBottom: 18, gap: 4 }}>
          {(['going', 'messages'] as const).map(id => {
            const isActive = subTab === id
            const label = id === 'going'
              ? `Plans${myEvents.length + activeHostedEvents.length > 0 ? ` · ${myEvents.length + activeHostedEvents.length}` : ''}`
              : `Chats${visibleChats.length > 0 ? ` · ${visibleChats.length}` : ''}`
            return (
              <TouchableOpacity key={id} activeOpacity={0.8}
                onPress={() => { setSubTab(id); Haptics.selectionAsync(); if (id === 'going') onPlansOpen?.() }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                  backgroundColor: isActive ? (id === 'going' ? PLANS_COLOR : CHATS_COLOR) : 'transparent',
                  shadowColor: id === 'going' ? PLANS_COLOR : CHATS_COLOR, shadowOpacity: isActive ? 0.3 : 0, shadowRadius: 8, elevation: isActive ? 4 : 0 }}>
                {id === 'going'
                  ? <CalendarDays size={14} color={isActive ? '#fff' : '#94A3B8'} />
                  : <MessageCircle size={14} color={isActive ? '#fff' : '#94A3B8'} />}
                <Text style={{ fontSize: 13, fontWeight: '800', color: isActive ? '#fff' : '#94A3B8' }}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Going tab */}
      {subTab === 'going' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
          {/* Hosted events section */}
          {activeHostedEvents.length > 0 && (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
                <Crown size={12} color={PLANS_COLOR} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: PLANS_COLOR, letterSpacing: 1, textTransform: 'uppercase' }}>Hosting</Text>
              </View>
              {activeHostedEvents.map((ev: any) => {
                const memberCount = (hostConfirmedMembers[ev.id] || []).length + 1
                const formatLabel = ev.maxParticipants === 2 ? 'Duo' : (ev.maxParticipants <= 5 ? 'Squad' : 'Party')
                // prettyEventTime returns e.g. "22 May, 09:30" — swap the comma
                // for a middle-dot to match the rest of the new card style.
                const whenLabel = (prettyEventTime(ev.time) || '').replace(/,\s*/, ' · ')
                // Read boost from DB field (set when host pays) so every viewer
                // sees FEATURED — not just the host. boostedEvents stays for the
                // local 'just confirmed' state but the source of truth is DB.
                const dbBoostExpiry = ev.boost_expires_at ? new Date(ev.boost_expires_at).getTime() : 0
                const localBoostExpiry = boostedEvents[ev.id] || 0
                const boostExpiry = Math.max(dbBoostExpiry, localBoostExpiry)
                // Force boolean — `0 && expr` returns 0, which leaks into JSX
                // and triggers 'Text strings must be rendered within a <Text>'.
                const isBoosted = boostExpiry > 0 && boostExpiry > Date.now()
                const hoursLeft = isBoosted ? Math.max(0, Math.ceil((boostExpiry - Date.now()) / 3600000)) : 0
                return (
                <View key={ev.id} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1.5, borderColor: isBoosted ? 'rgba(139,92,246,0.45)' : 'rgba(245,158,11,0.2)', shadowColor: isBoosted ? '#A78BFA' : PLANS_COLOR, shadowOpacity: isBoosted ? 0.22 : 0.12, shadowRadius: 16, elevation: 4 }}>
                  <LinearGradient colors={isBoosted ? ['#8B5CF6', '#EC4899'] : ev.gradient as any} style={{ height: 6 }} />
                  <View style={{ padding: 16 }}>
                    {/* FEATURED ribbon when boosted — violet→pink gradient
                        so it doesn't clash with the orange POPULAR sticker and
                        doesn't look like Tinder's flame branding. */}
                    {isBoosted && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 }}>
                          <BoostIcon size={11} color="#fff" />
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.4 }}>FEATURED</Text>
                        </LinearGradient>
                        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>· {hoursLeft}h left</Text>
                      </View>
                    )}
                    {/* Title row with trash on the right */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', flex: 1, letterSpacing: -0.2 }} numberOfLines={2}>{ev.title}</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.()
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                          setCancelEventTarget(ev)
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    {/* "You're hosting" sub-label */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <Crown size={11} color={PLANS_COLOR} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: PLANS_COLOR }}>You're hosting</Text>
                    </View>
                    {/* When + crew row */}
                    <Text style={{ fontSize: 14, color: '#475569', fontFamily: 'Outfit-SemiBold', marginTop: 12 }}>{whenLabel}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', fontFamily: 'Outfit-Medium', marginTop: 2 }}>
                      {formatLabel} · {memberCount}/{ev.maxParticipants} joined
                    </Text>
                    {/* CTA */}
                    <TouchableOpacity activeOpacity={0.85} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEventDetail?.(ev) }}
                      style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: PLANS_COLOR, paddingVertical: 12, borderRadius: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>View event</Text>
                      <ChevronRight size={15} color="#fff" />
                    </TouchableOpacity>
                    {/* Boost CTA — only when event is not currently boosted.
                        Subtle outlined card with flame icon — premium feel without
                        screaming. Tap opens the BoostSheet paywall. */}
                    {!isBoosted && (
                      <TouchableOpacity activeOpacity={0.85}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBoostEvent?.(ev) }}
                        style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.06)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.28)' }}>
                        <BoostIcon size={14} color="#8B5CF6" />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#8B5CF6' }}>
                          {freeBoostsLeft > 0 ? 'Boost to top — first one free' : 'Boost to top'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                )
              })}
            </View>
          )}
          {/* Attending — events the user joined (not as host) */}
          {myEvents.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
              <CheckCircle size={12} color={PLANS_COLOR} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: PLANS_COLOR, letterSpacing: 1, textTransform: 'uppercase' }}>Attending</Text>
            </View>
          )}
          {plansLoading && myEvents.length === 0 && activeHostedEvents.length === 0 && visibleExpiredEvents.length === 0 ? (
            // Still hydrating from DB — show a spinner so events don't flash in
            // after an empty "No plans yet" render on reload.
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <ActivityIndicator size="small" color="#818CF8" />
            </View>
          ) : myEvents.length === 0 && activeHostedEvents.length === 0 && visibleExpiredEvents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
              <LinearGradient colors={['#6366F1', '#818CF8']} style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CalendarDays size={32} color="#fff" />
              </LinearGradient>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E1B4B', marginBottom: 8, letterSpacing: -0.5 }}>No plans yet</Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 }}>
                Go join something —{'\n'}your events will show up here
              </Text>
            </View>
          ) : (
            myEvents.map(ev => {
              const trsp   = TRANSPORT_CHIP[userEventTransport[ev.id]]
              const isLive = isToday(ev.time)

              // Use actual data for crew count. If user already joined a specific
              // crew (chat exists), inherit that crew's format — otherwise the user's
              // own local pick can disagree with the crew they're actually in.
              const joinedChatId = officialEventChatMap[ev.id]
              const joinedCrew = joinedChatId
                ? (crewsByEvent[ev.id] || []).find(c => c.chatId === joinedChatId)
                : undefined
              // For community events the host doesn't go through joinSheet (they
              // create the event, no userEventFormat entry), so fall back to the
              // event's own maxParticipants. 2 = duo, 3-5 = squad, 6+ = party.
              const commFormatByCap = ev.type === 'community'
                ? (ev.maxParticipants === 2 ? '1+1' : ev.maxParticipants >= 6 ? 'party' : 'squad')
                : null
              const format        = joinedCrew?.format || userEventFormat[ev.id] || commFormatByCap || (ev.type === 'official' ? '1+1' : 'squad')
              const fmt           = FORMAT_CHIP[format]
              const cap           = joinedCrew?.maxSize || VIBE_FORMAT_MAX[format] || 5
              const threshold     = VIBE_FORMAT_THRESHOLD[format] || cap
              const isCommunity   = ev.type === 'community'
              const realAttendees = ev.type === 'official' ? (eventAttendeesMap[ev.id] || []) : []
              const passedIdsPlans = new Set<string>(passedRequests[ev.id] || [])
              const nonPassedAttendees = realAttendees.filter((p: any) => !passedIdsPlans.has(p.id))
              const hasReal       = nonPassedAttendees.length > 0
              const found         = hasReal ? nonPassedAttendees.length + 1 : 1
              const isActive      = hasReal && found >= threshold
              // Avatars on a Plans card represent MY crew for this event — not
              // the global attendee pool. Previously we showed the first N people
              // from event_attendees, which looked like a fake "5 in your crew"
              // strip even before the user joined a chat. Use joinedCrew.members
              // (DB-driven chat membership) when available; otherwise empty.
              // Keep the full list — render caps at 3 avatars and shows '+N' for
              // the rest, so we need an accurate total here.
              const crewProfiles  = (joinedCrew?.members || [])
                .filter((m: any) => m.id !== userDbId && !passedIdsPlans.has(m.id))

              // Smart status badge
              const isConfirmed = joinedEvents[ev.id] === 'confirmed'
              const statusLabel = isCommunity
                ? (isConfirmed ? 'Confirmed' : joinedEvents[ev.id] === 'pending' ? 'Pending' : 'Approved')
                : isConfirmed ? 'Confirmed'
                : hasReal ? `${nonPassedAttendees.length} found`
                : 'Looking...'
              // Matching Lucide icon for the status pill (unified style, no inline emoji).
              const StatusIcon = isConfirmed ? CheckCircle
                : isCommunity ? (joinedEvents[ev.id] === 'pending' ? Clock : Check)
                : hasReal ? Users : Clock
              const statusColor = isCommunity
                ? (isConfirmed ? '#16a34a' : joinedEvents[ev.id] === 'pending' ? '#d97706' : '#16a34a')
                : isConfirmed ? '#16a34a' : hasReal ? '#16a34a' : '#d97706'
              const statusBg    = isCommunity
                ? (isConfirmed ? 'rgba(34,197,94,0.12)' : joinedEvents[ev.id] === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(34,197,94,0.12)')
                : isConfirmed ? 'rgba(34,197,94,0.12)' : hasReal ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.15)'

              return (
                <View key={ev.id} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 0, borderWidth: 1, borderColor: isActive ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.08)' }}>
                  <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />

                  <View style={{ padding: 16 }}>
                    {/* Title row */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3, marginBottom: 4 }} numberOfLines={2}>{ev.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isLive && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' }} />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#ef4444' }}>TODAY</Text>
                            </View>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} color="#94A3B8" />
                            <Text style={{ fontSize: 12, color: '#64748B' }}>{(() => {
                              // Scraped official events often have time_label='-' as a placeholder
                              // when the source page hides the start hour. Show "starts ~ TBD"
                              // instead of "21/05/2026 · -" so the line still conveys "we just
                              // don't know the exact hour yet".
                              const date = ev.date_label
                              const time = ev.time_label && ev.time_label !== '-' ? ev.time_label : null
                              if (date && time) return `${date} · ${time}`
                              if (date) return `${date} · starts ~ TBD`
                              return prettyEventTime(ev.time) || '—'
                            })()}</Text>
                          </View>
                        </View>
                      </View>
                      {/* Status pill — three-dots overflow removed: only useful
                          action was 'Update my plans' which jarringly switched
                          tabs to Home. Destructive leave is already a
                          prominent 'Can't make it' button below the card, so
                          the menu was redundant. */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: statusBg }}>
                        <StatusIcon size={11} color={statusColor} strokeWidth={2.5} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
                      </View>
                    </View>

                    {/* Theme + format + transport chips */}
                    {(ev.category || fmt || trsp) && (
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {ev.category && (() => {
                          const themeColor = CATEGORY_COLOR[ev.category] || '#6366F1'
                          const themeBg = (CATEGORY_BG[ev.category] || ['#EEF2FF'])[0]
                          const themeLabel = ev.category.charAt(0).toUpperCase() + ev.category.slice(1)
                          return (
                            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: themeBg }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: themeColor }}>{themeLabel}</Text>
                            </View>
                          )
                        })()}
                        {fmt && (() => {
                          const FmtIcon = format === 'party' ? PhConfetti : format === 'squad' ? PhUsersThree : PhUsers
                          return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${fmt.color}18`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
                              <FmtIcon size={13} color={fmt.color} weight="duotone" />
                              <Text style={{ fontSize: 12, fontWeight: '700', color: fmt.color }}>{fmt.label}</Text>
                            </View>
                          )
                        })()}
                        {trsp && (
                          <AnimatedTransportChip transportKey={userEventTransport[ev.id]} label={trsp.label} />
                        )}
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: 'rgba(99,102,241,0.08)', marginBottom: 14 }} />

                    {/* Crew avatars + counter + button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      {isCommunity ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          {isConfirmed
                            ? <CheckCircle size={14} color="#16a34a" />
                            : joinedEvents[ev.id] === 'pending'
                            ? <Clock size={14} color="#d97706" />
                            : <Check size={14} color="#16a34a" />}
                          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: isConfirmed ? '#16a34a' : joinedEvents[ev.id] === 'pending' ? '#d97706' : '#16a34a', flexShrink: 1 }}>
                            {isConfirmed ? 'You\'re in the group' : joinedEvents[ev.id] === 'pending' ? 'Waiting for host' : 'Host approved you'}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          {/* Show me + up to 3 crew avatars, then a '+N' pill if there
                              are more. Otherwise a party crew of 20 produced a 20-avatar
                              strip that pushed everything else off-screen. */}
                          {(() => {
                            const MAX_AVATARS = 3
                            const shown = crewProfiles.slice(0, MAX_AVATARS)
                            const extra = Math.max(0, crewProfiles.length - shown.length)
                            return (
                              <View style={{ flexDirection: 'row' }}>
                                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366F1', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                  <Text style={{ fontSize: 12 }}>😊</Text>
                                </View>
                                {shown.map((p, i) => (
                                  <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: p.color, borderWidth: 2, borderColor: '#fff', marginLeft: -8, alignItems: 'center', justifyContent: 'center', zIndex: 9 - i }}>
                                    <Text style={{ fontSize: 11 }}>{p.emoji}</Text>
                                  </View>
                                ))}
                                {extra > 0 && (
                                  <View style={{ height: 28, borderRadius: 14, backgroundColor: '#E0E7FF', borderWidth: 2, borderColor: '#fff', marginLeft: -8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, zIndex: 0 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#4338CA' }}>+{extra}</Text>
                                  </View>
                                )}
                              </View>
                            )
                          })()}
                          <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748B', fontWeight: '600', flexShrink: 1 }}>
                            {/* Show crew members from chat. If user isn't in any crew yet,
                                say so explicitly instead of misleading "1/5 in crew". */}
                            {(() => {
                              const myCrewChat = chatList?.find((c: any) => c.eventRefId === ev.id || (c.event === ev.title && c.type === 'group'))
                              if (!myCrewChat) return 'Looking for crew…'
                              // Duo chats only exist after mutual accept — both parties are in,
                              // so 2/2 is implied. crewsByEvent (which joinedCrew comes from)
                              // is computed for group chats and is empty for duos, which is why
                              // we can't lean on joinedCrew here.
                              if (myCrewChat.type === 'duo') return 'Crew confirmed'
                              // Trust joinedCrew (DB-driven chat_members count). If it doesn't
                              // exist for this event we're no longer in a crew (partner left
                              // or we left) — surface that explicitly instead of a stale "2/2".
                              if (!joinedCrew?.members) return 'Looking for crew…'
                              const count = joinedCrew.members.length
                              return count >= cap ? 'Crew confirmed' : `${count}/${cap} in crew`
                            })()}
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          onEventDetail?.(ev)
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PLANS_COLOR, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, flexShrink: 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>View event</Text>
                        <ChevronRight size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Can't make it — soft neutral ghost, no harsh red.
                        Opens the branded ConfirmDialog (not native Alert) so
                        the leave-flow matches Cancel-event in tone. */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        setLeaveEventTarget(ev)
                      }}
                      style={{ marginTop: 10, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(100,116,139,0.06)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.14)' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>Can't make it</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )}
          {/* Expired events — last, visually muted so they don't compete with upcoming plans.
              Filtered to events that ended within the last 7 days; older ones disappear entirely. */}
          {visibleExpiredEvents.length > 0 && (
            <View style={{ gap: 8, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
                <Clock size={12} color="#94A3B8" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>Expired</Text>
              </View>
              {visibleExpiredEvents.map((ev: any) => {
                const isHosted = expiredHostedEvents.some(he => he.id === ev.id)
                const dateStr = ev.date_label || ev.time || ''
                const expiredAt = ev.expiresAt || (parseEventDateTime(dateStr)?.getTime() ?? 0)
                const ago = (() => {
                  if (!expiredAt) return ''
                  const diffMs = Date.now() - expiredAt
                  const days = Math.floor(diffMs / 86400000)
                  if (days > 0) return `${days}d ago`
                  const hours = Math.floor(diffMs / 3600000)
                  if (hours > 0) return `${hours}h ago`
                  const mins = Math.floor(diffMs / 60000)
                  return mins > 0 ? `${mins}m ago` : 'just now'
                })()
                return (
                  <View key={ev.id} style={{ borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, opacity: 0.7 }}>
                    <CalendarDays size={18} color="#94A3B8" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }} numberOfLines={1}>{ev.title}</Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }} numberOfLines={1}>
                        {prettyEventTime(dateStr) || 'Past event'}{ago ? ` · ${ago}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => isHosted ? onCancelHostedEvent?.(ev) : onLeaveEvent?.(ev)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ padding: 4 }}
                    >
                      <Feather name="trash-2" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Chats tab */}
      {subTab === 'messages' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 10, paddingBottom: 32 }}>
          {/* Wait until the events pool is non-empty before rendering chats.
              plansLoading alone isn't strict enough — it can flip false
              before the cleanup pass that resolves chats against events has
              had a chance to run, and the user sees an orphan flash in then
              disappear. Combine both: spin until events have actually
              landed in props. If the user genuinely has zero events (brand
              new account), the empty-state below renders. */}
          {(plansLoading || (allEvents.length === 0 && hostedEvents.length === 0)) ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <ActivityIndicator size="small" color="#818CF8" />
            </View>
          ) : visibleChats.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 }}>
              <View style={{ width: 100, height: 100, marginBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEF2FF' }} />
                <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: '#E0E7FF' }} />
                <ChatTeardrop size={38} color="#6366F1" weight="duotone" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E1B4B', marginBottom: 10, letterSpacing: -0.5 }}>No chats yet</Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22, maxWidth: 220 }}>
                Join an event to start chatting with your crew
              </Text>
            </View>
          )}
          {!(plansLoading || (allEvents.length === 0 && hostedEvents.length === 0)) && [...visibleChats].sort((a, b) => {
            // Most-recent activity first. `time` is usually an ISO timestamp
            // (created_at / last message); fall back to chat id (higher = newer)
            // when it's a bare "HH:MM" string that can't be parsed.
            const ta = Date.parse(a.time); const tb = Date.parse(b.time)
            const ka = isNaN(ta) ? (a.id || 0) : ta
            const kb = isNaN(tb) ? (b.id || 0) : tb
            return kb - ka
          }).map(chat => (
            <TouchableOpacity
              key={chat.id}
              onPress={() => onOpenChat(chat)}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                Alert.alert(
                  chat.type === 'duo' ? `Leave chat with ${chat.name}?` : `Leave "${chat.event}"?`,
                  chat.type === 'duo' ? `${chat.name} will see that your plans changed 📅` : `The group will see you've left.`,
                  [
                    { text: 'Leave', style: 'destructive', onPress: () => onLeaveChat?.(chat.id, true) },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                )
              }}
              activeOpacity={0.85}
              style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient
                colors={chat.isNew
                  ? ['#EEF2FF', '#F0EBFF']
                  : ['#ffffff', '#F8F9FF']}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12,
                  borderWidth: chat.isNew ? 1.5 : 1,
                  borderColor: chat.isNew ? 'rgba(236,72,153,0.2)' : 'rgba(0,0,0,0.04)',
                  borderRadius: 20 }}>

                {/* Avatar */}
                {chat.type === 'duo' ? (
                  <View style={{ width: 54, height: 54, borderRadius: 27, overflow: 'hidden', backgroundColor: chat.color,
                    shadowColor: chat.color, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}>
                    {chat.photo
                      ? <Image source={{ uri: chat.photo }} style={{ width: '100%', height: '100%' }} />
                      : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><User size={22} color="#fff" /></View>}
                  </View>
                ) : chat.eventImage ? (
                  <EventThumb uri={chat.eventImage} emoji={chat.eventEmoji} colors={chat.colors} />
                ) : (() => {
                  const photos = (chat.avatars || []).filter(Boolean).slice(0, 2)
                  const cols = (chat.colors || ['#818CF8', '#6366F1'])
                  const gc0 = (cols[0] && typeof cols[0] === 'string') ? cols[0] : '#818CF8'
                  const gc1 = (cols[1] && typeof cols[1] === 'string') ? cols[1] : '#6366F1'
                  const totalOthers = Math.max(0, (chat.members || 1) - 1)
                  const extra = Math.max(0, totalOthers - photos.length)
                  const SZ = 42
                  const SHIFT = 22

                  if (photos.length === 0) {
                    return (
                      <LinearGradient colors={[gc0, gc1]}
                        style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', elevation: 3 }}>
                        <PhUsersThree size={26} color="#fff" weight="duotone" />
                      </LinearGradient>
                    )
                  }

                  const containerW = SZ + (photos.length > 1 ? SHIFT : 0) + (extra > 0 ? SHIFT : 0)
                  return (
                    <View style={{ width: containerW, height: SZ, position: 'relative' }}>
                      {/* Render photos back-to-front so first is on top */}
                      {[...photos].reverse().map((photo: string, ri: number) => {
                        const ai = photos.length - 1 - ri
                        return (
                          <View key={ai} style={{
                            position: 'absolute', left: ai * SHIFT,
                            width: SZ, height: SZ, borderRadius: SZ / 2,
                            borderWidth: 2.5, borderColor: '#fff',
                            overflow: 'hidden',
                            backgroundColor: (cols[ai] && typeof cols[ai] === 'string') ? cols[ai] : '#818CF8',
                            zIndex: photos.length - ai, elevation: photos.length - ai,
                          }}>
                            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
                          </View>
                        )
                      })}
                      {extra > 0 && (
                        <View style={{
                          position: 'absolute', left: photos.length * SHIFT,
                          top: (SZ - 28) / 2,
                          width: 28, height: 28, borderRadius: 14,
                          backgroundColor: '#6366F1',
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 2.5, borderColor: '#fff',
                          zIndex: photos.length + 1, elevation: photos.length + 1,
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>+{extra}</Text>
                        </View>
                      )}
                    </View>
                  )
                })()}

                {/* Text content */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1B4B', letterSpacing: -0.2, flex: 1 }} numberOfLines={1}>
                      {chat.type === 'duo' ? `${chat.name}, ${chat.age}` : chat.event}
                    </Text>
                    <Text style={{ fontSize: 11, color: chat.isNew ? CHATS_COLOR : '#CBD5E1', fontWeight: chat.isNew ? '700' : '400', marginLeft: 8, flexShrink: 0 }}>{formatChatTime(chat.time)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    {chat.type === 'duo'
                      ? <PhMapPin size={12} color={CHATS_COLOR} weight="duotone" />
                      : <PhUsersThree size={12} color={CHATS_COLOR} weight="duotone" />}
                    <Text style={{ fontSize: 11, color: CHATS_COLOR, fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>
                      {chat.type === 'duo' ? chat.event : `${chat.members} members`}
                    </Text>
                    {(() => {
                      // Derive expiry from the linked event when available — chat.chatExpiresAt
                      // gets stuck at creation-time value (which falls back to "now + 24h" when
                      // ev.expiresAt wasn't parsed yet), so a chat for a May 20 event created
                      // yesterday looks "expiring" today even though the event is 5 days out.
                      // For official events (no `expiresAt` field) parse from `date_label`/`time`.
                      // Show "Expiring" only when ≤6h remain AND it hasn't already expired.
                      const evId = chat.eventRefId || chat.communityEventId || chat.hostEventId
                      const pool = [...allEvents, ...hostedEvents]
                      // Duo chats are persisted without event_id (DB schema didn't carry it),
                      // so we can't match by ID — fall back to title match. Title isn't unique
                      // forever but is unique enough for the active window where the chat lives.
                      const linkedEv = evId
                        ? pool.find((e: any) => e.id === evId)
                        : (chat.event ? pool.find((e: any) => e.title === chat.event) : null)
                      let evStartMs = 0
                      if (linkedEv?.expiresAt > 0) evStartMs = linkedEv.expiresAt
                      else if (linkedEv) {
                        const parsed = parseEventDateTime(linkedEv.date_label || linkedEv.time || '')
                        if (parsed) evStartMs = parsed.getTime()
                      }
                      // Grace window post-event = 7 days (was 24h). Matches the
                      // 7d cutoff used by visibleChats to drop long-dead chats.
                      const evExpiresAt = evStartMs > 0 ? evStartMs + 7 * 24 * 3600 * 1000 : 0
                      const effectiveExpiry = evExpiresAt || chat.chatExpiresAt
                      if (!effectiveExpiry) return null
                      const hoursLeft = (effectiveExpiry - Date.now()) / 3600000
                      // Threshold 24h covers the entire "post-event" window — once the event
                      // is done, the chat enters its 24h grace period and should flag as
                      // expiring. Anything past the chat's actual deadline is hidden.
                      if (hoursLeft <= 0 || hoursLeft > 24) return null
                      // After-event chats (event already happened, ≤24h remain) should also
                      // signal urgency — same red "Expiring" badge.
                      const evAlreadyHappened = evStartMs > 0 && evStartMs < Date.now()
                      if (!evAlreadyHappened && hoursLeft > 6) return null
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(239,68,68,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, flexShrink: 0 }}>
                          <Clock size={9} color="#EF4444" />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>Expiring</Text>
                        </View>
                      )
                    })()}
                  </View>
                  <Text style={{ fontSize: 13, color: chat.isNew ? '#334155' : '#94A3B8', fontWeight: chat.isNew ? '600' : '400' }} numberOfLines={1}>{chat.lastMsg}</Text>
                </View>

                {/* Unread dot */}
                {chat.isNew && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CHATS_COLOR,
                    shadowColor: CHATS_COLOR, shadowOpacity: 0.6, shadowRadius: 4, elevation: 3 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Crew Sheet — who's going (confirmed events) */}
      {crewSheet && (
        <Modal transparent animationType="none" onRequestClose={closeCrewSheet}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }} activeOpacity={1} onPress={closeCrewSheet} />
            <Animated.View style={{
              transform: [{ translateY: crewSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
              backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
              paddingBottom: 32, maxHeight: '85%',
            }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
              </View>

              {/* Header */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.08)' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>{crewSheet.ev.title}</Text>
                <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '700', marginTop: 4 }}>
                  🎉 {crewSheet.found}/{crewSheet.cap} confirmed · Your crew
                </Text>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {/* Me */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>😊</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>You</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: '#6366F1' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>ME</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>That's you 👋</Text>
                  </View>
                </View>

                {/* Each partner — tap to view full profile */}
                {crewSheet.profiles.map((p: any, i: number) => (
                  <TouchableOpacity key={i} activeOpacity={0.8}
                    onPress={() => {
                      setMemberPreview({
                        ...p,
                        colors: p.colors || [p.color, '#1E1B4B'],
                        langs: (p.langs || []).map((l: string) => FLAG_MAP[l] || l),
                        flag: p.flag || FLAG_MAP[p.langs?.[0]] || '🌍',
                        goal: p.goal || 'chill',
                        emoji: p.emoji || '👤',
                      })
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: `${p.color}08`, borderWidth: 1, borderColor: `${p.color}20` }}>
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {p.photo
                        ? <Image source={{ uri: p.photo }} style={{ width: '100%', height: '100%' }} />
                        : <Text style={{ fontSize: 22 }}>{p.emoji}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>{p.name}</Text>
                        <Text style={{ fontSize: 13, color: '#64748B' }}>{p.age}</Text>
                        <Text style={{ fontSize: 14 }}>{p.flag}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }} numberOfLines={2}>{p.bio}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={p.color} style={{ opacity: 0.6 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}
      {memberPreview && <ProfilePreviewSheet profile={memberPreview} onClose={() => setMemberPreview(null)} onBlock={onBlockUser} onReport={onReportUser} />}
      <ConfirmDialog
        visible={!!cancelEventTarget}
        title={`Cancel “${cancelEventTarget?.title || ''}”?`}
        body="This will delete the event and its chat."
        confirmText="Cancel event"
        cancelText="Keep"
        destructive
        onConfirm={() => {
          const ev = cancelEventTarget
          setCancelEventTarget(null)
          if (ev) onCancelHostedEvent?.(ev)
        }}
        onClose={() => setCancelEventTarget(null)}
      />
      <ConfirmDialog
        visible={!!leaveEventTarget}
        title="Can't make it?"
        body={`Your spot will be freed and${leaveEventTarget?.type === 'community' ? ' the group will be notified' : ' your details will be removed'}.`}
        confirmText="Yes, leave"
        cancelText="Keep my plans"
        destructive
        onConfirm={() => {
          const ev = leaveEventTarget
          setLeaveEventTarget(null)
          if (ev) onLeaveEvent?.(ev)
        }}
        onClose={() => setLeaveEventTarget(null)}
      />
    </View>
  )
}
