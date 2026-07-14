import React, { useEffect, useRef, useState } from 'react'
import {
  Alert, Animated, Image, Modal, ScrollView, Text, TouchableOpacity, View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Zap, PartyPopper, MessageCircle, Clock, Trash2, Crown,
  CheckCircle, User,
} from 'lucide-react-native'
import {
  Sparkle, MagnifyingGlass, CaretRight, MapPin as PhMapPin, Car as PhCar,
  HandWaving as PhHand, Check as PhCheck, X as PhX,
} from '../phosphor-icons'
import { ProfilePreviewSheet } from '../components/ProfilePreviewSheet'
import { CrewPoolSheet } from '../components/CrewPoolSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  VIBE_FORMAT_MAX, VIBE_FORMAT_THRESHOLD, VIBE_FORMAT_LABEL, FLAG_MAP, LANG_CODE, QUEUE_PROFILES,
} from '../feed-constants'
import { prettyEventTime, isEventPast, scoreRequesterForHost, scoreEventForRequester } from '../feed-helpers'

type MatchResult = { id: number; score: number; reason: string }

function PulsingStatusBadge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  const pulse = useRef(new Animated.Value(1)).current
  const isLooking = label === 'Looking...'
  useEffect(() => {
    if (!isLooking) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [isLooking])
  return (
    <Animated.View style={{ transform: [{ scale: pulse }], paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Text style={{ fontSize: 10, fontFamily: 'Outfit-Bold', color, letterSpacing: 0.3 }}>{label}</Text>
    </Animated.View>
  )
}

// Small glowing dot indicator — used next to 'Waiting for requests' /
// 'N request · X spots left' on hosted event cards so the user can see
// at a glance that the crew is still forming. Alternates opacity 0.35 ↔ 1
// on the dot itself, and softly pulses a diffuse violet halo behind it
// so it reads as 'alive / searching'.
function SearchingDot() {
  const halo = useRef(new Animated.Value(0)).current
  const core = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(halo, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(halo, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(core, { toValue: 0.35, duration: 1200, useNativeDriver: true }),
          Animated.timing(core, { toValue: 1,    duration: 1200, useNativeDriver: true }),
        ]),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] })
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] })
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: '#A78BFA',
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />
      <Animated.View
        style={{
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: '#A78BFA',
          opacity: core,
          shadowColor: '#8B5CF6',
          shadowOpacity: 0.9,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        }}
      />
    </View>
  )
}


