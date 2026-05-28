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
  Clock, MoreHorizontal, X, Check, User,
} from 'lucide-react-native'
import { ChatTeardrop, Car as PhCar, MapPin as PhMapPin, Users as PhUsers, UsersThree as PhUsersThree, Confetti as PhConfetti, HandWaving as PhHand } from '../phosphor-icons'
import { ProfilePreviewSheet } from '../components/ProfilePreviewSheet'
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

export function MessagesTab({ chatList, onOpenChat, onLeaveChat, joinedEvents = {}, userEventFormat = {}, userEventTransport = {}, crewsByEvent = {}, officialEventChatMap = {}, onVibeCheck, onLeaveEvent, onUpdatePlans, initialSubTab, hostedEvents = [], approvedJoiners = {}, hostConfirmedMembers = {}, approvedAtMap = {}, onCancelHostedEvent, onPlansOpen, allEvents = [], onEventDetail, eventAttendeesMap = {}, passedRequests = {}, onBlockUser, onReportUser, plansLoading = false }: {
  chatList: any[]; onOpenChat: (c: any) => void; onLeaveChat?: (id: number, addSystemMsg?: boolean) => void;
  plansLoading?: boolean;
  joinedEvents?: Record<number, string>; userEventFormat?: Record<number, string>; userEventTransport?: Record<number, string>; allEvents?: any[]; onEventDetail?: (ev: any) => void;
  crewsByEvent?: Record<number, Array<{ chatId: number; members: any[]; avgMatch: number; format?: string; maxSize?: number }>>;
  officialEventChatMap?: Record<number, number>;
  onVibeCheck?: (ev: any) => void; onLeaveEvent?: (ev: any) => void; onUpdatePlans?: (ev: any) => void;
  initialSubTab?: 'going' | 'messages'; hostedEvents?: any[]; approvedJoiners?: Record<number, any[]>; hostConfirmedMembers?: Record<number, any[]>; approvedAtMap?: Record<number, number>; onCancelHostedEvent?: (ev: any) => void; onPlansOpen?: () => void; eventAttendeesMap?: Record<number, any[]>; passedRequests?: Record<number, string[]>;
  onBlockUser?: (profile: any) => void; onReportUser?: (profile: any) => void;
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
              : `${chatList.length} conversation${chatList.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 14, padding: 4, marginBottom: 18, gap: 4 }}>
          {(['going', 'messages'] as const).map(id => {
            const isActive = subTab === id
            const label = id === 'going'
              ? `Plans${myEvents.length + activeHostedEvents.length > 0 ? ` · ${myEvents.length + activeHostedEvents.length}` : ''}`
              : `Chats${chatList.length > 0 ? ` · ${chatList.length}` : ''}`
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
                return (
                <View key={ev.id} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.2)', shadowColor: PLANS_COLOR, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 }}>
                  <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />
                  <View style={{ padding: 16 }}>
                    {/* Title row with trash on the right */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', flex: 1, letterSpacing: -0.2 }} numberOfLines={2}>{ev.title}</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.()
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                          Alert.alert(`Cancel "${ev.title}"?`, 'This will delete the event and its chat.', [
                            { text: 'Cancel Event', style: 'destructive', onPress: () => onCancelHostedEvent?.(ev) },
                            { text: 'Keep', style: 'cancel' },
                          ])
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
          {plansLoading && myEvents.length === 0 && activeHostedEvents.length === 0 && expiredAllEvents.length === 0 ? (
            // Still hydrating from DB — show a spinner so events don't flash in
            // after an empty "No plans yet" render on reload.
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <ActivityIndicator size="small" color="#818CF8" />
            </View>
          ) : myEvents.length === 0 && activeHostedEvents.length === 0 && expiredAllEvents.length === 0 ? (
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
              const crewProfiles  = hasReal ? nonPassedAttendees.slice(0, cap - 1) : []

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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: statusBg }}>
                          <StatusIcon size={11} color={statusColor} strokeWidth={2.5} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            Alert.alert(ev.title, 'What do you want to do?', [
                              { text: 'Update my plans', onPress: () => onUpdatePlans?.(ev) },
                              { text: "Can't make it", style: 'destructive', onPress: () => {
                                Alert.alert('Leave event?', `Your spot will be freed and${ev.type === 'community' ? ' the group will be notified' : ' your details will be removed'}.`, [
                                  { text: 'Yes, leave', style: 'destructive', onPress: () => onLeaveEvent?.(ev) },
                                  { text: 'Cancel', style: 'cancel' },
                                ])
                              }},
                              { text: 'Cancel', style: 'cancel' },
                            ])
                          }}
                          style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(100,116,139,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                          <MoreHorizontal size={16} color="#94A3B8" />
                        </TouchableOpacity>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      {isCommunity ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isConfirmed
                            ? <CheckCircle size={14} color="#16a34a" />
                            : joinedEvents[ev.id] === 'pending'
                            ? <Clock size={14} color="#d97706" />
                            : <Check size={14} color="#16a34a" />}
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isConfirmed ? '#16a34a' : joinedEvents[ev.id] === 'pending' ? '#d97706' : '#16a34a' }}>
                            {isConfirmed ? 'You\'re in the group' : joinedEvents[ev.id] === 'pending' ? 'Waiting for host' : 'Host approved you'}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ flexDirection: 'row' }}>
                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366F1', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                              <Text style={{ fontSize: 12 }}>😊</Text>
                            </View>
                            {crewProfiles.map((p, i) => (
                              <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: p.color, borderWidth: 2, borderColor: '#fff', marginLeft: -8, alignItems: 'center', justifyContent: 'center', zIndex: 9 - i }}>
                                <Text style={{ fontSize: 11 }}>{p.emoji}</Text>
                              </View>
                            ))}
                          </View>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
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
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PLANS_COLOR, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>View event</Text>
                        <ChevronRight size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Can't make it — prominent */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        Alert.alert("Can't make it?", `Your spot will be freed and${ev.type === 'community' ? ' the group will be notified' : ' your details will be removed'}.`, [
                          { text: "Yes, leave", style: 'destructive', onPress: () => onLeaveEvent?.(ev) },
                          { text: 'Keep my plans', style: 'cancel' },
                        ])
                      }}
                      style={{ marginTop: 10, paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)' }}>
                      <X size={13} color="#ef4444" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>Can't make it</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )}
          {/* Expired events — last, visually muted so they don't compete with upcoming plans */}
          {expiredAllEvents.length > 0 && (
            <View style={{ gap: 8, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
                <Clock size={12} color="#94A3B8" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>Expired</Text>
              </View>
              {expiredAllEvents.map((ev: any) => {
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
          {chatList.length === 0 && (
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
          {[...chatList].sort((a, b) => {
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
                        <Text style={{ fontSize: 26 }}>{chat.eventEmoji || '🎉'}</Text>
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
                    <Text style={{ fontSize: 13 }}>{chat.eventEmoji || '📍'}</Text>
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
                      const evExpiresAt = evStartMs > 0 ? evStartMs + 24 * 3600 * 1000 : 0
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
    </View>
  )
}