export function VibeCheckTab({ joinedEvents, allEvents, userEventFormat, userEventTransport, onGoHome, onConfirm, onLeave, hostedEvents = [], pendingJoinRequests = {}, approvedJoiners = {}, hostConfirmedMembers = {}, approvedAtMap = {}, onApproveJoiner, onRejectJoiner, onPassJoiner, passedRequests = {}, userData, tonightVibe, onGoToMessages, eventAttendeesMap = {}, communityEventMembers = {}, incomingCrewInvites = [], sentCrewInvites = {}, onAcceptInvite, onDeclineInvite, onCancelHostedEvent, readyCountMap = {}, crewPreviewMap = {}, passedIdsByEvent = {}, onPassMember, onJoinCrew, crewsByEvent = {}, onJoinSpecificCrew, onCreateNewCrew, onInviteToMyCrew, officialEventChatMap = {}, topInset = 0, onBlockUser, onReportUser }: any) {
  const insets = useSafeAreaInsets()
  // Custom-styled cancel-event confirmation in place of the OS Alert.alert
  // (which rendered as a plain Material dialog and felt off-brand).
  const [cancelEventTarget, setCancelEventTarget] = useState<any>(null)
  // Official + approved community events — shown as crew cards
  const notExpired = (e: any) => e.expiresAt ? e.expiresAt > Date.now() : !isEventPast(e.date_label || e.time || '')
  const myEvents = (allEvents || []).filter((e: any) => {
    const status = joinedEvents?.[e.id]
    if (!status || e.isHosted) return false
    if (!notExpired(e)) return false
    if (e.type === 'community') return status === 'joined'
    // Official: always show confirmed events so squad can track crew filling up
    if (status === 'confirmed') return true
    return true
  })
  const myApprovedCommunityEvents: any[] = [] // kept for subtitle logic only
  // Community events pending host approval — shown as waiting cards
  const myCommunityEvents = (allEvents || []).filter((e: any) => joinedEvents?.[e.id] === 'pending' && !e.isHosted && e.type === 'community' && notExpired(e))
  // User-created socials the user requested to join — shown as "awaiting approval"
  const pendingHostedEvents = (allEvents || []).filter((e: any) => joinedEvents?.[e.id] === 'pending' && e.isHosted && notExpired(e))
  const activeHosted = (hostedEvents || []).filter((e: any) => notExpired(e))
  // "Visible" subset — events that actually render a card in the list. A full
  // hosted event with no pending/approved is hidden (see line ~290) but used
  // to count towards the subtitle, causing "1 event · looking for crew..."
  // to linger over an empty list.
  const visibleHosted = activeHosted.filter((e: any) => {
    const slotsTotal = (e.maxParticipants || 5) - 1
    const slotsLeft = slotsTotal - ((hostConfirmedMembers?.[e.id] || []).length)
    const hasActivity = (pendingJoinRequests?.[e.id] || []).length > 0 || (approvedJoiners?.[e.id] || []).length > 0
    return slotsLeft > 0 || hasActivity
  })
  const hasHostActivity = activeHosted.some((e: any) => (pendingJoinRequests[e.id] || []).length > 0)
  const [previewProfile, setPreviewProfile] = useState<any>(null)
  // Open CrewPoolSheet for a specific event — null means closed
  const [crewPoolEv, setCrewPoolEv] = useState<any>(null)
  // Preview a specific crew's full member list before joining
  const [crewPreviewState, setCrewPreviewState] = useState<{ ev: any; crew: any } | null>(null)
  // Subtle live-dot heartbeat next to the title — only animation that survived.
  // Translating a gradient inside MaskedView clipped the text on tall devices,
  // and the sparkle emoji read as cheap. Static gradient + breathing dot is cleaner.
  const livePulse = useRef(new Animated.Value(0.6)).current
  useEffect(() => {
    const live = Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]))
    live.start()
    return () => { live.stop() }
  }, [])
  const [aiMatches, setAiMatches] = useState<MatchResult[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const aiRankedProfiles = aiMatches.length > 0
    ? [...QUEUE_PROFILES]
        .filter((p: any) => (aiMatches.find((m: MatchResult) => m.id === p.id)?.score ?? 50) > 0) // hide dealbreaker-blocked
        .sort((a: any, b: any) => {
          const sa = aiMatches.find((m: MatchResult) => m.id === a.id)?.score ?? 0
          const sb = aiMatches.find((m: MatchResult) => m.id === b.id)?.score ?? 0
          return sb - sa
        })
    : QUEUE_PROFILES

  const eventContext = myEvents.length > 0
    ? myEvents.map((e: any) => `${e.title} (${e.category})`).join(', ')
    : undefined

  useEffect(() => {
    if (!userData?.interests?.length) return
    // Rule-based scoring on QUEUE_PROFILES (static mock fallback queue, ~6 profiles).
    // Replaces aiMatchCompanions which used to fire an AI call on every
    // tonightVibe / eventContext change — the queue is mock data anyway, so AI
    // ranking was overkill and steadily burned through Anthropic credits.
    // Real attendees in the crew pool still get scored by AI in aiScoreRealAttendees.
    const userDb = userData.dealbreakers || []
    const results: MatchResult[] = QUEUE_PROFILES.map((p: any) => {
      // Hard dealbreakers → score 0 (mirrors aiMatchCompanions blocklist).
      if (userDb.includes('no_smoking') && (p.smokingPref === 'Smoker' || p.smokingPref === 'Social')) return { id: p.id, score: 0, reason: 'Smoking dealbreaker' }
      if (userDb.includes('sober_only') && p.drinksPref === 'Social drinker') return { id: p.id, score: 0, reason: 'Drinking dealbreaker' }
      if (userDb.includes('pets_allergy') && p.hasPets) return { id: p.id, score: 0, reason: 'Pet allergy' }
      const score = scoreRequesterForHost(
        { langs: p.langs, age: p.age, drinksPref: p.drinksPref, smokingPref: p.smokingPref, interests: p.interests, hasPets: p.hasPets, city: p.city, socialEnergy: p.socialEnergy },
        { langs: userData.langs, age: userData.age, drinksPref: userData.drinksPref, smokingPref: userData.smokingPref, interests: userData.interests, dealbreakers: userData.dealbreakers, city: userData.city, socialEnergy: userData.socialEnergy }
      )
      return { id: p.id, score, reason: 'Compatibility' }
    })
    setAiMatches(results)
    setAiLoading(false)
  }, [tonightVibe?.energy, eventContext, userData?.interests, userData?.langs, userData?.age])

  // aurora blob animations
  const blob1 = useRef(new Animated.Value(0)).current
  const blob2 = useRef(new Animated.Value(0)).current
  const blob3 = useRef(new Animated.Value(0)).current
  const radar1 = useRef(new Animated.Value(0)).current
  const radar2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = (val: Animated.Value, dur: number, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start()
    loop(blob1, 3200, 0); loop(blob2, 2800, 600); loop(blob3, 3600, 1200)
    Animated.loop(Animated.sequence([
      Animated.timing(radar1, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(radar1, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start()
    Animated.loop(Animated.sequence([
      Animated.delay(900),
      Animated.timing(radar2, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(radar2, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start()
  }, [])

  const AuroraBg = () => (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Animated.View style={{
        position: 'absolute', top: -60, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#FF6B6B',
        opacity: blob1.interpolate({ inputRange: [0,1], outputRange: [0.18, 0.32] }),
        transform: [{ scale: blob1.interpolate({ inputRange: [0,1], outputRange: [1, 1.2] }) }],
      }} />
      <Animated.View style={{
        position: 'absolute', top: 120, right: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: '#43E97B',
        opacity: blob2.interpolate({ inputRange: [0,1], outputRange: [0.14, 0.26] }),
        transform: [{ scale: blob2.interpolate({ inputRange: [0,1], outputRange: [1, 1.15] }) }],
      }} />
      <Animated.View style={{
        position: 'absolute', bottom: 80, left: 40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#6366F1',
        opacity: blob3.interpolate({ inputRange: [0,1], outputRange: [0.16, 0.28] }),
        transform: [{ scale: blob3.interpolate({ inputRange: [0,1], outputRange: [1, 1.1] }) }],
      }} />
    </View>
  )

  const allHostedFull = activeHosted.length > 0 && activeHosted.every((ev: any) => {
    const slotsTotal = (ev.maxParticipants || 5) - 1
    return (approvedJoiners?.[ev.id] || []).length >= slotsTotal && (pendingJoinRequests[ev.id] || []).length === 0
  })
  if (myEvents.length === 0 && myApprovedCommunityEvents.length === 0 && myCommunityEvents.length === 0 && !hasHostActivity && pendingHostedEvents.length === 0 && visibleHosted.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0812' }}>
        <AuroraBg />
        <SafeAreaView edges={['bottom']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              <Animated.View style={{
                position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.6)',
                opacity: radar1.interpolate({ inputRange: [0,0.5,1], outputRange: [0.8,0.3,0] }),
                transform: [{ scale: radar1.interpolate({ inputRange: [0,1], outputRange: [0.4,1] }) }],
              }} />
              <Animated.View style={{
                position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: 'rgba(67,233,123,0.5)',
                opacity: radar2.interpolate({ inputRange: [0,0.5,1], outputRange: [0.8,0.3,0] }),
                transform: [{ scale: radar2.interpolate({ inputRange: [0,1], outputRange: [0.4,1] }) }],
              }} />
              <LinearGradient colors={['#6366F1', '#818CF8']} style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={34} color="#fff" fill="#fff" />
              </LinearGradient>
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 10 }}>Your crew awaits</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 22, marginBottom: 36 }}>
              Join an event and we'll find{'\n'}the perfect people to go with
            </Text>
            <TouchableOpacity onPress={onGoHome} activeOpacity={0.85} style={{ paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99, backgroundColor: '#6366F1', shadowColor: '#6366F1', shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Browse Events →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  const subtitle = (() => {
    if (hasHostActivity) return 'You have join requests'
    const totalReal = myEvents.reduce((sum: number, e: any) => sum + (eventAttendeesMap[e.id]?.length || 0), 0)
    if (myEvents.length > 0 && totalReal > 0) return `${totalReal} ${totalReal === 1 ? 'person' : 'people'} in your crew`
    const lookingCount = myEvents.length + visibleHosted.length
    if (lookingCount > 0) return `${lookingCount} event${lookingCount > 1 ? 's' : ''} · looking for crew...`
    if (myApprovedCommunityEvents.length > 0) return `You're in — open the chat`
    if (myCommunityEvents.length > 0) return `${myCommunityEvents.length} request${myCommunityEvents.length > 1 ? 's' : ''} · waiting for host`
    return `${pendingHostedEvents.length} social${pendingHostedEvents.length > 1 ? 's' : ''} · waiting for host approval`
  })()

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0812' }}>
      <AuroraBg />
      {/* No SafeAreaView edges=['bottom'] — left a black gap above the tab bar
          on Android (gesture nav). The ScrollView paddingBottom below already
          accounts for the tab bar overlap; the parent View bg fills behind it. */}
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: topInset + 14, paddingBottom: 18 }}>
          {/* Static gradient title — gradient fills the letterforms via MaskedView. */}
          <MaskedView
            style={{ height: 40, marginBottom: 8 }}
            maskElement={
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 32, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, color: '#000' }}>Vibe Check</Text>
              </View>
            }>
            <LinearGradient
              colors={['#A78BFA', '#7DD3FC', '#43E97B']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </MaskedView>
          {/* Single status row — breathing dot only when there's actual activity,
              static dot otherwise. No duplicate green dots in the header. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Animated.View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: hasHostActivity ? '#FBBF24' : myEvents.length > 0 ? '#43E97B' : 'rgba(255,255,255,0.25)',
              opacity: myEvents.length > 0 || hasHostActivity ? livePulse : 1,
            }} />
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)' }}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 100 }}>
          {/* Host approval section — AI-ranked */}
          {activeHosted.map((ev: any) => {
            const allRequests: any[] = pendingJoinRequests[ev.id] || []
            const approvedCount = (approvedJoiners?.[ev.id] || []).length   // approved, not yet confirmed
            const confirmedCount = (hostConfirmedMembers[ev.id] || []).length // joiner confirmed → slot truly filled
            const slotsTotal = (ev.maxParticipants || 5) - 1 // spots for guests (host takes 1)
            const slotsLeft = slotsTotal - confirmedCount // only confirmed participants fill slots
            // Full and no pending/approved requests — hide panel
            if (slotsLeft <= 0 && allRequests.length === 0 && approvedCount === 0) return null
            // Score + sort, show top 12. Host sees every actual request — feed filter
            // already prevents most age-mismatched discovery, and a request that did
            // arrive (e.g. via shared link) is an explicit ask we want the host to decide.
            const scored = allRequests
              .map((req: any) => ({ ...req, _score: scoreRequesterForHost(req, userData || {}, ev.category) }))
              .sort((a: any, b: any) => b._score - a._score)
              .slice(0, 12)
            return (
              <View key={`host-${ev.id}`} style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)' }}>
                <LinearGradient colors={ev.gradient as any} style={{ height: 7 }} />
                <View style={{ padding: 16, gap: 12 }}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' }}>
                      <Crown size={10} color="#FFD700" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFD700' }}>HOST</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        setCancelEventTarget(ev)
                      }}
                      activeOpacity={0.7}
                      style={{ padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <Trash2 size={15} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Live-search indicator — pulsing violet dot to signal
                        that the crew is actively forming. Hidden once the
                        crew is full (no spots left AND no pending requests
                        remaining). */}
                    {slotsLeft > 0 && <SearchingDot />}
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', flex: 1 }}>
                      {allRequests.length === 0
                        ? `Waiting for requests · ${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} open`
                        : `${allRequests.length} request${allRequests.length > 1 ? 's' : ''} · ${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} left · AI-ranked ✨`}
                    </Text>
                  </View>
                  {/* Ranked request cards */}
                  {scored.map((req: any, idx: number) => {
                    const score = req._score as number
                    const scoreColor = score >= 75 ? '#43E97B' : score >= 50 ? '#FBBF24' : '#F87171'
                    return (
                      <View key={req.requestId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12 }}>
                        {/* Rank indicator — top vibe match (clean badge, not a trophy icon) */}
                        {idx === 0 && (
                          <View style={{ position: 'absolute', top: -8, left: 12, zIndex: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FBBF24' }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#1E1B4B', letterSpacing: 0.5 }}>TOP MATCH</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => {
                          setPreviewProfile({
                            ...req,
                            colors: [req.color, '#1E1B4B'],
                            flag: FLAG_MAP[req.langs?.[0]] || '🌍',
                            langs: (req.langs || []).map((l: string) => FLAG_MAP[l] || l),
                            interests: req.interests || [],
                            goal: 'chill',
                            emoji: '👤',
                            aiScore: score,
                            aiReason: score >= 75 ? 'Great match for your vibe' : score >= 50 ? 'Could be a good fit' : 'Some differences in style',
                          })
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        }} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View>
                            <Image source={{ uri: req.photo }} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#333' }} resizeMode="cover" />
                            {/* Score ring */}
                            <View style={{ position: 'absolute', bottom: -4, right: -6, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8, backgroundColor: '#1A1730', borderWidth: 1, borderColor: scoreColor }}>
                              <Text style={{ fontSize: 9, fontWeight: '900', color: scoreColor }}>{score}%</Text>
                            </View>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>← tap</Text>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{req.name}, {req.age}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }} numberOfLines={1}>{req.bio}</Text>
                            <View style={{ flexDirection: 'row', gap: 5, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              {(req.langs || []).map((l: string) => (
                                <View key={l} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.4 }}>{LANG_CODE[l] || l.toUpperCase()}</Text>
                                </View>
                              ))}
                              {req.transport === 'car' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <PhCar size={14} color="#A5B4FC" weight="duotone" />
                                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Can drive</Text>
                                </View>
                              )}
                              {req.transport === 'lift' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <PhHand size={14} color="#A5B4FC" weight="duotone" />
                                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Needs ride</Text>
                                </View>
                              )}
                              {req.transport === 'meet' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <PhMapPin size={14} color="#A5B4FC" weight="duotone" />
                                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Meets there</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        {/* Action buttons */}
                        <View style={{ gap: 6 }}>
                          <TouchableOpacity onPress={() => onApproveJoiner?.(ev.id, req)} activeOpacity={0.8}
                            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(67,233,123,0.15)', borderWidth: 1.5, borderColor: '#43E97B', alignItems: 'center', justifyContent: 'center' }}>
                            <PhCheck size={18} color="#43E97B" weight="bold" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => onPassJoiner?.(ev.id, req)} activeOpacity={0.8}
                            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(248,113,113,0.12)', borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                            <PhX size={17} color="#F87171" weight="bold" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  })}
                  {allRequests.length > 12 && (
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 4 }}>
                      +{allRequests.length - 12} more hidden · approve or pass to see them
                    </Text>
                  )}
                  {/* Waiting for approved joiner to confirm */}
                  {approvedCount > 0 && allRequests.length === 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)' }}>
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(251,191,36,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' }}>
                        <Clock size={17} color="#FBBF24" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#FBBF24' }}>Waiting for {approvedCount === 1 ? (approvedJoiners?.[ev.id]?.[0]?.name || 'them') : `${approvedCount} people`} to confirm...</Text>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>They need to open the app and accept</Text>
                      </View>
                    </View>
                  )}
                  {/* Group full state — only when joiner actually confirmed */}
                  {slotsLeft <= 0 && confirmedCount > 0 && approvedCount === 0 && (
                    <View style={{ gap: 10, paddingTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(67,233,123,0.1)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(67,233,123,0.3)' }}>
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(67,233,123,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                          <PartyPopper size={18} color="#43E97B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#43E97B' }}>All {slotsTotal} spots filled!</Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Your social is complete. Time to chat!</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => onGoToMessages?.(ev)}
                        activeOpacity={0.85}
                        style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                        <MessageCircle size={16} color="#052e16" />
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>Go to group chat</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Approved members count (while still collecting) */}
                  {approvedCount > 0 && slotsLeft > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(67,233,123,0.12)', borderWidth: 1, borderColor: 'rgba(67,233,123,0.25)' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#43E97B' }}>✓ {approvedCount} approved</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{slotsLeft} spot{slotsLeft !== 1 ? 's' : ''} left</Text>
                      {(hostConfirmedMembers[ev.id] || []).length > 0 && (
                        <TouchableOpacity onPress={() => onGoToMessages?.(ev)} style={{ marginLeft: 'auto' as any }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#818CF8' }}>Open chat →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )
          })}
          {/* ── Incoming crew invites for events not in user's list (edge case) ── */}
          {incomingCrewInvites.filter((invite: any) => !myEvents.some((ev: any) => ev.id === invite.event_ref_id)).map((invite: any) => {
            const inviter = invite.inviter || {}
            const openInviter = () => {
              setPreviewProfile({ ...inviter, flag: FLAG_MAP[inviter.langs?.[0]] || '🌍', langs: (inviter.langs || []).map((l: string) => FLAG_MAP[l] || l) })
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            return (
              <TouchableOpacity key={invite.id} activeOpacity={0.85} onPress={openInviter}
                style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)' }}>
                <LinearGradient colors={['#6366F1', '#818CF8']} style={{ height: 6 }} />
                <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    {inviter.photos?.[0] ? (
                      <Image source={{ uri: inviter.photos[0] }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: inviter.color || '#818CF8', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{(inviter.name || '?')[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{inviter.name || 'Someone'} wants to crew up!</Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{invite.event_title}</Text>
                      {invite._format && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(167,139,250,0.95)', marginTop: 4 }}>
                          {invite._format === '1+1' ? "You'll match as a Duo (1+1)" : `You'll join their ${invite._format === 'party' ? 'Party' : 'Squad'} · up to ${invite._maxSize}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => onAcceptInvite?.(invite)} style={{ flex: 1, borderRadius: 99, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 12, elevation: 5 }}>
                      <Zap size={14} color="#052e16" fill="#052e16" />
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#052e16' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => onDeclineInvite?.(invite)} style={{ flex: 1, borderRadius: 99, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}

          {myEvents.map((ev: any) => {
            const isCommunity = ev.type === 'community'
            // Default to 'squad' for official events — matches handleJoinEvent's
            // [2,5] default in event_attendees. Was '1+1' which forced Duo (1/2)
            // display for users who joined via flows that didn't set userEventFormat.
            const format     = userEventFormat?.[ev.id]    || 'squad'
            // Crew-list mode covers squad/party official events. 1+1 has its own
            // dedicated UI below (per-person Invite + "Searching..." when alone) —
            // sending it through crew-list would show a bulk Confirm button that
            // invites a phantom partner when there's stale event_attendees data.
            const isCrewMode = !isCommunity && format !== '1+1'
            // For community events: use real participant count as crew size
            const cap        = isCommunity ? Math.min(ev.participantsCount || 5, 5) : (VIBE_FORMAT_MAX[format] || 5)
            const threshold  = isCommunity ? cap : (VIBE_FORMAT_THRESHOLD[format] || cap)
            const isParty    = !isCommunity && format === 'party'
            // For official events: use real attendees from DB; for community: use other approved members
            const realAttendees = isCommunity ? (communityEventMembers[ev.id] || []) : (ev.type === 'official' ? (eventAttendeesMap[ev.id] || []) : [])
            const passedIds = new Set(passedRequests[ev.id] || [])
            const partners   = isCommunity ? realAttendees : realAttendees
            // Exclude people who are already members of a crew for this event —
            // otherwise a duo-seeker sees a crew member listed BOTH inside the
            // "join directly" crew card AND below as a lone invitable person
            // (Daria's screenshot: Nikos appeared twice). Inviting a crew member
            // as duo would also pull them into a duplicate chat.
            const inAnyCrewIds = new Set<string>(
              (crewsByEvent[ev.id] || []).flatMap((c: any) => (c.members || []).map((m: any) => m.id))
            )
            const realPartners = partners.filter((p: any) => p._real && !passedIds.has(p.id) && !inAnyCrewIds.has(p.id))
            const hasRealAttendees = realPartners.length > 0
            // found = me (1) + non-skipped real partners
            const found      = hasRealAttendees ? realPartners.length + 1 : 1
            const isActive   = hasRealAttendees || isCommunity
            // Status label (excludes skipped people from count)
            const statusLabel = isCommunity
              ? (hasRealAttendees ? `${realAttendees.length + 1} in group` : 'HOST APPROVED')
              : realPartners.length > 0 ? `${realPartners.length} found` : (isParty ? 'GROUP ACTIVE' : 'Looking...')
            const hasReal = realPartners.length > 0
            const statusColor = (isActive || hasReal) ? '#43E97B' : '#FBBF24'
            const statusBg    = (isActive || hasReal) ? 'rgba(67,233,123,0.15)' : 'rgba(251,191,36,0.13)'
            const statusBorder= (isActive || hasReal) ? 'rgba(67,233,123,0.35)' : 'rgba(251,191,36,0.28)'
            const inviteSentToAll = realPartners.length > 0 && realPartners.every((p: any) => !!sentCrewInvites[`${ev.id}_${p.id}`])
            // Hide "Let's go!" if we have an incoming invite from any of these partners for this event
            const hasIncomingInviteForEvent = incomingCrewInvites.some((inv: any) => inv.event_ref_id === ev.id)

            return (
              <View key={ev.id} style={{
                borderRadius: 24, overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
              }}>
                <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />

                <View style={{ padding: 20 }}>
                  {/* Title + status */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: '#fff', letterSpacing: -0.3, lineHeight: 21 }} numberOfLines={2}>{ev.title}</Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{ev.date_label ? `${ev.date_label}${ev.time_label ? ' · ' + ev.time_label : ''}` : prettyEventTime(ev.time) || ''}{ev.distance && ev.distance !== '0km' ? ` · ${ev.distance}` : ev.location ? ` · ${ev.location}` : ''}</Text>
                    </View>
                    {/* Hide swipe-flow status badge in crew mode (was "1 found 🎯") */}
                    {!isCrewMode && (
                      <PulsingStatusBadge label={statusLabel} color={statusColor} bg={statusBg} border={statusBorder} />
                    )}
                  </View>


                  {/* Confirmation deadline banner — disabled. The yellow alarm-clock
                      reminder duplicated info shown by the green "approved, tap to
                      confirm" block + the big green CTA button just below. The card
                      had 5 stacked sections saying the same thing. */}

                  {/* Progress — hidden in crew-list mode (data shown in crew cards),
                      AND for community events where the user is just approved (status
                      'joined') so the card stays compact with just the CTA. Also
                      hidden once the user is in a crew chat for this event: the
                      duo-format cap (e.g. 2) misleads ("CREW FOUND 1/2") when they
                      actually joined a party crew of 20 — Open Chat is the right CTA.
                      Also hidden when there are joinable crews below — the bar shows
                      "5 / 2" (5 people looking, 2-person duo cap) which reads as
                      "5 of 2" and confuses users; the actual crew cards below are
                      the source of truth for membership. */}
                  {(() => {
                    const allCrews = crewsByEvent[ev.id] || []
                    const hasJoinable = allCrews.some((c: any) => c.members.length > 0 && c.members.length < (c.maxSize || VIBE_FORMAT_MAX[c.format] || 5))
                    return !isCrewMode && !(isCommunity && joinedEvents?.[ev.id] === 'joined') && !officialEventChatMap?.[ev.id] && !hasJoinable
                  })() && (
                  <View style={{ marginBottom: 18 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: '700', letterSpacing: 0.6 }}>
                        {isCommunity ? 'GROUP MEMBERS' : isParty ? 'PARTY · OPEN TO JOIN' : 'CREW FOUND'}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: statusColor }}>
                        {isCommunity ? `${ev.participantsCount || cap} going` : `${found} / ${cap}`}
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                      <LinearGradient
                        colors={isActive ? ['#43E97B','#38ef7d'] : ['#6366F1','#818CF8']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{
                          height: 6, borderRadius: 99, width: `${(found / cap) * 100}%` as any,
                          shadowColor: isActive ? '#43E97B' : '#818CF8',
                          shadowOpacity: 0.9, shadowRadius: 8, elevation: 4,
                        }}
                      />
                    </View>
                    {isParty && (
                      <Text style={{ fontSize: 10, color: 'rgba(67,233,123,0.6)', marginTop: 5, fontWeight: '600' }}>
                        {cap - found > 0 ? `${cap - found} spots left` : 'Full'}
                      </Text>
                    )}
                  </View>
                  )}

                  {/* Joinable crews for DUO-seekers too: model symmetry. The
                      squad/party UI already lists lone people so a squad-seeker
                      can invite a duo. The reverse was missing — a duo-seeker
                      only saw individual people, so a duo + an existing
                      party/squad crew ended up with the duo person sending a
                      duo-invite that the crew never reciprocated ("Waiting
                      forever"). Now duo also sees the existing crews directly. */}
                  {!isCrewMode && !isCommunity && format === '1+1' && !officialEventChatMap[ev.id] && (() => {
                    const allCrews = crewsByEvent[ev.id] || []
                    const joinable = allCrews.filter((c: any) => c.members.length > 0 && c.members.length < (c.maxSize || VIBE_FORMAT_MAX[c.format] || 5))
                    if (joinable.length === 0) return null
                    return (
                      <View style={{ gap: 8, marginBottom: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                          {joinable.length} {joinable.length === 1 ? 'crew is forming · join directly' : 'crews are forming · join directly'}
                        </Text>
                        {joinable.map((crew: any) => {
                          const scoreColor = crew.avgMatch >= 75 ? '#43E97B' : crew.avgMatch >= 55 ? '#FBBF24' : crew.avgMatch >= 35 ? '#A78BFA' : '#94A3B8'
                          const openCrewPreview = () => setCrewPreviewState({ ev, crew })
                          const crewMax = crew.maxSize || VIBE_FORMAT_MAX[crew.format] || 5
                          const crewFormat = crew.format as string | undefined
                          const formatLabel = crewFormat === '1+1' ? '1+1' : crewFormat === 'party' ? 'Party' : crewFormat === 'squad' ? 'Squad' : null
                          return (
                            <View key={crew.chatId}
                              style={{ backgroundColor: 'rgba(167,139,250,0.06)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)', gap: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ flexDirection: 'row' }}>
                                  {crew.members.slice(0, 3).map((m: any, i: number) => {
                                    const openMember = () => {
                                      setPreviewProfile({ ...m, flag: FLAG_MAP[m.langs?.[0]] || '🌍', langs: (m.langs || []).map((l: string) => FLAG_MAP[l] || l) })
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    }
                                    return (
                                      <TouchableOpacity key={m.id || i} activeOpacity={0.85} onPress={openMember}
                                        style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, borderColor: 'rgba(167,139,250,0.45)', marginLeft: i > 0 ? -12 : 0, overflow: 'hidden', backgroundColor: m.color || '#818CF8', alignItems: 'center', justifyContent: 'center' }}>
                                        {m.photo
                                          ? <Image source={{ uri: m.photo }} style={{ width: '100%', height: '100%' }} />
                                          : <Text style={{ fontSize: 16 }}>👤</Text>}
                                      </TouchableOpacity>
                                    )
                                  })}
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                                      {(crew.members[0]?.name?.split(' ')[0] || 'Crew')}{crew.members.length > 1 ? ` +${crew.members.length - 1}` : ''}
                                    </Text>
                                    {formatLabel && (
                                      <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(167,139,250,0.45)' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#A78BFA', letterSpacing: 0.4 }}>{formatLabel}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text numberOfLines={1} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'Outfit-Medium' }}>
                                    {crew.members.length} of {crewMax} · {crewMax - crew.members.length} {crewMax - crew.members.length === 1 ? 'spot' : 'spots'} left
                                  </Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Sparkle size={11} color={crew.avgMatch > 0 ? scoreColor : 'rgba(255,255,255,0.4)'} weight="fill" />
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: crew.avgMatch > 0 ? scoreColor : 'rgba(255,255,255,0.4)' }}>
                                      {crew.avgMatch > 0 ? `${crew.avgMatch}% vibe match` : 'Matching…'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              {/* Pills moved to a full-width bottom row so the header has the
                                  whole card width for the avatars + name + format chip. On a
                                  narrow Xiaomi screen the side-stacked pills were squeezing
                                  the name to ~80px ('Dar…') and wrapping 'Party' onto two lines. */}
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity activeOpacity={0.85}
                                  onPress={openCrewPreview}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  style={{ flex: 1, paddingVertical: 11, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center' }}>
                                  <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>View</Text>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.85}
                                  onPress={() => onJoinSpecificCrew?.(ev, crew.chatId)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  style={{ flex: 1, paddingVertical: 11, borderRadius: 99, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.35, shadowRadius: 10, elevation: 4, alignItems: 'center' }}>
                                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#052e16' }}>Join</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    )
                  })()}

                  {/* ── DUO (1+1) official event — one person at a time ── */}
                  {/* Crew-list mode supersedes DUO swipe for all official events. */}
                  {!isCrewMode && !isCommunity && format === '1+1' ? (() => {
                    const existingChatId = officialEventChatMap[ev.id]
                    // If chat already created → show Open Chat
                    if (existingChatId) {
                      return (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => onGoToMessages?.(ev)}
                          style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                          <MessageCircle size={16} color="#052e16" />
                          <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>Open Chat</Text>
                        </TouchableOpacity>
                      )
                    }
                    // Current person to show (first non-passed real attendee)
                    const currentPerson = realPartners[0]
                    // Incoming invite from this specific person
                    const incomingFromCurrent = currentPerson
                      ? incomingCrewInvites.find((inv: any) => inv.event_ref_id === ev.id && inv.inviter_id === currentPerson.id)
                      : null
                    // Any other incoming invite for this event (from someone not currently shown)
                    const anyIncoming = incomingCrewInvites.find((inv: any) => inv.event_ref_id === ev.id)

                    if (!currentPerson && !anyIncoming) {
                      // No matches yet
                      return (
                        <BlurView intensity={18} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', padding: 14 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(129,140,248,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                              <MagnifyingGlass size={16} color="#818CF8" weight="duotone" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>Searching...</Text>
                              <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.38)', lineHeight: 17 }}>You'll be notified when someone going to this event matches your vibe.</Text>
                            </View>
                          </View>
                        </BlurView>
                      )
                    }

                    // Show incoming invite card inline (from someone not in current queue)
                    if (!currentPerson && anyIncoming) {
                      const inviter = anyIncoming.inviter || {}
                      // Pull AI score for the inviter from the attendees map (same source as queue cards)
                      const inviterAttendee = (eventAttendeesMap[ev.id] || []).find((p: any) => p.id === inviter.id)
                      const inviterScore = inviterAttendee?.score ?? null
                      const inviterVibe = inviterAttendee?.vibe || ''
                      const scoreColor = inviterScore != null && inviterScore >= 75 ? '#43E97B' : '#818CF8'
                      const openInviterPreview = () => {
                        setPreviewProfile({
                          ...inviter,
                          colors: [inviter.color || '#6366F1', '#1E1B4B'],
                          flag: FLAG_MAP[inviter.langs?.[0]] || '🌍',
                          langs: (inviter.langs || []).map((l: string) => FLAG_MAP[l] || l),
                          aiScore: inviterScore,
                          aiReason: inviterVibe || 'Wants to go together',
                        })
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      }
                      return (
                        <View style={{ gap: 14 }}>
                          {/* Tap anywhere on the card to preview the inviter's profile.
                              View pill is retained as an explicit affordance. Action
                              buttons (Accept/Decline) below capture their own presses. */}
                          <TouchableOpacity activeOpacity={0.85} onPress={openInviterPreview}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                            {inviter.photos?.[0] ? (
                              <Image source={{ uri: inviter.photos[0] }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: scoreColor + '60' }} />
                            ) : (
                              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: inviter.color || '#818CF8', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{(inviter.name || '?')[0]}</Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }} numberOfLines={1}>{inviter.name || 'Someone'}</Text>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: anyIncoming._format ? 'rgba(167,139,250,0.95)' : 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                                {anyIncoming._format
                                  ? (anyIncoming._format === '1+1' ? "You'll match as a Duo (1+1)" : `You'll join their ${anyIncoming._format === 'party' ? 'Party' : 'Squad'} · up to ${anyIncoming._maxSize}`)
                                  : 'wants to go together'}
                              </Text>
                              {inviterScore != null && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                  <Sparkle size={10} color={scoreColor} weight="fill" />
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: scoreColor }}>{inviterScore}% vibe match</Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity activeOpacity={0.85}
                              onPress={openInviterPreview}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', minWidth: 70 }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' }}>View</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                            <TouchableOpacity activeOpacity={0.85} onPress={() => onAcceptInvite?.(anyIncoming)} style={{ paddingHorizontal: 26, borderRadius: 99, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3, minWidth: 110 }}>
                              <Zap size={14} color="#052e16" fill="#052e16" />
                              <Text style={{ fontSize: 14, fontWeight: '900', color: '#052e16' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => onDeclineInvite?.(anyIncoming)} style={{ paddingHorizontal: 20, borderRadius: 99, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 80 }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )
                    }

                    // Show current person with action buttons
                    const inviteSent = !!sentCrewInvites[`${ev.id}_${currentPerson!.id}`]
                    const scoreVal = currentPerson!.score
                    const scoreColor = scoreVal != null && scoreVal >= 75 ? '#43E97B' : '#818CF8'
                    const openPreview = () => {
                      setPreviewProfile({ ...currentPerson, flag: FLAG_MAP[currentPerson.langs?.[0]] || '🌍', langs: (currentPerson.langs || []).map((l: string) => FLAG_MAP[l] || l), aiScore: scoreVal, aiReason: currentPerson.vibe || 'Real attendee' })
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                    return (
                      <View style={{ gap: 14 }}>
                        {/* Tap anywhere on the card to preview profile; View pill is
                            still there as an explicit affordance. Invite/Skip pills
                            below capture their own presses and won't fire openPreview. */}
                        <TouchableOpacity activeOpacity={0.85} onPress={openPreview}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                          {currentPerson!.photo ? (
                            <Image source={{ uri: currentPerson!.photo }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: scoreColor + '60' }} />
                          ) : (
                            <LinearGradient colors={currentPerson!.colors || ['#6366F1','#818CF8']} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
                              <Text style={{ fontSize: 24 }}>{currentPerson!.emoji || '🎵'}</Text>
                            </LinearGradient>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }} numberOfLines={1}>{currentPerson!.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Sparkle size={10} color={scoreVal != null ? scoreColor : 'rgba(255,255,255,0.4)'} weight="fill" />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: scoreVal != null ? scoreColor : 'rgba(255,255,255,0.4)' }}>
                                {scoreVal != null ? `${scoreVal}% vibe match` : 'Matching…'}
                              </Text>
                            </View>
                            {currentPerson!.bio ? <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 16 }} numberOfLines={1}>{currentPerson!.bio}</Text> : null}
                            {/* Their format + transport — so you see they want e.g. a Squad
                                and need a ride, not just your own preference. */}
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                              {(() => {
                                const gm = currentPerson!.groupMax
                                const fmtLabel = gm === 2 ? 'Duo' : (gm != null && gm >= 6) ? 'Party' : 'Squad'
                                return (
                                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(167,139,250,0.15)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' }}>
                                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#A78BFA', letterSpacing: 0.3 }}>{fmtLabel}</Text>
                                  </View>
                                )
                              })()}
                              {currentPerson!.transport && (() => {
                                const tk = currentPerson!.transport
                                const TIcon = tk === 'meet' ? PhMapPin : tk === 'lift' ? PhHand : PhCar
                                const tLabel = tk === 'car' ? 'Can drive' : tk === 'lift' ? 'Needs a ride' : 'Meets there'
                                return (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <TIcon size={11} color="rgba(255,255,255,0.45)" weight="duotone" />
                                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>{tLabel}</Text>
                                  </View>
                                )
                              })()}
                            </View>
                          </View>
                          <TouchableOpacity activeOpacity={0.85}
                            onPress={openPreview}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', minWidth: 70 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' }}>View</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>

                        {/* Action buttons */}
                        {incomingFromCurrent ? (
                          // B sees A pressed Let's go → Accept / Decline (centered, Accept first + larger)
                          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                            <TouchableOpacity activeOpacity={0.85} onPress={() => onAcceptInvite?.(incomingFromCurrent)} style={{ paddingHorizontal: 26, borderRadius: 99, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3, minWidth: 110 }}>
                              <Zap size={14} color="#052e16" fill="#052e16" />
                              <Text style={{ fontSize: 14, fontWeight: '900', color: '#052e16' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => onDeclineInvite?.(incomingFromCurrent)} style={{ paddingHorizontal: 20, borderRadius: 99, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 80 }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        ) : inviteSent ? (
                          // Invite sent — waiting for them to confirm
                          <View style={{ gap: 10 }}>
                            <View style={{ borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)' }}>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FBBF24' }}>Waiting for {currentPerson?.name || 'them'}</Text>
                              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' }}>We'll create a chat if they confirm too.</Text>
                            </View>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => { onPassJoiner?.(ev.id, currentPerson); Haptics.selectionAsync() }} style={{ borderRadius: 99, paddingVertical: 11, alignItems: 'center' }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>Skip and see next</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          // Default: Invite + Skip — centered, Invite first and slightly larger
                          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => { onConfirm?.(ev, [currentPerson], format); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) }}
                              style={{ paddingHorizontal: 26, borderRadius: 99, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3, minWidth: 110 }}>
                              <Zap size={14} color="#052e16" fill="#052e16" />
                              <Text style={{ fontSize: 14, fontWeight: '900', color: '#052e16' }}>Invite</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => { onPassJoiner?.(ev.id, currentPerson); Haptics.selectionAsync() }}
                              style={{ paddingHorizontal: 20, borderRadius: 99, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', minWidth: 80 }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}>Skip</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )
                  })() : (
                  <>
                  {/* ── Non-duo: avatar row + CTA (squad / party / community) ── */}
                  {/* Crew-list mode replaces this whole "YOUR CREW SO FAR" avatar grid.
                      Also hidden for community events when user is just approved
                      (status='joined') to avoid the cluttered "5 sections of redundant
                      info" card before they tap Confirm. */}
                  {!isCrewMode && !(isCommunity && joinedEvents?.[ev.id] === 'joined') && (
                  <View style={{ marginBottom: isActive ? 20 : 0 }}>
                    {(partners.length > 0) && (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, marginBottom: 12 }}>
                        YOUR CREW SO FAR
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      {/* Me — always first */}
                      <View>
                        <LinearGradient colors={['#6366F1','#818CF8']} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
                          <Text style={{ fontSize: 22 }}>😊</Text>
                        </LinearGradient>
                        <Text style={{ fontSize: 10, color: '#818CF8', textAlign: 'center', marginTop: 4, fontWeight: '700' }}>You</Text>
                      </View>
                      {/* Partners */}
                      {partners.filter((p: any) => !new Set(passedRequests[ev.id] || []).has(p.id)).map((p: any, i: number) => {
                        const match = aiMatches.find((m: any) => m.id === p.id)
                        const isReal = !!p._real
                        return (
                          <View key={i} style={{ alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => {
                            const aiScore = isReal ? (p.score ?? null) : (match?.score ?? 50)
                            const aiReason = isReal ? (p.vibe || 'Real attendee') : (match?.reason ?? 'Ready to connect')
                            setPreviewProfile({ ...p, flag: FLAG_MAP[p.langs?.[0]] || '🌍', langs: (p.langs || []).map((l: string) => FLAG_MAP[l] || l), aiScore, aiReason })
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          }} activeOpacity={0.75}>
                            <View style={{ alignItems: 'center' }}>
                              {isReal && p.photo ? (
                                <Image source={{ uri: p.photo }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                              ) : (
                                <LinearGradient colors={p.colors as any} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
                                  <Text style={{ fontSize: 22 }}>{p.emoji || '🎵'}</Text>
                                </LinearGradient>
                              )}
                              {isReal ? (
                                <View style={{ marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99,
                                  backgroundColor: p.score != null && p.score >= 75 ? 'rgba(67,233,123,0.2)' : p.score != null && p.score >= 50 ? 'rgba(129,140,248,0.2)' : 'rgba(67,233,123,0.2)' }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800',
                                    color: p.score != null && p.score >= 75 ? '#43E97B' : p.score != null && p.score >= 50 ? '#818CF8' : '#43E97B' }}>
                                    {p.score != null ? `${p.score}%` : 'REAL'}
                                  </Text>
                                </View>
                              ) : match ? (
                                <View style={{ marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, backgroundColor: match.score >= 75 ? 'rgba(67,233,123,0.2)' : 'rgba(129,140,248,0.2)' }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: match.score >= 75 ? '#43E97B' : '#818CF8' }}>{match.score}%</Text>
                                </View>
                              ) : null}
                              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 2, fontWeight: '600' }}>{p.name}</Text>
                            </View>
                          </TouchableOpacity>
                          </View>
                        )
                      })}
                      {/* Empty slots = cap - found (me already counted in found) */}
                      {found < cap && (
                        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.2)' }}>+{cap - found}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  )}

                  {/* CTA */}
                  {isCommunity && !hasRealAttendees && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', marginBottom: 10 }}>
                      <Text style={{ fontSize: 18 }}>✅</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 }}>You're approved! More people may join. Open the chat to say hi.</Text>
                    </View>
                  )}
                  {/* Crew-list UI takes over for squad/party official + community events.
                      1+1 official has its own dedicated UI above — skip this whole block,
                      otherwise the bulk Confirm button shows up and invites phantom partners
                      when there are stale event_attendees rows. */}
                  {!(format === '1+1' && !isCommunity) && (isActive || !isCommunity || (joinedEvents?.[ev.id] === 'confirmed' && !!officialEventChatMap[ev.id])) && (
                    <View style={{ gap: 10 }}>
                      {(() => {
                        const isCrewMode = !isCommunity && (format === 'squad' || format === 'party')
                        const isAlreadyConfirmed = joinedEvents?.[ev.id] === 'confirmed' && !!officialEventChatMap[ev.id]

                        // ── Crew-list mode (all official events: 1+1 / squad / party) ──
                        // Everyone gets the same crew-list UI; the format only changes
                        // the max chat size (2 / 5 / 20 from VIBE_FORMAT_MAX).
                        if (isCrewMode) {
                          const crews = crewsByEvent[ev.id] || []
                          const myCrew = crews.find((c: any) => c.members.some((m: any) => m.id === userData?.dbId))
                          // Use the crew's own maxSize (party=20 / squad=5 / 1+1=2)
                          // rather than the viewer's local format pick — if you
                          // joined a party crew while your own pick was squad,
                          // the "X spots left" count must reflect the crew you're
                          // actually in, not your stale local preference.
                          const maxSize = myCrew?.maxSize || VIBE_FORMAT_MAX[format] || 5
                          // Fallback when user just created/joined and the 5s polling hasn't
                          // refreshed crewsByEvent yet — joinedEvents+officialEventChatMap
                          // already says "they're in a crew", so show the badge immediately.
                          const isOptimisticallyInCrew = !myCrew && joinedEvents?.[ev.id] === 'confirmed' && !!officialEventChatMap[ev.id]
                          // Surface an incoming invite in crew mode too — otherwise a
                          // squad/party invitee only ever sees "Start your own crew" and
                          // never the invite someone sent them.
                          const crewIncoming = incomingCrewInvites.find((inv: any) => inv.event_ref_id === ev.id)
                          if (crewIncoming && !myCrew && !isOptimisticallyInCrew) {
                            const inviter = crewIncoming.inviter || {}
                            return (
                              <View style={{ gap: 12 }}>
                                <TouchableOpacity activeOpacity={0.85}
                                  onPress={() => {
                                    setPreviewProfile({ ...inviter, flag: FLAG_MAP[inviter.langs?.[0]] || '🌍', langs: (inviter.langs || []).map((l: string) => FLAG_MAP[l] || l) })
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                  }}
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(67,233,123,0.07)', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(67,233,123,0.22)' }}>
                                  {inviter.photos?.[0] ? (
                                    <Image source={{ uri: inviter.photos[0] }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                                  ) : (
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: inviter.color || '#818CF8', alignItems: 'center', justifyContent: 'center' }}>
                                      <Text style={{ fontSize: 18, color: '#fff', fontWeight: '800' }}>{(inviter.name || '?').charAt(0)}</Text>
                                    </View>
                                  )}
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }} numberOfLines={1}>{inviter.name || 'Someone'} invited you</Text>
                                    <Text style={{ fontSize: 11, color: 'rgba(167,139,250,0.95)', fontWeight: '700', marginTop: 2 }}>
                                      {crewIncoming._format
                                        ? (crewIncoming._format === '1+1' ? "You'll match as a Duo (1+1)" : `You'll join their ${crewIncoming._format === 'party' ? 'Party' : 'Squad'} · up to ${crewIncoming._maxSize}`)
                                        : 'Accept to join their crew'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                                  <TouchableOpacity activeOpacity={0.85} onPress={() => onAcceptInvite?.(crewIncoming)} style={{ paddingHorizontal: 26, borderRadius: 99, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#43E97B', minWidth: 120, justifyContent: 'center' }}>
                                    <Zap size={14} color="#052e16" fill="#052e16" />
                                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#052e16' }}>Accept</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity activeOpacity={0.8} onPress={() => onDeclineInvite?.(crewIncoming)} style={{ paddingHorizontal: 20, borderRadius: 99, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 90, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>Decline</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )
                          }
                          if (myCrew || isOptimisticallyInCrew) {
                            const memberCount = myCrew?.members.length ?? 1
                            return (
                              <View style={{ gap: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(67,233,123,0.07)', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(67,233,123,0.22)' }}>
                                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(67,233,123,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={16} color="#43E97B" />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#43E97B' }}>You're in a crew of {memberCount}</Text>
                                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                                      {memberCount < maxSize ? `Still looking — ${maxSize - memberCount} more can join your crew` : 'Crew is full'}
                                    </Text>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => onGoToMessages?.(ev)}
                                  style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                                  <MessageCircle size={16} color="#fff" />
                                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff' }}>Open Chat</Text>
                                </TouchableOpacity>
                              </View>
                            )
                          }
                          // Not in any crew yet — show existing crews + Create new.
                          // Visual priority is JOIN (existing crews), not CREATE.
                          // Filter out crews that are full AND orphan empty crews (zero
                          // members — leftovers). "Full" is judged by the CREW's own
                          // maxSize, not the viewer's format — so a duo-seeker still sees
                          // a squad crew of 5 (shown as "3 of 5 · Squad"), not just crews
                          // matching their own size.
                          const joinable = crews.filter((c: any) => c.members.length > 0 && c.members.length < (c.maxSize || maxSize))
                          // Lone attendees not yet in any crew — invitable into MY crew.
                          // This is what makes a squad-seeker see a duo-seeker (and vice
                          // versa): everyone on the event is discoverable, format is a hint.
                          const crewMemberIds = new Set<string>(crews.flatMap((c: any) => (c.members || []).map((m: any) => m.id)))
                          const lonePeople = realPartners.filter((p: any) => !crewMemberIds.has(p.id))
                          return (
                            <View style={{ gap: 8 }}>
                              {/* Individuals shown FIRST — primary interaction is exploring
                                  candidates ("here are the people, pick who you click with").
                                  Ready crews come below as a quick-path alternative. */}
                              {lonePeople.length === 0 && joinable.length === 0 && (
                                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontStyle: 'italic' }}>
                                  No one's here yet — be the first.
                                </Text>
                              )}
                              {lonePeople.length > 0 && (
                                <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                                  {lonePeople.length === 1 ? '1 person looking' : `${lonePeople.length} people looking`}
                                </Text>
                              )}
                              {lonePeople.map((p: any) => {
                                const invited = !!sentCrewInvites[`${ev.id}_${p.id}`]
                                const sv = p.score
                                const sColor = sv != null && sv >= 75 ? '#43E97B' : sv != null && sv >= 55 ? '#FBBF24' : '#A78BFA'
                                const gm = p.groupMax
                                const fmtLabel = gm === 2 ? 'Duo' : (gm != null && gm >= 6) ? 'Party' : 'Squad'
                                const openP = () => {
                                  setPreviewProfile({ ...p, flag: FLAG_MAP[p.langs?.[0]] || '🌍', langs: (p.langs || []).map((l: string) => FLAG_MAP[l] || l), aiScore: sv, aiReason: p.vibe || 'Real attendee' })
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                }
                                return (
                                  <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={openP}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {p.photo ? (
                                      <Image source={{ uri: p.photo }} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: sColor + '50' }} />
                                    ) : (
                                      <LinearGradient colors={p.colors || ['#6366F1', '#818CF8']} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' }}>
                                        <Text style={{ fontSize: 20 }}>{p.emoji || '🎵'}</Text>
                                      </LinearGradient>
                                    )}
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: '#fff', flexShrink: 1 }}>{p.name}</Text>
                                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(167,139,250,0.15)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' }}>
                                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#A78BFA', letterSpacing: 0.3 }}>{fmtLabel}</Text>
                                        </View>
                                      </View>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                        <Sparkle size={10} color={sv != null ? sColor : 'rgba(255,255,255,0.4)'} weight="fill" />
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: sv != null ? sColor : 'rgba(255,255,255,0.4)' }}>{sv != null ? `${sv}% vibe match` : 'Matching…'}</Text>
                                      </View>
                                    </View>
                                    <View style={{ gap: 10 }}>
                                      <TouchableOpacity activeOpacity={0.85} onPress={openP} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', minWidth: 66 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' }}>View</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity activeOpacity={invited ? 1 : 0.85} disabled={invited}
                                        onPress={() => { onInviteToMyCrew?.(ev, p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: invited ? 'rgba(67,233,123,0.18)' : '#43E97B', alignItems: 'center', minWidth: 66, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                                        {invited ? <CheckCircle size={13} color="#43E97B" /> : <Zap size={13} color="#052e16" fill="#052e16" />}
                                        <Text style={{ fontSize: 13, fontWeight: '900', color: invited ? '#43E97B' : '#052e16' }}>{invited ? 'Invited' : 'Invite'}</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </TouchableOpacity>
                                )
                              })}
                              {joinable.length > 0 && (
                                <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase', marginTop: lonePeople.length > 0 ? 10 : 0, marginBottom: 4 }}>
                                  Or join {joinable.length === 1 ? 'an existing crew' : `one of ${joinable.length} crews`}
                                </Text>
                              )}
                              {joinable.map((crew: any) => {
                                const scoreColor = crew.avgMatch >= 75 ? '#43E97B' : crew.avgMatch >= 55 ? '#FBBF24' : crew.avgMatch >= 35 ? '#A78BFA' : '#94A3B8'
                                const openCrewPreview = () => setCrewPreviewState({ ev, crew })
                                // Use the crew's own format/maxSize (stored on the chat row) — not
                                // the current user's chosen format. That way the card says "1 of 5"
                                // for a squad crew even if the viewer picked party.
                                const crewMax = crew.maxSize || maxSize
                                const crewFormat = crew.format as string | undefined
                                const formatLabel = crewFormat === '1+1' ? '1+1' : crewFormat === 'party' ? 'Party' : crewFormat === 'squad' ? 'Squad' : null
                                return (
                                  // Card itself is non-interactive — two explicit pills on the
                                  // right do the actions. View = preview members, Join = commit.
                                  <View key={crew.chatId}
                                    style={{ backgroundColor: 'rgba(167,139,250,0.06)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)', gap: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                      <View style={{ flexDirection: 'row' }}>
                                        {crew.members.slice(0, 3).map((m: any, i: number) => {
                                          const openMember = () => {
                                            setPreviewProfile({ ...m, flag: FLAG_MAP[m.langs?.[0]] || '🌍', langs: (m.langs || []).map((l: string) => FLAG_MAP[l] || l) })
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                          }
                                          return (
                                            <TouchableOpacity key={m.id || i} activeOpacity={0.85} onPress={openMember}
                                              style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, borderColor: 'rgba(167,139,250,0.45)', marginLeft: i > 0 ? -12 : 0, overflow: 'hidden', backgroundColor: m.color || '#818CF8', alignItems: 'center', justifyContent: 'center' }}>
                                              {m.photo
                                                ? <Image source={{ uri: m.photo }} style={{ width: '100%', height: '100%' }} />
                                                : <Text style={{ fontSize: 16 }}>👤</Text>}
                                            </TouchableOpacity>
                                          )
                                        })}
                                      </View>
                                      <View style={{ flex: 1, gap: 4 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                          <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                                            {(crew.members[0]?.name?.split(' ')[0] || 'Crew')}{crew.members.length > 1 ? ` +${crew.members.length - 1}` : ''}
                                          </Text>
                                          {formatLabel && (
                                            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(167,139,250,0.45)' }}>
                                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#A78BFA', letterSpacing: 0.4 }}>{formatLabel}</Text>
                                            </View>
                                          )}
                                        </View>
                                        <Text numberOfLines={1} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'Outfit-Medium' }}>
                                          {crew.members.length} of {crewMax} · {crewMax - crew.members.length} {crewMax - crew.members.length === 1 ? 'spot' : 'spots'} left
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                          <Sparkle size={11} color={crew.avgMatch > 0 ? scoreColor : 'rgba(255,255,255,0.4)'} weight="fill" />
                                          <Text style={{ fontSize: 11, fontWeight: '700', color: crew.avgMatch > 0 ? scoreColor : 'rgba(255,255,255,0.4)' }}>
                                            {crew.avgMatch > 0 ? `${crew.avgMatch}% vibe match` : 'Matching…'}
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                      <TouchableOpacity activeOpacity={0.85}
                                        onPress={openCrewPreview}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={{ flex: 1, paddingVertical: 11, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>View</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity activeOpacity={0.85}
                                        onPress={() => onJoinSpecificCrew?.(ev, crew.chatId)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={{ flex: 1, paddingVertical: 11, borderRadius: 99, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.35, shadowRadius: 10, elevation: 4, alignItems: 'center' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#052e16' }}>Join</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                )
                              })}
                              {/* When no crews exist — designer primary CTA: dark glass body
                                  with a soft gradient border + gradient text. Subtle but clear.
                                  When crews already exist — small secondary text link. */}
                              {(joinable.length === 0 && lonePeople.length === 0) ? (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => onCreateNewCrew?.(ev)}
                                  style={{ marginTop: 4 }}>
                                  <LinearGradient
                                    colors={['#A78BFA', '#43E97B']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 99, padding: 1.5 }}>
                                    <View style={{ borderRadius: 99, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#0F0C1F' }}>
                                      <MaskedView
                                        maskElement={
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '900', color: '#000' }}>✨ Start your own crew</Text>
                                          </View>
                                        }>
                                        <LinearGradient
                                          colors={['#A78BFA', '#43E97B']}
                                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 18 }}>
                                          <Text style={{ fontSize: 14, fontWeight: '900', opacity: 0 }}>✨ Start your own crew</Text>
                                        </LinearGradient>
                                      </MaskedView>
                                    </View>
                                  </LinearGradient>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => onCreateNewCrew?.(ev)}
                                  style={{ paddingVertical: 12, alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' }}>
                                    + or start your own
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )
                        }

                        // ── Non-crew formats (1+1 duo / community) — keep old behavior ──
                        if (isAlreadyConfirmed) {
                          return (
                            <View style={{ gap: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(67,233,123,0.07)', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(67,233,123,0.22)' }}>
                                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(67,233,123,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckCircle size={16} color="#43E97B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#43E97B' }}>You're in!</Text>
                                </View>
                              </View>
                              <TouchableOpacity activeOpacity={0.85} onPress={() => onGoToMessages?.(ev)}
                                style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                                <MessageCircle size={16} color="#fff" />
                                <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff' }}>Open Chat</Text>
                              </TouchableOpacity>
                            </View>
                          )
                        }
                        return (
                          <TouchableOpacity
                            activeOpacity={inviteSentToAll ? 1 : 0.85}
                            disabled={inviteSentToAll}
                            onPress={() => onConfirm?.(ev, partners, format)}
                            style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: inviteSentToAll ? 'rgba(67,233,123,0.2)' : '#43E97B', shadowColor: '#43E97B', shadowOpacity: inviteSentToAll ? 0 : 0.4, shadowRadius: 14, elevation: inviteSentToAll ? 0 : 6 }}>
                            {!inviteSentToAll && (isCommunity ? <MessageCircle size={15} color="#052e16" /> : <Zap size={15} color="#052e16" fill="#052e16" />)}
                            {inviteSentToAll && <CheckCircle size={15} color="#43E97B" />}
                            <Text style={{ fontSize: 15, fontWeight: '900', color: inviteSentToAll ? '#43E97B' : '#052e16' }}>
                              {isCommunity ? 'Confirm & Open Chat' : inviteSentToAll ? 'Invite sent' : 'Confirm'}
                            </Text>
                          </TouchableOpacity>
                        )
                      })()}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onLeave?.(ev)}
                        style={{ borderRadius: 99, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Plans changed</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  </>
                  )}
                </View>
              </View>
            )
          })}

          {/* Community events — pending host approval */}
          {myCommunityEvents.map((ev: any) => {
            const isPending = joinedEvents?.[ev.id] === 'pending'
            const total = ev.maxParticipants || ev.capacity || 20
            const filled = (ev.participantsCount || 0) + (isPending ? 0 : 1)
            const free = Math.max(0, total - filled)
            const compatScore = scoreEventForRequester(userData || {}, ev)
            const compatColor = compatScore >= 70 ? '#43E97B' : compatScore >= 50 ? '#FBBF24' : '#F87171'
            const compatLabel = compatScore >= 70 ? 'Great match' : compatScore >= 50 ? 'Good fit' : 'Low match'
            const interestMatch = (userData?.interests || []).includes(ev.category)
            return (
              <View key={`community-${ev.id}`} style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: isPending ? 'rgba(245,158,11,0.25)' : 'rgba(67,233,123,0.28)' }}>
                <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }} numberOfLines={2}>{ev.title}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{ev.date_label ? `${ev.date_label}${ev.time_label ? ' · ' + ev.time_label : ''}` : prettyEventTime(ev.time) || ''}{ev.location ? ` · ${ev.location}` : ''}</Text>
                      {ev.hostTransport === 'car' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                          <Text style={{ fontSize: 11 }}>🚗</Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>Host can give a lift</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, backgroundColor: isPending ? 'rgba(245,158,11,0.15)' : 'rgba(67,233,123,0.15)', borderWidth: 1, borderColor: isPending ? 'rgba(245,158,11,0.4)' : 'rgba(67,233,123,0.4)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: isPending ? '#FBBF24' : '#43E97B' }}>{isPending ? 'PENDING ⏳' : 'APPROVED ✓'}</Text>
                    </View>
                  </View>

                  {/* Compatibility with this event */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${compatColor}22`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: compatColor }}>{compatScore}%</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: compatColor }}>{compatLabel} ✦</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {interestMatch ? `Matches your interest in ${ev.category}` : 'AI matched based on your profile'}
                      </Text>
                    </View>
                  </View>

                  {/* Real capacity bar */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 0.5 }}>SPOTS FILLED</Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)' }}>{filled} / {total} · {free === 0 ? 'Full' : `${free} spot${free === 1 ? '' : 's'} left`}</Text>
                    </View>
                    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                      <LinearGradient
                        colors={['#6366F1', '#818CF8']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ height: 3, borderRadius: 99, width: `${Math.min(100, (filled / total) * 100)}%` as any }}
                      />
                    </View>
                  </View>

                  {isPending ? (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(245,158,11,0.07)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        <Clock size={16} color="#FCD34D" />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FCD34D' }}>Waiting for host approval</Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)', lineHeight: 18 }}>
                          {compatScore >= 60 ? 'Your match score looks great — good chances!' : 'The host reviews all requests by compatibility score.'}{'\n'}You'll get a notification when they respond.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => onConfirm?.(ev, [], 'community')}
                      style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                      <MessageCircle size={16} color="#052e16" />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>Open Chat</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onLeave?.(ev)}
                    style={{ borderRadius: 99, paddingVertical: 12, alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>Cancel request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}

          {/* Pending approval cards for user-created socials */}
          {pendingHostedEvents.map((ev: any) => {
            // Rough compatibility hint: lang overlap + category interest
            const userLangs: string[] = userData?.langs || []
            const hostLangs: string[] = ev.hostLangs || []
            const langMatch = userLangs.some((l: string) => hostLangs.includes(l))
            const interestMatch = (userData?.interests || []).includes(ev.category)
            const compatScore = (langMatch ? 40 : 10) + (interestMatch ? 35 : 5) + 20
            const compatColor = compatScore >= 70 ? '#43E97B' : compatScore >= 50 ? '#FBBF24' : '#94A3B8'
            const compatLabel = compatScore >= 70 ? 'Strong match' : compatScore >= 50 ? 'Good fit' : 'Different vibes'
            return (
              <View key={`hosted-pending-${ev.id}`} style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)' }}>
                <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }} numberOfLines={2}>{ev.title}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{ev.date_label ? `${ev.date_label}${ev.time_label ? ' · ' + ev.time_label : ''}` : prettyEventTime(ev.time) || ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 5 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(245,158,11,0.13)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' }}>
                        <User size={9} color="#F59E0B" />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#F59E0B' }}>SOCIAL</Text>
                      </View>
                      <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, backgroundColor: `${compatColor}18`, borderWidth: 1, borderColor: `${compatColor}40` }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: compatColor }}>{compatScore}% · {compatLabel}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(245,158,11,0.07)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <Clock size={16} color="#FCD34D" />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FCD34D' }}>Waiting for host approval</Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)', lineHeight: 18 }}>
                        {langMatch ? 'The host speaks your language — great sign!' : 'The organizer reviews requests manually.'}{'\n'}You'll be notified as soon as they respond.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => onLeave?.(ev)}
                    style={{ marginTop: 14, borderRadius: 99, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Cancel request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {previewProfile && <ProfilePreviewSheet profile={previewProfile} onClose={() => setPreviewProfile(null)} onBlock={onBlockUser} onReport={onReportUser} />}
      {/* Crew preview modal — list of all members in a specific crew with Join button */}
      {crewPreviewState && (
        <Modal transparent statusBarTranslucent animationType="slide" onRequestClose={() => setCrewPreviewState(null)}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)' }} activeOpacity={1} onPress={() => setCrewPreviewState(null)} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '85%', backgroundColor: '#0A0812', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
            <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.6, textTransform: 'uppercase' }}>Crew at</Text>
              <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '900', color: '#fff', marginTop: 2 }}>{crewPreviewState.ev?.title}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{crewPreviewState.crew.members.length} member{crewPreviewState.crew.members.length === 1 ? '' : 's'} · tap to view profile</Text>
            </View>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}>
              {crewPreviewState.crew.members.map((m: any) => (
                <TouchableOpacity key={m.id} activeOpacity={0.85} onPress={() => {
                  // iOS won't render Modal-over-Modal — close crew preview first,
                  // wait for the slide-out animation, then open the profile sheet.
                  const memberToShow = m
                  setCrewPreviewState(null)
                  setTimeout(() => setPreviewProfile(memberToShow), 350)
                }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                  {m.photo ? <Image source={{ uri: m.photo }} style={{ width: 48, height: 48, borderRadius: 24 }} /> :
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: m.color || '#818CF8', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                  </View>}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{m.name}{m.age ? `, ${m.age}` : ''}</Text>
                    {m.bio ? <Text numberOfLines={1} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{m.bio}</Text> : null}
                    {(m.interests || []).length > 0 && (
                      <Text numberOfLines={1} style={{ fontSize: 11, color: 'rgba(167,139,250,0.85)', marginTop: 2 }}>
                        {(m.interests || []).slice(0, 3).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <CaretRight size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom + 8, 18), borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => {
                const { ev, crew } = crewPreviewState
                setCrewPreviewState(null)
                onJoinSpecificCrew?.(ev, crew.chatId)
              }}
                style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>Join this crew</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <CrewPoolSheet
        visible={!!crewPoolEv}
        event={crewPoolEv}
        // Use eventAttendeesMap (includes status='looking' members too) so the
        // pool is visible immediately after both users join the event — no need
        // to first go through the VibeCheck swipe flow to flip status to 'ready'.
        members={crewPoolEv ? (eventAttendeesMap[crewPoolEv.id] || []) : []}
        userProfile={{
          interests: userData?.interests,
          langs: userData?.langs,
          age: userData?.age,
          drinksPref: userData?.drinksPref,
          smokingPref: userData?.smokingPref,
          dealbreakers: userData?.dealbreakers,
        }}
        passedIds={crewPoolEv ? (passedIdsByEvent[crewPoolEv.id] || new Set()) : new Set()}
        onPass={(profileId: string) => {
          if (crewPoolEv) onPassMember?.(crewPoolEv.id, profileId)
        }}
        onJoin={() => { if (crewPoolEv) onJoinCrew?.(crewPoolEv) }}
        onClose={() => setCrewPoolEv(null)}
        onOpenProfile={(m: any) => setPreviewProfile(m)}
      />
      <ConfirmDialog
        visible={!!cancelEventTarget}
        title={`Cancel "${cancelEventTarget?.title || ''}"?`}
        body="This will delete the event and notify everyone in the crew."
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
    </View>
  )
}
