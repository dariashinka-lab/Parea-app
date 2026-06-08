// app/(tabs)/index.tsx — Parea Mobile
import { Feather, Ionicons } from '@expo/vector-icons'
import { Users, UsersRound, PartyPopper, Dumbbell, UtensilsCrossed, Briefcase, Leaf, Palette, Pencil, CheckCircle, Zap, Car, MapPin, ThumbsUp, User, Radio, Clock, Search, Trash2, Crown, Check, Minus, MessageCircle, X, ChevronRight, CalendarDays, MoreHorizontal, Coffee, Wine, Cpu, Gamepad2, Music, Drama, Lock, Globe } from 'lucide-react-native'
import { Bell as PhBell, MagnifyingGlass, CalendarBlank, CaretDown, CaretLeft, CaretRight, MapPin as PhMapPin, Sparkle, Coffee as PhCoffee, Barbell, Wine as PhWine, GameController, Cpu as PhCpu, Leaf as PhLeaf, ForkKnife, Palette as PhPalette, MusicNotes, UsersThree, Car as PhCar, Star as PhStar, Ticket as PhTicket, PushPin, HouseLine, Couch, Scales, Butterfly, Confetti, Prohibit, Wind, Fire, Drop, CheckCircle as PhCheckCircle, Warning, Clock as PhClock, Trash as PhTrash, ChatTeardrop, HandWaving, Crosshair, TennisBall, Mountains, YinYang, AirplaneTilt, Books, Camera as PhCamera, MaskHappy, Umbrella, MicrophoneStage, WaveSine, Scissors as PhScissors, TShirt, FilmSlate, PersonSimpleSwim, Briefcase as PhBriefcase, Egg, SunHorizon, Handshake, Coins, Laptop, Sailboat } from '../../lib/phosphor-icons'
import Svg, { Circle, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { BlurView } from 'expo-blur'

WebBrowser.maybeCompleteAuthSession()

import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, Animated, AppState, Dimensions, FlatList, Image, Keyboard, Linking, LogBox, Share,
  KeyboardAvoidingView, LayoutAnimation, Modal, PanResponder, Platform, Pressable,
  ScrollView, StatusBar as RNStatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'

LogBox.ignoreLogs(['Invalid Refresh Token', 'AuthApiError: Invalid Refresh Token'])
import * as ExpoLinking from 'expo-linking'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import ConfettiCannon from 'react-native-confetti-cannon'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../lib/supabase'
import { BreathingButton } from '../../lib/components/BreathingButton'
import { AuroraBg } from '../../lib/components/AuroraBg'
import { DobBottomSheet } from '../../lib/components/DobBottomSheet'
import { AnimatedInterestChip } from '../../lib/components/AnimatedInterestChip'
import { ReportModal } from '../../lib/components/ReportModal'
import { ProfilePreviewSheet } from '../../lib/components/ProfilePreviewSheet'
import { LocationPicker } from '../../lib/components/LocationPicker'
import { CrewPoolSheet } from '../../lib/components/CrewPoolSheet'
import { LandingScreen } from '../../lib/screens/LandingScreen'
import { RegistrationScreen } from '../../lib/screens/RegistrationScreen'
import { OTPScreen } from '../../lib/screens/OTPScreen'
import { OnboardingScreen } from '../../lib/screens/OnboardingScreen'
import { ProfileTab } from '../../lib/screens/ProfileTab'
import { MessagesTab } from '../../lib/screens/MessagesTab'
import { VibeCheckTab } from '../../lib/screens/VibeCheckTab'
import { ChatScreen } from '../../lib/screens/ChatScreen'
import { useChats } from '../../lib/hooks/useChats'
import { useNotifs, BELL_TYPES, CHAT_TYPES, PLANS_TYPES, Notif } from '../../lib/hooks/useNotifs'
import { registerPushToken, sendPush } from '../../lib/push'
import * as Notifications from 'expo-notifications'
import { uploadPhotoToStorage, isImageSafe } from '../../lib/photo-helpers'
import { SOCIAL_ENERGY } from '../../lib/social-energy'
import { s } from '../../lib/feed-styles'
import { INTEREST_ICON_MAP } from '../../lib/interest-icons'
import {
  INTERESTS_LIST, INTERESTS_BY_CATEGORY, INTEREST_CATEGORY_PALETTE, INTEREST_TO_CATEGORY,
  LANGUAGES_LIST, CITIES, MOCK_COMMUNITY_EVENTS, MOCK_EVENTS,
  CATEGORY_EMOJI, CATEGORY_COLOR, CATEGORY_BG,
  BENTO_SONGS, BENTO_FLAGS, BENTO_MOODS, MAGIC_BIOS,
  FLAG_MAP, TRANSPORT_LABEL, MOCK_SEEKERS, FORMAT_BADGE, FORMAT_SIZES,
  MOCK_CHATS, MOCK_MESSAGES, COUNTRIES,
  MUSIC_GENRES, PRIMARY_GENRE_COUNT, VIBE_CATS, DEALBREAKERS,
  QUEUE_PROFILES, VIBE_FORMAT_MAX, VIBE_FORMAT_THRESHOLD, VIBE_FORMAT_LABEL, GOAL_LABEL,
  REPORT_REASONS, CREATE_EVENT_TYPES, CITY_CENTERS,
} from '../../lib/feed-constants'
import { prettyEventTime, scoreRequesterForHost, scoreEventForRequester, MAX_AGE_GAP, parseEventDate, parseEventDateTime, isEventPast } from '../../lib/feed-helpers'

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ''

const { width: W, height: H } = Dimensions.get('window')
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY || ''

// uploadPhotoToStorage moved to lib/photo-helpers.ts (shared with OnboardingScreen)

// ─── AURORA BACKGROUND ────────────────────────────────────────────────────────

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, any> = { coffee: PhCoffee, sports: Barbell, wine: PhWine, gaming: GameController, tech: PhCpu, outdoors: PhLeaf, food: ForkKnife, culture: PhPalette, music: MusicNotes, dance: MaskHappy, theatre: MaskHappy, art: PhPalette }


// ─── AI COMPANION MATCHING ────────────────────────────────────────────────────

type MatchResult = { id: number; score: number; reason: string }

async function aiScoreRealAttendees(
  user: { name?: string; age?: any; langs?: string[]; interests?: string[]; drinksPref?: string; smokingPref?: string; bio?: string; transport?: string; dealbreakers?: string[] },
  candidates: { id: string; name: string; age?: any; langs?: string[]; interests?: string[]; drinksPref?: string; smokingPref?: string; bio?: string; transport?: string; hasPets?: boolean }[]
): Promise<{ id: string; score: number; vibe: string }[]> {
  if (candidates.length === 0) return []
  // For official-event attendees we hard-cut on user's explicit dealbreakers —
  // score=0 surfaces them as a clear reason rather than a misleading 50-70% AI
  // suggestion. Age gap is NOT hard-blocked here: both users already chose this
  // event, so the AI's natural age-proximity weighting (low score for big gaps)
  // is enough — let them decide. MAX_AGE_GAP only filters at primary feed
  // discovery (community events with mismatched host age, line 2084).
  const userDb = user.dealbreakers || []
  const blockReason = (c: any): string | null => {
    if (userDb.includes('no_smoking') && (c.smokingPref === 'Smoker' || c.smokingPref === 'Social')) return 'Smoking dealbreaker'
    if (userDb.includes('sober_only') && c.drinksPref === 'Social drinker') return 'Drinking dealbreaker'
    if (userDb.includes('pets_allergy') && c.hasPets) return 'Pet allergy'
    return null
  }
  const userAge = typeof user.age === 'string' ? parseInt(user.age || '25') : (user.age || 25)
  // Rule-based fallback score when AI is unavailable / fails / returns garbage.
  // Without this we'd return a flat 75% for every candidate, which is misleading
  // (e.g. age 35 vs 18 would still read as "75% match"). scoreRequesterForHost
  // weights interests, age proximity, langs, lifestyle — so a big age gap drops
  // naturally to 25-40% even when interests align.
  const fallbackScore = (c: any): number => scoreRequesterForHost(
    {
      langs: c.langs, age: typeof c.age === 'string' ? parseInt(c.age || '25') : (c.age || 25),
      drinksPref: c.drinksPref, smokingPref: c.smokingPref, interests: c.interests, hasPets: c.hasPets,
    },
    {
      langs: user.langs, age: userAge,
      drinksPref: user.drinksPref, smokingPref: user.smokingPref, interests: user.interests,
      dealbreakers: user.dealbreakers,
    }
  )
  const eligible: typeof candidates = []
  const blocked: { id: string; score: number; vibe: string }[] = []
  candidates.forEach(c => {
    const reason = blockReason(c)
    if (reason) blocked.push({ id: c.id, score: 0, vibe: reason })
    else eligible.push(c)
  })
  if (eligible.length === 0) return blocked
  if (!ANTHROPIC_KEY) return [...eligible.map(c => ({ id: c.id, score: fallbackScore(c), vibe: 'Compatibility' })), ...blocked]
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        // Deterministic — same user+candidate pair always yields the same score.
        // Without this, scores would drift on each poll even with caching disabled.
        temperature: 0,
        messages: [{
          role: 'user',
          content: `You are a social compatibility matcher for Parea. Score each candidate's compatibility with the user (0-100).

User: ${user.name}, age ${userAge}, langs=[${(user.langs||[]).join(',')}], interests=[${(user.interests||[]).join(',')}], drinks=${user.drinksPref||'?'}, smoking=${user.smokingPref||'?'}, transport=${user.transport||'?'}, bio="${user.bio||''}"

Candidates:
${eligible.map((c,i) => `${i+1}. id="${c.id}" ${c.name} age=${c.age} langs=[${(c.langs||[]).join(',')}] interests=[${(c.interests||[]).join(',')}] drinks=${c.drinksPref||'?'} smoking=${c.smokingPref||'?'} transport=${c.transport||'?'} bio="${c.bio||''}"`).join('\n')}

Scoring weights: shared interests 35%, age proximity 20%, language overlap 20%, lifestyle (drinks+smoking) 15%, bio vibe 7%, transport complement 3%.
Age proximity: within 3 yrs = full 20, within 7 yrs = 14, within 12 yrs = 8, beyond = 3.
Return ONLY valid JSON array: [{"id":"exact-id-string","score":85,"vibe":"Short 2-3 word tag"}]`,
        }],
      }),
    })
    const data = await res.json()
    const text = data?.content?.[0]?.text?.trim() || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const parsed: { id: string; score: number; vibe: string }[] = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    const scored = eligible.map(c => {
      const m = parsed.find(p => p.id === c.id)
      return { id: c.id, score: m?.score ?? fallbackScore(c), vibe: m?.vibe ?? 'Compatibility' }
    })
    return [...scored, ...blocked]
  } catch {
    return [...eligible.map(c => ({ id: c.id, score: fallbackScore(c), vibe: 'Compatibility' })), ...blocked]
  }
}

async function aiMatchCompanions(
  user: {
    interests: string[]; bio: string; age: string | number; langs: string[]
    musicGenres?: string[]; drinksPref?: string; smokingPref?: string
    socialEnergy?: string; dealbreakers?: string[]; eventContext?: string
  },
  candidates: Array<{
    id: number; name: string; age: number; bio: string
    interests: string[]; langs: string[]
    smokingPref?: string; drinksPref?: string
    musicGenres?: string[]; hasPets?: boolean
  }>
): Promise<MatchResult[]> {
  if (candidates.length === 0) return []

  // ── Hard pre-filters based on dealbreakers ──────────────────────────────
  const db = user.dealbreakers || []
  const disqualifiedIds = new Set<number>()
  candidates.forEach(c => {
    if (db.includes('no_smoking') && (c.smokingPref === 'Smoker' || c.smokingPref === 'Social')) disqualifiedIds.add(c.id)
    if (db.includes('sober_only') && c.drinksPref === 'Social drinker') disqualifiedIds.add(c.id)
    if (db.includes('pets_allergy') && c.hasPets) disqualifiedIds.add(c.id)
  })
  const eligible = candidates.filter(c => !disqualifiedIds.has(c.id))
  const blocked = candidates.filter(c => disqualifiedIds.has(c.id)).map(c => ({ id: c.id, score: 0, reason: 'Not compatible' }))

  if (!ANTHROPIC_KEY || eligible.length === 0) {
    return [...eligible.map(c => ({ id: c.id, score: 50, reason: 'Ready to connect' })), ...blocked]
  }

  try {
    const energyLabel = { homebody: 'Homebody', chill: 'Chill vibes', balanced: 'Balanced', social: 'Extrovert', party: 'Party animal' }
    const candidatesList = eligible.map((c, i) =>
      `${i + 1}. ${c.name} (${c.age}yo): interests=[${c.interests.join(', ')}], music=[${(c.musicGenres || []).join(', ') || 'any'}], drinks=${c.drinksPref || '?'}, smoking=${c.smokingPref || '?'}, bio="${c.bio}", langs=[${c.langs.join(', ')}]`
    ).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `You are an AI companion matching system for Parea, a social app in Cyprus.
${user.eventContext ? `\nEvent context: ${user.eventContext}\nMatch specifically for this event — prioritize candidates who would enjoy this type of activity.\n` : ''}
User profile (tonight's vibe):
- Age: ${user.age}
- Interests: ${user.interests.join(', ') || 'not set'}
- Music taste: ${(user.musicGenres || []).join(', ') || 'any'}
- Drinks: ${user.drinksPref || 'not specified'}
- Smoking: ${user.smokingPref || 'not specified'}
- Tonight's energy: ${(energyLabel as any)[user.socialEnergy || ''] || 'balanced'}
- Languages: ${user.langs.join(', ') || 'en'}
- Bio: "${user.bio || 'no bio'}"

Eligible candidates (hard limits already filtered out):
${candidatesList}

Score each candidate 0-100 for companion compatibility.${user.eventContext ? ' Boost score for candidates whose interests align with the event context.' : ''} Weigh: shared interests & music taste (35%), age proximity (25%), lifestyle compatibility (20%), language overlap (20%). Age proximity: within 3 yrs = full, within 7 yrs ≈ 0.7×, within 12 yrs ≈ 0.4×, beyond = 0.1×. Lifestyle = compatible habits, not identical. Return ONLY valid JSON, no other text:
[{"id": <number>, "score": <0-100>, "reason": "<max 5 words, event-specific if possible>"}]`,
        }],
      }),
    })
    const data = await res.json()
    const text = data?.content?.[0]?.text?.trim() || '[]'
    const parsed: MatchResult[] = JSON.parse(text)
    return [...parsed.sort((a, b) => b.score - a.score), ...blocked]
  } catch {
    return [...eligible.map(c => ({ id: c.id, score: 50, reason: 'Ready to connect' })), ...blocked]
  }
}

// ─── IMAGE SAFETY ─────────────────────────────────────────────────────────────

// isImageSafe moved to lib/photo-helpers.ts

// LandingScreen extracted to lib/screens/LandingScreen.tsx
// RegistrationScreen extracted to lib/screens/RegistrationScreen.tsx
// OTPScreen extracted to lib/screens/OTPScreen.tsx


// ─── HOME TAB ─────────────────────────────────────────────────────────────────

function HomeTab({ city, setCityOpen, feedFilter, setFeedFilter, onEventPress, joinedEvents, onJoin, userInterests, setUserEventFormat, setUserEventTransport, onJoinConfirmed, pendingJoinEv, onPendingJoinConsumed, extraEvents, approvedJoiners = {}, tonightVibe, setTonightVibe, onBellPress, unreadCount, bellShake, userData, onCancelHostedEvent, crewStats = {} }: any) {
  const insets = useSafeAreaInsets()
  const [vibeEditOpen, setVibeEditOpen] = useState(false)
  const [draftVibe, setDraftVibe] = useState(tonightVibe)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (draftVibe?.energy === 'party') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(1)
    }
  }, [draftVibe?.energy])
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [searchQuery, setSearchQuery] = useState('')
  const [officialDbEvents, setOfficialDbEvents] = useState<any[]>([])
  const [officialDbLoading, setOfficialDbLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [forYouFilter, setForYouFilter] = useState(false)
  const [showAllOfficialModal, setShowAllOfficialModal] = useState(false)
  // Simplified toolbar filters: each toggle is a single segmented control,
  // category lives in a popup instead of the inline horizontal scroll. Default
  // 'all' for both → show everything, matching the prior unfiltered behavior.
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'custom'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'official' | 'community'>('all')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const now = Date.now()

  useEffect(() => {
    const fetchOfficial = () => supabase.from('official_events').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setOfficialDbEvents(data)
        setOfficialDbLoading(false)
      })
    fetchOfficial()
    const interval = setInterval(fetchOfficial, 30000)
    return () => clearInterval(interval)
  }, [])

  // Parse event time string → Date (for calendar matching)
  const allCityEvents = [...MOCK_EVENTS, ...(extraEvents || [])].filter(e => {
    if (city && e.city !== city) return false
    if (e.isHosted) return false  // host doesn't join their own event
    if (isEventPast(e.time)) return false  // hide past events
    return true
  })

  // ── Data ─────────────────────────────────────────────────────────────────
  const userCategories = (userInterests as string[]).map((i: string) => INTEREST_TO_CATEGORY[i]).filter(Boolean)

  const CAT_FILTERS = [
    { id: 'outdoors', label: 'Outdoors' },
    { id: 'coffee',   label: 'Coffee' },
    { id: 'food',     label: 'Food' },
    { id: 'culture',  label: 'Culture' },
    { id: 'sports',   label: 'Sports' },
    { id: 'wine',     label: 'Wine' },
    { id: 'tech',     label: 'Tech' },
    { id: 'gaming',   label: 'Gaming' },
  ]

  // Official: DB events only (no mock fallback to avoid flicker)
  const officialAll: any[] = officialDbLoading ? [] : [
    ...MOCK_EVENTS.filter(e => e.type === 'official' && (!e.city || e.city === city)),
    ...officialDbEvents.map(e => ({ ...e, id: e.id + 100000, _dbId: e.id, _fromDb: true, type: 'official', time: e.time || e.date_label || '', gradient: e.gradient || ['#667eea', '#764ba2'], maxParticipants: e.capacity ?? e.max_participants ?? 100, seekerColors: e.seeker_colors || ['#818CF8', '#6366F1'], seekingCount: e.seeking_count ?? 0, participantsCount: e.participants_count ?? 0 }))
      // Skip CANCELLED events the scraper didn't catch (date_label/time literally "CANCELLED")
      .filter((e: any) => {
        const txt = `${e.date_label || ''} ${e.time || ''}`.toUpperCase()
        return !txt.includes('CANCEL')
      })
      .filter((e: any) => !isEventPast(e.date_label || e.time || '')),
  ].sort((a: any, b: any) => {
    if (a.is_promoted && !b.is_promoted) return -1
    if (!a.is_promoted && b.is_promoted) return 1
    const da = parseEventDate(a.date_label || a.time || '')
    const db = parseEventDate(b.date_label || b.time || '')
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  })

  // Community: MOCK community + user-created extra events (including own hosted)
  const communityAll = [...MOCK_COMMUNITY_EVENTS, ...MOCK_EVENTS, ...(extraEvents || [])].filter(e => {
    if (city && e.city && e.city.toLowerCase() !== city.toLowerCase()) return false
    if (isEventPast(e.time)) return false
    if (e.type === 'official') return false
    // Hide private community events from non-hosts (host always sees own private plans)
    if (!e.isHosted && e.visibility === 'private') return false
    // Hide community events whose host's crew preference excludes this user's gender (own events always visible)
    if (!e.isHosted) {
      const pref = (e.crewPref || 'any').toLowerCase()
      const myGender = ((userData as any)?.gender || '').toLowerCase()
      if (pref === 'women' && myGender !== 'female') return false
      if (pref === 'men'   && myGender !== 'male')   return false
    }
    // Age filter for community events removed by request — show events to all
    // ages regardless of host's age. Inter-generational socializing OK.
    return true
  })

  // Apply search + category filter to community
  // Date-range helper used by both communityFiltered and officialEvents filters
  // so the new toolbar Today/Week/Custom segmented control affects both lists
  // consistently. 'custom' falls back to the existing selectedDate state.
  const isInDateRange = (evDate: Date | null) => {
    if (dateRange === 'all') return true
    if (!evDate) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (dateRange === 'today') return evDate.toDateString() === today.toDateString()
    if (dateRange === 'week') {
      const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)
      return evDate >= today && evDate < weekEnd
    }
    // custom — gated on the calendar picker. Until a date is picked, show
    // nothing (the inline calendar opens automatically with this mode).
    if (!selectedDate) return false
    return evDate.toDateString() === selectedDate.toDateString()
  }
  const communityFiltered = communityAll.filter(ev => {
    if (typeFilter === 'official') return false
    if (categoryFilter && ev.category !== categoryFilter) return false
    if (forYouFilter && userCategories.length > 0 && !userCategories.includes(ev.category)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!ev.title.toLowerCase().includes(q) && !(ev.description || '').toLowerCase().includes(q)) return false
    }
    if (!isInDateRange(parseEventDate(ev.time))) return false
    return true
  })

  // Sort community: vibe-matched first, then interest-matched
  const vibeCats = tonightVibe?.energy ? (VIBE_CATS[tonightVibe.energy] || []) : []
  const communityEvents = [...communityFiltered].sort((a, b) => {
    const aVibe = vibeCats.includes(a.category) ? 2 : 0
    const bVibe = vibeCats.includes(b.category) ? 2 : 0
    const aInt = userCategories.includes(a.category) ? 1 : 0
    const bInt = userCategories.includes(b.category) ? 1 : 0
    return (bVibe + bInt) - (aVibe + aInt)
  })

  // Vibe-matched official events (shown in Tonight Vibe section) — curated top-3 for today/tomorrow
  const vibeEvents = (() => {
    if (vibeCats.length === 0) return []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    return officialAll
      .filter(ev => {
        if (!vibeCats.includes(ev.category)) return false
        if (city && ev.city && ev.city.toLowerCase() !== city.toLowerCase()) return false
        const d = parseEventDate(ev.date_label || ev.time || '')
        if (!d) return false
        return d >= today && d < dayAfterTomorrow
      })
      .map(ev => {
        const interestHit = userCategories.includes(ev.category) ? 2 : 0
        const d = parseEventDate(ev.date_label || ev.time || '')
        const todayHit = d && d.toDateString() === today.toDateString() ? 1 : 0
        return { ev, score: interestHit + todayHit }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.ev)
  })()
  const vibeEventIds = new Set(vibeEvents.map((e: any) => e.id))

  // Apply search + date + city filter to official; exclude Tonight's Vibe picks (B+C)
  const officialEvents = officialAll.filter(ev => {
    if (vibeEventIds.has(ev.id)) return false
    if (typeFilter === 'community') return false
    if (city && ev.city && ev.city.toLowerCase() !== city.toLowerCase()) return false
    if (categoryFilter && ev.category !== categoryFilter) return false
    if (forYouFilter && userCategories.length > 0 && !userCategories.includes(ev.category)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!(ev.title || '').toLowerCase().includes(q) && !(ev.category || '').toLowerCase().includes(q)) return false
    }
    if (!isInDateRange(parseEventDate(ev.date_label || ev.time || ''))) return false
    return true
  }).sort((a, b) => {
    // Promoted always at the top
    if (a.is_promoted && !b.is_promoted) return -1
    if (!a.is_promoted && b.is_promoted) return 1
    // Otherwise strict date ascending — earliest upcoming first.
    const da = parseEventDate(a.date_label || a.time || '')
    const db = parseEventDate(b.date_label || b.time || '')
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  })

  // ── For You scoring ───────────────────────────────────────────────────────
  const userLangs: string[] = userData?.langs || []
  const LANG_LABEL: Record<string, string> = { en: 'English', ru: 'Russian', el: 'Greek', de: 'German', fr: 'French', he: 'Hebrew', uk: 'Ukrainian', it: 'Italian', es: 'Spanish' }
  const todayForYou = new Date(); todayForYou.setHours(0, 0, 0, 0)
  const dayAfterForYou = new Date(todayForYou); dayAfterForYou.setDate(dayAfterForYou.getDate() + 2)

  const scoreForYou = (ev: any): { score: number; reasons: string[] } => {
    let score = 0
    const reasons: string[] = []

    if (vibeCats.length > 0 && vibeCats.includes(ev.category)) {
      score += 35
      reasons.push('Vibe')
    }
    if (userCategories.length > 0 && userCategories.includes(ev.category)) {
      score += 30
      reasons.push('Interests match')
    }

    let langHit: string | null = null
    if (userLangs.length > 0) {
      if (ev.type === 'community') {
        const evLangs: string[] = ev.hostLangs || []
        const overlap = evLangs.filter((l: string) => userLangs.includes(l))
        if (overlap.length > 0) langHit = LANG_LABEL[overlap[0]] || overlap[0]
      } else {
        const langStr = (ev.language || '').toLowerCase()
        if (langStr) {
          const matched = userLangs.find(code => {
            const label = (LANG_LABEL[code] || code).toLowerCase()
            return langStr.includes(label) || langStr.includes(code)
          })
          if (matched) langHit = LANG_LABEL[matched] || matched
        }
      }
    }
    if (langHit) {
      score += 15
      reasons.push(langHit)
    }

    const d = parseEventDate(ev.date_label || ev.time || '')
    if (d && d >= todayForYou && d < dayAfterForYou) {
      score += 10
      reasons.push(d.toDateString() === todayForYou.toDateString() ? 'Today' : 'Tomorrow')
    }

    let joinable = false
    if (ev.type === 'community') {
      const filled = ev.isHosted ? (approvedJoiners[ev.id] || []).length + 1 : ev.participantsCount || 0
      const total = ev.maxParticipants || 10
      joinable = filled < total
    } else {
      joinable = !ev.expiresAt || ev.expiresAt > Date.now()
    }
    if (joinable) {
      score += 10
      reasons.push('Spots open')
    }

    return { score: Math.min(100, score), reasons: reasons.slice(0, 3) }
  }

  const forYouEvents = (() => {
    const officialForYou = officialAll.filter((ev: any) => !city || !ev.city || ev.city.toLowerCase() === city.toLowerCase())
    const all: any[] = [...officialForYou, ...communityAll]
    const seen = new Set<number>()
    const scored = all.flatMap(ev => {
      if (seen.has(ev.id)) return []
      seen.add(ev.id)
      const { score, reasons } = scoreForYou(ev)
      if (score < 60) return []
      return [{ ev, score, reasons }]
    })
    scored.sort((a, b) => b.score - a.score)
    return scored
  })()

  // ── Join Bottom Sheet state ──────────────────────────────────────────────
  const [joinSheet, setJoinSheet] = useState<{ visible: boolean; ev: any | null; step: 1 | 2 | 3 | 4; format: string; transport: string; crewPref: string; groupMin: number; groupMax: number }>(
    { visible: false, ev: null, step: 1, format: '', transport: '', crewPref: 'any', groupMin: 2, groupMax: 5 }
  )

  const openJoinSheet = (ev: any) => {
    const startStep = ev?.type === 'official' ? 1 : 2
    setJoinSheet({ visible: true, ev, step: startStep as any, format: '', transport: '', crewPref: 'any', groupMin: 2, groupMax: 5 })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  useEffect(() => {
    if (pendingJoinEv) { openJoinSheet(pendingJoinEv); onPendingJoinConsumed?.() }
  }, [pendingJoinEv])

  const closeJoinSheet = () => setJoinSheet(prev => ({ ...prev, visible: false }))

  const confirmJoin = () => {
    const ev = joinSheet.ev
    const format = joinSheet.format
    const transport = joinSheet.transport
    const crewPref = joinSheet.crewPref || 'any'
    // Show success immediately
    setJoinSheet(prev => ({ ...prev, step: 4 }))
    // Apply local state
    onJoin(ev, transport)
    if (ev?.id) {
      if (format)    setUserEventFormat?.((prev: Record<number, string>) => ({ ...prev, [ev.id]: format }))
      if (transport) setUserEventTransport?.((prev: Record<number, string>) => ({ ...prev, [ev.id]: transport }))
    }
    // Background DB write for official events (crew matching) — don't block UI
    if (ev?.type === 'official' && userData?.dbId) {
      const formatSizes: Record<string, [number, number]> = { '1+1': [2, 2], squad: [3, 5], party: [6, 20] }
      const [gMin, gMax] = formatSizes[format] || [2, 5]
      supabase.from('event_attendees').upsert({
        event_ref_id: ev.id,
        event_title: ev.title,
        profile_id: userData.dbId,
        group_size_min: gMin,
        group_size_max: gMax,
        transport,
        status: 'looking',
        crew_pref: crewPref,
      }, { onConflict: 'event_ref_id,profile_id' })
        .then(({ error }) => { if (error) console.warn('event_attendees upsert error:', error.message); else console.log('✅ Saved to event_attendees') })
    }
    setTimeout(() => {
      onJoinConfirmed?.(ev, format, transport)
      closeJoinSheet()
    }, 1100)
  }

  const getJoinState = (ev: any) => {
    const approvedCount = (approvedJoiners[ev.id] || []).length
    const actualCount = ev.isHosted ? approvedCount + 1 : ev.participantsCount
    if (actualCount >= ev.maxParticipants) return 'full'
    return joinedEvents?.[ev.id] || 'none'
  }

  const JoinButton = ({ ev }: { ev: any }) => {
    if (ev.isHosted) return (
      <View style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#B45309' }}>Your plan</Text>
      </View>
    )
    const state = getJoinState(ev)
    const isFull = state === 'full'
    const label = isFull ? 'Full' : (state === 'joined' || state === 'confirmed') ? 'Joined ✓' : state === 'pending' ? 'Requested…' : ev.type === 'community' ? 'Request to join' : 'Join'
    let bg: string, textColor: string
    if (isFull)                                          { bg = '#F1F5F9'; textColor = '#94A3B8' }
    else if (state === 'joined' || state === 'confirmed') { bg = 'rgba(34,197,94,0.12)'; textColor = '#16a34a' }
    else if (state === 'pending')                        { bg = 'rgba(251,191,36,0.15)'; textColor = '#d97706' }
    else                                                 { bg = '#F97316'; textColor = '#fff' }
    return (
      <TouchableOpacity
        onPress={() => {
          if (isFull) return
          if (ev.type === 'community' && state !== 'none') return
          if (state === 'none') openJoinSheet(ev)
          else if (state === 'joined') onJoin(ev)
        }}
        activeOpacity={isFull ? 1 : 0.75}
        style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, backgroundColor: bg, opacity: isFull ? 0.55 : 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{label}</Text>
      </TouchableOpacity>
    )
  }

  // ── Format & Transport options ────────────────────────────────────────────
  const FORMAT_OPTIONS = [
    { id: '1+1',   Icon: Users,        label: 'Duo',   sub: 'You + 1 person',  grad: ['#6366F1','#818CF8'] as [string,string], color: '#818CF8' },
    { id: 'squad', Icon: UsersRound,   label: 'Squad', sub: 'Up to 5 people',  grad: ['#10B981','#34D399'] as [string,string], color: '#34D399' },
    { id: 'party', Icon: PartyPopper,  label: 'Group', sub: 'Up to 20 people', grad: ['#F59E0B','#FBBF24'] as [string,string], color: '#FBBF24' },
  ]
  const TRANSPORT_OPTIONS = [
    { id: 'car',  Icon: Car,         label: "I'm driving", sub: 'Open to giving a lift',  grad: ['#3B82F6','#60A5FA'] as [string,string], color: '#60A5FA' },
    { id: 'lift', Icon: ThumbsUp,    label: 'I need a ride', sub: 'Open to carpooling',   grad: ['#EC4899','#F472B6'] as [string,string], color: '#F472B6' },
    { id: 'meet', Icon: MapPin,      label: 'Meet there',  sub: "I'll get there myself", grad: ['#8B5CF6','#A78BFA'] as [string,string], color: '#A78BFA' },
  ]

  const userName = userData?.name?.split(' ')[0] || 'there'

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickyHeaderIndices={[0]}>

        {/* ── STICKY HEADER ── */}
        <View style={{ backgroundColor: '#F8F7FF', zIndex: 600, paddingBottom: 4 }}>
          {/* Header */}
          <View style={{ paddingTop: Platform.OS === 'android' ? 10 : 16, paddingHorizontal: 20, paddingBottom: 10, gap: 10 }}>
            {/* Row 1: greeting + bell */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Medium', color: '#475569', letterSpacing: -0.2 }}>Hi, {userName}</Text>
              <Animated.View style={{ transform: [{ rotate: bellShake?.interpolate({ inputRange: [-12, 0, 12], outputRange: ['-18deg', '0deg', '18deg'] }) ?? '0deg' }] }}>
                <TouchableOpacity onPress={onBellPress} activeOpacity={0.85}
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#6366F1', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
                  <PhBell size={19} color={unreadCount > 0 ? '#6366F1' : '#94A3B8'} weight={unreadCount > 0 ? 'duotone' : 'regular'} />
                </TouchableOpacity>
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8,
                    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: '#F8F7FF' }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </Animated.View>
            </View>

            {/* Row 2: city (primary, soft) · vibe (outline) · calendar (ghost) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* City — primary, subtle */}
              <TouchableOpacity onPress={() => setCityOpen(true)} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#E9E5FF' }}>
                <PhMapPin size={12} color="#6366F1" weight="duotone" />
                <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#4338CA', letterSpacing: -0.1 }}>{city ?? 'All Cities'}</Text>
                <CaretDown size={10} color="#A5B4FC" weight="bold" />
              </TouchableOpacity>

              {/* Vibe — outline, muted */}
              <TouchableOpacity onPress={() => { setDraftVibe(tonightVibe); setVibeEditOpen(true) }}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: tonightVibe ? (SOCIAL_ENERGY.find(e => e.id === tonightVibe.energy)?.color || '#E2E8F0') + '33' : '#E2E8F0' }}>
                {tonightVibe ? (() => {
                  const energyInfo = SOCIAL_ENERGY.find(e => e.id === tonightVibe.energy) || SOCIAL_ENERGY[2]
                  return <>
                    <energyInfo.Icon size={12} color={energyInfo.color + 'B0'} weight="duotone" />
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: energyInfo.color + 'CC' }}>{energyInfo.label}</Text>
                    <CaretDown size={10} color="#CBD5E1" weight="bold" />
                  </>
                })() : <>
                  <Sparkle size={12} color="#94A3B8" weight="duotone" />
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#94A3B8' }}>My Vibe</Text>
                  <CaretDown size={10} color="#CBD5E1" weight="bold" />
                </>}
              </TouchableOpacity>

              {/* Calendar pill removed — its job is now the When toggle below. */}

            </View>
          </View>

          {/* All / For You toggle */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 3 }}>
            <TouchableOpacity onPress={() => setForYouFilter(false)} style={{ flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center',
              backgroundColor: !forYouFilter ? '#fff' : 'transparent',
              shadowColor: !forYouFilter ? '#6366F1' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: !forYouFilter ? 2 : 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: !forYouFilter ? '#4338CA' : '#94A3B8' }}>All Events</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setForYouFilter(true)} style={{ flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4,
              backgroundColor: forYouFilter ? '#fff' : 'transparent',
              shadowColor: forYouFilter ? '#6366F1' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: forYouFilter ? 2 : 0 }}>
              <Sparkle size={13} color={forYouFilter ? '#EC4899' : '#94A3B8'} weight="duotone" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: forYouFilter ? '#EC4899' : '#94A3B8' }}>For You</Text>
            </TouchableOpacity>
          </View>

          {/* When (date range) segmented control. 'Custom' both flags the
              range and pops open the inline calendar below so user can pick
              a specific day. Picking a day from Today / Week / Anytime
              clears any previously-picked custom date. */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 3 }}>
            {([
              { key: 'all', label: 'Anytime' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This week' },
              { key: 'custom', label: selectedDate ? selectedDate.toLocaleDateString('en', { day: 'numeric', month: 'short' }) : 'Pick date' },
            ] as const).map(opt => {
              const active = dateRange === opt.key
              return (
                <TouchableOpacity key={opt.key}
                  onPress={() => {
                    if (opt.key === 'custom') {
                      setDateRange('custom'); setCalendarOpen(true)
                    } else {
                      setDateRange(opt.key); setSelectedDate(null); setCalendarOpen(false)
                    }
                  }}
                  style={{ flex: 1, paddingVertical: 7, borderRadius: 11, alignItems: 'center',
                    backgroundColor: active ? '#fff' : 'transparent',
                    shadowColor: active ? '#6366F1' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: active ? 2 : 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#4338CA' : '#94A3B8' }} numberOfLines={1}>{opt.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Type (Official / Community) segmented control. */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 3 }}>
            {([
              { key: 'all', label: 'All' },
              { key: 'official', label: 'Official' },
              { key: 'community', label: 'Community' },
            ] as const).map(opt => {
              const active = typeFilter === opt.key
              return (
                <TouchableOpacity key={opt.key}
                  onPress={() => setTypeFilter(opt.key)}
                  style={{ flex: 1, paddingVertical: 7, borderRadius: 11, alignItems: 'center',
                    backgroundColor: active ? '#fff' : 'transparent',
                    shadowColor: active ? '#6366F1' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: active ? 2 : 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#4338CA' : '#94A3B8' }}>{opt.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Search bar */}
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 44, gap: 10,
              shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <MagnifyingGlass size={16} color="#94A3B8" weight="regular" />
              <TextInput
                placeholder="Find an event..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, fontSize: 14, color: '#1E1B4B' }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Inline Calendar */}
          {calendarOpen && (() => {
            const today = new Date(); today.setHours(0,0,0,0)
            const firstDay = new Date(calYear, calMonth, 1).getDay()
            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
            const monthName = new Date(calYear, calMonth).toLocaleDateString('en', { month: 'long', year: 'numeric' })
            const officialDates = new Set([...officialAll.filter((ev: any) => !city || !ev.city || ev.city === city), ...communityAll.filter(ev => ev.type === 'official')].map(ev => parseEventDate(ev.date_label || ev.time || '')?.toDateString()).filter(Boolean))
            const socialDates = new Set(communityAll.filter(ev => ev.type !== 'official').map(ev => parseEventDate(ev.time || ev.date_label || '')?.toDateString()).filter(Boolean))
            const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
            while (cells.length % 7 !== 0) cells.push(null)
            return (
              <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 20, padding: 14, shadowColor: '#6366F1', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                    <CaretLeft size={16} color="#475569" weight="bold" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E1B4B' }}>{monthName}</Text>
                  <TouchableOpacity onPress={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                    <CaretRight size={16} color="#475569" weight="bold" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{d}</Text>
                  ))}
                </View>
                {Array.from({ length: cells.length / 7 }, (_, row) => (
                  <View key={row} style={{ flexDirection: 'row', marginBottom: 2 }}>
                    {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                      if (!day) return <View key={col} style={{ flex: 1, height: 36 }} />
                      const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0)
                      const ds = d.toDateString()
                      const isSelected = selectedDate?.toDateString() === ds
                      const isToday = today.toDateString() === ds
                      const isPast = d < today
                      const hasOfficial = officialDates.has(ds)
                      const hasSocial = socialDates.has(ds)
                      return (
                        <TouchableOpacity key={col} onPress={() => { if (!isPast) { setSelectedDate(isSelected ? null : d); setCalendarOpen(false) } }}
                          style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                            backgroundColor: isSelected ? '#6366F1' : isToday ? '#EEF2FF' : 'transparent' }}>
                          <Text style={{ fontSize: 13, fontWeight: isSelected || isToday ? '800' : '500', color: isSelected ? '#fff' : isPast ? '#CBD5E1' : isToday ? '#6366F1' : '#334155' }}>{day}</Text>
                          {(hasOfficial || hasSocial) && !isPast && (
                            <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3 }}>
                              {hasOfficial && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? '#fff' : '#F59E0B' }} />}
                              {hasSocial && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? '#fff' : '#6366F1' }} />}
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 10, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                    <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Official</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' }} />
                    <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Community</Text>
                  </View>
                </View>
              </View>
            )
          })()}
        </View>

        {/* Compact Categories button (opens grid popup). The inline horizontal
            scroll of chips was the biggest visual-density complaint in friend's
            feedback — a popup keeps category power-users happy without
            crowding the home toolbar for everyone. */}
        {!forYouFilter && (officialAll.length > 0 || communityAll.length > 0) && (
          <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => setCategoryModalOpen(true)} activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
                backgroundColor: categoryFilter ? '#6366F1' : '#fff',
                borderWidth: 1, borderColor: categoryFilter ? '#6366F1' : '#E2E8F0' }}>
              <MagnifyingGlass size={12} color={categoryFilter ? '#fff' : '#64748B'} weight="duotone" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: categoryFilter ? '#fff' : '#64748B', textTransform: 'capitalize' }}>
                {categoryFilter || 'Categories'}
              </Text>
              {categoryFilter && (
                <TouchableOpacity onPress={() => setCategoryFilter(null)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                  <X size={11} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Categories popup */}
        <Modal visible={categoryModalOpen} animationType="slide" transparent onRequestClose={() => setCategoryModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setCategoryModalOpen(false)}
            style={{ flex: 1, backgroundColor: 'rgba(15,12,31,0.55)', justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}
              style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32, maxHeight: '70%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Filter by category</Text>
                <TouchableOpacity onPress={() => setCategoryModalOpen(false)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                {(() => {
                  const allEvs = [...officialAll, ...communityAll]
                  const counts = new Map<string, number>()
                  allEvs.forEach(ev => {
                    const c = (ev.category || '').toLowerCase().trim()
                    if (!c) return
                    counts.set(c, (counts.get(c) || 0) + 1)
                  })
                  const knownIds = new Set(CAT_FILTERS.map(f => f.id))
                  const ordered: { id: string; label: string }[] = []
                  CAT_FILTERS.forEach(f => { if (counts.has(f.id)) ordered.push(f) })
                  const extras = [...counts.entries()]
                    .filter(([id]) => !knownIds.has(id))
                    .sort((a, b) => b[1] - a[1])
                    .map(([id]) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))
                  const chips = [{ id: '', label: 'All categories' }, ...ordered, ...extras]
                  return (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {chips.map(f => {
                        const isOn = f.id === (categoryFilter || '')
                        return (
                          <TouchableOpacity key={f.id || 'all'}
                            onPress={() => { setCategoryFilter(f.id || null); setCategoryModalOpen(false) }}
                            style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99,
                              backgroundColor: isOn ? '#6366F1' : '#F1F5F9',
                              borderWidth: 1, borderColor: isOn ? '#6366F1' : 'transparent' }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: isOn ? '#fff' : '#475569' }}>{f.label}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  )
                })()}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ── FOR YOU ── */}
        {forYouFilter && (
          <View>
            <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 14 }}>
              <Text style={{ fontSize: 26, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.5 }}>Picked for you ✨</Text>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Based on your vibe, interests and languages</Text>
            </View>
            {forYouEvents.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 32, paddingBottom: 32 }}>
                <Image source={require('../../assets/images/community_empty.png')} style={{ width: 160, height: 122, marginBottom: 14 }} resizeMode="contain" />
                <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', textAlign: 'center' }}>Your picks are warming up ✨</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: '#94A3B8', marginTop: 6, textAlign: 'center', lineHeight: 18 }}>Add more interests to get better recommendations</Text>
                <TouchableOpacity onPress={() => setVibeEditOpen(true)} activeOpacity={0.85}
                  style={{ marginTop: 20, borderRadius: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={['#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 13, paddingHorizontal: 24 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#fff' }}>Improve my vibe</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 16 }}>
                {forYouEvents.map(({ ev, score, reasons }: any) => {
                  const CatIcon = CATEGORY_ICON[ev.category] || MapPin
                  const bgColors = CATEGORY_BG[ev.category] || ['#EEF2FF', '#C7D2FE']
                  const iconColor = CATEGORY_COLOR[ev.category] || '#4338CA'
                  return (
                    <TouchableOpacity key={ev.id} onPress={() => onEventPress(ev)} activeOpacity={0.88}
                      style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                        <LinearGradient colors={bgColors as any}
                          style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CatIcon size={22} color={iconColor} weight="duotone" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1B4B', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#DDD6FE' }}>
                              <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#6D28D9' }}>{score >= 70 ? `${score}% match` : 'Good match'}</Text>
                            </View>
                          </View>
                          {reasons.length > 0 && (
                            <Text style={{ fontSize: 12, color: '#8B5CF6', fontFamily: 'Outfit-Medium' }} numberOfLines={1}>{reasons.join(' · ')}</Text>
                          )}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <CalendarBlank size={12} color="#94A3B8" weight="regular" />
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>{prettyEventTime(ev.date_label || ev.time_label || ev.time) || ''}</Text>
                        </View>
                        {(ev.location || ev.venue) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
                            <PhMapPin size={12} color="#94A3B8" weight="regular" />
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>{(ev.location || ev.venue || '').split(',')[0].trim()}</Text>
                          </View>
                        )}
                        <View style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: ev.type === 'community' ? '#EEF2FF' : '#FEF3C7' }}>
                          <Text style={{ fontSize: 10, fontFamily: 'Outfit-SemiBold', color: ev.type === 'community' ? '#4338CA' : '#B45309' }}>{ev.type === 'community' ? 'Community' : 'Official'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* ── TONIGHT VIBE PICKS ── */}
        {!forYouFilter && vibeEvents.length > 0 && (() => {
          const energyInfo = SOCIAL_ENERGY.find(e => e.id === tonightVibe?.energy) || SOCIAL_ENERGY[2]
          return (
            <View style={{ marginTop: 28, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 12 }}>
                <energyInfo.Icon size={18} color={energyInfo.color} weight="duotone" />
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Tonight's Vibe</Text>
                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: energyInfo.color + '14' }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Outfit-Medium', color: energyInfo.color, letterSpacing: 0.1 }}>{energyInfo.label}</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}>
                {vibeEvents.map((ev: any) => (
                  <TouchableOpacity key={ev.id} onPress={() => onEventPress(ev)} activeOpacity={0.88}
                    style={{ width: 148, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', shadowColor: energyInfo.color, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }}>
                    {ev.image_url ? (
                      <Image source={{ uri: ev.image_url }} style={{ width: '100%', height: 68 }} resizeMode="cover" />
                    ) : (
                      <LinearGradient colors={(CATEGORY_BG[ev.category] || ['#EEF2FF','#C7D2FE']) as any} style={{ width: '100%', height: 68, alignItems: 'center', justifyContent: 'center' }}>
                        {(() => { const CatIcon = CATEGORY_ICON[ev.category] || PhMapPin; return <CatIcon size={26} color={CATEGORY_COLOR[ev.category] || '#4338CA'} weight="duotone" /> })()}
                      </LinearGradient>
                    )}
                    <View style={{ padding: 9 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', marginBottom: 3 }} numberOfLines={2}>{ev.title}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'Outfit-Medium' }} numberOfLines={1}>{prettyEventTime(ev.date_label || ev.time_label) || ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        })()}

        {/* ── OFFICIAL EVENTS ── */}
        {!forYouFilter && typeFilter !== 'community' && officialDbLoading && (
          <>
            <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Official Events</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 4 }}>
              {[1, 2].map(i => (
                <View key={i} style={{ width: 210, height: 200, borderRadius: 22, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <View style={{ height: 6, backgroundColor: '#E2E8F0' }} />
                  <View style={{ padding: 14, gap: 10 }}>
                    <View style={{ height: 14, width: '70%', backgroundColor: '#E2E8F0', borderRadius: 7 }} />
                    <View style={{ height: 10, width: '50%', backgroundColor: '#E2E8F0', borderRadius: 5 }} />
                    <View style={{ height: 10, width: '60%', backgroundColor: '#E2E8F0', borderRadius: 5 }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}
        {!forYouFilter && typeFilter !== 'community' && !officialDbLoading && officialDbEvents.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PhStar size={18} color="#F59E0B" weight="duotone" />
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Official Events</Text>
              </View>
              {officialEvents.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllOfficialModal(true)}>
                  <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '700' }}>See all {officialEvents.length} →</Text>
                </TouchableOpacity>
              )}
            </View>
            {officialEvents.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '500' }}>No events in {city ?? 'this selection'} right now</Text>
              </View>
            ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 4 }}>
              {officialEvents.slice(0, 3).map((ev: any) => (
                <TouchableOpacity key={ev.id} onPress={() => onEventPress(ev)} activeOpacity={0.88}
                  style={{ width: 210, borderRadius: 22, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#6366F1', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
                  {ev.image_url ? (
                    <Image source={{ uri: ev.image_url }} style={{ width: '100%', height: 100 }} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={(CATEGORY_BG[ev.category] || ['#EEF2FF','#C7D2FE']) as any} style={{ width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' }}>
                      {(() => { const CatIcon = CATEGORY_ICON[ev.category] || PhMapPin; return <CatIcon size={36} color={CATEGORY_COLOR[ev.category] || '#4338CA'} weight="duotone" /> })()}
                    </LinearGradient>
                  )}
                  {/* Category overlay removed — scraper miscategorized many events
                      (e.g. RUES CINE ART tagged as "Kids Shows"). Category filter
                      lives in the top tabs; the badge on the image misled users. */}
                  {ev.is_promoted && (
                    <View style={{ position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#f59e0b' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><PushPin size={9} color="#fff" weight="duotone" /><Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>FEATURED</Text></View>
                    </View>
                  )}
                  {/* Popular sticker on the hero image — prominent, designer-y,
                      separate from the inline "1 crew · X spots left" text below. */}
                  {(crewStats[ev.id]?.members || 0) >= 3 && (
                    <LinearGradient colors={['#FB923C', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 5 }}>
                      <Fire size={13} color="#fff" weight="fill" />
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.4 }}>POPULAR</Text>
                    </LinearGradient>
                  )}
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E1B4B', marginBottom: 6, minHeight: 36 }} numberOfLines={2}>{ev.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CalendarBlank size={11} color="#94A3B8" weight="regular" />
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>{prettyEventTime(ev.date_label || ev.time_label || ev.time) || ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, height: 16 }}>
                      <PhMapPin size={11} color={ev.location || ev.distance ? '#94A3B8' : 'transparent'} weight="regular" />
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>{ev.location || ev.distance || ''}</Text>
                    </View>
                    {(() => {
                      const st = crewStats[ev.id]
                      if (!st || st.crews === 0) return null
                      const spotsTxt = st.spotsLeft === 0 ? 'crew full' : `${st.spotsLeft} spot${st.spotsLeft === 1 ? '' : 's'} left`
                      return (
                        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 8 }}>
                          {st.crews} crew{st.crews === 1 ? '' : 's'} · {spotsTxt}
                        </Text>
                      )
                    })()}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: crewStats[ev.id]?.crews ? 6 : 8 }}>
                      {(() => { const st = getJoinState(ev); const active = st !== 'none'; return (
                        <TouchableOpacity
                          onPress={() => { if (!active) openJoinSheet(ev) }}
                          activeOpacity={active ? 1 : 0.75}
                          style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: active ? 'rgba(34,197,94,0.15)' : '#6366F1', opacity: active ? 0.9 : 1 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#16a34a' : '#fff' }}>
                            {st === 'confirmed' ? 'Confirmed ✓' : st === 'joined' ? 'Crew ready ✓' : st === 'pending' ? 'Finding crew…' : "I'm Going"}
                          </Text>
                        </TouchableOpacity>
                      )})()}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {officialEvents.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllOfficialModal(true)} activeOpacity={0.85}
                  style={{ width: 90, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <PhTicket size={26} color="#6366F1" weight="duotone" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#6366F1', textAlign: 'center' }}>+{officialEvents.length - 3}{'\n'}more</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            )}

            {/* ── ALL OFFICIAL EVENTS MODAL ── */}
            <Modal visible={showAllOfficialModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAllOfficialModal(false)}>
              <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EEF2FF' }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Official Events</Text>
                  <TouchableOpacity onPress={() => setShowAllOfficialModal(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} color="#6366F1" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator>
                  {officialEvents.map((ev: any) => (
                    <TouchableOpacity key={ev.id} onPress={() => { setShowAllOfficialModal(false); setTimeout(() => onEventPress(ev), 300) }} activeOpacity={0.88}
                      style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', flexDirection: 'row', shadowColor: '#6366F1', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}>
                      {ev.image_url ? (
                        <Image source={{ uri: ev.image_url }} style={{ width: 90, height: 90 }} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={(CATEGORY_BG[ev.category] || ['#EEF2FF','#C7D2FE']) as any} style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
                          {(() => { const CatIcon = CATEGORY_ICON[ev.category] || PhMapPin; return <CatIcon size={30} color={CATEGORY_COLOR[ev.category] || '#4338CA'} weight="duotone" /> })()}
                        </LinearGradient>
                      )}
                      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E1B4B', flex: 1, marginRight: 8 }} numberOfLines={2}>{ev.title}</Text>
                          {ev.is_promoted && <PushPin size={12} color="#f59e0b" weight="duotone" />}
                        </View>
                        <View style={{ gap: 3, marginTop: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <CalendarBlank size={11} color="#94A3B8" weight="regular" />
                            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>{prettyEventTime(ev.date_label || ev.time_label || ev.time) || ''}</Text>
                          </View>
                          {(ev.location || (ev.distance && ev.distance !== '0km')) && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <PhMapPin size={11} color="#94A3B8" weight="regular" />
                              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>{ev.location || ev.distance}</Text>
                            </View>
                          )}
                          {ev.price && <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>{ev.price}</Text>}
                          {(() => {
                            const st = crewStats[ev.id]
                            if (!st || st.crews === 0) return null
                            const spotsTxt = st.spotsLeft === 0 ? 'crew full' : `${st.spotsLeft} spot${st.spotsLeft === 1 ? '' : 's'} left`
                            return (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>{st.crews} crew{st.crews === 1 ? '' : 's'} · {spotsTxt}</Text>
                                {st.members >= 3 && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: '#FFEDD5' }}>
                                    <Fire size={9} color="#EA580C" weight="fill" />
                                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#9A3412' }}>POPULAR</Text>
                                  </View>
                                )}
                              </View>
                            )
                          })()}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </SafeAreaView>
            </Modal>
          </>
        )}

        {/* ── COMMUNITY ── */}
        {!forYouFilter && typeFilter !== 'official' && (<>
        {communityAll.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UsersThree size={18} color="#6366F1" weight="duotone" />
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Community</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>{communityEvents.length} events</Text>
        </View>
        )}


        {/* Community event list */}
        {communityEvents.length > 0 ? (
          <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 8 }}>
            {communityEvents.map((ev: any) => {
              const filled = ev.isHosted ? Math.max((approvedJoiners[ev.id] || []).length + 1, ev.participantsCount || 1) : ev.participantsCount || 0
              const total = ev.maxParticipants || 10
              const pct = Math.min(1, filled / total)
              const free = Math.max(0, total - filled)
              return (
                <TouchableOpacity key={ev.id} onPress={() => onEventPress(ev)} activeOpacity={0.88}
                  style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  {/* Top row: avatar + title + badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    {(() => {
                      const CatIcon = CATEGORY_ICON[ev.category] || MapPin
                      const bgColors = CATEGORY_BG[ev.category] || ['#EEF2FF','#C7D2FE']
                      const iconColor = CATEGORY_COLOR[ev.category] || '#4338CA'
                      return (
                        <LinearGradient colors={bgColors}
                          style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CatIcon size={22} color={iconColor} weight="duotone" />
                        </LinearGradient>
                      )
                    })()}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1B4B', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                        {ev.visibility === 'private' && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#F1F5F9' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>Private 🔒</Text>
                          </View>
                        )}
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#EEF2FF' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#4338CA', textTransform: 'capitalize' }}>{ev.category}</Text>
                        </View>
                        {(crewStats[ev.id]?.members || 0) >= 3 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, backgroundColor: '#FFEDD5' }}>
                            <Fire size={11} color="#EA580C" weight="fill" />
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#9A3412' }}>POPULAR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>{ev.organizer?.name || 'Community'}</Text>
                    </View>
                  </View>
                  {/* Date + location row */}
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CalendarBlank size={12} color="#94A3B8" weight="regular" />
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>{prettyEventTime(ev.time)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <PhMapPin size={12} color="#94A3B8" weight="regular" />
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>{(ev.location || '').split(',')[0].trim() || 'Location TBD'}</Text>
                    </View>
                    {ev.hostTransport === 'car' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                        <PhCar size={11} color="#6366F1" weight="duotone" />
                        <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '600' }}>Host can give a lift</Text>
                      </View>
                    )}
                  </View>
                  {/* Progress + join */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>{filled} of {total} spots</Text>
                        <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '700' }}>{free === 0 ? 'Full' : `${free} spot${free === 1 ? '' : 's'} left`}</Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: '#EEF2FF', borderRadius: 99 }}>
                        <View style={{ height: 4, width: `${Math.round(pct * 100)}%` as any, backgroundColor: pct >= 0.8 ? '#EF4444' : '#6366F1', borderRadius: 99 }} />
                      </View>
                    </View>
                    <JoinButton ev={ev} />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
            <Image
              source={require('../../assets/images/community_empty.png')}
              style={{ width: 180, height: 138, marginBottom: 14 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3 }}>No community plans yet</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: '#94A3B8', marginTop: 6 }}>Tap + to start one</Text>
          </View>
        )}
        </>)}

      </ScrollView>

      {/* ── Vibe Edit Modal ── */}
      <Modal visible={vibeEditOpen} transparent animationType="slide" onRequestClose={() => setVibeEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setVibeEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom + 16, 36) }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 26, color: '#1E1B4B', letterSpacing: -0.5, marginBottom: 20 }}>Tonight's vibe</Text>

          {/* Social energy */}
          <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 11, color: '#94A3B8', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>Social Energy</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {SOCIAL_ENERGY.map(e => {
              const on = draftVibe?.energy === e.id
              const isParty = e.id === 'party'
              const btn = (
                <TouchableOpacity key={e.id} onPress={() => setDraftVibe((v: any) => ({ ...v, energy: e.id }))} activeOpacity={0.8}>
                  {on ? (
                    <LinearGradient colors={e.grad}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                        shadowColor: e.color, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
                      <e.Icon size={18} color={e.color} weight="duotone" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: e.color }}>{e.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                      backgroundColor: 'rgba(248,250,252,0.9)', borderWidth: 1.5, borderColor: '#E2E8F0' }}>
                      <e.Icon size={18} color="#CBD5E1" weight="regular" />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8' }}>{e.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
              return isParty && on
                ? <Animated.View key={e.id} style={{ transform: [{ scale: pulseAnim }] }}>{btn}</Animated.View>
                : btn
            })}
          </View>

          <TouchableOpacity onPress={() => { setTonightVibe(draftVibe); setVibeEditOpen(false) }}
            style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center', overflow: 'hidden' }}>
            <LinearGradient colors={['#6366F1','#818CF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: '#fff' }}>Save vibe</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Join Bottom Sheet ── */}
      <Modal visible={joinSheet.visible} transparent animationType="slide" onRequestClose={closeJoinSheet}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,8,30,0.75)' }} activeOpacity={1} onPress={closeJoinSheet} />
        <View style={[s.joinSheetWrap, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.joinSheetHandle} />

          {joinSheet.ev?.type === 'official' && joinSheet.step !== 4 && (
            <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Step {joinSheet.step} of 3</Text>
            </View>
          )}
          {joinSheet.ev?.type === 'community' && joinSheet.step !== 4 && (
            <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Step 2 of 2</Text>
            </View>
          )}

          {joinSheet.step === 4 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(167,139,250,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.45)' }}>
                <Ionicons name="checkmark" size={38} color="#A78BFA" />
              </View>
              <Text style={{ fontSize: 22, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.4, marginBottom: 6 }}>You're in ✨</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 }}>
                {joinSheet.ev?.type === 'official' ? "We'll start looking for your crew." : "Request sent. Host will reply soon."}
              </Text>
            </View>
          ) : joinSheet.step === 1 ? (
            <>
              <Text style={s.joinSheetTitle}>How many people are{'\n'}you looking for?</Text>
              <View style={{ gap: 10, marginTop: 4 }}>
                {FORMAT_OPTIONS.map(opt => {
                  const active = joinSheet.format === opt.id
                  return (
                    <TouchableOpacity key={opt.id} activeOpacity={0.8}
                      onPress={() => { setJoinSheet(prev => ({ ...prev, format: opt.id })); Haptics.selectionAsync() }}
                      style={[s.joinSheetCard, active && { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: opt.color + '55' }]}>
                      <LinearGradient
                        colors={active ? opt.grad : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                        style={{ width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
                        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
                        <opt.Icon size={24} color={active ? '#fff' : 'rgba(255,255,255,0.35)'} strokeWidth={1.8} />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.joinSheetCardLabel, active && { color: opt.color }]}>{opt.label}</Text>
                        <Text style={s.joinSheetCardSub}>{opt.sub}</Text>
                      </View>
                      {active && <CheckCircle size={22} color={opt.color} strokeWidth={2} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity
                style={[s.joinSheetNext, !joinSheet.format && { opacity: 0.4 }]}
                disabled={!joinSheet.format}
                onPress={() => setJoinSheet(prev => ({ ...prev, step: 2 }))}>
                <Text style={s.joinSheetNextTxt}>Next →</Text>
              </TouchableOpacity>
            </>
          ) : joinSheet.step === 2 ? (
            <>
              {joinSheet.ev?.type === 'official' && (
                <TouchableOpacity onPress={() => setJoinSheet(prev => ({ ...prev, step: 1 }))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Ionicons name="chevron-back" size={14} color="#6366F1" />
                  <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: '600' }}>Back</Text>
                </TouchableOpacity>
              )}
              <Text style={s.joinSheetTitle}>How are you{'\n'}getting there?</Text>
              <View style={{ gap: 10, marginTop: 4 }}>
                {TRANSPORT_OPTIONS.map(opt => {
                  const active = joinSheet.transport === opt.id
                  return (
                    <TouchableOpacity key={opt.id} activeOpacity={0.8}
                      onPress={() => { setJoinSheet(prev => ({ ...prev, transport: opt.id })); Haptics.selectionAsync() }}
                      style={[s.joinSheetCard, active && { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: opt.color + '55' }]}>
                      <LinearGradient
                        colors={active ? opt.grad : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                        style={{ width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
                        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
                        <opt.Icon size={24} color={active ? '#fff' : 'rgba(255,255,255,0.35)'} strokeWidth={1.8} />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.joinSheetCardLabel, active && { color: opt.color }]}>{opt.label}</Text>
                        <Text style={s.joinSheetCardSub}>{opt.sub}</Text>
                      </View>
                      {active && <CheckCircle size={22} color={opt.color} strokeWidth={2} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
              {(joinSheet.ev?.isHosted || joinSheet.ev?.type === 'community') && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 12, marginTop: 16, marginBottom: -4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}>
                  <Text style={{ fontSize: 15 }}>👤</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 }}>The host will see your transport preference and reviews compatibility before approving.</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.joinSheetNext, !joinSheet.transport && { opacity: 0.4 }, joinSheet.transport && { shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }]}
                disabled={!joinSheet.transport}
                onPress={() => {
                  // Community events skip crew preference step — host already set it
                  if (joinSheet.ev?.type === 'community') confirmJoin()
                  else setJoinSheet(prev => ({ ...prev, step: 3 }))
                }}>
                <Text style={s.joinSheetNextTxt}>{joinSheet.ev?.type === 'community' ? 'Send Request →' : 'Continue →'}</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {joinSheet.step === 3 && (
            <>
              <TouchableOpacity onPress={() => setJoinSheet(prev => ({ ...prev, step: 2 }))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <Ionicons name="chevron-back" size={14} color="#6366F1" />
                <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
              <Text style={s.joinSheetTitle}>Who would you feel{'\n'}comfortable going with?</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit-Regular', marginTop: 4, marginBottom: 8 }}>Optional · applies to this event only</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {[
                  { id: 'any',    label: 'Any',          sub: 'Open to everyone' },
                  { id: 'women',  label: 'Women only',   sub: 'Crew of women only' },
                  { id: 'men',    label: 'Men only',     sub: 'Crew of men only' },
                ].map(opt => {
                  const active = joinSheet.crewPref === opt.id
                  return (
                    <TouchableOpacity key={opt.id} activeOpacity={0.8}
                      onPress={() => { setJoinSheet(prev => ({ ...prev, crewPref: opt.id })); Haptics.selectionAsync() }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16,
                        backgroundColor: active ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
                        borderWidth: 1.5, borderColor: active ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.08)' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: active ? '#A78BFA' : '#fff' }}>{opt.label}</Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{opt.sub}</Text>
                      </View>
                      {active && <CheckCircle size={20} color="#A78BFA" strokeWidth={2} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity
                style={[s.joinSheetNext, { shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }]}
                onPress={confirmJoin}>
                <Text style={s.joinSheetNextTxt}>
                  {joinSheet.ev?.type === 'official' ? "I'm Going" : "Send Request →"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        </View>
      </Modal>

    </View>
  )
}


// ─── VIBE CHECK TAB ───────────────────────────────────────────────────────────





function SeekersListWithProfile({ vibeResults, onPass, onLike, seekers }: { vibeResults: Record<number, string>; onPass: (id: number) => void; onLike: (sk: any) => void; seekers: any[] }) {
  const [preview, setPreview] = useState<any>(null)
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {seekers.map(sk => {
          const result = vibeResults[sk.id]
          return (
            <View key={sk.id} style={[s.seekerCard, result === 'vibe' && { borderColor: '#818CF8', borderWidth: 2 }, result === 'pass' && { opacity: 0.35 }]}>
              <TouchableOpacity onPress={() => { setPreview({ ...sk, colors: [sk.color, '#1E1B4B'], flag: FLAG_MAP[sk.langs[0]] || '🌍', langs: sk.langs.map((l: string) => FLAG_MAP[l] || '🌍'), interests: [], goal: sk.format === '1+1' ? 'networking' : 'chill', emoji: FORMAT_BADGE[sk.format]?.label || '👤' }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }} activeOpacity={0.8}>
                <Image source={{ uri: sk.photo }} style={s.seekerPhoto} />
                {FORMAT_BADGE[sk.format] && (
                  <View style={[s.formatBadge, { backgroundColor: FORMAT_BADGE[sk.format].color }]}>
                    <Text style={{ fontSize: 8, fontWeight: '800', color: '#fff' }}>{FORMAT_BADGE[sk.format].label}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E1B4B' }}>{sk.name}, {sk.age}</Text>
                  {sk.langs.map((l: string) => <Text key={l} style={{ fontSize: 14 }}>{FLAG_MAP[l] || '🌍'}</Text>)}
                </View>
                <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17 }} numberOfLines={2}>{sk.bio}</Text>
                <Text style={{ fontSize: 11, color: '#818CF8', marginTop: 4, fontWeight: '600' }}>{TRANSPORT_LABEL[sk.transport]}</Text>
              </View>
              {!result ? (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity style={s.passBtn} onPress={() => onPass(sk.id)}>
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.vibeBtn} onPress={() => onLike(sk)}>
                    <Text style={{ fontSize: 18 }}>⭐</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: result === 'vibe' ? 'rgba(129,140,248,0.15)' : 'rgba(0,0,0,0.05)' }}>
                  <Text style={{ fontSize: 18 }}>{result === 'vibe' ? '⭐' : '✕'}</Text>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
      {preview && <InlineProfileSheet profile={preview} onClose={() => setPreview(null)} />}
    </View>
  )
}

function InlineProfileSheet({ profile, onClose }: { profile: any; onClose: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const slideAnim = useRef(new Animated.Value(400)).current
  const leftArrow = useRef(new Animated.Value(0)).current
  const rightArrow = useRef(new Animated.Value(0)).current

  const flash = (anim: Animated.Value) => {
    anim.setValue(1)
    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start()
  }

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start()
  }, [])

  const close = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(onClose)
  }

  const photoPalettes = [
    profile.colors,
    [profile.colors[1], '#0A0812'],
    ['#0A0812', profile.colors[0]],
  ]

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)' }} activeOpacity={1} onPress={close} />
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#100D20', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        transform: [{ translateY: slideAnim }],
        maxHeight: '90%',
      }}>
        {/* Photo carousel */}
        <View style={{ height: 280, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <LinearGradient colors={photoPalettes[photoIdx] as any} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {profile.photo && photoIdx === 0
              ? <Image source={{ uri: profile.photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              : <Text style={{ fontSize: 72 }}>{profile.emoji}</Text>
            }
          </LinearGradient>
          <LinearGradient colors={['transparent', '#100D20']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }} pointerEvents="none" />
          <TouchableOpacity onPress={() => setPhotoIdx(i => Math.max(0, i - 1))} style={{ position: 'absolute', left: 14, top: 120, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', opacity: photoIdx > 0 ? 1 : 0 }}>
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPhotoIdx(i => Math.min(photoPalettes.length - 1, i + 1))} style={{ position: 'absolute', right: 14, top: 120, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', opacity: photoIdx < photoPalettes.length - 1 ? 1 : 0 }}>
            <Feather name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={close} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="x" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Контент — свой ScrollView */}
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>{profile.name}</Text>
              <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{profile.age}</Text>
              <Text style={{ fontSize: 20 }}>{profile.flag}</Text>
            </View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 21, marginBottom: 18 }}>{profile.bio}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                  {profile.transport === 'car' ? '🚗 Driving' : profile.transport === 'lift' ? '🙋 Needs lift' : '📍 Meet there'}
                </Text>
              </View>
              {profile.goal && (
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{GOAL_LABEL[profile.goal] || '😌 Chill'}</Text>
                </View>
              )}
            </View>
            {profile.langs?.length > 0 && (
              <>
                <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 8 }}>LANGUAGES</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
                  {profile.langs.map((l: string, i: number) => (
                    <View key={i} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' }}>
                      <Text style={{ fontSize: 14 }}>{l}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {profile.interests?.length > 0 && (
              <>
                <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 8 }}>INTERESTS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {profile.interests.map((tag: string, i: number) => (
                    <View key={i} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: `${profile.colors[0]}22`, borderWidth: 1, borderColor: `${profile.colors[0]}44` }}>
                      <Text style={{ fontSize: 12, color: profile.colors[0], fontWeight: '700' }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  )
}


// ProfileTab extracted to lib/screens/ProfileTab.tsx

// ─── FEED SCREEN ──────────────────────────────────────────────────────────────

function LocationSearch({ apiKey, onSelect }: { apiKey: string; onSelect: (desc: string, lat?: number, lng?: number) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 2) { setResults([]); setError(''); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}&language=en`
        const res = await fetch(url)
        const json = await res.json()
        if (json.status === 'OK') {
          setResults(json.predictions)
          setError('')
        } else {
          setResults([])
          setError(json.status)
          console.log('Places API status:', json.status, json.error_message)
        }
      } catch (e) {
        setError('Network error')
        console.log('Places fetch error:', e)
      }
    }, 400)
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <TextInput
        autoFocus
        value={query}
        onChangeText={search}
        placeholder="Search for a place..."
        placeholderTextColor="#94A3B8"
        style={{ fontSize: 15, fontFamily: 'Outfit-Regular', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, height: 46, color: '#1E1B4B' }}
      />
      {error.length > 0 && (
        <Text style={{ color: 'red', fontSize: 12, marginTop: 8 }}>Error: {error}</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.place_id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.description)}
            style={{ paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Outfit-Regular', color: '#1E1B4B' }}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

function FeedScreen({ userData = {}, onUpdateUserData, onLogOut }: { userData?: any; onUpdateUserData?: (patch: any) => void; onLogOut?: () => void }) {
  const insets = useSafeAreaInsets()
  const fullWindowHeightRef = useRef(Dimensions.get('window').height)
  const insetsBottomRef = useRef(insets.bottom)
  insetsBottomRef.current = insets.bottom
  const [activeTab, setActiveTab] = useState<'home' | 'vibecheck' | 'messages' | 'profile'>('home')
  const [messagesInitialSubTab, setMessagesInitialSubTab] = useState<'going' | 'messages'>('going')
  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [createSize, setCreateSize] = useState<string | null>(null)
  const [createType, setCreateType] = useState<string | null>(null)
  const [createDay, setCreateDay] = useState('')
  const [createHour, setCreateHour] = useState('')
  const [dateSheetOpen, setDateSheetOpen] = useState(false)
  const [timeSheetOpen, setTimeSheetOpen] = useState(false)
  const [createLocation, setCreateLocation] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createDriving, setCreateDriving] = useState(false)
  const [createLangs, setCreateLangs] = useState<string[]>([])
  const [createCrewPref, setCreateCrewPref] = useState<string>('any')
  const [createVisibility, setCreateVisibility] = useState<'public' | 'private'>('public')
  // True while the final "Create plan" submit is uploading the cover + inserting
  // the event — drives the button spinner and blocks double-taps.
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [calViewYear, setCalViewYear] = useState(new Date().getFullYear())
  const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth())
  const [createCategory, setCreateCategory] = useState<string>('Sport')
  const [createVibe, setCreateVibe] = useState<string | null>(null)
  const [createCustom, setCreateCustom] = useState('')
  // True only after the user taps the disabled Next without filling the name.
  // Resets the moment they start typing so the input doesn't sit in red.
  const [createNameError, setCreateNameError] = useState(false)
  // Summary on step 4 lives behind a "Review your plan" toggle so the
  // section doesn't push the actual fields below the fold.
  const [createSummaryOpen, setCreateSummaryOpen] = useState(false)
  const [createImage, setCreateImage] = useState<{ uri: string; base64: string } | null>(null)
  const createScrollRef = useRef<ScrollView>(null)
  // Keyboard height while the create modal is open. On Android edge-to-edge the
  // window does NOT shrink for the keyboard, so we add this as bottom padding to
  // the step ScrollView — that gives scrollToEnd room to lift the name field
  // above the keyboard instead of leaving it covered.
  const [createKbHeight, setCreateKbHeight] = useState(0)
  useEffect(() => {
    if (!createOpen) { setCreateKbHeight(0); return }
    const show = Keyboard.addListener('keyboardDidShow', e => setCreateKbHeight(e.endCoordinates?.height || 0))
    const hide = Keyboard.addListener('keyboardDidHide', () => setCreateKbHeight(0))
    return () => { show.remove(); hide.remove() }
  }, [createOpen])
  // Once the keyboard padding is applied on the name step, scroll the field
  // into view above the keyboard (runs after the padding re-render, so the
  // ScrollView actually has room to lift it).
  useEffect(() => {
    if (createKbHeight > 0 && createStep === 2) {
      createScrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [createKbHeight, createStep])
  // Scroll create form to top on step change
  useEffect(() => { createScrollRef.current?.scrollTo({ y: 0, animated: false }) }, [createStep])
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [city, setCity] = useState<string | null>(userData?.city || null)
  const [cityOpen, setCityOpen] = useState(false)
  // Keep local city in sync with userData.city when it loads from DB
  useEffect(() => { if (userData?.city && userData.city !== city) setCity(userData.city) }, [userData?.city])
  const [feedFilter, setFeedFilter] = useState('all')
  const [eventDetail, setEventDetail] = useState<any>(null)
  const [eventParticipants, setEventParticipants] = useState<{ ev: any; members: any[] } | null>(null)
  const [matchedWith, setMatchedWith] = useState<any>(null)
  const [vibeResults, setVibeResults] = useState<Record<number, string>>({})
  // Per-chat "last read at" timestamps. When the user opens a chat we record
  // Date.now() here and persist; an incoming inbox message only marks the chat
  // unread if its created_at is *after* the saved lastReadAt.
  const [lastReadAtMap, setLastReadAtMap] = useState<Record<number, number>>({})
  const lastReadAtMapRef = useRef<Record<number, number>>({})
  lastReadAtMapRef.current = lastReadAtMap
  const {
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
  } = useChats({
    userDbId: userData?.dbId,
    userName: userData?.name,
    lastReadAtMap,
    // Called when realtime DELETE on chats removes one of our chats (e.g., the
    // other side blocked us and tore down the chat). Mirror the cleanup the
    // blocker did locally so VibeCheck/Plans don't show stale "Open Chat".
    // Duo chats often miss `eventRefId` (DB has no event_id column carried over)
    // — fall back to matching the event by title.
    onChatRemoved: (chat: any) => {
      let evId: number | undefined = chat?.eventRefId
      if (!evId && chat?.event) {
        const ev = [...feedOfficialDbEventsRef.current, ...dbCommunityEventsRef.current].find((e: any) => e.title === chat.event)
        evId = ev?.id
      }
      // Defensive fallback for older chats without eventRefId/title match — scan
      // officialEventChatMap for any event whose chat_id matches the removed chat.
      if (!evId && chat?.id) {
        for (const [eId, cId] of Object.entries(officialEventChatMapRef.current)) {
          if (cId === chat.id) { evId = Number(eId); break }
        }
      }
      if (!evId) return
      setOfficialEventChatMap(prev => { const n = { ...prev }; delete n[evId!]; return n })
      setCrewPreviewMap(prev => { const n = { ...prev }; delete n[evId!]; return n })
      setReadyCountMap(prev => { const n = { ...prev }; delete n[evId!]; return n })
    },
  })

  // Block wrapper: hook does chat-level cleanup (delete duo chats + crew_invites
  // between us, auto-leave groups). We follow with minimal event-state cleanup
  // — just clear `officialEventChatMap` / `crewPreviewMap` entries pointing to
  // deleted chats so VibeCheck doesn't render "Open Chat" into nothing.
  //
  // We deliberately DON'T delete the blocker's `event_attendees` or remove from
  // `joinedEvents`: the block is about the *person*, not the event. The blocker
  // stays in the event and can join a different crew. VibeCheck's bidirectional
  // block filter keeps the two of them invisible to each other.
  const handleBlock = async (profile: any) => {
    if (!userData?.dbId || !profile?.id) return
    const { duoChats, groupChats } = await blockClearChats(profile)
    const deletedChatIds = new Set([...duoChats, ...groupChats].map((c: any) => c.id))
    const affectedEventIds = new Set<number>()
    Object.entries(officialEventChatMapRef.current).forEach(([evId, chatId]) => {
      if (deletedChatIds.has(chatId)) affectedEventIds.add(Number(evId))
    })
    if (affectedEventIds.size > 0) {
      setOfficialEventChatMap(prev => {
        const n = { ...prev }
        affectedEventIds.forEach(id => delete n[id])
        return n
      })
      setCrewPreviewMap(prev => {
        const n = { ...prev }
        affectedEventIds.forEach(id => delete n[id])
        return n
      })
      setReadyCountMap(prev => {
        const n = { ...prev }
        affectedEventIds.forEach(id => delete n[id])
        return n
      })
    }
    // Clear local sentCrewInvites for this person — `blockClearChats` already
    // cancelled them in DB so leaving local state stale would show "Waiting for X".
    setSentCrewInvites(prev => {
      const n: typeof prev = {}
      for (const k of Object.keys(prev)) {
        if (!k.endsWith(`_${profile.id}`)) n[k] = prev[k]
      }
      return n
    })
    // Clear the "already processed accepted invites" memo. Stored keys are
    // `inv:<invite_row_id>`. We don't know the invite ids here (DB cancel just
    // happened), but clearing all entries is safe — the next poll will rebuild
    // it from the current crew_invites rows, processing only ones not yet
    // reflected in local state.
    acceptedInviteKeysRef.current.clear()
    Alert.alert('Blocked', `${profile.name} has been blocked.`)
  }
  const scrollRef = useRef<ScrollView>(null)
  const realtimeChatRef = useRef<any>(null)
  const inboxChannelRef = useRef<any>(null)
  const seenInboxMsgIdsRef = useRef<Set<any>>(new Set())
  const duoBroadcastRef = useRef<any>(null)
  const communityBroadcastRef = useRef<any>(null)
  const duoBroadcastQueueRef = useRef<any[]>([])
  const communityBroadcastQueueRef = useRef<any[]>([])

  const [joinedEvents, setJoinedEvents] = useState<Record<number, 'pending' | 'joined' | 'confirmed'>>({})
  const [cancelledEventIds, setCancelledEventIds] = useState<number[]>([])
  const cancelledEventIdsRef = useRef<Set<number>>(new Set())
  const [vibes, setVibes] = useState<number[]>([])
  const [dbSeekers, setDbSeekers] = useState<any[]>([])
  const [feedOfficialDbEvents, setFeedOfficialDbEvents] = useState<any[]>([])
  const feedOfficialDbEventsRef = useRef<any[]>([])
  const [dbCommunityEvents, setDbCommunityEvents] = useState<any[]>([])
  const dbCommunityEventsRef = useRef<any[]>([])
  const deletedCommunityEventIds = useRef<Set<number>>(new Set())
  const communityEventChatMap = useRef<Record<number, number>>({}) // eventId → chatId


  useEffect(() => {
    const fetchFeedOfficial = () => supabase.from('official_events').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) setFeedOfficialDbEvents(data.map(e => ({ ...e, id: e.id + 100000, _dbId: e.id, _fromDb: true, type: 'official', time: e.time || e.date_label || '', gradient: e.gradient || ['#667eea', '#764ba2'], maxParticipants: e.capacity ?? e.max_participants ?? 100, seekerColors: e.seeker_colors || ['#818CF8', '#6366F1'], seekingCount: e.seeking_count ?? 0, participantsCount: e.participants_count ?? 0 }))) })
    fetchFeedOfficial()
    const interval = setInterval(fetchFeedOfficial, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load community events from DB (other users' events) — poll every 15s
  useEffect(() => {
    const fetch = async () => {
      const [{ data }, { data: countData }] = await Promise.all([
        supabase
          .from('community_events')
          .select('*, host:profiles!host_id(id, name, photos, color, bio, age, langs)')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('join_requests')
          .select('event_id')
          .in('status', ['approved', 'confirmed']),
      ])
      // Count only confirmed per event (approved = reserved but not yet accepted by joiner)
      const participantCounts: Record<number, number> = {}
      countData?.forEach((r: any) => {
        participantCounts[r.event_id] = (participantCounts[r.event_id] || 0) + 1
      })
      if (data) {
        setDbCommunityEvents(data.filter(e => !deletedCommunityEventIds.current.has(e.id)).map(e => ({
          id: e.id,
          type: 'community',
          city: e.city || '',
          title: e.title ? e.title.charAt(0).toUpperCase() + e.title.slice(1) : e.title,
          category: e.category || 'outdoors',
          location: e.location,
          time: e.time || 'TBD',
          distance: '',
          // image_url was missing here — that's why other devices (e.g. Android)
          // didn't render the cover even though the upload + DB row succeeded.
          image_url: e.image_url || null,
          gradient: e.gradient || ['#667eea', '#764ba2'],
          maxParticipants: e.max_participants || 5,
          participantsCount: 1 + (participantCounts[e.id] || 0), // host + confirmed members
          seekerColors: ['#818CF8'],
          seekingCount: 0,
          isHosted: e.host_id === userData?.dbId,
          hostId: e.host_id,
          hostTransport: e.host_transport || null,
          crewPref: e.crew_pref || 'any',
          visibility: e.visibility || 'public',
          hostProfile: e.host ? {
            id: e.host.id,
            name: e.host.name || 'Host',
            photo: e.host.photos?.[0] || null,
            photos: e.host.photos || [],
            bio: e.host.bio || '',
            age: e.host.age || '',
            langs: e.host.langs || [],
            color: e.host.color || '#6366F1',
            colors: [e.host.color || '#6366F1', '#818CF8'],
            _isHost: true,
            _real: true,
          } : null,
          // Don't fall back description to location — the address is already shown
          // in its own row on the card; duplicating it as the description was noise.
          description: e.description || '',
          expiresAt: (() => {
            try {
              const raw = (e.time || '').trim()
              if (!raw) return 0
              // Try ISO-ish first ("2026-05-09, 10:30")
              const isoTry = new Date(raw.replace(', ', 'T') + ':00')
              if (!isNaN(isoTry.getTime())) return isoTry.getTime()
              // "9 May, 10:30" or "May 9, 10:30" without year — assume current year.
              const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11, янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4, июн: 5, июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11 }
              const m1 = raw.match(/^(\d{1,2})\s+([A-Za-zА-Яа-я]+),\s*(\d{1,2}):(\d{2})/)
              if (m1) {
                const monIdx = months[m1[2].toLowerCase().slice(0, 3)]
                if (monIdx == null) return 0
                return new Date(new Date().getFullYear(), monIdx, +m1[1], +m1[3], +m1[4]).getTime()
              }
              const m2 = raw.match(/^([A-Za-zА-Яа-я]+)\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})/)
              if (m2) {
                const monIdx = months[m2[1].toLowerCase().slice(0, 3)]
                if (monIdx == null) return 0
                return new Date(new Date().getFullYear(), monIdx, +m2[2], +m2[3], +m2[4]).getTime()
              }
              return 0
            } catch { return 0 }
          })(),
          _dbCommunity: true,
        })))
      }
    }
    fetch()
    const interval = setInterval(fetch, 15000)

    // Realtime: update participantsCount instantly when someone joins or leaves
    const jrChannel = supabase.channel('join_requests_counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'join_requests' }, (payload: any) => {
        const r = payload.new
        if (r.status === 'approved' || r.status === 'confirmed') {
          setDbCommunityEvents(prev => prev.map(e =>
            e.id === r.event_id ? { ...e, participantsCount: (e.participantsCount || 1) + 1 } : e
          ))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'join_requests' }, (payload: any) => {
        const r = payload.old
        // r.event_id / r.requester_id may be undefined without REPLICA IDENTITY FULL —
        // so we trigger an immediate re-fetch of host join requests instead of relying on them
        fetchRequestsRef.current?.()
        // Also re-fetch community events to update participantsCount
        if (r.event_id) {
          setDbCommunityEvents(prev => prev.map(e =>
            e.id === r.event_id ? { ...e, participantsCount: Math.max(1, (e.participantsCount || 1) - 1) } : e
          ))
        } else {
          // event_id unknown — trigger full community events re-fetch
          fetch()
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'join_requests' }, () => {
        // On any status change just re-fetch counts
        fetch()
      })
      .subscribe()

    return () => { clearInterval(interval); supabase.removeChannel(jrChannel) }
  }, [userData?.dbId])
  // Group chat: refresh members from DB on open AND on any chat_members change
  // (realtime) so the header member count + avatars stay in sync without waiting
  // for crewsByEvent polling.
  useEffect(() => {
    if (!openChat || openChat.type !== 'group' || !openChat.id || !userData?.dbId) return
    if (typeof openChat.id !== 'number' || openChat.id >= 1e12) return
    const chatId = openChat.id
    const refresh = async () => {
      const { data: members } = await supabase
        .from('chat_members')
        .select('profile_id, profiles:profile_id(id, name, photos, color, age, bio, langs, interests, goal)')
        .eq('chat_id', chatId)
      if (!members) return
      const others = members
        .filter((m: any) => m.profile_id !== userData.dbId && (m as any).profiles?.id)
        .map((m: any) => {
          const p = (m as any).profiles
          return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍' }
        })
      setOpenChat((cur: any) => cur && cur.id === chatId ? {
        ...cur,
        members: members.length,
        memberProfiles: others,
        avatars: others.map((p: any) => p.photo).filter(Boolean),
        colors: others.map((p: any) => p.color),
      } : cur)
      setChatList(prev => prev.map(c => c.id === chatId ? {
        ...c,
        members: members.length,
        memberProfiles: others,
        avatars: others.map((p: any) => p.photo).filter(Boolean),
        colors: others.map((p: any) => p.color),
      } : c))
    }
    refresh()
    const ch = supabase.channel(`open_chat_members_${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members', filter: `chat_id=eq.${chatId}` }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [openChat?.id, openChat?.type, userData?.dbId])

  const persistLoaded = useRef(false)
  const [persistLoadedState, setPersistLoadedState] = useState(false)
  // True once the first event_attendees backfill from DB completes. Until then
  // Plans shows a spinner instead of "No plans yet", so events don't flash in
  // after an empty render on reload (especially on web where AsyncStorage is
  // empty and everything comes from the DB fetch).
  const [plansHydrated, setPlansHydrated] = useState(false)

  // Load profiles from DB, fall back to MOCK_SEEKERS if empty
  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbSeekers(data.map((p, i) => ({
            id: p.id,
            name: p.name || 'User',
            age: p.age || 25,
            langs: p.langs || [],
            transport: p.transport || 'meet',
            format: p.format || 'group',
            color: p.color || '#6366F1',
            photo: p.photos?.[0] || `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
            bio: p.bio || '',
            interests: p.interests || [],
            drinksPref: p.drinks_pref || '',
            smokingPref: p.smoking_pref || '',
          })))
        }
      })
  }, [])

  const allSeekers = dbSeekers.length > 0 ? dbSeekers : MOCK_SEEKERS
  const evHost = eventDetail?.type === 'community' && !eventDetail.isHosted
    ? (eventDetail.hostProfile || allSeekers[(eventDetail.id - 1) % allSeekers.length])
    : null
  const [userEventFormat, setUserEventFormat] = useState<Record<number, string>>({})
  const [userEventTransport, setUserEventTransport] = useState<Record<number, string>>({})
  const [pendingJoinEv, setPendingJoinEv] = useState<any>(null)
  const [eventAttendeesMap, setEventAttendeesMap] = useState<Record<number, any[]>>({})
  // Ref mirrors eventAttendeesMap for read-only access inside polling closures —
  // lets us reuse already-computed AI scores instead of re-billing every 15s.
  const eventAttendeesMapRef = useRef<Record<number, any[]>>({})
  eventAttendeesMapRef.current = eventAttendeesMap
  // All existing crew chats per event — populated from chats + chat_members. The user
  // picks one to join or creates their own; multiple chats per event are allowed.
  // Each crew = { chatId, members: [{ id, name, photo, color, age, ... }], avgMatch }.
  const [crewsByEvent, setCrewsByEvent] = useState<Record<number, Array<{ chatId: number; members: any[]; avgMatch: number }>>>({})
  // Aggregated crew stats per event for the feed cards: how many crews are
  // forming + total members across them + total spots still open. Drives the
  // "N crew · X spots left" call-to-action on event cards. Sourced from a
  // SECURITY DEFINER RPC because chats/chat_members are RLS-hidden from
  // non-members, so a direct count would always be 0 for the discovery feed.
  const [crewStatsByEvent, setCrewStatsByEvent] = useState<Record<number, { crews: number; members: number; spotsLeft: number }>>({})
  // Bidirectional crew_pref + gender check.
  // Returns true if (a) my preference allows the other person's gender AND (b) their preference allows my gender.
  const fitsCrewPref = (myPref: string, myGender: string | undefined, theirPref: string, theirGender: string | undefined) => {
    const accepts = (pref: string, gender: string | undefined) => {
      if (!pref || pref === 'any' || pref === 'mixed') return true
      const g = (gender || '').toLowerCase()
      if (pref === 'women') return g === 'female'
      if (pref === 'men')   return g === 'male'
      return true
    }
    return accepts(myPref || 'any', theirGender) && accepts(theirPref || 'any', myGender)
  }
  const [incomingCrewInvites, setIncomingCrewInvites] = useState<any[]>([])
  const [sentCrewInvites, setSentCrewInvites] = useState<Record<string, string>>({}) // `${eventId}_${profileId}` -> 'pending'|'accepted'
  const [officialEventChatMap, setOfficialEventChatMap] = useState<Record<number, number>>({}) // eventId -> chatId
  const officialEventChatMapRef = useRef<Record<number, number>>({})
  officialEventChatMapRef.current = officialEventChatMap
  const acceptedInviteKeysRef = useRef<Set<string>>(new Set())
  const acceptingInviteRef = useRef<Set<number>>(new Set())
  const partyChatMemberChannels = useRef<Record<number, any>>({})
  const partyChatBroadcastChannels = useRef<Record<number, any>>({})
  const [readyCountMap, setReadyCountMap] = useState<Record<number, number>>({})
  const [crewPreviewMap, setCrewPreviewMap] = useState<Record<number, { members: any[]; chatId: number | null } | null>>({})
  // Per-event "I passed on this profile" map — populated from passes table + maintained
  // on realtime + on local pass action. Used by CrewPoolSheet to filter the pool.
  const [passedIdsByEvent, setPassedIdsByEvent] = useState<Record<number, Set<string>>>({})

  useEffect(() => {
    const officialJoined = Object.keys(joinedEvents)
      .map(Number)
      .filter(id => joinedEvents[id] && id > 100000) // official events have offset id
    // Keep all eventAttendeesMap entries — even for events the user is not
    // currently in. On rejoin we want to reuse cached AI scores instead of
    // re-billing Anthropic and seeing the score drift (Claude isn't 100%
    // deterministic on batched prompts even at temperature 0).
    // Stale candidates inside an active event are still cleaned up by the
    // realtime DELETE handler below + by the next polling cycle's data fetch.
    if (officialJoined.length === 0 || !userData?.dbId) return
    const fetchAttendees = async () => {
      const map: Record<number, any[]> = {}
      // Fetch all my passes (both directions) for joined events in one query
      // Two queries instead of `.or()` — Supabase or-filter with UUIDs was
      // dropping valid rows for passes (same regression we hit with blocked_users),
      // letting declined/passed candidates re-appear in VibeCheck.
      const [{ data: passedByMe }, { data: passedMe }] = await Promise.all([
        supabase.from('passes').select('passed_id, event_id').eq('passer_id', userData.dbId).in('event_id', officialJoined),
        supabase.from('passes').select('passer_id, event_id').eq('passed_id', userData.dbId).in('event_id', officialJoined),
      ])
      const passRows = [
        ...(passedByMe || []).map((p: any) => ({ passer_id: userData.dbId, passed_id: p.passed_id, event_id: p.event_id })),
        ...(passedMe || []).map((p: any) => ({ passer_id: p.passer_id, passed_id: userData.dbId, event_id: p.event_id })),
      ]
      // Bidirectional block relationships fetched fresh each cycle — realtime
      // doesn't always fire (depends on Supabase replication / RLS / online
      // status), so pulling from DB here makes the filter reliable. Two queries
      // — Supabase .or() with UUIDs has been unreliable in practice.
      const [{ data: iBlocked }, { data: blockedMe }] = await Promise.all([
        supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData.dbId),
        supabase.from('blocked_users').select('blocker_id').eq('blocked_id', userData.dbId),
      ])
      const blockedSet = new Set<string>([
        ...(iBlocked || []).map((b: any) => b.blocked_id),
        ...(blockedMe || []).map((b: any) => b.blocker_id),
      ])
      const passedSetByEvent: Record<number, Set<string>> = {}
      ;(passRows || []).forEach((p: any) => {
        const otherId = p.passer_id === userData.dbId ? p.passed_id : p.passer_id
        if (!passedSetByEvent[p.event_id]) passedSetByEvent[p.event_id] = new Set()
        passedSetByEvent[p.event_id].add(otherId)
      })
      // Surface to FeedScreen so CrewPoolSheet can filter the pool the same way
      setPassedIdsByEvent(passedSetByEvent)
      await Promise.all(officialJoined.map(async (evId) => {
        // Include confirmed users so others can see them and join existing crew chats
        const statusFilter = ['looking', 'ready', 'confirmed']
        // Fetch own row to know my crew_pref for this event
        const { data: mine } = await supabase.from('event_attendees').select('crew_pref').eq('event_ref_id', evId).eq('profile_id', userData.dbId).maybeSingle()
        const myPref = mine?.crew_pref || 'any'
        const myGender = (userData as any)?.gender
        // Size filter intentionally dropped — users already sharing a crew chat
        // should always be scored regardless of original format preference. The
        // previous gs_min/gs_max overlap check silently excluded chat members on
        // format mismatch, producing avgMatch=0 and hidden % vibe match.
        const { data: rawData } = await supabase
          .from('event_attendees')
          .select('*, profiles(*)')
          .eq('event_ref_id', evId)
          .neq('profile_id', userData.dbId)
          .in('status', statusFilter)
          .limit(20)
        // Bidirectional crew_pref + gender filter, then drop anyone we've mutually passed
        const passedSet = passedSetByEvent[evId] || new Set<string>()
        // Bidirectional dealbreaker filter — if either side's dealbreakers conflict
        // with the other's lifestyle, hide them entirely (don't just score=0).
        const myDb: string[] = (userData as any)?.dealbreakers || []
        const conflicts = (myDbList: string[], them: any) => {
          if (myDbList.includes('no_smoking') && (them?.smoking_pref === 'Smoker' || them?.smoking_pref === 'Social')) return true
          if (myDbList.includes('sober_only') && them?.drinks_pref === 'Social drinker') return true
          if (myDbList.includes('pets_allergy') && them?.has_pets) return true
          return false
        }
        const me = userData as any
        const data = (rawData || [])
          .filter((row: any) => fitsCrewPref(myPref, myGender, row.crew_pref || 'any', row.profiles?.gender))
          .filter((row: any) => !passedSet.has(row.profiles?.id))
          // Bidirectional block filter — hide users I blocked AND users who blocked me.
          // Uses fresh blockedSet pulled from DB just above (more reliable than
          // realtime-synced blockedIds/blockedByIds state).
          .filter((row: any) => !blockedSet.has(row.profiles?.id))
          .filter((row: any) => {
            const p = row.profiles || {}
            // My dealbreakers vs their profile
            if (conflicts(myDb, p)) return false
            // Their dealbreakers vs my profile
            const theirDb: string[] = p.dealbreakers || []
            if (conflicts(theirDb, { smoking_pref: me?.smokingPref, drinks_pref: me?.drinksPref, has_pets: me?.hasPets })) return false
            return true
          })
        if (data && data.length > 0) {
          const candidates = data.map((row: any) => {
            const p = row.profiles || {}
            return {
              id: p.id, name: p.name || 'User', age: p.age || '',
              color: p.color || '#818CF8', colors: [p.color || '#818CF8', p.color ? p.color + 'AA' : '#6366F1'],
              emoji: '🎵', photo: p.photos?.[0] || null, photos: p.photos || [],
              bio: p.bio || '', langs: p.langs || [],
              interests: p.interests || [], drinksPref: p.drinks_pref || '', smokingPref: p.smoking_pref || '',
              hasPets: !!p.has_pets,
              transport: row.transport, groupMin: row.group_size_min, groupMax: row.group_size_max,
              _real: true, score: null as number | null, vibe: '',
            }
          })
          // Reuse cached scores from previous polls — AI is non-deterministic and
          // costs money per call, so re-scoring the same pair every 15s would
          // (a) make scores jump around in the UI and (b) burn through credits.
          // Only call AI for genuinely new candidates the user hasn't seen yet.
          const cachedById: Record<string, { score: number; vibe: string }> = {}
          ;(eventAttendeesMapRef.current[evId] || []).forEach((p: any) => {
            if (p && p.id && p.score != null) cachedById[p.id] = { score: p.score, vibe: p.vibe || '' }
          })
          const newCandidates = candidates.filter(c => !cachedById[c.id])
          const scores = newCandidates.length > 0
            ? await aiScoreRealAttendees(
                {
                  name: userData.name, age: userData.age,
                  langs: userData.langs || [], interests: userData.interests || [],
                  drinksPref: userData.drinksPref || '', smokingPref: userData.smokingPref || '',
                  bio: userData.bio || '', transport: userEventTransport[evId] || '',
                  dealbreakers: userData.dealbreakers || [],
                },
                newCandidates
              )
            : []
          map[evId] = candidates.map(c => {
            const cached = cachedById[c.id]
            if (cached) return { ...c, score: cached.score, vibe: cached.vibe }
            const s = scores.find(r => r.id === c.id)
            return s ? { ...c, score: s.score, vibe: s.vibe } : c
          })
        } else if (data) {
          map[evId] = []
        }
      }))
      setEventAttendeesMap(map)
    }
    fetchAttendees()
    // Poll every 15 seconds for new attendees
    const interval = setInterval(fetchAttendees, 15000)
    // Realtime: immediate refresh on block changes — without this the blocker
    // / blockee see each other in VibeCheck until next 15s poll, which Daria
    // (rightly) called confusing UX.
    const blockChannel = supabase.channel(`blocked_users_vibe_${userData.dbId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blocked_users' }, (payload: any) => {
        const b = payload.new
        if (b?.blocker_id === userData.dbId || b?.blocked_id === userData.dbId) fetchAttendees()
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'blocked_users' }, () => {
        // Can't filter by user on DELETE (only PK comes through) — refetch always.
        fetchAttendees()
      })
      .subscribe()
    // Realtime: remove attendee instantly when they leave
    const rtChannel = supabase.channel('event_attendees_rt')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'event_attendees' }, (payload: any) => {
        console.log('event_attendees DELETE payload:', JSON.stringify(payload.old))
        const { profile_id, event_ref_id } = payload.old
        if (!profile_id || !event_ref_id) return
        setEventAttendeesMap(prev => {
          const current = prev[event_ref_id]
          if (!current) return prev
          const updated = current.filter((p: any) => p.id !== profile_id)
          return { ...prev, [event_ref_id]: updated }
        })
      })
      .subscribe()
    // Realtime: drop the other party from my queue the instant either side passes
    const recordPass = (eventId: number, otherId: string) => {
      setPassedIdsByEvent(prev => {
        const existing = prev[eventId] || new Set<string>()
        if (existing.has(otherId)) return prev
        const next = new Set(existing); next.add(otherId)
        return { ...prev, [eventId]: next }
      })
      setEventAttendeesMap(prev => prev[eventId] ? { ...prev, [eventId]: prev[eventId].filter((p: any) => p.id !== otherId) } : prev)
      setCrewPreviewMap(prev => {
        const cur = prev[eventId]
        if (!cur) return prev
        const filtered = (cur.members || []).filter((m: any) => m.id !== otherId)
        return { ...prev, [eventId]: { ...cur, members: filtered } }
      })
    }
    const passesChannel = supabase.channel(`passes_for_${userData.dbId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'passes', filter: `passer_id=eq.${userData.dbId}` }, (payload: any) => {
        const { passed_id, event_id } = payload.new
        if (!passed_id || !event_id) return
        recordPass(event_id, passed_id)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'passes', filter: `passed_id=eq.${userData.dbId}` }, (payload: any) => {
        const { passer_id, event_id } = payload.new
        if (!passer_id || !event_id) return
        recordPass(event_id, passer_id)
      })
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(rtChannel); supabase.removeChannel(passesChannel); supabase.removeChannel(blockChannel) }
  }, [Object.keys(joinedEvents).join(','), userData?.dbId, JSON.stringify(userEventFormat)])

  // Sync chatList + openChat member counts from crewsByEvent so the chat header
  // updates when someone joins/leaves the crew. Without this, the header sticks
  // on the count from when the chat was first added to chatList.
  useEffect(() => {
    const all = Object.values(crewsByEvent).flat()
    if (all.length === 0) return
    const refresh = (c: any) => {
      const crew = all.find((cr: any) => cr.chatId === c.id)
      if (!crew) return c
      const others = crew.members.filter((m: any) => m.id !== userData?.dbId)
      return { ...c, members: crew.members.length, memberProfiles: others, avatars: others.map((m: any) => m.photo).filter(Boolean), colors: others.map((m: any) => m.color) }
    }
    setChatList(prev => prev.map(refresh))
    setOpenChat((cur: any) => cur ? refresh(cur) : cur)
  }, [crewsByEvent, userData?.dbId])

  // Register this device's Expo push token once we know who the user is.
  // No-op in Expo Go / simulators (registerPushToken returns null) — only
  // real builds on physical devices get a token. Saved to profiles so the
  // send-side edge function can target the device.
  useEffect(() => {
    if (!userData?.dbId) return
    // Respect the user's push preference — don't re-register if they turned
    // notifications off in Settings.
    AsyncStorage.getItem('parea_push_enabled').then(v => {
      console.log('push: effect fired, dbId=', userData.dbId, 'pref=', v)
      if (v === '0') { console.log('push: skip — disabled in settings'); return }
      registerPushToken(userData.dbId).catch((e) => console.warn('push: register threw', e?.message))
    })
  }, [userData?.dbId])

  // Deep-link on push tap: open the chat the notification points to. Handles
  // both a tap while running and a cold start launched from a notification.
  // Web has no push — skip entirely (the listeners throw there).
  useEffect(() => {
    if (Platform.OS === 'web') return
    const openFromData = (data: any) => {
      if (!data) return
      // 'chat' — open the specific chat (deep link from new-message push).
      if (data.screen === 'chat' && data.chatId != null) {
        const chat = chatListRef.current.find((c: any) => c.id === data.chatId)
        if (chat) {
          setOpenChat(chat)
          setChatList(prev => prev.map((c: any) => c.id === chat.id ? { ...c, isNew: false } : c))
        }
        setMessagesInitialSubTab('messages')
        setActiveTab('messages')
        return
      }
      // 'plans' — Plans/Going tab. Host's join-request notifications and
      // joiner's host-approved / chat-created notifications all land here.
      if (data.screen === 'plans') {
        setMessagesInitialSubTab('going')
        setActiveTab('messages')
        return
      }
      // 'vibecheck' — crew matching for the event in the payload (crew_match,
      // crew_invite). If the event is open, scrolling to it is the host's job;
      // we just land on the tab.
      if (data.screen === 'vibecheck') {
        setActiveTab('vibecheck')
        return
      }
    }
    // Cold start: app launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then(resp => {
      if (resp) openFromData(resp.notification.request.content.data)
    })
    // Running: tap while app is open/backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener(resp => {
      openFromData(resp.notification.request.content.data)
    })
    // Foreground receive: funnel the push into the in-app bell so the two
    // stay consistent (same title/body/emoji). addNotif dedups by key, so a
    // later poll detecting the same event won't double it.
    const recvSub = Notifications.addNotificationReceivedListener(notif => {
      const c = notif.request.content
      const d: any = c.data || {}
      // Skip if the user is already viewing this chat — the realtime message
      // path already rendered it; no need for a bell entry too.
      if (d.type === 'new_message' && openChatRef.current?.id === d.chatId) return
      addNotif({
        type: d.type || 'push',
        emoji: d.emoji || '🔔',
        color: d.color || '#6366F1',
        title: c.title || '',
        body: c.body || '',
        chatId: d.chatId,
        eventId: d.eventId,
      })
    })
    return () => { sub.remove(); recvSub.remove() }
  }, [])

  // Backfill joinedEvents from event_attendees on login + scrub
  // cancelledEventIds for events the user is still attending. Old handleBlock
  // versions polluted both stores on block, and we kept that state in
  // AsyncStorage even after simplifying the flow — so a "cancelled" event id
  // could lock the user out of accepting future invites for the same event.
  useEffect(() => {
    if (!userData?.dbId || !persistLoadedState) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('event_attendees')
        .select('event_ref_id, status')
        .eq('profile_id', userData.dbId)
      if (cancelled || !data) return
      const attendedIds = new Set<number>((data as any[]).map(r => r.event_ref_id))
      // Fetch chat memberships too — if user is in a chat for the event, they
      // should be 'confirmed' regardless of what event_attendees.status says.
      // This catches the case where a partner accepted (chat created, both in
      // chat_members) but the event_attendees row never got upgraded to
      // 'confirmed' (e.g. the realtime listener that triggers that UPDATE
      // missed firing on one side).
      // Two sources to cover both crew/community (chats.event_id) and duo
      // official (crew_invites.event_ref_id — chats.event_id is NULL there).
      const [{ data: myChats }, { data: invitesAsInviter }, { data: invitesAsInvitee }] = await Promise.all([
        supabase.from('chat_members')
          .select('chats:chat_id(event_id)')
          .eq('profile_id', userData.dbId),
        supabase.from('crew_invites')
          .select('event_ref_id')
          .eq('inviter_id', userData.dbId)
          .eq('status', 'accepted')
          .not('chat_id', 'is', null),
        supabase.from('crew_invites')
          .select('event_ref_id')
          .eq('invitee_id', userData.dbId)
          .eq('status', 'accepted')
          .not('chat_id', 'is', null),
      ])
      const confirmedViaChatEventIds = new Set<number>([
        ...(myChats || []).map((r: any) => (r.chats as any)?.event_id).filter((id: any) => id != null),
        ...(invitesAsInviter || []).map((r: any) => r.event_ref_id),
        ...(invitesAsInvitee || []).map((r: any) => r.event_ref_id),
      ])
      setJoinedEvents(prev => {
        const next = { ...prev }
        let changed = false
        for (const row of data as any[]) {
          // Don't resurrect an event the user just left/deleted — its
          // event_attendees DELETE may not have propagated yet, but the
          // cancelled (left) / deleted (host-cancelled) flag means "keep it
          // gone". Host events live under deletedCommunityEventIds.
          if (cancelledEventIdsRef.current.has(row.event_ref_id)) continue
          if (deletedCommunityEventIds.current.has(row.event_ref_id)) continue
          const dbStatus: 'joined' | 'confirmed' =
            row.status === 'confirmed' || confirmedViaChatEventIds.has(row.event_ref_id)
              ? 'confirmed'
              : 'joined'
          // Always sync to DB — earlier this skipped if any local value was set,
          // which left users on "Looking for crew" after a partner accepted
          // while their local state was still 'joined'.
          if (next[row.event_ref_id] !== dbStatus) {
            next[row.event_ref_id] = dbStatus
            changed = true
          }
        }
        return changed ? next : prev
      })
      if (!cancelled) setPlansHydrated(true)
    })()
    return () => { cancelled = true }
  }, [userData?.dbId, persistLoadedState])

  // Backfill chatList from DB on login — without this, a user who was added
  // to a chat while their realtime channel was down (or who reinstalled the
  // app) never sees that chat locally even though the DB has them in
  // chat_members. The realtime listener at ~line 2870 only fires for new
  // INSERTs, so anything pre-mount is invisible.
  useEffect(() => {
    if (!userData?.dbId || !persistLoadedState) return
    let cancelled = false
    ;(async () => {
      const { data: memberships } = await supabase
        .from('chat_members')
        .select('chat_id, chats:chat_id(id, type, event_id, last_msg, created_at, format)')
        .eq('profile_id', userData.dbId)
      if (cancelled || !memberships) return
      const dbChatIds = (memberships as any[])
        .map(m => (m.chats as any)?.id)
        .filter((id: any) => typeof id === 'number')
      if (dbChatIds.length === 0) return
      // Reconcile: drop local chats that are gone from the DB (left/deleted/
      // expired elsewhere, e.g. a duplicate chat we cleaned up). The persisted
      // AsyncStorage list only ever grew, so a server-side delete kept
      // reappearing on every reload. Only prune confirmed DB-backed chats
      // (duo/group) the user is no longer a member of — never an optimistic
      // chat (isNew) or one created in the last minute, whose membership row
      // may not have landed yet. Guarded by dbChatIds.length > 0 above so a
      // transient empty fetch can't wipe the whole list.
      {
        const dbIdSet = new Set<number>(dbChatIds as number[])
        setChatList(prev => {
          const next = prev.filter((c: any) => {
            if (c.type !== 'duo' && c.type !== 'group') return true
            if (typeof c.id !== 'number') return true
            // Local-only chats use a negative stable id (e.g. -1_000_000 - evId)
            // for hosted-event group chats that live only in this client's state.
            // They never appear in DB chat_members, so the reconcile would drop
            // them every reload — and the poll would re-create them and re-fire
            // "X joined the group" every time.
            if (c.id < 0) return true
            if (dbIdSet.has(c.id)) return true
            if (c.isNew) return true
            const createdMs = Date.parse(c.time)
            if (!isNaN(createdMs) && Date.now() - createdMs < 60_000) return true
            return false
          })
          return next.length === prev.length ? prev : next
        })
      }
      // Skip chats already in local list (realtime / AsyncStorage already
      // captured them) and chats whose event was explicitly cancelled. Dedup
      // by event_id too — older local chats may carry a "stable local id"
      // (-1_000_000 - eventId) while DB has the real numeric chat id, so
      // matching only on chat.id would surface both copies.
      const localIds = new Set(chatListRef.current.map((c: any) => c.id))
      const localEventIds = new Set(
        chatListRef.current
          .map((c: any) => c.communityEventId ?? c.hostEventId ?? c.eventRefId)
          .filter((v: any) => v != null)
      )
      const dbChatsById: Record<number, any> = {}
      ;(memberships as any[]).forEach(m => { const c = m.chats as any; if (c) dbChatsById[c.id] = c })
      const missingIds = dbChatIds.filter((id: number) => {
        if (localIds.has(id)) return false
        const evId = dbChatsById[id]?.event_id
        if (evId && localEventIds.has(evId)) return false
        return true
      })
      if (missingIds.length === 0) return
      // Pull members for the missing chats so card avatars/counts render.
      const { data: allMembers } = await supabase
        .from('chat_members')
        .select('chat_id, profile_id, profiles:profile_id(id, name, photos, color, age)')
        .in('chat_id', missingIds)
      const membersByChat: Record<number, any[]> = {}
      ;(allMembers || []).forEach((m: any) => {
        if (!membersByChat[m.chat_id]) membersByChat[m.chat_id] = []
        membersByChat[m.chat_id].push(m.profiles || { id: m.profile_id })
      })
      // For duo chats event_id is NULL — resolve event_ref_id via crew_invites.
      const { data: duoInvites } = await supabase
        .from('crew_invites')
        .select('chat_id, event_ref_id, event_title')
        .in('chat_id', missingIds)
      const inviteByChat: Record<number, any> = {}
      ;(duoInvites || []).forEach((i: any) => { inviteByChat[i.chat_id] = i })
      // For group chats event_id points to community_events — pull titles so
      // the chat card has a name (otherwise it renders as "Crew" with no event).
      const groupEventIds = (memberships as any[])
        .map(m => m.chats as any)
        .filter((c: any) => c && missingIds.includes(c.id) && c.type === 'group' && c.event_id && c.event_id < 100000)
        .map((c: any) => c.event_id)
      const communityTitleById: Record<number, string> = {}
      const communityTimeById: Record<number, string> = {}
      if (groupEventIds.length > 0) {
        const { data: communityRows } = await supabase
          .from('community_events')
          .select('id, title, time')
          .in('id', groupEventIds)
        ;(communityRows || []).forEach((r: any) => {
          communityTitleById[r.id] = r.title
          communityTimeById[r.id] = r.time
        })
      }
      // Duo/official chats anchor expiry to the official event's date. The app's
      // event_ref_id is offset by +100000 over official_events.id, so resolve it
      // back and pull date_label (DD/MM/YYYY). Without this duo official-event
      // chats never get an event date → never expire (the recurring "old chat
      // won't disappear" bug). End-of-day + 24h grace keeps same-day events live.
      const officialEndById: Record<number, number> = {} // keyed by app event_ref_id
      const officialRefIds = (duoInvites || [])
        .map((i: any) => i.event_ref_id)
        .filter((r: any) => typeof r === 'number' && r >= 100000)
      if (officialRefIds.length > 0) {
        const { data: offRows } = await supabase
          .from('official_events')
          .select('id, date_label')
          .in('id', officialRefIds.map((r: number) => r - 100000))
        ;(offRows || []).forEach((r: any) => {
          const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((r.date_label || '').trim())
          if (m) {
            const end = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59, 0, 0).getTime()
            officialEndById[r.id + 100000] = end
          }
        })
      }
      // Don't resurrect chats whose event ended >24h ago — otherwise the
      // auto-cleanup deletes them locally but this backfill re-adds them from
      // DB on the next login, so they appear permanent. Parse the community
      // event time and drop+delete anything past its 24h grace window.
      const EXPIRE_AFTER = 24 * 60 * 60 * 1000
      const nowMs = Date.now()
      // Resolve a chat's event end-time (ms): community group chats from
      // community_events.time, duo/official chats from official_events.date_label.
      const chatEventEndMs = (c: any): number | null => {
        const timeStr = c.event_id ? communityTimeById[c.event_id] : null
        if (timeStr) {
          const parsed = parseEventDateTime(timeStr)
          if (parsed) return parsed.getTime()
        }
        const refId = inviteByChat[c.id]?.event_ref_id
        if (refId != null && officialEndById[refId] != null) return officialEndById[refId]
        return null
      }
      const isChatExpired = (c: any): boolean => {
        const endMs = chatEventEndMs(c)
        if (endMs == null) return false
        return endMs + EXPIRE_AFTER < nowMs
      }
      const expiredToDelete: number[] = []
      const newChats = (memberships as any[])
        .map(m => m.chats as any)
        .filter((c: any) => c && missingIds.includes(c.id))
        .filter((c: any) => {
          // Skip if user cancelled this event explicitly
          const evId = c.event_id ?? inviteByChat[c.id]?.event_ref_id
          if (evId && cancelledEventIdsRef.current.has(evId)) return false
          // Skip + delete if the event is long over
          if (isChatExpired(c)) { expiredToDelete.push(c.id); return false }
          return true
        })
        .map((c: any) => {
          const others = (membersByChat[c.id] || []).filter((m: any) => m.id !== userData.dbId)
          const invite = inviteByChat[c.id]
          return {
            id: c.id,
            type: c.type,
            eventRefId: invite?.event_ref_id ?? null,
            communityEventId: c.type === 'group' && c.event_id && c.event_id < 100000 ? c.event_id : undefined,
            hostEventId: c.type === 'group' && c.event_id ? c.event_id : undefined,
            event: invite?.event_title || (c.event_id ? communityTitleById[c.event_id] : '') || '',
            eventEmoji: '🎉',
            name: c.type === 'duo' && others[0]?.name ? others[0].name : ((c.event_id && communityTitleById[c.event_id]) || (c.type === 'group' ? 'Crew' : 'Your crew')),
            partnerProfile: c.type === 'duo' ? others[0] : undefined,
            memberProfiles: others,
            members: (membersByChat[c.id] || []).length,
            avatars: others.map((m: any) => m.photos?.[0]).filter(Boolean),
            colors: others.map((m: any) => m.color).filter(Boolean),
            photo: others[0]?.photos?.[0] || '',
            age: others[0]?.age || '',
            color: others[0]?.color || '#818CF8',
            lastMsg: c.last_msg || '🎉 Crew confirmed!',
            time: c.created_at || new Date().toISOString(),
            isNew: false,
            // Derive expiry from the event time so the chat ages out on its
            // own schedule. Falls back to 24h-from-now only when there's no
            // parseable event time (e.g. duo with TBD) — never refreshes an
            // event-anchored expiry on reload.
            chatExpiresAt: (() => {
              const endMs = chatEventEndMs(c)
              return endMs != null ? endMs + EXPIRE_AFTER : Date.now() + EXPIRE_AFTER
            })(),
          }
        })
      // Delete events that are long over from DB so they stop coming back.
      if (expiredToDelete.length > 0) {
        ;(async () => {
          for (const chatId of expiredToDelete) {
            await supabase.from('chats').delete().eq('id', chatId)
          }
        })()
      }
      if (newChats.length === 0) return
      setChatList(prev => {
        const seen = new Set(prev.map((c: any) => c.id))
        const fresh = newChats.filter((c: any) => !seen.has(c.id))
        return fresh.length === 0 ? prev : [...fresh, ...prev]
      })
      // Also map duo chats into officialEventChatMap so VibeCheck shows
      // "Open Chat" rather than re-prompting an invite.
      newChats.forEach((c: any) => {
        if (c.eventRefId && c.type === 'duo') {
          setOfficialEventChatMap(prev => prev[c.eventRefId] ? prev : { ...prev, [c.eventRefId]: c.id })
        }
      })
    })()
    return () => { cancelled = true }
  }, [userData?.dbId, persistLoadedState])

  // Backfill userEventFormat from event_attendees on login. AsyncStorage on a
  // fresh device install has no userEventFormat, which made VibeCheck fall back
  // to '1+1' (Duo) for official events the user already joined — showing
  // "1/2 in crew" instead of the real squad/party size.
  useEffect(() => {
    if (!userData?.dbId) return
    const officialIds = Object.keys(joinedEvents)
      .map(Number)
      .filter(id => joinedEvents[id] && id > 100000)
    if (officialIds.length === 0) return
    ;(async () => {
      const { data } = await supabase.from('event_attendees')
        .select('event_ref_id, group_size_min, group_size_max')
        .eq('profile_id', userData.dbId)
        .in('event_ref_id', officialIds)
      const have = new Set((data || []).map((r: any) => r.event_ref_id))
      // Backfill missing rows — user joined via crew flow without going through
      // handleJoinEvent (which is the only place that inserts event_attendees).
      // Without a row, AI scoring queries can't find them as a candidate, and
      // other users' VibeCheck shows no % match.
      const missing = officialIds.filter(id => !have.has(id))
      if (missing.length > 0) {
        const allKnown = [...feedOfficialDbEventsRef.current, ...MOCK_EVENTS as any]
        const sizeMap: Record<string, [number, number]> = { '1+1': [2, 2], squad: [3, 5], party: [6, 20] }
        const inserts = missing.map(id => {
          const ev: any = allKnown.find((e: any) => e.id === id)
          // Honor the user's actual format pick if we have it — otherwise fall back to squad.
          // Hardcoding [3,5] was overwriting party (20) picks when a race put joinedEvents
          // ahead of confirmJoin's upsert.
          const fmt = userEventFormat[id]
          const [gMin, gMax] = (fmt && sizeMap[fmt]) || [3, 5]
          return {
            event_ref_id: id,
            event_title: ev?.title || 'Event',
            profile_id: userData.dbId,
            status: 'confirmed',
            group_size_min: gMin,
            group_size_max: gMax,
          }
        })
        supabase.from('event_attendees')
          .upsert(inserts, { onConflict: 'event_ref_id,profile_id' })
          .then(({ error }) => { if (error) console.warn('event_attendees backfill error:', error.message) })
      }
      if (data && data.length > 0) {
        setUserEventFormat(prev => {
          const next = { ...prev }
          let changed = false
          for (const row of data) {
            // Don't overwrite explicit local choice (that's the user's intent —
            // DB row may be stale from an earlier crew join with hardcoded sizes).
            if (next[row.event_ref_id]) continue
            const hi = row.group_size_max
            const format = hi === 2 ? '1+1' : hi >= 6 ? 'party' : 'squad'
            next[row.event_ref_id] = format
            changed = true
          }
          return changed ? next : prev
        })
      }
    })()
  }, [Object.keys(joinedEvents).join(','), userData?.dbId])

  // ─── Fetch existing crew chats per joined official event ───────────────────
  // Runs whenever joinedEvents changes. For each official event the user is in,
  // pulls all `chats` + `chat_members` rows so we can show "existing crews" UI.
  // Avg vibe match for a crew is computed against the current user via cached
  // AI scores in eventAttendeesMap (no extra AI calls).
  useEffect(() => {
    if (!userData?.dbId) return
    const officialJoined = Object.keys(joinedEvents)
      .map(Number)
      .filter(id => joinedEvents[id] && id > 100000)
    if (officialJoined.length === 0) { setCrewsByEvent({}); return }
    let cancelled = false
    const fetchCrews = async () => {
      const result: Record<number, Array<{ chatId: number; members: any[]; avgMatch: number; format?: string; maxSize?: number }>> = {}
      await Promise.all(officialJoined.map(async (evId) => {
        // Two-step fetch: chats first, then full member profiles separately. The
        // nested-select form was returning null `profiles` join in some cases
        // (the "EXISTING CREWS (1) · 0/5 · no match yet" bug) which made crews
        // look empty to other users. Doing it as two queries is rock-solid.
        // Discovery must surface crews the viewer isn't a member of yet — but RLS
        // on chats/chat_members hides those from non-members (confirmed: a 3rd
        // user saw two people who'd already crewed up as separate individuals
        // instead of one crew). A SECURITY DEFINER RPC returns the event's group
        // crews + member profiles for everyone. Degrades safely: if the RPC isn't
        // present yet, crewsRaw is null → no crews shown (same as before).
        const { data: crewsRaw } = await supabase.rpc('get_event_crews', { p_event_id: evId })
        const crewRows: any[] = Array.isArray(crewsRaw) ? crewsRaw : []
        if (crewRows.length === 0) { result[evId] = []; return }
        const attendees = eventAttendeesMapRef.current[evId] || []
        const scoreById: Record<string, number> = {}
        attendees.forEach((a: any) => { if (a?.id && a.score != null) scoreById[a.id] = a.score })
        const sizeMap: Record<string, number> = { '1+1': 2, squad: 5, party: 20 }
        result[evId] = crewRows.map((c: any) => {
          const members = (c.members || []).map((p: any) => ({
            id: p.id,
            name: p.name || 'Member',
            photo: p.photos?.[0] || null, photos: p.photos || [],
            color: p.color || '#818CF8',
            age: p.age || '',
            bio: p.bio || '', langs: p.langs || [], interests: p.interests || [],
            drinksPref: p.drinks_pref, smokingPref: p.smoking_pref, hasPets: !!p.has_pets,
          }))
          const otherIds = members.map((m: any) => m.id).filter((id: string) => id !== userData.dbId)
          const scores = otherIds.map((id: string) => scoreById[id]).filter((s: any) => typeof s === 'number')
          const avgMatch = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
          const format = c.format
          const maxSize = format ? sizeMap[format] : undefined
          return { chatId: c.chat_id, members, avgMatch, format, maxSize }
        })
      }))
      if (!cancelled) setCrewsByEvent(result)
    }
    fetchCrews()
    const interval = setInterval(fetchCrews, 5000) // 5s feels live without spamming
    // Realtime: refetch when chat_members changes (someone joined/left a crew)
    const cmChannel = supabase.channel('crews_chat_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => {
        if (!cancelled) fetchCrews()
      })
      .subscribe()
    return () => { cancelled = true; clearInterval(interval); supabase.removeChannel(cmChannel) }
  }, [Object.keys(joinedEvents).join(','), userData?.dbId])

  // Crew-stats aggregation per event for the feed: how many crews are forming,
  // total members across them, total spots still open. Uses a definer RPC
  // (chats/chat_members would be RLS-hidden from non-members). Refetches on
  // chats or chat_members changes + a 30s poll safety net. Degrades safely
  // when the RPC isn't deployed yet — empty map → no badges (no crash).
  useEffect(() => {
    let cancelled = false
    const fetchStats = async () => {
      // Visible event ids: official from DB + community + user-created.
      const officialIds = feedOfficialDbEvents.map((e: any) => e.id).filter((n: any) => typeof n === 'number')
      const communityIds = dbCommunityEvents.map((e: any) => e.id).filter((n: any) => typeof n === 'number')
      const ids = Array.from(new Set([...officialIds, ...communityIds]))
      if (ids.length === 0) return
      const { data } = await supabase.rpc('get_events_crew_stats', { p_event_ids: ids })
      if (cancelled || !data) return
      const out: Record<number, { crews: number; members: number; spotsLeft: number }> = {}
      Object.entries(data as any).forEach(([k, v]: any) => {
        out[Number(k)] = {
          crews: Number(v?.crews) || 0,
          members: Number(v?.members) || 0,
          spotsLeft: Number(v?.spots_left) || 0,
        }
      })
      setCrewStatsByEvent(out)
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    const channel = supabase.channel('crew_stats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => { if (!cancelled) fetchStats() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => { if (!cancelled) fetchStats() })
      .subscribe()
    return () => { cancelled = true; clearInterval(interval); supabase.removeChannel(channel) }
  }, [feedOfficialDbEvents.length, dbCommunityEvents.length])

  // Poll for other 'ready' users when we're in waiting state (readyCountMap[id] === 0 = only self is ready)
  useEffect(() => {
    // Poll while waiting for crew OR while crew found but self not yet confirmed
    const waitingIds = Object.keys(readyCountMap).map(Number).filter(id =>
      !officialEventChatMap[id] && (
        (readyCountMap[id] === 0 && !crewPreviewMap[id]) ||
        !!crewPreviewMap[id]
      )
    )
    if (waitingIds.length === 0 || !userData?.dbId) return
    const check = async () => {
      for (const evId of waitingIds) {
        const format = userEventFormat[evId] || 'squad'
        const [userMin, userMax] = FORMAT_SIZES[format] || [3, 5]
        const { data: mine } = await supabase.from('event_attendees').select('crew_pref').eq('event_ref_id', evId).eq('profile_id', userData.dbId).maybeSingle()
        const myPref = mine?.crew_pref || 'any'
        const myGender = (userData as any)?.gender
        // Format/size is a hint shown on the card, NOT a hard filter — otherwise a
        // duo-seeker and a squad-seeker never see each other and both dead-end on
        // "Start your own crew". Match the eventAttendeesMap path which already
        // dropped this size overlap check. Everyone on the event is discoverable.
        const { data: rawReady } = await supabase
          .from('event_attendees').select('*, profiles(*)')
          .eq('event_ref_id', evId).in('status', ['ready', 'confirmed'])
          .neq('profile_id', userData.dbId)
        const readyData = (rawReady || []).filter((r: any) => fitsCrewPref(myPref, myGender, r.crew_pref || 'any', r.profiles?.gender))
        const othersCount = readyData?.length || 0
        const confirmedCount = (readyData || []).filter((r: any) => r.status === 'confirmed').length
        setReadyCountMap(prev => ({ ...prev, [evId]: othersCount }))
        if (othersCount >= 1) {
          const otherIds = (readyData || []).map((r: any) => r.profile_id)
          let existingChatId: number | null = null
          const { data: eventChat } = await supabase.from('chats').select('id').eq('event_id', evId).eq('type', 'group').maybeSingle()
          if (eventChat) existingChatId = eventChat.id
          const memberProfiles = (readyData || []).filter((r: any) => r.profile_id !== userData.dbId).map((r: any) => {
            const p = r.profiles || {}
            return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍', status: r.status, transport: r.transport,
              // Lifestyle fields needed by scoreRequesterForHost in CrewPoolSheet
              drinksPref: p.drinks_pref || '', smokingPref: p.smoking_pref || '', hasPets: !!p.has_pets,
            }
          })
          setCrewPreviewMap(prev => ({ ...prev, [evId]: { members: memberProfiles, chatId: existingChatId, confirmedCount } }))
        }
      }
    }
    check()
    const interval = setInterval(check, 3000)
    // Realtime: instantly update when someone confirms
    const rtConfirm = supabase.channel('crew_confirm_rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_attendees' }, (payload: any) => {
        if (payload.new?.status === 'confirmed' && waitingIds.includes(payload.new?.event_ref_id)) {
          check()
        }
      })
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(rtConfirm) }
  }, [JSON.stringify(readyCountMap), JSON.stringify(crewPreviewMap), userData?.dbId, JSON.stringify(userEventFormat), JSON.stringify(officialEventChatMap)])

  const [userCreatedEvents, setUserCreatedEvents] = useState<any[]>([])
  const [pendingJoinRequests, setPendingJoinRequests] = useState<Record<number, any[]>>({})
  const [approvedJoiners, setApprovedJoiners] = useState<Record<number, any[]>>({})
  const [hostConfirmedMembers, setHostConfirmedMembers] = useState<Record<number, any[]>>({})
  const evSpotsLeft = eventDetail?.maxParticipants
    ? eventDetail.maxParticipants - (
        (eventDetail.isHosted || eventDetail.host_id === userData?.dbId)
          ? (hostConfirmedMembers[eventDetail.id] || []).length + 1
          : eventDetail.participantsCount
      )
    : null
  const evIsFull = evSpotsLeft !== null && evSpotsLeft <= 0
  const [approvedAtMap, setApprovedAtMap] = useState<Record<number, number>>({}) // eventId → timestamp when host approved
  const [communityEventMembers, setCommunityEventMembers] = useState<Record<number, any[]>>({})
  const [passedRequests, setPassedRequests] = useState<Record<number, string[]>>({})

  // ── Notifications state (declared early so persist useEffect below can use it) ──
  // Core state + actions live in useNotifs hook; BELL_TYPES/CHAT_TYPES/PLANS_TYPES
  // and Notif type re-exported from there. Only refs unrelated to notif state
  // itself (prevPendingRef, prevChatCountRef) stay inline.
  const {
    notifications, setNotifications,
    notifOpen, setNotifOpen,
    bellShake, notifPanelY,
    seenNotifKeysRef,
    unreadCount,
    addNotif,
    dismissNotif,
  } = useNotifs({ persistLoadedRef: persistLoaded })
  const prevPendingRef = useRef<Record<number, any[]>>({})
  const prevChatCountRef = useRef(0)

  // ── Persist & restore state ───────────────────────────────────────────────
  const PERSIST_KEY = `parea_feed_${userData?.authId || 'local'}`

  useEffect(() => {
    if (!userData?.authId) return
    AsyncStorage.getItem(PERSIST_KEY).then(raw => {
      if (!raw) { persistLoaded.current = true; setPersistLoadedState(true); return }
      try {
        const saved = JSON.parse(raw)
        if (saved.joinedEvents) setJoinedEvents(saved.joinedEvents)
        if (saved.userEventFormat) setUserEventFormat(saved.userEventFormat)
        if (saved.userEventTransport) setUserEventTransport(saved.userEventTransport)
        if (saved.userCreatedEvents) setUserCreatedEvents(saved.userCreatedEvents.map((ev: any) => ({
          ...ev,
          title: ev.title ? ev.title.charAt(0).toUpperCase() + ev.title.slice(1) : ev.title,
        })))
        if (saved.pendingJoinRequests) setPendingJoinRequests(saved.pendingJoinRequests)
        if (saved.approvedJoiners) {
          setApprovedJoiners(saved.approvedJoiners)
          // Pre-fill ref so already-full events don't re-trigger auto-nav to messages on app open
          if (saved.userCreatedEvents) {
            saved.userCreatedEvents.forEach((ev: any) => {
              const approved = saved.approvedJoiners[ev.id] || []
              const slotsTotal = (ev.maxParticipants || 5) - 1
              if (approved.length >= slotsTotal && slotsTotal > 0) {
                prevFullHostEventsRef.current.add(ev.id)
              }
            })
          }
        }
        if (saved.passedRequests) setPassedRequests(saved.passedRequests)
        // Build cleaned chatMessages first so we can use it to patch chatList previews
        const cleanedMessages: Record<string, any[]> = {}
        if (saved.chatMessages) {
          // Filter out system messages — they're session-only, shouldn't survive restart
          Object.entries(saved.chatMessages).forEach(([id, msgs]: [string, any]) => {
            const filtered = (msgs || []).filter((m: any) => m.from !== 'system')
            if (filtered.length > 0) cleanedMessages[id] = filtered
          })
          setChatMessages(cleanedMessages)
        }
        if (saved.chatList) {
          // Dedupe by id, then by (type, event-pointing key) to catch races where
          // realtime + manual confirm flows added the same chat with different ids.
          const seenIds = new Set<any>()
          const seenKeys = new Set<string>()
          const deduped = saved.chatList.filter((c: any) => {
            if (seenIds.has(c.id)) return false
            const eventKey = c.communityEventId ?? c.eventRefId ?? c.hostEventId ?? c.event
            if (eventKey != null) {
              const k = `${c.type}:${eventKey}`
              if (seenKeys.has(k)) return false
              seenKeys.add(k)
            }
            seenIds.add(c.id)
            return true
          })
          // Patch each chat's lastMsg/time from the most recent message in chatMessages.
          // Without this, preview can show stale "Waiting for crew to join..." after restart
          // when actual conversation has happened since.
          const patched = deduped.map((c: any) => {
            const msgs = cleanedMessages[c.id] || []
            const last = msgs[msgs.length - 1]
            // Clear stale isNew on launch — realtime will re-flag only chats
            // that actually have unread messages arriving after this reload.
            // If the last cached message is the user's own send, they've
            // obviously seen it.
            const cleared: any = { ...c, isNew: false }
            // Backfill chatExpiresAt for chats persisted before this field was
            // standardized. Without it the auto-cleanup pass can't expire the
            // chat once its backing event drops out of the feed (e.g. scraper
            // stops returning a past official event), and it lingers forever.
            if (!cleared.chatExpiresAt) {
              cleared.chatExpiresAt = Date.now() + 24 * 60 * 60 * 1000
            }
            if (!last) return cleared
            const previewText = last.from === 'me' ? `You: ${last.text}` : (last.senderName ? `${last.senderName}: ${last.text}` : last.text)
            return { ...cleared, lastMsg: previewText || cleared.lastMsg, time: last._ts || cleared.time }
          })
          setChatList(patched)
        }
        if (saved.cancelledEventIds) {
          setCancelledEventIds(saved.cancelledEventIds)
          cancelledEventIdsRef.current = new Set(saved.cancelledEventIds)
        }
        if (saved.sentCrewInvites) {
          setSentCrewInvites(saved.sentCrewInvites)
          // `acceptedInviteKeysRef` rebuilds from the next poll — its keys are
          // now `inv:<row_id>` which we don't have here. Re-processing accepted
          // invites is idempotent because chatList/officialEventChatMap setters
          // dedup by chat id.
        }
        if (saved.lastReadAtMap) {
          setLastReadAtMap(saved.lastReadAtMap)
          lastReadAtMapRef.current = saved.lastReadAtMap
        }
        if (saved.officialEventChatMap) {
          setOfficialEventChatMap(saved.officialEventChatMap)
          officialEventChatMapRef.current = saved.officialEventChatMap
        }
        if (Array.isArray(saved.notifications)) {
          setNotifications(saved.notifications)
          // Seed seen-keys set so dedupe also catches notifs we currently have
          // visible (in case user dismisses then polling re-fires within session)
          saved.notifications.forEach((n: any) => {
            seenNotifKeysRef.current.add(`${n.type}|${n.title}|${n.body || ''}|${n.chatId || 0}`)
          })
        }
        // Restore the cumulative seen-notif keys list — survives across reloads
        // even after user dismissed the notif, so polling can't re-fire it
        if (Array.isArray(saved.seenNotifKeys)) {
          saved.seenNotifKeys.forEach((k: string) => seenNotifKeysRef.current.add(k))
        }
      } catch {}
      persistLoaded.current = true
      setPersistLoadedState(true)
    })
  }, [userData?.authId])


  useEffect(() => {
    if (!persistLoaded.current) return
    AsyncStorage.setItem(PERSIST_KEY, JSON.stringify({
      joinedEvents, userEventFormat, userEventTransport, userCreatedEvents, pendingJoinRequests,
      approvedJoiners, passedRequests, chatList, chatMessages, sentCrewInvites, cancelledEventIds, officialEventChatMap,
      lastReadAtMap,
      // Persist notifications so dismissed/read state survives app reload and we
      // don't re-add the same "X joined" notif from each polling cycle.
      notifications,
      // Persist seen-keys atomically with everything else — separate AsyncStorage
      // entries created a race where polling fired before seen-keys loaded.
      seenNotifKeys: [...seenNotifKeysRef.current],
    }))
  }, [joinedEvents, userEventFormat, userEventTransport, userCreatedEvents, pendingJoinRequests, approvedJoiners, passedRequests, chatList, chatMessages, sentCrewInvites, cancelledEventIds, officialEventChatMap, lastReadAtMap, notifications])

  // ── Cleanup stale event_attendees rows once after persist loaded ─────────
  // Gated on plansHydrated: the joinedEvents backfill from DB (which sets
  // plansHydrated=true on completion) must run FIRST. Otherwise this raced the
  // backfill and ran with a half-empty joinedEvents, deleting valid attendance
  // rows (a duo-seeker who'd joined vanished entirely — "as if never joined").
  // After backfill, joinedOfficialIds covers every attended event except ones
  // explicitly left (cancelledEventIds, which the backfill skips), so staleIds
  // correctly resolves to just those left events.
  useEffect(() => {
    if (!userData?.dbId || !persistLoadedState || !plansHydrated) return
    // Use joinedEvents state directly (not ref) to avoid race with ref update order
    const joinedOfficialIds = new Set(
      Object.keys(joinedEvents).map(Number).filter(id => joinedEvents[id] && id > 100000)
    )
    supabase.from('event_attendees').select('event_ref_id').eq('profile_id', userData.dbId)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const staleIds = data.map((r: any) => r.event_ref_id).filter((id: number) => id > 100000 && !joinedOfficialIds.has(id))
        if (staleIds.length > 0) {
          supabase.from('event_attendees').delete().eq('profile_id', userData.dbId).in('event_ref_id', staleIds)
            .then(({ error }) => { if (error) console.warn('stale event_attendees cleanup error:', error.message) })
        }
      })
  }, [userData?.dbId, persistLoadedState, plansHydrated])

  // ── Tonight's Vibe ────────────────────────────────────────────────────────
  const [tonightVibe, setTonightVibe] = useState({
    energy: userData?.socialEnergy || 'balanced',
    drinks: userData?.drinksPref || 'Social drinker',
    smoking: userData?.smokingPref || 'Non-smoker',
  })
  // Keep tonightVibe in sync with userData (covers updates from ProfileTab vibe editor)
  useEffect(() => {
    setTonightVibe({
      energy: userData?.socialEnergy || 'balanced',
      drinks: userData?.drinksPref || 'Social drinker',
      smoking: userData?.smokingPref || 'Non-smoker',
    })
  }, [userData?.socialEnergy, userData?.drinksPref, userData?.smokingPref])

  // ── Notifications ─────────────────────────────────────────────────────────
  // State + actions extracted to useNotifs hook above. The pending/chat-count
  // poll refs below stay inline since they track *other* state to decide
  // when to emit notifs, not notification state itself.

  // Notify when new real attendees appear in eventAttendeesMap
  const prevAttendeesRef = useRef<Record<number, string[]>>({})
  useEffect(() => {
    Object.entries(eventAttendeesMap).forEach(([evIdStr, attendees]) => {
      const evId = Number(evIdStr)
      const prevIds = prevAttendeesRef.current[evId] || []
      const newPeople = attendees.filter(p => !prevIds.includes(p.id))
      if (prevIds.length > 0 && newPeople.length > 0) {
        // Only notify if we already had a previous fetch (not first load)
        newPeople.forEach(p => {
          addNotif({ type: 'crew_match', emoji: '🎯', color: '#6366F1', title: `${p.name} is also going!`, body: 'Tap Vibe to vet your crew' })
        })
      }
      prevAttendeesRef.current[evId] = attendees.map(p => p.id)
    })
  }, [eventAttendeesMap])

  // ── Incoming crew invites (invitee side) — realtime ───────────────────────
  const joinedEventsRef = useRef<Record<number, string>>({})
  useEffect(() => { joinedEventsRef.current = joinedEvents }, [joinedEvents])
  useEffect(() => {
    if (!userData?.dbId) return
    const fetchIncoming = async () => {
      const [{ data }, { data: iBlocked }, { data: blockedMe }] = await Promise.all([
        supabase.from('crew_invites')
          .select('*, inviter:profiles!crew_invites_inviter_id_fkey(*)')
          .eq('invitee_id', userData.dbId)
          .eq('status', 'pending'),
        // Hide invites from people involved in a block with me — two queries
        // (`.or()` with UUIDs unreliable). Forward + reverse.
        supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData.dbId),
        supabase.from('blocked_users').select('blocker_id').eq('blocked_id', userData.dbId),
      ])
      const blocked = new Set<string>([
        ...(iBlocked || []).map((b: any) => b.blocked_id),
        ...(blockedMe || []).map((b: any) => b.blocker_id),
      ])
      const filtered = (data || []).filter((inv: any) => !blocked.has(inv.inviter_id))
      if (filtered.length === 0) { setIncomingCrewInvites([]); return }
      // Enrich each invite with the inviter's chosen format + max size, so the
      // accept-consent card can say "You're joining their Squad of up to 5"
      // before Accept (so a duo-seeker isn't surprised by a 5-person crew).
      // Duo invites carry chat_id=null (1+1 mutual flow); group invites store
      // the inviter's crew chat id and inherit its format. We read from
      // event_attendees to avoid a chats.format select that RLS would hide.
      const inviterIds = Array.from(new Set(filtered.map((inv: any) => inv.inviter_id)))
      const eventIds = Array.from(new Set(filtered.map((inv: any) => inv.event_ref_id)))
      const { data: sizeRows } = await supabase
        .from('event_attendees')
        .select('profile_id, event_ref_id, group_size_max')
        .in('profile_id', inviterIds).in('event_ref_id', eventIds)
      const sizeByPair: Record<string, number> = {}
      ;(sizeRows || []).forEach((r: any) => {
        if (r.group_size_max != null) sizeByPair[`${r.profile_id}_${r.event_ref_id}`] = r.group_size_max
      })
      const enriched = filtered.map((inv: any) => {
        let format: string | null = null
        let maxSize: number | null = null
        if (!inv.chat_id) {
          format = '1+1'; maxSize = 2
        } else {
          const gm = sizeByPair[`${inv.inviter_id}_${inv.event_ref_id}`]
          if (gm != null) {
            maxSize = gm
            format = gm === 2 ? '1+1' : gm >= 6 ? 'party' : 'squad'
          }
        }
        return { ...inv, _format: format, _maxSize: maxSize }
      })
      setIncomingCrewInvites(enriched)
    }
    fetchIncoming()
    const interval = setInterval(fetchIncoming, 15000)
    const channel = supabase.channel('crew_invites_incoming')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_invites', filter: `invitee_id=eq.${userData.dbId}` }, () => {
        fetchIncoming()
      })
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [userData?.dbId])

  // ── Invitee side: detect when crew partner leaves (accepted invite disappears) ─
  useEffect(() => {
    if (!userData?.dbId) return
    const checkPartnerLeft = async () => {
      // Find official events where we are 'confirmed' (have a crew chat)
      const confirmedEventIds = Object.keys(joinedEventsRef.current)
        .map(Number)
        .filter(id => joinedEventsRef.current[id] === 'confirmed' && id > 100000)
      if (confirmedEventIds.length === 0) return
      // Check if accepted invite still exists (user could be inviter OR invitee)
      const [{ data: asInvitee }, { data: asInviter }] = await Promise.all([
        supabase.from('crew_invites').select('event_ref_id').eq('invitee_id', userData.dbId).eq('status', 'accepted').in('event_ref_id', confirmedEventIds),
        supabase.from('crew_invites').select('event_ref_id').eq('inviter_id', userData.dbId).eq('status', 'accepted').in('event_ref_id', confirmedEventIds),
      ])
      if (!asInvitee && !asInviter) return
      const activeEventIds = new Set([...(asInvitee || []), ...(asInviter || [])].map((r: any) => r.event_ref_id))
      // Events that are confirmed but have no accepted invite → partner left
      for (const evId of confirmedEventIds) {
        if (activeEventIds.has(evId)) continue
        // Multi-chat per event: only trust the user's KNOWN chat. Don't fall
        // back to "first chat for this event" — that could be another crew the
        // user isn't even in, and we'd wrongly mark them as "partner left".
        const chatId = officialEventChatMapRef.current[evId]
        if (chatId) {
          const { data: membership } = await supabase.from('chat_members').select('chat_id').eq('chat_id', chatId).eq('profile_id', userData.dbId).maybeSingle()
          if (membership) continue // still in our crew chat — not "partner left"
        } else {
          // No known chat for this user on this event → query their own membership directly.
          const { data: anyMembership } = await supabase.from('chat_members')
            .select('chat_id, chats:chat_id(event_id)')
            .eq('profile_id', userData.dbId)
            .limit(20)
          const stillInCrewForThisEvent = (anyMembership || []).some((m: any) => (m as any).chats?.event_id === evId)
          if (stillInCrewForThisEvent) continue
        }
        // Remove duo chat for this event
        const chatIdToRemove = officialEventChatMapRef.current[evId]
        // Distinguish a real "partner left" (chat still exists, I'm just no
        // longer a member because they're gone) from stale local state (chat
        // was already deleted — e.g. we cleaned up test data, or the whole
        // crew dissolved). Only the first deserves a toast; the second is
        // silent cleanup, otherwise the poll re-fires the notification every
        // 15s until the user manually resets local state.
        let chatStillExists = false
        if (chatIdToRemove) {
          const { data: chatRow } = await supabase.from('chats').select('id').eq('id', chatIdToRemove).maybeSingle()
          chatStillExists = !!chatRow
        }
        if (chatIdToRemove) setChatList(prev => prev.filter((c: any) => c.id !== chatIdToRemove))
        setOfficialEventChatMap(prev => { const n = { ...prev }; delete n[evId]; return n })
        // Reset event status back to 'going'
        setJoinedEvents(prev => ({ ...prev, [evId]: 'joined' }))
        // Reset event_attendees status back to 'looking' in DB
        supabase.from('event_attendees').update({ status: 'looking' })
          .eq('event_ref_id', evId).eq('profile_id', userData.dbId)
        if (chatStillExists) {
          showToast('We\'ll find you a new match', 'Partner left 👋', '🔍')
        }
      }
    }
    checkPartnerLeft()
    const interval = setInterval(checkPartnerLeft, 15000)

    // Broadcast: listen for instant "partner_left" from crew partner
    const broadcastChannel = supabase.channel(`crew-partner-${userData.dbId}`)
      .on('broadcast', { event: 'partner_left' }, async ({ payload }: any) => {
        const evId = payload?.eventId
        if (!evId) return
        // Same logic as checkPartnerLeft but instant
        const chatIdToRemove = officialEventChatMapRef.current[evId]
        // Multi-crew safety: if we're still in chat_members, the chat survives
        // (someone left but our crew is intact). Don't tear down the chat.
        if (chatIdToRemove) {
          const { data: membership } = await supabase.from('chat_members')
            .select('chat_id').eq('chat_id', chatIdToRemove).eq('profile_id', userData.dbId).maybeSingle()
          if (membership) return
        }
        const partnerChat = chatListRef.current.find((c: any) => c.id === chatIdToRemove)
        const eventTitle = partnerChat?.title || payload?.eventTitle || 'your event'
        if (chatIdToRemove) setChatList(prev => prev.filter((c: any) => c.id !== chatIdToRemove))
        setOfficialEventChatMap(prev => { const n = { ...prev }; delete n[evId]; return n })
        setJoinedEvents(prev => ({ ...prev, [evId]: 'joined' }))
        supabase.from('event_attendees').update({ status: 'looking' })
          .eq('event_ref_id', evId).eq('profile_id', userData.dbId)
        addNotif({ type: 'partner_left', emoji: '👋', color: '#EF4444', title: 'Your partner left', body: `They cancelled their plans for "${eventTitle}" — searching for a new match 🔍` })
        showToast('We\'ll find you a new match', 'Partner left 👋', '🔍')
      })
      .subscribe()

    return () => { clearInterval(interval); supabase.removeChannel(broadcastChannel) }
  }, [userData?.dbId])

  // ── Realtime: detect when added to a crew group chat ─────────────────────
  useEffect(() => {
    if (!userData?.dbId) return
    const channel = supabase.channel('my_crew_chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members', filter: `profile_id=eq.${userData.dbId}` }, async (payload: any) => {
        const chatId = payload.new.chat_id
        if (chatListRef.current.some((c: any) => c.id === chatId)) return
        // Fetch chat type and members to check if user left this event
        const [{ data: chatData }, { data: members }, { data: inviteData }] = await Promise.all([
          supabase.from('chats').select('type, event_id').eq('id', chatId).single(),
          supabase.from('chat_members').select('profile_id, profiles:profile_id(id, name, photos, color, age)').eq('chat_id', chatId),
          // Pull event_ref_id too — duo chats lack chats.event_id, so the invite
          // row is the only way to know which event this chat belongs to.
          supabase.from('crew_invites').select('event_title, event_ref_id').eq('chat_id', chatId).limit(1).single(),
        ])
        // Treat invite's event_ref_id as the effective event id when chats.event_id is null.
        const effectiveEventId: number | null = chatData?.event_id ?? (inviteData as any)?.event_ref_id ?? null
        if (!members || members.length < 2) return
        const otherMembers = members.filter((m: any) => m.profile_id !== userData.dbId).map((m: any) => {
          const p = (m as any).profiles || {}
          return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, color: p.color || '#818CF8', age: p.age }
        })
        // Community events have raw IDs (<100000); official events shift +100000
        const isCommunityChat = !!chatData?.event_id && chatData.event_id < 100000
        // Trust DB type, no member-count heuristic. Multi-crew group chats may
        // start at 2 members and grow — counting members would freeze them as duo.
        const isDuo = chatData?.type === 'duo'
        const partner = otherMembers[0]
        const eventTitle = inviteData?.event_title || dbCommunityEventsRef.current?.find((e: any) => e.id === chatData?.event_id)?.title || feedOfficialDbEventsRef.current?.find((e: any) => e.id === chatData?.event_id)?.title || 'Crew Chat'
        const foundEv = dbCommunityEventsRef.current?.find((e: any) => e.id === chatData?.event_id) || feedOfficialDbEventsRef.current?.find((e: any) => e.id === chatData?.event_id)
        // Skip re-creating chat if event ended 24h+ ago. Realtime can replay
        // chat_members INSERTs on reconnect and resurrect chats for past events.
        if (foundEv?.expiresAt > 0 && foundEv.expiresAt + 24 * 60 * 60 * 1000 < Date.now()) {
          console.log('[skip-resurrect-chat] event expired', chatData?.event_id, eventTitle)
          return
        }
        const evChatExpiry = (foundEv?.expiresAt > 0 ? foundEv.expiresAt : Date.now()) + 24 * 60 * 60 * 1000
        const newChat: any = isDuo ? {
          id: chatId, type: 'duo', eventRefId: effectiveEventId,
          name: partner?.name || 'Your crew',
          age: partner?.age || '',
          color: partner?.color || '#818CF8',
          photo: partner?.photo || '',
          lastMsg: '🎉 Crew confirmed! Say hi',
          time: new Date().toISOString(), isNew: true, chatExpiresAt: evChatExpiry,
          event: eventTitle, eventEmoji: '🎉',
          partnerProfile: partner,
          eventImage: (foundEv as any)?.image_url || null,
        } : {
          id: chatId, type: 'group', eventRefId: effectiveEventId,
          eventImage: (foundEv as any)?.image_url || null,
          event: eventTitle, eventEmoji: '🎉',
          members: members.length,
          avatars: otherMembers.map((p: any) => p.photo).filter(Boolean),
          colors: otherMembers.map((p: any) => p.color),
          memberProfiles: otherMembers,
          lastMsg: '🎉 You\'re in the crew! Say hi 👋',
          time: new Date().toISOString(), isNew: true, chatExpiresAt: evChatExpiry,
        }
        if (isCommunityChat && chatData?.event_id) newChat.communityEventId = chatData.event_id
        // Don't re-add if user explicitly left this event
        if (effectiveEventId && cancelledEventIdsRef.current.has(effectiveEventId)) return
        // Dedup: the polling path (line ~7517) may have already created a local chat
        // for this event with a stable local id (-1_000_000 - evId). Match by chat
        // id OR by event id and REPLACE in place — otherwise host sees two chats:
        // one with local stable id (lastMsg "Jopa joined the group"), one with
        // real DB id (lastMsg "You're in the crew!"). Same for joiner side.
        const evId = effectiveEventId
        setChatList(prev => {
          const existingIdx = prev.findIndex((c: any) =>
            c.id === chatId ||
            (evId != null && (c.hostEventId === evId || c.communityEventId === evId || c.eventRefId === evId))
          )
          if (existingIdx >= 0) {
            const existing = prev[existingIdx]
            const merged = { ...existing, ...newChat, id: chatId }
            // Preserve hostEventId if this user is host of the event
            if (existing.hostEventId) merged.hostEventId = existing.hostEventId
            // Preserve user's existing chat state — don't reset to placeholders
            if (existing.lastMsg) merged.lastMsg = existing.lastMsg
            if (existing.time) merged.time = existing.time
            if (existing.isNew === false) merged.isNew = false
            const updated = [...prev]
            updated[existingIdx] = merged
            return updated
          }
          return [newChat, ...prev]
        })
        // Migrate any messages that were attached to the stable local id to the real DB chat id
        if (evId != null) {
          const stableLocalId = -1_000_000 - evId
          if (stableLocalId !== chatId) {
            setChatMessages((prev: any) => {
              if (!prev[stableLocalId]) return prev
              const merged = [...(prev[stableLocalId] || []), ...(prev[chatId] || [])]
              const next = { ...prev, [chatId]: merged }
              delete next[stableLocalId]
              return next
            })
          }
        }
        if (isCommunityChat && chatData?.event_id) communityEventChatMap.current[chatData.event_id] = chatId
        if (effectiveEventId) {
          setOfficialEventChatMap(prev => ({ ...prev, [effectiveEventId]: chatId }))
          setJoinedEvents(prev => ({ ...prev, [effectiveEventId]: 'confirmed' }))
          setCrewPreviewMap(prev => ({ ...prev, [effectiveEventId]: null }))
          setReadyCountMap(prev => { const n = { ...prev }; delete n[effectiveEventId]; return n })
          // Mark self as confirmed so we don't appear in others' VibeCheck
          supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', effectiveEventId).eq('profile_id', userData.dbId).then(() => {})
        }
        // Only celebrate on genuinely new chats — skip the toast/haptic when
        // realtime is replaying memberships during app reconnect.
        if (chatNotifReadyRef.current && persistLoadedState) {
          showToast('Check your Messages tab for the chat', 'You\'re in! 🎉', '✅')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userData?.dbId])

  // ── Party chat: live member updates — subscribe to chat_members per party chat ──
  useEffect(() => {
    if (!userData?.dbId) return
    const currentChatIds = Object.values(officialEventChatMap)
    // Subscribe to newly added chatIds
    currentChatIds.forEach(chatId => {
      if (partyChatMemberChannels.current[chatId]) return
      const ch = supabase.channel(`party_members_${chatId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members', filter: `chat_id=eq.${chatId}` }, async (payload: any) => {
          const newProfileId = payload.new.profile_id
          if (newProfileId === userData.dbId) return // own join, already handled
          const { data: profile } = await supabase.from('profiles').select('id, name, photos, color').eq('id', newProfileId).single()
          if (!profile) return
          // The "X joined the group" line is now a persistent DB message posted by
          // join_party_chat (survives reload, same as "X left"), so we no longer
          // add a local ephemeral one here — that would double it. We only update
          // the open chat's member count/avatars below.
          // Reflect the new member in the OPEN chat header + chat list right away —
          // otherwise the member count + avatars stay stale until you leave and
          // re-enter the chat. Dedup-guarded and derived from list length (not an
          // increment) so it's idempotent if crewsByEvent also syncs.
          const joined = { id: profile.id, name: profile.name, photo: profile.photos?.[0] || '', color: profile.color || '#818CF8' }
          setOpenChat((cur: any) => {
            if (!cur || cur.id !== chatId) return cur
            if ((cur.memberProfiles || []).some((p: any) => p.id === joined.id)) return cur
            const newProfiles = [...(cur.memberProfiles || []), joined]
            return { ...cur, memberProfiles: newProfiles, members: newProfiles.length + 1 }
          })
          setChatList((prev: any) => prev.map((c: any) => {
            if (c.id !== chatId) return c
            if ((c.memberProfiles || []).some((p: any) => p.id === joined.id)) return c
            const newProfiles = [...(c.memberProfiles || []), joined]
            return { ...c, memberProfiles: newProfiles, members: newProfiles.length + 1, avatars: newProfiles.map((p: any) => p.photo).filter(Boolean), colors: newProfiles.map((p: any) => p.color) }
          }))
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
        })
        // A member leaving is a DELETE — without this the remaining members' open
        // chat keeps showing the old count (e.g. "3 members") until they re-enter.
        // (The "X left the group" message itself arrives via the message pipeline.)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_members', filter: `chat_id=eq.${chatId}` }, (payload: any) => {
          const goneId = payload.old?.profile_id
          if (!goneId || goneId === userData.dbId) return
          setOpenChat((cur: any) => {
            if (!cur || cur.id !== chatId) return cur
            const newProfiles = (cur.memberProfiles || []).filter((p: any) => p.id !== goneId)
            if (newProfiles.length === (cur.memberProfiles || []).length) return cur
            return { ...cur, memberProfiles: newProfiles, members: newProfiles.length + 1 }
          })
          setChatList((prev: any) => prev.map((c: any) => {
            if (c.id !== chatId) return c
            const newProfiles = (c.memberProfiles || []).filter((p: any) => p.id !== goneId)
            if (newProfiles.length === (c.memberProfiles || []).length) return c
            return { ...c, memberProfiles: newProfiles, members: newProfiles.length + 1, avatars: newProfiles.map((p: any) => p.photo).filter(Boolean), colors: newProfiles.map((p: any) => p.color) }
          }))
        })
        .subscribe()
      partyChatMemberChannels.current[chatId] = ch
      // Persistent broadcast channel — handles messages both when chat is open and closed
      if (partyChatBroadcastChannels.current[chatId]) return
      const bcastCh = supabase.channel(`duo_chat_${chatId}`)
        .on('broadcast', { event: 'message' }, ({ payload }: any) => {
          if (payload.sender_id === userData.dbId) return
          const t = new Date(payload.created_at)
          const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          if (openChatRef.current?.id === chatId) {
            // Chat is open — append in real-time
            const sender = (openChatRef.current?.memberProfiles || []).find((p: any) => p.id === payload.sender_id)
            const newMsg = { from: 'them', text: payload.text, time, date: t.toISOString().slice(0, 10), senderName: sender?.name || payload.sender_name || '', senderPhoto: sender?.photo || payload.sender_photo || null, senderColor: sender?.color || payload.sender_color || '#818CF8', _dbId: payload._dbId, _senderId: payload.sender_id }
            setChatMessages((prev: any) => {
              const existing = prev[chatId] || []
              const recent = existing.slice(-8)
              const isDup = recent.some((m: any) =>
                (payload._dbId && m._dbId === payload._dbId) ||
                (m.text === payload.text && m.from === 'them' && m._senderId === payload.sender_id)
              )
              if (isDup) return prev
              return { ...prev, [chatId]: [...existing, newMsg] }
            })
            setChatList((prev: any) => prev.map((c: any) => c.id === chatId ? { ...c, lastMsg: payload.text, time: payload.created_at } : c))
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
          } else {
            // Chat is closed — mark unread
            setChatList((prev: any) => prev.map((c: any) => c.id === chatId ? { ...c, lastMsg: payload.text, isNew: true, time: payload.created_at } : c))
          }
        })
        .subscribe()
      partyChatBroadcastChannels.current[chatId] = bcastCh
    })
    // Unsubscribe from chats no longer in map
    Object.entries(partyChatMemberChannels.current).forEach(([id, ch]) => {
      if (!currentChatIds.includes(Number(id))) {
        supabase.removeChannel(ch)
        delete partyChatMemberChannels.current[Number(id)]
      }
    })
    Object.entries(partyChatBroadcastChannels.current).forEach(([id, ch]) => {
      if (!currentChatIds.includes(Number(id))) {
        supabase.removeChannel(ch)
        delete partyChatBroadcastChannels.current[Number(id)]
      }
    })
  }, [officialEventChatMap, userData?.dbId])

// ── Fallback poll: check chat_members every 30s for chats added via party/squad flow ──
  useEffect(() => {
    if (!userData?.dbId) return
    const poll = async () => {
      const { data: memberships } = await supabase
        .from('chat_members')
        .select('chat_id, chats:chat_id(id, type, event_id, last_msg)')
        .eq('profile_id', userData.dbId)
      if (!memberships || memberships.length === 0) return
      for (const m of memberships) {
        const chat = m.chats as any
        if (!chat || !chat.event_id) continue
        // User explicitly left this event — don't re-add
        if (cancelledEventIdsRef.current.has(chat.event_id)) continue
        // Fetch members
        const { data: members } = await supabase
          .from('chat_members')
          .select('profile_id, profiles:profile_id(id, name, photos, color, age)')
          .eq('chat_id', chat.id)
        if (!members || members.length < 2) continue
        const otherMembers = members.filter((mem: any) => mem.profile_id !== userData.dbId).map((mem: any) => {
          const p = (mem as any).profiles || {}
          return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, color: p.color || '#818CF8', age: p.age }
        })
        // Community events have raw IDs (<100000); official events shift +100000
        const isCommunityChat = chat.event_id < 100000
        const correctType = chat.type === 'duo' ? 'duo' : 'group'
        const existing = chatListRef.current.find((c: any) => c.id === chat.id)
        // If chat exists and is in sync (type, member count, communityEventId where needed) — skip
        const inSync = existing
          && existing.type === correctType
          && (existing.members || 0) === members.length
          && (!isCommunityChat || existing.communityEventId === chat.event_id)
        if (inSync) continue
        const foundEventRow: any = dbCommunityEventsRef.current.find((e: any) => e.id === chat.event_id) || feedOfficialDbEventsRef.current.find((e: any) => e.id === chat.event_id)
        const newChat: any = {
          id: chat.id, type: correctType, eventRefId: chat.event_id,
          event: foundEventRow?.title || 'Crew Chat',
          eventImage: foundEventRow?.image_url || null,
          eventEmoji: '🎉', members: members.length,
          avatars: otherMembers.map((p: any) => p.photo).filter(Boolean),
          colors: otherMembers.map((p: any) => p.color), memberProfiles: otherMembers,
          lastMsg: chat.last_msg || '🎉 You\'re in the crew!',
          time: new Date().toISOString(), isNew: existing?.isNew ?? true, chatExpiresAt: existing?.chatExpiresAt || (Date.now() + 24 * 60 * 60 * 1000),
        }
        if (isCommunityChat) newChat.communityEventId = chat.event_id
        setChatList(prev => {
          // Match by chat id OR by event id — local polling may have created a
          // chat with stable local id (-1_000_000 - evId) that should be replaced
          // with the real DB id once this poll observes it. Otherwise: dupe chats.
          const evRefId = chat.event_id
          const idx = prev.findIndex((c: any) =>
            c.id === chat.id ||
            (evRefId != null && (c.hostEventId === evRefId || c.communityEventId === evRefId || c.eventRefId === evRefId))
          )
          if (idx === -1) return [newChat, ...prev]
          const existing = prev[idx]
          const merged = { ...existing, ...newChat }
          if (existing.hostEventId) merged.hostEventId = existing.hostEventId
          // Don't overwrite live preview with DB's stale placeholder ("Crew
          // confirmed!" / "You're in the crew!") on reload — keep whatever
          // the user has been seeing locally if it's there.
          if (existing.lastMsg) merged.lastMsg = existing.lastMsg
          if (existing.time) merged.time = existing.time
          if (existing.isNew === false) merged.isNew = false
          const updated = [...prev]
          updated[idx] = merged
          return updated
        })
        // Migrate chatMessages from stable local id to real DB id
        if (chat.event_id != null) {
          const stableLocalId = -1_000_000 - chat.event_id
          if (stableLocalId !== chat.id) {
            setChatMessages((prev: any) => {
              if (!prev[stableLocalId]) return prev
              const merged = [...(prev[stableLocalId] || []), ...(prev[chat.id] || [])]
              const next = { ...prev, [chat.id]: merged }
              delete next[stableLocalId]
              return next
            })
          }
        }
        if (isCommunityChat) communityEventChatMap.current[chat.event_id] = chat.id
        setJoinedEvents(prev => ({ ...prev, [chat.event_id]: 'confirmed' }))
        setOfficialEventChatMap(prev => ({ ...prev, [chat.event_id]: chat.id }))
        setCrewPreviewMap(prev => ({ ...prev, [chat.event_id]: null }))
        setReadyCountMap(prev => { const n = { ...prev }; delete n[chat.event_id]; return n })
        // Mark self as confirmed so we don't appear in others' VibeCheck
        supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', chat.event_id).eq('profile_id', userData.dbId).then(() => {})
        // Same as realtime handler — suppress the celebration toast when the
        // fallback poll picks up an existing chat we've already lived in.
        if (chatNotifReadyRef.current && persistLoadedState) {
          showToast('Check your Messages tab', 'You\'re in the crew! 🎉', '✅')
        }
      }
    }
    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [userData?.dbId])

  // ── Poll for accepted invites (inviter side) — sync chat to local state ───
  useEffect(() => {
    if (!userData?.dbId) return
    // Baseline gate: the first data-bearing check after login only RESTORES state
    // (chat list, maps) for already-accepted invites without firing notifications —
    // otherwise every historical accept replays as a fresh "X accepted!" bell on
    // each login. Only accepts seen after the baseline (genuinely new) notify.
    let baselineDone = false
    const check = async () => {
      const { data } = await supabase
        .from('crew_invites')
        .select('*, invitee:profiles!crew_invites_invitee_id_fkey(*)')
        .eq('inviter_id', userData.dbId)
        .in('status', ['accepted', 'cancelled', 'declined'])
      // Clear sentCrewInvites for cancelled/declined invites
      const cancelled = (data || []).filter((inv: any) => inv.status === 'cancelled' || inv.status === 'declined')
      if (cancelled.length > 0) {
        setSentCrewInvites(prev => {
          const next = { ...prev }
          cancelled.forEach((inv: any) => { delete next[`${inv.event_ref_id}_${inv.invitee_id}`] })
          return next
        })
        cancelled.forEach((inv: any) => {
          setChatList(prev => prev.filter(c => c.id !== inv.chat_id))
          if (cancelledEventIdsRef.current.has(inv.event_ref_id)) {
            // We left this event ourselves — remove it
            setJoinedEvents(prev => { const n = { ...prev }; delete n[inv.event_ref_id]; return n })
          } else {
            // Partner left or declined — keep the event as 'joined' so we continue searching
            setJoinedEvents(prev => ({ ...prev, [inv.event_ref_id]: 'joined' }))
          }
        })
      }
      const acceptedData = (data || []).filter((inv: any) => inv.status === 'accepted')
      if (!data) return
      for (const inv of acceptedData) {
        const sentKey = `${inv.event_ref_id}_${inv.invitee_id}`
        // Use the invite row id for the "already processed" memo — pair-based
        // keys collided when the same two users matched again on the same event
        // after an earlier invite was cancelled/blocked, causing the second
        // accept to be skipped and "Waiting for X" to stay stuck.
        const processedKey = `inv:${inv.id}`
        if (acceptedInviteKeysRef.current.has(processedKey) || !inv.chat_id) continue
        if (cancelledEventIdsRef.current.has(inv.event_ref_id)) continue
        acceptedInviteKeysRef.current.add(processedKey)
        setSentCrewInvites(prev => ({ ...prev, [sentKey]: 'accepted' }))
        setOfficialEventChatMap(prev => ({ ...prev, [inv.event_ref_id]: inv.chat_id }))
        setChatList(prev => {
          if (prev.some(c => c.id === inv.chat_id)) return prev
          const partner = inv.invitee
          return [{
            id: inv.chat_id, type: 'duo', eventRefId: inv.event_ref_id,
            name: partner?.name || 'Your crew',
            age: partner?.age || '',
            color: partner?.color || '#818CF8',
            photo: partner?.photos?.[0] || '',
            lastMsg: '🎉 Crew confirmed! Say hi',
            time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
            event: inv.event_title, eventEmoji: '🎉',
            partnerProfile: partner,
          }, ...prev]
        })
        setJoinedEvents(prev => ({ ...prev, [inv.event_ref_id]: 'confirmed' }))
        // Only notify for accepts discovered after the login baseline — skip the
        // historical backlog so re-login doesn't replay old "accepted" bells.
        if (baselineDone) {
          addNotif({ type: 'crew_accepted', emoji: '🎉', color: '#43E97B', title: `${inv.invitee?.name} accepted your invite!`, body: `For "${inv.event_title}" — say hi 💬` })
        }
      }
      // First successful data load establishes the baseline; subsequent checks
      // (interval / realtime UPDATE / app-resume) fire notifs for new accepts.
      baselineDone = true
    }
    // First check may run before Supabase auth session is fully attached —
    // RLS would return empty, the user sees "Waiting for X" stuck until the
    // next interval. Retry once after 2s to cover that race.
    let didEarlyRetry = false
    const earlyRetry = setTimeout(() => { if (!didEarlyRetry) { didEarlyRetry = true; check() } }, 2000)
    check()
    const interval = setInterval(check, 15000)
    // Realtime: when our sent invite changes status (accepted/declined/cancelled),
    // run the same poll logic right away instead of waiting up to 15s. Otherwise
    // the inviter UI shows stale "Waiting for X" after X already accepted.
    const channel = supabase.channel(`crew_invites_outgoing_${userData.dbId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'crew_invites', filter: `inviter_id=eq.${userData.dbId}` }, () => {
        check()
      })
      .subscribe()
    // When app returns from background, realtime/poll may have stalled — re-sync.
    // Without this, user backgrounds the app while waiting on a partner accept,
    // returns hours later, and "Waiting for X" stays stuck until manual reopen.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
    })
    return () => { clearTimeout(earlyRetry); clearInterval(interval); supabase.removeChannel(channel); appStateSub.remove() }
  }, [userData?.dbId])

  const openNotifPanel = () => {
    setNotifOpen(true)
    Animated.spring(notifPanelY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start()
  }
  const closeNotifPanel = () => {
    Animated.timing(notifPanelY, { toValue: -600, duration: 260, useNativeDriver: true }).start(() => setNotifOpen(false))
    // Remove bell-type notifications when panel is closed (they've been seen)
    setNotifications(prev => prev.filter(n => !BELL_TYPES.includes(n.type)))
  }

  const markNotifsReadForChat = (chatId: number) => {
    // Remove chat-linked notifications when that chat is opened
    setNotifications(prev => prev.filter(n =>
      !(CHAT_TYPES.includes(n.type) && (!n.chatId || n.chatId === chatId))
    ))
  }

  const markNotifsReadForPlans = () => {
    // Remove plans-linked notifications when Plans/VibeCheck is opened
    setNotifications(prev => prev.filter(n => !PLANS_TYPES.includes(n.type)))
  }

  // Welcome notification — only once after registration
  useEffect(() => {
    const key = `parea_welcomed_${userData?.authId || 'local'}`
    AsyncStorage.getItem(key).then(val => {
      if (val) return
      const t = setTimeout(() => {
        addNotif({ type: 'welcome', emoji: '👋', color: '#6366F1', title: `Welcome to Parea, ${userData?.name || 'there'}!`, body: 'Find your tonight\'s crew in Cyprus 🌊' })
        AsyncStorage.setItem(key, '1')
      }, 1500)
      return () => clearTimeout(t)
    })
  }, [])

  // Watch for new join requests
  useEffect(() => {
    Object.entries(pendingJoinRequests).forEach(([evId, reqs]) => {
      const prev = prevPendingRef.current[Number(evId)] || []
      reqs.filter(r => !prev.find((p: any) => p.requestId === r.requestId)).forEach(req => {
        const ev = userCreatedEvents.find(e => e.id === Number(evId))
        addNotif({ type: 'join_request', emoji: '🙋', color: '#6366F1', title: `${req.name} wants to join`, body: ev?.title || 'your social' })
      })
    })
    prevPendingRef.current = pendingJoinRequests
  }, [pendingJoinRequests])

  // Watch for host's group becoming full → auto-navigate to chat.
  // First run after persist hydration populates the ref with already-full
  // events as "seen" baseline — only NEW transitions to full trigger the
  // notif + auto-nav. Previously the ref reset on reload, so every restart
  // re-fired "Your social is complete!" for events that were already full.
  const prevFullHostEventsRef = useRef<Set<number>>(new Set())
  const hostFullInitializedRef = useRef(false)
  useEffect(() => {
    if (!persistLoadedState) return
    if (!hostFullInitializedRef.current) {
      userCreatedEvents.forEach(ev => {
        const slotsTotal = (ev.maxParticipants || 5) - 1
        const isFull = (approvedJoiners[ev.id] || []).length >= slotsTotal && slotsTotal > 0
        if (isFull) prevFullHostEventsRef.current.add(ev.id)
      })
      hostFullInitializedRef.current = true
      return
    }
    userCreatedEvents.forEach(ev => {
      const approved = approvedJoiners[ev.id] || []
      const slotsTotal = (ev.maxParticipants || 5) - 1
      const isFull = approved.length >= slotsTotal && slotsTotal > 0
      if (isFull && !prevFullHostEventsRef.current.has(ev.id)) {
        prevFullHostEventsRef.current.add(ev.id)
        addNotif({ type: 'host_full', emoji: '🎉', color: '#10B981', title: 'Your social is complete!', body: `All spots filled for "${ev.title}"` })
        setTimeout(() => {
          setMessagesInitialSubTab('messages')
          setActiveTab('messages')
        }, 1200)
      }
    })
  }, [approvedJoiners, userCreatedEvents, persistLoadedState])

  const refillInFlightRef = useRef<Set<string>>(new Set())
  const fetchRequestsRef = useRef<(() => Promise<void>) | null>(null)

  // Poll real join requests from DB for hosted events
  useEffect(() => {
    if (!userData?.dbId || userCreatedEvents.length === 0) return
    const eventIds = userCreatedEvents.map(e => e.id)
    const fetchRequests = async () => {
      const { data: allReqData, error } = await supabase
        .from('join_requests')
        .select('id, event_id, requester_id, status, transport, updated_at')
        .in('event_id', eventIds)
        .in('status', ['pending', 'approved', 'confirmed'])
      if (error) console.warn('join_requests poll error:', error.message)

      // Auto-expire approved requests older than 6h — free slot if joiner didn't confirm
      const APPROVE_EXPIRY_MS = 6 * 60 * 60 * 1000
      const expiredApproved = (allReqData || []).filter((r: any) =>
        r.status === 'approved' && r.created_at && Date.now() - new Date(r.created_at).getTime() > APPROVE_EXPIRY_MS
      )
      if (expiredApproved.length > 0) {
        supabase.from('join_requests').delete().in('id', expiredApproved.map((r: any) => r.id))
          .then(() => addNotif({ type: 'info', emoji: '⏰', color: '#F59E0B', title: 'Spot freed', body: 'A joiner didn\'t confirm in time — slot is open again' }))
      }
      const validReqData = (allReqData || []).filter((r: any) => !expiredApproved.some((e: any) => e.id === r.id))
      const reqData = validReqData.filter((r: any) => r.status === 'pending')
      const approvedData = validReqData.filter((r: any) => r.status === 'approved')

      const data = await (async () => {
        const allIds = [...new Set(validReqData.map((r: any) => r.requester_id))]
        if (allIds.length === 0) return []
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', allIds)
        const profileMap: Record<string, any> = {}
        profiles?.forEach((p: any) => { profileMap[p.id] = p })
        return validReqData.map((r: any) => ({ ...r, profiles: profileMap[r.requester_id] || {} }))
      })()

      // Pending requests
      const newRequests: Record<number, any[]> = {}
      data.filter((r: any) => r.status === 'pending').forEach((req: any) => {
        const p = req.profiles || {}
        const evId = req.event_id
        if (!newRequests[evId]) newRequests[evId] = []
        newRequests[evId].push({
          id: p.id,
          requestId: req.id,
          name: p.name || 'User',
          age: p.age || '',
          color: p.color || '#818CF8',
          colors: [p.color || '#818CF8', '#6366F1'],
          photo: p.photos?.[0] || null,
          photos: p.photos || [],
          bio: p.bio || '',
          langs: p.langs || [],
          interests: p.interests || [],
          drinksPref: p.drinks_pref || '',
          smokingPref: p.smoking_pref || '',
          hasPets: !!p.has_pets,
          city: p.city || null,
          transport: req.transport || null,
          _real: true,
        })
      })
      setPendingJoinRequests(newRequests)

      // Sync approvedJoiners from DB — only 'approved' (not yet confirmed by joiner)
      const newApproved: Record<number, any[]> = {}
      data.filter((r: any) => r.status === 'approved').forEach((req: any) => {
        const p = req.profiles || {}
        const evId = req.event_id
        if (!newApproved[evId]) newApproved[evId] = []
        newApproved[evId].push({ id: p.id, requestId: req.id, name: p.name || 'User', age: p.age || '', color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#6366F1'], photo: p.photos?.[0] || null, photos: p.photos || [], bio: p.bio || '', langs: p.langs || [], _real: true })
      })
      setApprovedJoiners(prev => {
        const next = { ...prev }
        eventIds.forEach(id => { next[id] = newApproved[id] || [] })
        return next
      })

      // Track confirmed joiners separately (joiner confirmed → slot is truly filled)
      const newConfirmed: Record<number, any[]> = {}
      data.filter((r: any) => r.status === 'confirmed').forEach((req: any) => {
        const p = req.profiles || {}
        const evId = req.event_id
        if (!newConfirmed[evId]) newConfirmed[evId] = []
        newConfirmed[evId].push({ id: p.id, requestId: req.id, name: p.name || 'User', age: p.age || '', color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#6366F1'], photo: p.photos?.[0] || null, photos: p.photos || [], bio: p.bio || '', langs: p.langs || [], _real: true })
      })
      setHostConfirmedMembers(prev => {
        const next = { ...prev }
        eventIds.forEach(id => { next[id] = newConfirmed[id] || [] })
        return next
      })

      // Confirmed joiners → создаём/обновляем чат у хоста
      const confirmedByEvent: Record<number, any[]> = {}
      data.filter((r: any) => r.status === 'confirmed').forEach((req: any) => {
        const p = req.profiles || {}
        const evId = req.event_id
        if (!confirmedByEvent[evId]) confirmedByEvent[evId] = []
        confirmedByEvent[evId].push({
          id: p.id, requestId: req.id,
          name: p.name || 'User', age: p.age || '',
          color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#6366F1'],
          photo: p.photos?.[0] || null, photos: p.photos || [],
          bio: p.bio || '', langs: p.langs || [], _real: true,
        })
      })
      Object.entries(confirmedByEvent).forEach(([evIdStr, confirmedJoiners]) => {
        const evId = +evIdStr
        const ev = userCreatedEvents.find(e => e.id === evId)
        if (!ev) return
        // Skip recreating chat for events that ended 24h+ ago — otherwise every
        // app start would resurrect the chat for past events based on the still-
        // existing 'confirmed' join_requests in DB.
        if (ev.expiresAt > 0 && ev.expiresAt + 24 * 60 * 60 * 1000 < Date.now()) return
        setChatList(prev => {
          // Look up existing chat by any event-pointing key — realtime/joiner-confirm
          // creates chats with communityEventId/eventRefId, this poll uses hostEventId.
          // Without this, both code paths can each create a chat for the same event.
          const existingIdx = prev.findIndex(c =>
            c.hostEventId === evId || c.communityEventId === evId || c.eventRefId === evId
          )
          if (existingIdx >= 0) {
            const updated = [...prev]
            const existingProfiles: any[] = updated[existingIdx].memberProfiles || []
            const newProfiles = [...existingProfiles]
            let added = false
            // Notif fires only after the initial-load window. Lifecycle:
            // reload replays existing members → silent sync, no toast/notif.
            // Real-time join later → notif. (The party_chat realtime listener
            // handles the live "X joined" message in-chat separately.)
            const isInitialLoad = !persistLoadedState || !chatNotifReadyRef.current
            confirmedJoiners.forEach(joiner => {
              if (!newProfiles.find((p: any) => p.id === joiner.id)) {
                newProfiles.push(joiner); added = true
                if (!isInitialLoad) {
                  addNotif({ type: 'member_joined', emoji: '✅', color: '#10B981', title: `${joiner.name} joined the group`, body: ev.title || '', chatId: updated[existingIdx].id })
                }
              }
            })
            if (!added) return prev
            // Never overwrite chat-list lastMsg/time from this poll — real
            // conversation messages drive the preview. The "X joined" event
            // arrives as an in-chat system message via a separate realtime
            // listener and updates lastMsg there.
            updated[existingIdx] = {
              ...updated[existingIdx],
              hostEventId: evId,
              members: newProfiles.length + 1,
              memberProfiles: newProfiles,
              avatars: newProfiles.map((p: any) => p.photo).filter(Boolean),
              colors: newProfiles.map((p: any) => p.color),
            }
            return updated
          } else {
            // One more pass — match by title in case the other code path created
            // a chat without any of the event id fields set yet (race window).
            const titleIdx = prev.findIndex((c: any) => c.type === 'group' && c.event === (ev.title || 'Your Social'))
            if (titleIdx >= 0) {
              const updated = [...prev]
              const existingProfiles: any[] = updated[titleIdx].memberProfiles || []
              const newProfiles = [...existingProfiles]
              confirmedJoiners.forEach(joiner => {
                if (!newProfiles.find((p: any) => p.id === joiner.id)) newProfiles.push(joiner)
              })
              updated[titleIdx] = {
                ...updated[titleIdx],
                hostEventId: evId, communityEventId: evId, eventRefId: evId,
                members: newProfiles.length + 1,
                memberProfiles: newProfiles,
                avatars: newProfiles.map((p: any) => p.photo).filter(Boolean),
                colors: newProfiles.map((p: any) => p.color),
                lastMsg: `✅ ${confirmedJoiners[0]?.name} joined the group`,
                time: new Date().toISOString(), isNew: true,
              }
              return updated
            }
            // Stable chat id derived from evId so two parallel setChatList calls
            // (polling + realtime) both produce IDENTICAL chat objects → React
            // reconciles to a single entry instead of stacking duplicates.
            const stableLocalId = -1_000_000 - evId
            if (prev.some((c: any) => c.id === stableLocalId)) return prev
            // Baseline gate — same as the existing-chat path above. First poll
            // after reload restores history silently; only NEW joiners after the
            // initial-load window get an inbox toast.
            const isInitialLoad = !persistLoadedState || !chatNotifReadyRef.current
            if (!isInitialLoad) {
              addNotif({ type: 'member_joined', emoji: '✅', color: '#10B981', title: `${confirmedJoiners[0]?.name} joined the group`, body: ev.title || '', chatId: 0 })
            }
            // Anchor chat expiry to the event time, not "now + 24h". Otherwise
            // every fresh app start the local chat gets re-created with a new
            // 24h window — past events would never clean up locally.
            const eventChatExpiry = (ev.expiresAt && ev.expiresAt > 0 ? ev.expiresAt : Date.now()) + 24 * 60 * 60 * 1000
            return [{
              // All three event-pointing keys so any other path's dedup matches.
              id: stableLocalId, type: 'group', hostEventId: evId, communityEventId: evId, eventRefId: evId,
              event: ev.title || 'Your Social', eventEmoji: CATEGORY_EMOJI[ev.category || ''] || '🎉',
              members: confirmedJoiners.length + 1,
              memberProfiles: confirmedJoiners,
              avatars: confirmedJoiners.map((p: any) => p.photo).filter(Boolean),
              colors: confirmedJoiners.map((p: any) => p.color),
              lastMsg: `✅ ${confirmedJoiners[0]?.name} joined the group`,
              time: new Date().toISOString(), isNew: true, chatExpiresAt: eventChatExpiry,
            }, ...prev]
          }
        })
      })

      // Sync chatList members — remove joiners who left (no longer confirmed)
      setChatList(prev => {
        let changed = false
        const updated = prev.map(chat => {
          if (!chat.hostEventId) return chat
          const evId = chat.hostEventId
          const stillConfirmed = new Set((confirmedByEvent[evId] || []).map((p: any) => p.id))
          const existingProfiles: any[] = chat.memberProfiles || []
          const newProfiles = existingProfiles.filter((p: any) => stillConfirmed.has(p.id))
          if (newProfiles.length === existingProfiles.length) return chat
          changed = true
          return { ...chat, memberProfiles: newProfiles, members: newProfiles.length + 1, avatars: newProfiles.map((p: any) => p.photo).filter(Boolean), colors: newProfiles.map((p: any) => p.color) }
        }).filter(chat => {
          // Remove chat entirely if no confirmed members left
          if (chat.hostEventId && (chat.memberProfiles || []).length === 0) { changed = true; return false }
          return true
        })
        return changed ? updated : prev
      })

      // Sync approvedJoiners from DB (catches when joiner leaves)
      const syncedApproved: Record<number, any[]> = {}
      data.filter((r: any) => r.status === 'approved').forEach((req: any) => {
        const p = req.profiles || {}
        const evId = req.event_id
        if (!syncedApproved[evId]) syncedApproved[evId] = []
        syncedApproved[evId].push({ id: p.id, requestId: req.id, name: p.name || 'User', age: p.age || '', color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#6366F1'], photo: p.photos?.[0] || null, photos: p.photos || [], bio: p.bio || '', langs: p.langs || [], _real: true })
      })
      setApprovedJoiners(prev => {
        const merged = { ...prev }
        eventIds.forEach((id: number) => { merged[id] = syncedApproved[id] || [] })
        return merged
      })
      const syncedConfirmed: Record<number, any[]> = {}
      data.filter((r: any) => r.status === 'confirmed').forEach((req: any) => {
        const p = req.profiles || {}
        const evId = req.event_id
        if (!syncedConfirmed[evId]) syncedConfirmed[evId] = []
        syncedConfirmed[evId].push({ id: p.id, requestId: req.id, name: p.name || 'User', age: p.age || '', color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#6366F1'], photo: p.photos?.[0] || null, photos: p.photos || [], bio: p.bio || '', langs: p.langs || [], _real: true })
      })
      setHostConfirmedMembers(prev => {
        const merged = { ...prev }
        eventIds.forEach((id: number) => { merged[id] = syncedConfirmed[id] || [] })
        return merged
      })
    }
    fetchRequestsRef.current = fetchRequests
    fetchRequests()
    const interval = setInterval(fetchRequests, 5000)
    return () => { clearInterval(interval); fetchRequestsRef.current = null }
  }, [userData?.dbId, userCreatedEvents.length])

  // Broadcast: host listens for instant "member_left" from joiners
  // Also subscribes to postgres_changes DELETE on join_requests as fallback (broadcast requires subscribe to work)
  useEffect(() => {
    if (!userData?.dbId) return
    const handleMemberLeft = (eventId: number, requesterId: string) => {
      setApprovedJoiners(prev => {
        const current = prev[eventId] || []
        const updated = current.filter((p: any) => p.id !== requesterId)
        if (updated.length === current.length) return prev
        return { ...prev, [eventId]: updated }
      })
      setChatList(prev => {
        const chatIdx = prev.findIndex((c: any) => c.hostEventId === eventId)
        if (chatIdx < 0) return prev
        const chat = prev[chatIdx]
        const newProfiles = (chat.memberProfiles || []).filter((p: any) => p.id !== requesterId)
        if (newProfiles.length === (chat.memberProfiles || []).length) return prev
        if (newProfiles.length === 0) return prev.filter((_: any, i: number) => i !== chatIdx)
        const updated = [...prev]
        updated[chatIdx] = { ...chat, memberProfiles: newProfiles, members: newProfiles.length + 1, avatars: newProfiles.map((p: any) => p.photo).filter(Boolean), colors: newProfiles.map((p: any) => p.color) }
        return updated
      })
      fetchRequestsRef.current?.()
    }
    const channel = supabase.channel(`host-events-${userData.dbId}`)
      .on('broadcast', { event: 'member_left' }, ({ payload }: any) => {
        const { eventId, requesterId } = payload || {}
        if (!eventId || !requesterId) return
        handleMemberLeft(eventId, requesterId)
      })
      // Fallback: postgres_changes catches DELETE even when broadcast fails
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'join_requests' }, (payload: any) => {
        const old = payload.old || {}
        if (old.requester_id && old.event_id) {
          handleMemberLeft(old.event_id, old.requester_id)
        } else {
          fetchRequestsRef.current?.()
        }
      })
      // When joiner confirms (status → confirmed), instantly update host's slot counter
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'join_requests' }, () => {
        fetchRequestsRef.current?.()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userData?.dbId])

  // Poll own join request statuses (requester side)
  useEffect(() => {
    if (!userData?.dbId) return
    const pollStatus = async () => {
      const [{ data: reqData }, { data: evData }] = await Promise.all([
        supabase.from('join_requests').select('event_id, status, updated_at').eq('requester_id', userData.dbId),
        supabase.from('community_events').select('id'),
      ])
      if (reqData) {
        // Only treat requests as valid if the community event still exists in DB
        const existingEventIds = new Set((evData || []).map((e: any) => e.id))
        const validRequests = reqData.filter((r: any) => existingEventIds.has(r.event_id))
        const validEventIds = new Set(validRequests.map((r: any) => r.event_id))
        setJoinedEvents(prev => {
          const updated = { ...prev }
          let changed = false
          // Remove ALL stale community event entries that no longer have a join_request in DB
          Object.keys(updated).forEach(id => {
            const numId = +id
            const isMockOrOfficial = MOCK_EVENTS.some(e => e.id === numId) || numId > 100000
            // Skip removal for events requested in the last 15s — the join_request
            // upsert may not be visible to this poll yet (commit/RLS lag); without
            // this grace the freshly-set 'pending' is wiped then restored (flicker).
            const justRequested = recentlyRequestedRef.current[numId] && (Date.now() - recentlyRequestedRef.current[numId] < 15000)
            if (!isMockOrOfficial && !validEventIds.has(numId) && !justRequested) {
              const wasJoinedOrConfirmed = updated[numId] === 'joined' || updated[numId] === 'confirmed'
              const cancelledByUser = cancelledEventIdsRef.current.has(numId)
              if (wasJoinedOrConfirmed && !cancelledByUser) {
                const chat = chatList.find(c => (c.communityEventId === numId || c.hostEventId === numId))
                const title = chat?.event || 'A social you joined'
                addNotif({ type: 'event_cancelled', emoji: '🗑️', color: '#EF4444', title: 'Event cancelled', body: `Host cancelled "${title}"` })
              }
              delete updated[numId]; changed = true
            }
          })
          // Restore/sync from DB
          validRequests.forEach((req: any) => {
            if (cancelledEventIdsRef.current.has(req.event_id)) {
              // Previously left, but a fresh pending/approved request means the
              // user re-joined this event — un-cancel so the re-join flows through
              // (otherwise the approval is ignored and they're stuck on "Waiting").
              if (req.status === 'pending' || req.status === 'approved') {
                cancelledEventIdsRef.current.delete(req.event_id)
                setCancelledEventIds(prev => prev.filter(id => id !== req.event_id))
              } else {
                return
              }
            }
            if (req.status === 'pending' && !updated[req.event_id]) {
              updated[req.event_id] = 'pending'
              changed = true
            }
            if (req.status === 'approved') {
              if (prev[req.event_id] === 'pending') {
                addNotif({ type: 'crew_ready', emoji: '✅', color: '#43E97B', title: 'Host approved your request! 🎉', body: '' })
              }
              if (!updated[req.event_id] || updated[req.event_id] === 'pending') {
                updated[req.event_id] = 'joined'
                changed = true
              }
              if (req.updated_at) {
                setApprovedAtMap(prev => prev[req.event_id] ? prev : { ...prev, [req.event_id]: new Date(req.updated_at).getTime() })
              }
            }
            if (req.status === 'confirmed') {
              if (!updated[req.event_id] || updated[req.event_id] === 'pending' || updated[req.event_id] === 'joined') {
                updated[req.event_id] = 'confirmed'
                changed = true
              }
            }
            if (req.status === 'rejected') {
              // Silent rejection — drop the event from local state so it
              // disappears from Plans/VibeCheck without showing a harsh
              // "Rejected" badge (matches our hybrid UX decision).
              if (updated[req.event_id]) {
                delete updated[req.event_id]
                changed = true
                cancelledEventIdsRef.current.add(req.event_id)
              }
            }
          })
          return changed ? updated : prev
        })

        // Fetch other approved/confirmed members for events where I'm approved or confirmed
        const approvedEventIds = validRequests.filter((r: any) => r.status === 'approved' || r.status === 'confirmed').map((r: any) => r.event_id)
        if (approvedEventIds.length > 0) {
          const { data: memberRows } = await supabase
            .from('join_requests')
            .select('event_id, requester_id')
            .in('event_id', approvedEventIds)
            .in('status', ['approved', 'confirmed'])
            .neq('requester_id', userData.dbId)
          if (memberRows && memberRows.length > 0) {
            const profileIds = [...new Set(memberRows.map((r: any) => r.requester_id))]
            const { data: profiles } = await supabase.from('profiles').select('id, name, photos, bio, age, langs, color').in('id', profileIds)
            const profileMap: Record<string, any> = {}
            profiles?.forEach((p: any) => { profileMap[p.id] = p })
            const membersMap: Record<number, any[]> = {}
            memberRows.forEach((r: any) => {
              const p = profileMap[r.requester_id] || {}
              if (!membersMap[r.event_id]) membersMap[r.event_id] = []
              membersMap[r.event_id].push({
                id: p.id || r.requester_id,
                name: p.name || 'Member',
                photo: p.photos?.[0] || null,
                photos: p.photos || [],
                bio: p.bio || '',
                age: p.age || '',
                langs: p.langs || [],
                color: p.color || '#818CF8',
                colors: [p.color || '#818CF8', '#6366F1'],
                _real: true,
              })
            })
            setCommunityEventMembers(membersMap)
          } else {
            setCommunityEventMembers({})
          }
        }
      }
    }
    pollStatus()
    const interval = setInterval(pollStatus, 15000)
    return () => clearInterval(interval)
  }, [userData?.dbId])

  // Clean up joinedEvents + chats for community events that no longer exist in DB
  useEffect(() => {
    const dbIds = new Set(dbCommunityEvents.map(e => e.id))
    // Re-add hosted events that were accidentally removed from userCreatedEvents (race condition fix)
    const hostedInDb = dbCommunityEvents.filter(e => e.isHosted)
    setUserCreatedEvents(prev => {
      const prevIds = new Set(prev.map(e => e.id))
      const missing = hostedInDb.filter(e => !prevIds.has(e.id) && !deletedCommunityEventIds.current.has(e.id))
      if (missing.length === 0) {
        // Also remove events no longer in DB (skip recently created ones)
        const filtered = prev.filter(ev => dbIds.has(ev.id) || (ev.createdAt && Date.now() - ev.createdAt < 60000))
        return filtered.length !== prev.length ? filtered : prev
      }
      const restored = missing.map(e => ({ ...e, isHosted: true }))
      const filtered = [...prev.filter(ev => dbIds.has(ev.id) || (ev.createdAt && Date.now() - ev.createdAt < 60000)), ...restored]
      return filtered
    })
    const deletedIds: number[] = []
    setJoinedEvents(prev => {
      const updated = { ...prev }
      let changed = false
      Object.keys(updated).forEach(id => {
        const numId = +id
        const isMockOrOfficial = MOCK_EVENTS.some(e => e.id === numId) || numId > 100000
        if (!isMockOrOfficial && !dbIds.has(numId)) {
          deletedIds.push(numId)
          delete updated[numId]
          changed = true
        }
      })
      return changed ? updated : prev
    })
    if (deletedIds.length > 0) {
      deletedIds.forEach(evId => {
        const mappedChatId = communityEventChatMap.current[evId]
        setChatList(prev => {
          const chat = prev.find(c => c.id === mappedChatId || c.communityEventId === evId)
          if (!chat) return prev
          setChatMessages(msgs => ({
            ...msgs,
            [chat.id]: [...(msgs[chat.id] || []), { from: 'system', text: '🗑️ Host cancelled this event', time: 'now' }],
          }))
          delete communityEventChatMap.current[evId]
          return prev.filter(c => c.id !== chat.id)
        })
      })
    }
  }, [dbCommunityEvents])

  useEffect(() => { dbCommunityEventsRef.current = dbCommunityEvents }, [dbCommunityEvents])
  useEffect(() => { feedOfficialDbEventsRef.current = feedOfficialDbEvents }, [feedOfficialDbEvents])

  // Backfill eventImage for chats that were added via realtime/poll before event
  // data loaded. Without this, those chats show member photos instead of event image.
  useEffect(() => {
    if (dbCommunityEvents.length === 0 && feedOfficialDbEvents.length === 0) return
    setChatList(prev => {
      let changed = false
      const next = prev.map((c: any) => {
        if (c.eventImage) return c
        const evId = c.eventRefId ?? c.communityEventId ?? c.hostEventId
        if (evId == null) return c
        const ev: any = dbCommunityEvents.find((e: any) => e.id === evId) || feedOfficialDbEvents.find((e: any) => e.id === evId)
        if (ev?.image_url) {
          changed = true
          return { ...c, eventImage: ev.image_url }
        }
        return c
      })
      return changed ? next : prev
    })
  }, [dbCommunityEvents, feedOfficialDbEvents])

  // Auto-expire hosted events and their chats 24h after event ends
  useEffect(() => {
    if (!persistLoadedState) return
    const check = () => {
      const now = Date.now()
      const EXPIRE_AFTER = 24 * 60 * 60 * 1000 // 24 hours
      setUserCreatedEvents(prev => {
        const expired = prev.filter(ev => ev.expiresAt > 0 && now > ev.expiresAt + EXPIRE_AFTER)
        if (expired.length === 0) return prev
        const expiredIds = new Set(expired.map((ev: any) => ev.id))
        // Remove chats linked to expired hosted events
        setChatList(cl => cl.filter(c => !expiredIds.has(c.hostEventId)))
        setPendingJoinRequests(pjr => {
          const n = { ...pjr }
          expiredIds.forEach(id => delete n[id])
          return n
        })
        setApprovedJoiners(aj => {
          const n = { ...aj }
          expiredIds.forEach(id => delete n[id])
          return n
        })
        return prev.filter(ev => !expiredIds.has(ev.id))
      })
      // Remove chats linked to events that already passed (and 24h+ grace).
      // Also remove chats whose event is gone from DB entirely (orphan from
      // an event the host deleted) — local chatList still has it but there's
      // nothing left to anchor it to.
      const cancelledByCleanup: number[] = []
      // Local chatList isn't enough — chats persist in DB too. Delete-on-DB
      // happens further below for chats we drop locally that match an expired
      // official event (no `expiresAt` field — we parse the date string).
      const toDeleteInDb: number[] = []
      setChatList(cl => cl.filter(c => {
        const eventId = c.communityEventId || c.hostEventId || c.eventRefId
        if (eventId) {
          const ev = dbCommunityEventsRef.current.find((e: any) => e.id === eventId)
            || feedOfficialDbEventsRef.current?.find?.((e: any) => e.id === eventId)
          if (ev) {
            // Community events carry `expiresAt` directly. Official events only
            // expose `date_label` / `time` — parse those to a Date, otherwise
            // post-event chats live forever in DB.
            let evStartMs: number = ev.expiresAt && ev.expiresAt > 0 ? ev.expiresAt : 0
            if (!evStartMs) {
              const parsed = parseEventDateTime(ev.date_label || ev.time || '')
              if (parsed) evStartMs = parsed.getTime()
            }
            if (evStartMs > 0 && evStartMs + EXPIRE_AFTER < now) {
              cancelledByCleanup.push(eventId)
              if (typeof c.id === 'number' && c.id < 1e12) toDeleteInDb.push(c.id)
              return false
            }
          } else if (eventId < 100000) {
            // Community event not in DB → it was deleted → drop orphan chat.
            cancelledByCleanup.push(eventId)
            if (typeof c.id === 'number' && c.id < 1e12) toDeleteInDb.push(c.id)
            return false
          }
        }
        if (c.chatExpiresAt && c.chatExpiresAt < now) {
          if (eventId) cancelledByCleanup.push(eventId)
          if (typeof c.id === 'number' && c.id < 1e12) toDeleteInDb.push(c.id)
          return false
        }
        return true
      }))
      // Delete expired chats from DB so they don't get replayed via realtime
      // chat_members INSERT on next reconnect. DELETE chats triggers CASCADE on
      // messages.chat_id and chat_members.chat_id — single statement is enough,
      // and avoids the RLS trap where chat_members policies block deleting other
      // users' rows while we're still a member.
      if (toDeleteInDb.length > 0 && userData?.dbId) {
        ;(async () => {
          for (const chatId of toDeleteInDb) {
            await supabase.from('chats').delete().eq('id', chatId)
          }
        })()
      }
      if (cancelledByCleanup.length > 0) {
        // Persist the cancellation so realtime chat_members INSERT replays
        // (e.g., reconnecting on app load) can't resurrect these chats. The
        // listener at line ~7097 already skips when event_id is here.
        cancelledByCleanup.forEach(id => cancelledEventIdsRef.current.add(id))
        setCancelledEventIds(prev => [...new Set([...prev, ...cancelledByCleanup])])
      }
    }
    check()
    // Re-check every 5 min instead of hourly so orphan chats get pruned
    // quickly once dbCommunityEvents loads / events get deleted.
    const interval = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(interval)
    // Re-run when dbCommunityEvents changes — initial mount may not have DB events
    // loaded yet, so the first check() can't distinguish orphan chats from "still
    // loading". Re-fire when fresh event data arrives.
  }, [persistLoadedState, dbCommunityEvents.length])

  // Watch for crew/partner found on joined events
  const prevActiveEventsRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    const myEvents = MOCK_EVENTS.filter(e => joinedEvents?.[e.id] && joinedEvents[e.id] !== 'confirmed')
    myEvents.forEach(ev => {
      const format    = userEventFormat?.[ev.id] || 'squad'
      const cap       = VIBE_FORMAT_MAX[format] || 5
      const threshold = VIBE_FORMAT_THRESHOLD[format] || cap
      const partnersFound = Math.min(cap - 1, (ev.id % Math.max(1, threshold - 1)) + 1)
      const found     = 1 + partnersFound
      const isActive  = found >= threshold
      if (isActive && !prevActiveEventsRef.current.has(ev.id)) {
        const isDuo = format === '1+1'
        addNotif({
          type: 'crew_ready',
          emoji: isDuo ? '🎯' : '🔥',
          color: isDuo ? '#EC4899' : '#43E97B',
          title: isDuo ? 'Partner found!' : 'Your crew is ready!',
          body: ev.title,
        })
      }
      if (isActive) prevActiveEventsRef.current.add(ev.id)
      else prevActiveEventsRef.current.delete(ev.id)
    })
  }, [joinedEvents, userEventFormat])

  // Watch for new chats (approvals / matches). Skip during hydration window —
  // AsyncStorage + realtime + fallback poll race and may briefly push chatList
  // length up before dedup, triggering a "you matched" notif for already-known chats.
  // Re-arm on every user change (logout/login) so the window applies again.
  const chatNotifReadyRef = useRef(false)
  useEffect(() => {
    chatNotifReadyRef.current = false
    prevChatCountRef.current = 0
    const t = setTimeout(() => { chatNotifReadyRef.current = true }, 3000)
    return () => clearTimeout(t)
  }, [userData?.dbId])
  useEffect(() => {
    if (chatNotifReadyRef.current && chatList.length > prevChatCountRef.current && prevChatCountRef.current > 0) {
      const newest = chatList[0]
      // Only notify for genuinely fresh chats (created within last 10s). Older
      // timestamps come from AsyncStorage restore / realtime re-sync of existing chats.
      const chatTime = new Date(newest.time || 0).getTime()
      const isFresh = chatTime > 0 && Date.now() - chatTime < 10000
      if (isFresh) {
        if (newest.type === 'duo') {
          addNotif({ type: 'match', emoji: '✨', color: '#EC4899', title: `You matched with ${newest.name}!`, body: newest.event || 'Check your chats' })
        } else {
          addNotif({ type: 'group_chat', emoji: '🎉', color: '#10B981', title: 'Group chat is live!', body: newest.event || 'Your crew is ready' })
        }
      }
    }
    prevChatCountRef.current = chatList.length
  }, [chatList.length])

  const timeAgo = (ms: number) => {
    const s = Math.floor((Date.now() - ms) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  // ── End Notifications ──────────────────────────────────────────────────────

  const [toast, setToast] = useState<{ visible: boolean; text: string; title?: string; emoji?: string }>({ visible: false, text: '' })
  const toastAnim = useRef(new Animated.Value(0)).current

  const showToast = (text: string, title?: string, emoji?: string, holdMs: number = 3500) => {
    setToast({ visible: true, text, title, emoji })
    toastAnim.setValue(0)
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.delay(holdMs),
      Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, text: '' }))
  }

  const handleJoinConfirmed = (ev: any, format: string, transport: string) => {
    const FORMAT_LABEL: Record<string, string> = { '1+1': '1+1', squad: 'Squad', party: 'Group' }
    const TRANSPORT_LABEL: Record<string, string> = { car: 'Can give a lift', lift: 'Needs a lift', meet: 'Meeting there' }
    const parts = [FORMAT_LABEL[format], TRANSPORT_LABEL[transport]].filter(Boolean)
    showToast(parts.join(' · '), 'Finding your crew...')
    // Clear stale invite/pass state from previous sessions for this event
    setSentCrewInvites(prev => {
      const next = { ...prev }
      Object.keys(next).filter(k => k.startsWith(`${ev.id}_`)).forEach(k => delete next[k])
      return next
    })
    setPassedRequests(prev => { const n = { ...prev }; delete n[ev.id]; return n })
    // Joining an official event → start crew-finding in Vibe Check
    if (ev?.type === 'official' && !ev?.isHosted) {
      setActiveTab('vibecheck')
      markNotifsReadForPlans?.()
    }
  }

  // Match animation refs
  const matchFlash   = useRef(new Animated.Value(0)).current
  const matchLeftX   = useRef(new Animated.Value(-80)).current
  const matchRightX  = useRef(new Animated.Value(80)).current
  const matchScale   = useRef(new Animated.Value(0.7)).current

  // checkMatch: always match when user vibes (demo — every vibe is mutual)
  const checkMatch = (_seeker: any, _eventId?: number) => true

  // Event ids the user just requested → guards the optimistic 'pending' from
  // being wiped by the status poll before the DB upsert is visible (caused the
  // "event disappears then reappears" flicker right after tapping Request).
  const recentlyRequestedRef = useRef<Record<number, number>>({})

  const handleJoinEvent = (ev: any, transport?: string) => {
    const isFull = ev.participantsCount >= ev.maxParticipants
    if (isFull) return
    const currentState = joinedEvents[ev.id]
    // Distinguish "add" call (from confirmJoin, always passes transport) vs
    // "leave" call (from event-card Leave button, no transport). Without this
    // split, the toggle removes events the user just joined when backfill
    // had pre-populated their state to 'confirmed' from DB.
    const isAddAction = transport !== undefined
    setJoinedEvents(prev => {
      if (isAddAction) {
        if (!prev[ev.id]) return { ...prev, [ev.id]: 'pending' }
        if (prev[ev.id] === 'pending') {
          if (ev.type === 'community' && !ev.isHosted) return prev // wait for host
          return { ...prev, [ev.id]: 'joined' }
        }
        return prev // already 'joined'/'confirmed' — keep as is
      }
      // Leave action — remove if present.
      if (!prev[ev.id]) return prev
      const next = { ...prev }
      delete next[ev.id]
      return next
    })
    // Side effects OUTSIDE the state updater
    if (!currentState && ev.type === 'community' && !ev.isHosted) {
      recentlyRequestedRef.current[ev.id] = Date.now()
      // Insert real join request into DB
      if (userData?.dbId && ev.hostId) {
        ;(async () => {
          // Block re-submission if host already rejected us for this event.
          // Without this, DELETE-then-rejoin loops kept the host's inbox
          // filling with the same request.
          const { data: existing } = await supabase.from('join_requests')
            .select('id, status').eq('event_id', ev.id).eq('requester_id', userData.dbId).maybeSingle()
          if (existing?.status === 'rejected') {
            showToast('You can\'t apply to this event', 'Request was declined', '🚫')
            // Roll back the local state we optimistically set above.
            setJoinedEvents(prev => { const n = { ...prev }; delete n[ev.id]; return n })
            return
          }
          if (existing) return // already pending/approved/confirmed — nothing to do
          // Upsert (not insert) — re-requesting an event you previously left can
          // collide with a leftover row on the (event_id, requester_id) unique key
          // before the leave-cleanup delete lands. Upsert just resets it to pending.
          const { error } = await supabase.from('join_requests').upsert({
            event_id: ev.id,
            requester_id: userData.dbId,
            host_id: ev.hostId,
            status: 'pending',
            transport: transport || null,
          }, { onConflict: 'event_id,requester_id' })
          if (error) console.warn('join_request upsert error:', error.message)
          // Notify the host someone wants in.
          else if (ev.hostId) {
            sendPush([ev.hostId], `${userData.name || 'Someone'} wants to join`,
              ev.title || 'your plan', { screen: 'plans', eventId: ev.id, type: 'join_request', emoji: '🙋', color: '#6366F1' })
          }
        })()
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const handleLike = (seeker: any) => {
    setVibeResults(prev => ({ ...prev, [seeker.id]: 'vibe' }))
    setVibes(prev => [...prev, seeker.id])
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const evId = eventDetail?.id
    if (checkMatch(seeker, evId)) {
      setTimeout(() => {
        setMatchedWith(seeker)
        // Flash + slide-in animation
        matchFlash.setValue(0); matchLeftX.setValue(-80); matchRightX.setValue(80); matchScale.setValue(0.7)
        Animated.parallel([
          Animated.sequence([
            Animated.timing(matchFlash,  { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(matchFlash,  { toValue: 0.92, duration: 200, useNativeDriver: true }),
          ]),
          Animated.spring(matchLeftX,  { toValue: 0, friction: 7, useNativeDriver: true }),
          Animated.spring(matchRightX, { toValue: 0, friction: 7, useNativeDriver: true }),
          Animated.spring(matchScale,  { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start()
      }, 350)
    }
  }

  const handlePass = (id: number) => setVibeResults(prev => ({ ...prev, [id]: 'pass' }))

  const DUO_REPLIES = [
    "Sounds great! 😊", "Yeah, totally! See you there 🙌", "Perfect, can't wait!",
    "Nice, looking forward to it ✨", "Sure thing! 👍", "Awesome! Should be a good one 🎉",
    "Cool, see you soon!", "Great, I'll be there 🙂", "Sounds like a plan!",
    "That works for me 💯",
  ]
  const GROUP_REPLIES = [
    "Looking forward to it! 🎉", "Anyone need a lift? 🚗", "What time should we meet?",
    "I'll be there! 🙌", "Can't wait! ✨", "This is going to be great 🔥",
    "See you all there!", "So excited for this 🌊", "Who else is coming early?",
  ]

  const formatChatDateLabel = (dateStr: string) => {
    if (!dateStr) return ''
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    const d = new Date(dateStr)
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const handleSend = () => {
    if (!chatInput.trim() || !openChat) return
    const text = chatInput.trim()
    // Snapshot reply from ref to bypass stale state closure when user taps Send
    // before React commits the long-press setReplyTo update.
    const currentReply = replyToRef.current
    const _now = new Date()
    const newMsg = { from: 'me', text, time: _now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: _now.toISOString().slice(0, 10), replyTo: currentReply || undefined }
    setChatMessages(prev => ({ ...prev, [openChat.id]: [...(prev[openChat.id] || []), newMsg] }))
    // Sending = obviously seen — clear the unread dot and bump lastReadAt.
    const nowMs = Date.now()
    setChatList(prev => prev.map(c => c.id === openChat.id ? { ...c, lastMsg: `You: ${text}`, time: new Date().toISOString(), isNew: false } : c))
    setLastReadAtMap(prev => ({ ...prev, [openChat.id]: nowMs }))
    lastReadAtMapRef.current = { ...lastReadAtMapRef.current, [openChat.id]: nowMs }
    if (typeof openChat.id === 'number' && openChat.id < 1e12 && userData?.dbId) {
      supabase.from('chat_members')
        .update({ last_read_at: new Date(nowMs).toISOString() })
        .eq('chat_id', openChat.id).eq('profile_id', userData.dbId)
        .then(() => {})
    }
    setChatInput('')
    setReplyTo(null)
    replyToRef.current = null
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)

    // Push to the other members — those with the app closed/backgrounded get
    // notified. Collect from memberProfiles (group) + partnerProfile (duo).
    if (userData?.dbId) {
      const recipientSet = new Set<string>()
      ;(openChat.memberProfiles || []).forEach((m: any) => { if (m?.id) recipientSet.add(m.id) })
      if (openChat.partnerProfile?.id) recipientSet.add(openChat.partnerProfile.id)
      recipientSet.delete(userData.dbId)
      const pushRecipients = [...recipientSet]
      if (pushRecipients.length > 0) {
        const evTitle = openChat.event || openChat.name || 'Parea'
        sendPush(pushRecipients, userData.name || 'New message', text, { screen: 'chat', chatId: openChat.id, eventTitle: evTitle, type: 'new_message', emoji: '💬', color: '#6366F1' })
      }
    }

    // Для community-чатов — пишем в Supabase + broadcast
    const chatEvId = openChat.communityEventId || openChat.hostEventId
    if (chatEvId && userData?.dbId) {
      const payload = { text, sender_id: userData.dbId, created_at: new Date().toISOString(), reply_to_text: currentReply?.text || null, reply_to_sender: currentReply?.senderName || null }
      // Include chat_id when we have a real DB id (not the temporary Date.now()
      // sentinel). Without this the message row carries only community_event_id
      // and the hydrate-previews query (filtered by chat_id) never finds it,
      // so the Chats preview keeps showing the "Group chat created!" placeholder.
      const row: any = { community_event_id: chatEvId, sender_id: userData.dbId, text, reply_to_text: currentReply?.text || null, reply_to_sender: currentReply?.senderName || null }
      if (typeof openChat.id === 'number' && openChat.id < 1e12) row.chat_id = openChat.id
      supabase.from('messages').insert(row)
        .then(({ error }) => { if (error) console.warn('message insert error:', error.message) })
      const bcast = { type: 'broadcast', event: 'message', payload }
      // httpSend (REST) is the explicit one-off broadcast — Supabase deprecated
      // the implicit REST fallback that fired when .send() was called on a
      // channel that wasn't WebSocket-ready. We still also INSERT to messages,
      // so DB realtime delivers regardless. httpSend is just the instant nudge.
      if (communityBroadcastRef.current) communityBroadcastRef.current.httpSend('message', payload)
      else communityBroadcastQueueRef.current.push(bcast)
      return
    }

    // Для дуо чатов (crew invite) — пишем в Supabase через chat_id + broadcast
    const isChatDuoSend = openChat.type === 'duo' || (openChat.type === 'group' && !openChat.communityEventId && !openChat.hostEventId)
    if (isChatDuoSend && openChat.id && userData?.dbId) {
      const payload = { text, sender_id: userData.dbId, created_at: new Date().toISOString(), reply_to_text: currentReply?.text || null, reply_to_sender: currentReply?.senderName || null, sender_name: userData.name || '', sender_photo: (userData as any).photos?.[0] || null, sender_color: (userData as any).color || '#818CF8' }
      // Skip DB insert if chat has a fake local ID (Date.now() > 1e12) — not a real DB chat
      const sendBroadcast = (extraPayload: any = {}) => {
        const fullPayload = { ...payload, ...extraPayload }
        const bcast = { type: 'broadcast', event: 'message', payload: fullPayload }
        if (duoBroadcastRef.current) duoBroadcastRef.current.httpSend('message', fullPayload)
        else duoBroadcastQueueRef.current.push(bcast)
      }
      if (openChat.id < 1e12) {
        // INSERT first so we can broadcast with the real DB id — receivers dedup
        // via _dbId across broadcast/inbox/loadHistory paths.
        supabase.from('messages').insert({ chat_id: openChat.id, sender_id: userData.dbId, text, reply_to_text: currentReply?.text || null, reply_to_sender: currentReply?.senderName || null })
          .select('id').single()
          .then(({ data, error }) => {
            if (error) {
              console.warn('duo message insert error:', error.message)
              if (error.code === '42501' || error.message?.includes('policy')) {
                setChatMessages(prev => ({ ...prev, [openChat.id]: (prev[openChat.id] || []).slice(0, -1) }))
                Alert.alert('Cannot send', 'You cannot message this person.')
                return
              }
            }
            sendBroadcast({ _dbId: data?.id })
          })
      } else {
        sendBroadcast()
      }
      return
    }

    // Mock auto-reply (только для не-community чатов без real backend)
    const chatId = openChat.id
    const delay = 1500 + Math.random() * 1500
    if (openChat.type === 'duo') {
      const replyText = DUO_REPLIES[Math.floor(Math.random() * DUO_REPLIES.length)]
      setTimeout(() => {
        const replyMsg = { from: 'them', text: replyText, time: 'now', date: new Date().toISOString().slice(0, 10) }
        setChatMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), replyMsg] }))
        setChatList(prev => prev.map(c => c.id === chatId ? { ...c, lastMsg: replyText, time: new Date().toISOString(), isNew: true } : c))
        // Notify only if chat is not currently open
        setOpenChat((cur: any) => {
          if (!cur || cur.id !== chatId) {
            addNotif({ type: 'new_message', emoji: '💬', color: '#6366F1', title: openChat.name || 'New message', body: replyText, chatId })
          }
          return cur
        })
      }, delay)
    } else if (openChat.type === 'group') {
      const profiles: any[] = openChat.memberProfiles || []
      if (profiles.length > 0) {
        const sender = profiles[Math.floor(Math.random() * profiles.length)]
        const replyText = GROUP_REPLIES[Math.floor(Math.random() * GROUP_REPLIES.length)]
        setTimeout(() => {
          const replyMsg = { from: 'them', text: replyText, time: 'now', date: new Date().toISOString().slice(0, 10), senderName: sender.name, senderPhoto: sender.photo, senderColor: sender.color }
          setChatMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), replyMsg] }))
          setChatList(prev => prev.map(c => c.id === chatId ? { ...c, lastMsg: `${sender.name}: ${replyText}`, time: new Date().toISOString(), isNew: true } : c))
          setOpenChat((cur: any) => {
            if (!cur || cur.id !== chatId) {
              addNotif({ type: 'new_message', emoji: '💬', color: '#6366F1', title: `${sender.name} in ${openChat.event}`, body: replyText, chatId })
            }
            return cur
          })
        }, delay)
      }
    }
  }

  // Realtime чат для дуо чатов (crew invite)
  useEffect(() => {
    // Treat as duo if explicitly duo, OR if group-type but no communityEventId (legacy saved chats)
    const isChatDuo = openChat?.type === 'duo' || (openChat?.type === 'group' && !openChat?.communityEventId && !openChat?.hostEventId)
    if (!openChat?.id || !isChatDuo || !userData?.dbId) return
    const chatId = openChat.id
    // Load history — retry once after 2s if empty (race: sender insert may not have propagated)
    const loadHistory = (retry = false) => {
      supabase.from('messages')
        .select('id, sender_id, text, created_at, reply_to_text, reply_to_sender')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(100)
        .then(({ data, error }) => {
          if (error) { console.warn('history load error:', error.message); return }
          if (!data || data.length === 0) {
            // If chat was empty and this is the first try, retry after 2s
            if (!retry) setTimeout(() => loadHistory(true), 2000)
            return
          }
          const msgs = data.map((m: any) => {
            const isSystem = /(left|joined) the group/.test(m.text || '')
            if (isSystem) {
              return { from: 'system', text: m.text, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), _dbId: m.id }
            }
            const isMe = m.sender_id === userData.dbId
            const t = new Date(m.created_at)
            const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const sender = isMe ? null : (openChat.memberProfiles || []).find((p: any) => p.id === m.sender_id)
            return {
              from: isMe ? 'me' : 'them',
              text: m.text, time,
              date: t.toISOString().slice(0, 10),
              senderName: isMe ? undefined : (sender?.name || ''),
              senderPhoto: isMe ? undefined : (sender?.photo || null),
              senderColor: isMe ? undefined : (sender?.color || '#818CF8'),
              replyTo: m.reply_to_text ? { text: m.reply_to_text, senderName: m.reply_to_sender || '' } : undefined,
              _dbId: m.id,
              _senderId: m.sender_id,
              _ts: m.created_at,
            }
          })
          setChatMessages(prev => {
            const existing = prev[chatId] || []
            // Preserve any local optimistic msgs (from='me', no _dbId yet) whose
            // text isn't already in the DB result. Prevents reply flicker —
            // optimistic msg with replyTo briefly disappearing on polling.
            const localOptimistic = existing.filter((m: any) =>
              m.from === 'me' && !m._dbId &&
              !msgs.some((dbM: any) => dbM.from === 'me' && dbM.text === m.text)
            )
            return { ...prev, [chatId]: [...msgs, ...localOptimistic] }
          })
          // Update preview in chatList so Chats tab shows fresh lastMsg without
          // needing the user to open the chat first.
          const last = msgs[msgs.length - 1]
          if (last) {
            const previewText = last.from === 'me'
              ? `You: ${last.text}`
              : (last.senderName ? `${last.senderName}: ${last.text}` : last.text)
            setChatList(prev => prev.map(c =>
              c.id === chatId ? { ...c, lastMsg: previewText, time: last._ts || c.time } : c
            ))
          }
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 400)
        })
    }
    loadHistoryRef.current = loadHistory
    loadHistory()
    // Polling fallback — catches messages missed while chat was closed or broadcast dropped
    const pollInterval = setInterval(loadHistory, 3000)
    // Party/squad chats: use or create persistent broadcast channel
    const isPartyChat = Object.values(officialEventChatMapRef.current).includes(chatId)
    if (isPartyChat && !partyChatBroadcastChannels.current[chatId]) {
      // Channel not yet created (e.g. app restored from AsyncStorage before useEffect ran)
      const bcastCh = supabase.channel(`duo_chat_${chatId}`)
        .on('broadcast', { event: 'message' }, ({ payload }: any) => {
          if (payload.sender_id === userData.dbId) return
          const t = new Date(payload.created_at)
          const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          if (openChatRef.current?.id === chatId) {
            const sender = (openChatRef.current?.memberProfiles || []).find((p: any) => p.id === payload.sender_id)
            const newMsg = { from: 'them', text: payload.text, time, date: t.toISOString().slice(0, 10), senderName: sender?.name || payload.sender_name || '', senderPhoto: sender?.photo || payload.sender_photo || null, senderColor: sender?.color || payload.sender_color || '#818CF8', _dbId: payload._dbId, _senderId: payload.sender_id }
            setChatMessages((prev: any) => {
              const existing = prev[chatId] || []
              const recent = existing.slice(-8)
              const isDup = recent.some((m: any) =>
                (payload._dbId && m._dbId === payload._dbId) ||
                (m.text === payload.text && m.from === 'them' && m._senderId === payload.sender_id)
              )
              if (isDup) return prev
              return { ...prev, [chatId]: [...existing, newMsg] }
            })
            setChatList((prev: any) => prev.map((c: any) => c.id === chatId ? { ...c, lastMsg: payload.text, time: payload.created_at } : c))
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
          } else {
            setChatList((prev: any) => prev.map((c: any) => c.id === chatId ? { ...c, lastMsg: payload.text, isNew: true, time: payload.created_at } : c))
          }
        })
        .subscribe()
      partyChatBroadcastChannels.current[chatId] = bcastCh
    }
    const persistentChannel = partyChatBroadcastChannels.current[chatId]
    if (persistentChannel) {
      duoBroadcastRef.current = persistentChannel
      // Flush queued messages — use httpSend to match the new send path.
      duoBroadcastQueueRef.current.forEach((p: any) => persistentChannel.httpSend(p.event || 'message', p.payload))
      duoBroadcastQueueRef.current = []
      // Reload to catch anything missed while chat was closed
      loadHistory()
      setTimeout(loadHistory, 1500)
      return () => { clearInterval(pollInterval); duoBroadcastRef.current = null }
    }
    // Non-party duo chat (crew invite 1+1) — create own channel
    if (duoBroadcastRef.current) {
      supabase.removeChannel(duoBroadcastRef.current)
      duoBroadcastRef.current = null
    }
    const channel = supabase.channel(`duo_chat_${chatId}`)
      .on('broadcast', { event: 'message' }, ({ payload }: any) => {
          if (payload.sender_id === userData.dbId) return
          const time = new Date(payload.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const newMsg = { from: 'them', text: payload.text, time, date: new Date(payload.created_at).toISOString().slice(0, 10), senderName: payload.sender_name || '', senderPhoto: payload.sender_photo || null, senderColor: payload.sender_color || '#818CF8', replyTo: payload.reply_to_text ? { text: payload.reply_to_text, senderName: payload.reply_to_sender || '' } : undefined, _dbId: payload._dbId, _senderId: payload.sender_id }
          setChatMessages(prev => {
            const existing = prev[chatId] || []
            const recent = existing.slice(-8)
            const isDup = recent.some((m: any) =>
              (payload._dbId && m._dbId === payload._dbId) ||
              (m.text === payload.text && m.from === 'them' && (m as any)._senderId === payload.sender_id)
            )
            if (isDup) return prev
            return { ...prev, [chatId]: [...existing, newMsg] }
          })
          // Don't flag unread if the chat is currently open — user is reading.
          // Same gate as in the party-broadcast handler above.
          const chatOpen = openChatRef.current?.id === chatId
          setChatList(prev => prev.map(c => c.id === chatId ? { ...c, lastMsg: payload.text, time: payload.created_at, isNew: chatOpen ? c.isNew : true } : c))
          if (chatOpen) {
            const msgMs = new Date(payload.created_at).getTime()
            setLastReadAtMap(prev => ({ ...prev, [chatId]: Math.max(prev[chatId] || 0, msgMs) }))
            lastReadAtMapRef.current = { ...lastReadAtMapRef.current, [chatId]: Math.max(lastReadAtMapRef.current[chatId] || 0, msgMs) }
          }
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
        })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          duoBroadcastRef.current = channel
          duoBroadcastQueueRef.current.forEach((p: any) => channel.httpSend(p.event || 'message', p.payload))
          duoBroadcastQueueRef.current = []
          loadHistory()
          setTimeout(loadHistory, 1500)
        }
      })
    return () => { clearInterval(pollInterval); supabase.removeChannel(channel); duoBroadcastRef.current = null; duoBroadcastQueueRef.current = [] }
  }, [openChat?.id, openChat?.type, userData?.dbId])

  // Reload history when app comes back to foreground — broadcasts are missed while backgrounded
  const loadHistoryRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && loadHistoryRef.current) {
        loadHistoryRef.current()
      }
    })
    return () => sub.remove()
  }, [])

  // Deep link handler: works for pareaapp:///event/:id (APK), exp://...--/event/:id (Expo Go), https://joinparea.app/event/:id (Universal Links)
  const handledInitialUrlRef = useRef(false)
  const pendingDeepLinkIdRef = useRef<number | null>(null)
  useEffect(() => {
    const tryOpen = (id: number) => {
      const allKnown = [...MOCK_EVENTS, ...MOCK_COMMUNITY_EVENTS, ...userCreatedEvents, ...dbCommunityEvents, ...feedOfficialDbEvents]
      const found = allKnown.find(e => e.id === id || e._dbId === id)
      if (found) {
        setEventDetail(found)
        pendingDeepLinkIdRef.current = null
      } else {
        // Event not loaded yet — keep pending; effect re-runs on data updates and will retry
        pendingDeepLinkIdRef.current = id
      }
    }
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = ExpoLinking.parse(url)
      const path = parsed.path || ''
      const match = path.match(/^event\/(\d+)/) || url.match(/event\/(\d+)/)
      if (match) tryOpen(parseInt(match[1]))
    }

    // Retry pending deep link when event data finally loads
    if (pendingDeepLinkIdRef.current != null) tryOpen(pendingDeepLinkIdRef.current)

    // Run once: initial URL + pending stash from /event/[id] route file
    if (!handledInitialUrlRef.current) {
      handledInitialUrlRef.current = true
      Linking.getInitialURL().then(url => { if (url) handleUrl({ url }) })
      AsyncStorage.getItem('pendingDeepLinkEventId').then(stored => {
        if (stored) {
          AsyncStorage.removeItem('pendingDeepLinkEventId')
          tryOpen(parseInt(stored))
        }
      })
    }
    const sub = Linking.addEventListener('url', handleUrl)
    return () => sub.remove()
  }, [dbCommunityEvents, feedOfficialDbEvents, userCreatedEvents])

  // Realtime чат для community events (и для хоста через hostEventId)
  useEffect(() => {
    if (realtimeChatRef.current) {
      supabase.removeChannel(realtimeChatRef.current)
      realtimeChatRef.current = null
    }
    const evId = openChat?.communityEventId || openChat?.hostEventId
    if (!evId || !userData?.dbId) return

    const chatId = openChat.id

    // Загружаем историю сообщений
    const loadCommunityHistory = () => supabase.from('messages')
      .select('id, sender_id, text, created_at, reply_to_text, reply_to_sender')
      .eq('community_event_id', evId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!data) return
        const profilesInChat: any[] = openChat.memberProfiles || []
        const msgs = data.map((m: any) => {
          const isSystem = /(left|joined) the group/.test(m.text || '')
          if (isSystem) {
            return { from: 'system', text: m.text, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), _dbId: m.id }
          }
          const isMe = m.sender_id === userData.dbId
          const sender = profilesInChat.find((p: any) => p.id === m.sender_id)
          const t = new Date(m.created_at)
          const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return {
            from: isMe ? 'me' : 'them',
            text: m.text,
            time,
            date: t.toISOString().slice(0, 10),
            senderName: isMe ? '' : (sender?.name || ''),
            senderPhoto: isMe ? '' : (sender?.photo || ''),
            senderColor: isMe ? '' : (sender?.color || '#818CF8'),
            replyTo: m.reply_to_text ? { text: m.reply_to_text, senderName: m.reply_to_sender || '' } : undefined,
            _dbId: m.id,
            _senderId: m.sender_id,
          }
        })
        setChatMessages(prev => {
          const existing = prev[chatId] || []
          // Preserve just-sent optimistic msgs (from='me', no _dbId) whose text
          // isn't in the DB result yet — otherwise a poll firing between send and
          // insert-commit wipes the sender's own message until the next poll.
          const localOptimistic = existing.filter((mm: any) =>
            mm.from === 'me' && !mm._dbId &&
            !msgs.some((dbM: any) => dbM.from === 'me' && dbM.text === mm.text)
          )
          return { ...prev, [chatId]: [...msgs, ...localOptimistic] }
        })
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 400)
      })
    loadCommunityHistory()
    // Polling fallback — catches messages missed while chat was closed or broadcast dropped
    const communityPollInterval = setInterval(loadCommunityHistory, 10000)

    // Broadcast подписка для real-time доставки
    if (communityBroadcastRef.current) {
      supabase.removeChannel(communityBroadcastRef.current)
      communityBroadcastRef.current = null
    }
    const channel = supabase.channel(`community_chat_${evId}`)
      .on('broadcast', { event: 'message' }, async ({ payload: bcast }: any) => {
        const m = bcast
        if (m.sender_id === userData.dbId) return // своё уже добавили оптимистично
        const profilesInChat: any[] = openChat.memberProfiles || []
        let sender = profilesInChat.find((p: any) => p.id === m.sender_id)
        // Если профиль отправителя не найден (новый участник), подгружаем из БД
        if (!sender && m.sender_id) {
          const { data: freshProfile } = await supabase.from('profiles').select('id, name, photos, color').eq('id', m.sender_id).single()
          if (freshProfile) {
            sender = { id: freshProfile.id, name: freshProfile.name, photo: freshProfile.photos?.[0] || '', color: freshProfile.color || '#818CF8' }
            setOpenChat((cur: any) => {
              if (!cur || cur.id !== chatId) return cur
              const alreadyIn = (cur.memberProfiles || []).find((p: any) => p.id === sender.id)
              if (alreadyIn) return cur
              const newProfiles = [...(cur.memberProfiles || []), sender]
              // Sync chatList too so the new member persists after chat is closed
              setChatList(prev => prev.map(c =>
                c.id === chatId
                  ? { ...c, memberProfiles: newProfiles, members: (c.members || 1) + 1, avatars: newProfiles.map((p: any) => p.photo).filter(Boolean), colors: newProfiles.map((p: any) => p.color) }
                  : c
              ))
              return { ...cur, memberProfiles: newProfiles, members: (cur.members || 1) + 1 }
            })
          }
        }
        const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const msgDate = new Date(m.created_at).toISOString().slice(0, 10)
        // Системные сообщения (e.g. "X left the group") — показываем по центру
        const isSystemMsg = /(left|joined) the group/.test(m.text || '')
        const newMsg = isSystemMsg ? {
          from: 'system', text: m.text, time,
        } : {
          from: 'them',
          text: m.text,
          time,
          date: msgDate,
          senderName: sender?.name || '',
          senderPhoto: sender?.photo || '',
          senderColor: sender?.color || '#818CF8',
          replyTo: m.reply_to_text ? { text: m.reply_to_text, senderName: m.reply_to_sender || '' } : undefined,
          _senderId: m.sender_id,
        }
        // Dedup like the duo handler — a poll may have already loaded this message
        // from the DB; without this the broadcast appends a duplicate until the next
        // poll overwrites it (the "message appears twice then vanishes" flicker).
        setChatMessages(prev => {
          const existing = prev[chatId] || []
          const recent = existing.slice(-8)
          const isDup = recent.some((mm: any) =>
            mm.text === newMsg.text &&
            mm.from === newMsg.from &&
            (isSystemMsg ? true : (mm.senderName || '') === (newMsg.senderName || ''))
          )
          if (isDup) return prev
          return { ...prev, [chatId]: [...existing, newMsg] }
        })
        const lastMsgText = isSystemMsg ? m.text : `${sender?.name || 'Someone'}: ${m.text}`
        // If the chat is open right now the user is reading it — don't mark it
        // unread, and advance lastReadAt so it stays read after leaving/reloading.
        const chatOpen = openChatRef.current?.id === chatId
        const msgMs = new Date(m.created_at).getTime()
        setChatList(prev => prev.map(c => c.id === chatId ? { ...c, lastMsg: lastMsgText, time: new Date().toISOString(), isNew: chatOpen ? c.isNew : !isSystemMsg } : c))
        if (chatOpen && !isSystemMsg) {
          setLastReadAtMap(prev => ({ ...prev, [chatId]: Math.max(prev[chatId] || 0, msgMs) }))
          lastReadAtMapRef.current = { ...lastReadAtMapRef.current, [chatId]: Math.max(lastReadAtMapRef.current[chatId] || 0, msgMs) }
          if (typeof chatId === 'number' && chatId < 1e12 && userData?.dbId) {
            supabase.from('chat_members')
              .update({ last_read_at: new Date(msgMs).toISOString() })
              .eq('chat_id', chatId).eq('profile_id', userData.dbId)
              .then(() => {})
          }
        }
        if (!isSystemMsg) {
          setOpenChat((cur: any) => {
            if (!cur || cur.id !== chatId) {
              addNotif({ type: 'new_message', emoji: '💬', color: '#6366F1', title: sender?.name || openChat.event, body: m.text, chatId })
            }
            return cur
          })
        }
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          communityBroadcastRef.current = channel
          communityBroadcastQueueRef.current.forEach((p: any) => channel.httpSend(p.event || 'message', p.payload))
          communityBroadcastQueueRef.current = []
        }
      })

    realtimeChatRef.current = channel
    return () => {
      clearInterval(communityPollInterval)
      supabase.removeChannel(channel)
      realtimeChatRef.current = null
      communityBroadcastRef.current = null
    }
  }, [openChat?.id, openChat?.communityEventId, openChat?.hostEventId, userData?.dbId])

  // Keyboard spacer removed — KeyboardAvoidingView handles it now

  // ── Background inbox subscription (updates lastMsg + isNew for ALL chats) ───
  useEffect(() => {
    if (!userData?.dbId) return
    if (inboxChannelRef.current) {
      supabase.removeChannel(inboxChannelRef.current)
    }
    const channel = supabase.channel('inbox_background')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const m = payload.new
        // Guard against duplicate INSERT events (React StrictMode dev double-mount,
        // brief overlap during channel re-subscribe). Each message id processed once.
        if (seenInboxMsgIdsRef.current.has(m.id)) return
        seenInboxMsgIdsRef.current.add(m.id)
        // Prevent unbounded growth — keep only most recent 200 ids
        if (seenInboxMsgIdsRef.current.size > 200) {
          const arr = Array.from(seenInboxMsgIdsRef.current)
          seenInboxMsgIdsRef.current = new Set(arr.slice(-200))
        }
        if (m.sender_id === userData.dbId) return // своё сообщение
        if (/(left|joined) the group/.test(m.text || '')) return // системные скипаем
        // Найти чат по community_event_id или по chat_id (дуо + group)
        const chat = chatListRef.current.find(c =>
          c.communityEventId === m.community_event_id || c.hostEventId === m.community_event_id
          || (m.chat_id && c.id === m.chat_id)
        )
        if (!chat) return
        // If the chat is currently open, treat the incoming message as read
        // right away — user is sitting in the chat. Without this, opening a
        // chat, receiving a message while reading, then reloading would
        // resurface the (already read) message with the unread dot.
        const isChatOpenNow = openChatRef.current?.id === chat.id
        const msgTime = new Date(m.created_at).getTime()
        if (isChatOpenNow) {
          setLastReadAtMap(prev => ({ ...prev, [chat.id]: Math.max(prev[chat.id] || 0, msgTime) }))
          lastReadAtMapRef.current = { ...lastReadAtMapRef.current, [chat.id]: Math.max(lastReadAtMapRef.current[chat.id] || 0, msgTime) }
          if (typeof chat.id === 'number' && chat.id < 1e12 && userData?.dbId) {
            supabase.from('chat_members')
              .update({ last_read_at: new Date(msgTime).toISOString() })
              .eq('chat_id', chat.id).eq('profile_id', userData.dbId)
              .then(() => {})
          }
        }
        // If we've already read this chat past the message's timestamp, treat
        // it as already-read (don't mark isNew=true again). Covers realtime
        // replay on reconnect after reload.
        const lastRead = lastReadAtMapRef.current[chat.id] || 0
        const alreadyRead = isChatOpenNow || msgTime <= lastRead
        // Don't early-return when chat is open: race between inbox and chat-specific
        // subscriptions means either path may miss the first message. Dedup by _dbId
        // (further down) prevents duplicates.
        // Найти имя отправителя из memberProfiles чата
        const sender = (chat.memberProfiles || []).find((p: any) => p.id === m.sender_id)
        const senderName = sender?.name || chat.name || 'Someone'
        const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setChatList(prev => prev.map(c =>
          c.id === chat.id
            ? { ...c, lastMsg: chat.type === 'duo' ? m.text : `${senderName}: ${m.text}`, time, isNew: alreadyRead ? c.isNew : true }
            : c
        ))
        // Also add to chatMessages so User 1 sees it immediately when opening the chat
        const inboxMsg = {
          from: 'them',
          text: m.text,
          time,
          date: new Date(m.created_at).toISOString().slice(0, 10),
          ...(chat.type !== 'duo' && { senderName, senderPhoto: sender?.photo || '', senderColor: sender?.color || '#818CF8' }),
          replyTo: m.reply_to_text ? { text: m.reply_to_text, senderName: m.reply_to_sender || '' } : undefined,
          _dbId: m.id,
        }
        setChatMessages(prev => {
          const existing = prev[chat.id] || []
          // Dedup by _dbId (preferred) OR by recent text+sender (covers broadcast-added msg without _dbId)
          const recent = existing.slice(-8)
          const isDup = recent.some((msg: any) =>
            msg._dbId === m.id ||
            (msg.text === m.text && msg.from === 'them' && (msg as any)._senderId === m.sender_id)
          )
          if (isDup) return prev
          return { ...prev, [chat.id]: [...existing, { ...inboxMsg, _senderId: m.sender_id }] }
        })
      })
      .subscribe()
    inboxChannelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      inboxChannelRef.current = null
    }
  }, [userData?.dbId])

  // Background broadcast subscriptions for all duo chats — receive messages even when chat is closed
  const bgDuoChannelsRef = useRef<Record<number, any>>({})
  useEffect(() => {
    if (!userData?.dbId) return
    const openChatId = openChat?.id
    // Rebuild all background channels excluding the currently open chat (handled by open-chat subscription)
    Object.values(bgDuoChannelsRef.current).forEach(ch => supabase.removeChannel(ch))
    bgDuoChannelsRef.current = {}
    const duoChats = chatList.filter((c: any) => c.type === 'duo' && c.id && c.id !== openChatId)
    duoChats.forEach((chat: any) => {
      const channel = supabase.channel(`duo_chat_${chat.id}`)
        .on('broadcast', { event: 'message' }, ({ payload }: any) => {
          if (payload.sender_id === userData.dbId) return
          const time = new Date(payload.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const newMsg = { from: 'them', text: payload.text, time, date: new Date(payload.created_at).toISOString().slice(0, 10), replyTo: payload.reply_to_text ? { text: payload.reply_to_text, senderName: payload.reply_to_sender || '' } : undefined }
          setChatMessages(prev => ({ ...prev, [chat.id]: [...(prev[chat.id] || []), newMsg] }))
          setChatList(prev => prev.map((c: any) => c.id === chat.id ? { ...c, lastMsg: payload.text, time, isNew: true } : c))
        })
        .subscribe()
      bgDuoChannelsRef.current[chat.id] = channel
    })
    return () => {
      Object.values(bgDuoChannelsRef.current).forEach(ch => supabase.removeChannel(ch))
      bgDuoChannelsRef.current = {}
    }
  }, [chatList.filter((c: any) => c.type === 'duo').map((c: any) => c.id).join(','), userData?.dbId, openChat?.id])

  // Scroll to bottom when chat opens (after modal animation ~300ms)
  useEffect(() => {
    if (!openChat?.id) return
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 350)
    return () => clearTimeout(t)
  }, [openChat?.id])

  return (
    <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F0F9FF']} style={s.fill}>
      <StatusBar style="dark" hidden={activeTab === 'vibecheck'} />
      <SafeAreaView style={s.fill} edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : undefined}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, display: activeTab === 'home' ? 'flex' : 'none' }}>
            <HomeTab city={city} setCityOpen={setCityOpen} feedFilter={feedFilter} setFeedFilter={setFeedFilter} onEventPress={setEventDetail} joinedEvents={joinedEvents} onJoin={handleJoinEvent} userInterests={userData?.interests || []} setUserEventFormat={setUserEventFormat} setUserEventTransport={setUserEventTransport} onJoinConfirmed={handleJoinConfirmed} pendingJoinEv={pendingJoinEv} onPendingJoinConsumed={() => setPendingJoinEv(null)} extraEvents={[...userCreatedEvents.map(uc => { const dbVer = dbCommunityEvents.find(d => d.id === uc.id); return dbVer ? { ...uc, participantsCount: dbVer.participantsCount } : uc }), ...dbCommunityEvents.filter(e => !userCreatedEvents.some(u => u.id === e.id))]} approvedJoiners={approvedJoiners} tonightVibe={tonightVibe} setTonightVibe={(v: any) => { setTonightVibe(v); onUpdateUserData?.({ socialEnergy: v.energy, drinksPref: v.drinks, smokingPref: v.smoking }) }} onBellPress={openNotifPanel} unreadCount={unreadCount} bellShake={bellShake} userData={userData} onCancelHostedEvent={(ev: any) => { setUserCreatedEvents(prev => prev.filter(e => e.id !== ev.id)); setPendingJoinRequests(prev => { const n = { ...prev }; delete n[ev.id]; return n }); setApprovedJoiners(prev => { const n = { ...prev }; delete n[ev.id]; return n }); setChatList(prev => prev.filter(c => c.hostEventId !== ev.id)); showToast("Event deleted 🗑️") }} crewStats={crewStatsByEvent} />
          </View>
          <View style={{ position: 'absolute', top: -insets.top, left: 0, right: 0, bottom: 0, display: activeTab === 'vibecheck' ? 'flex' : 'none' }}>
          <VibeCheckTab
            topInset={insets.top}
            joinedEvents={joinedEvents}
            allEvents={[...MOCK_EVENTS, ...feedOfficialDbEvents, ...userCreatedEvents, ...dbCommunityEvents.filter(e => !userCreatedEvents.some(u => u.id === e.id))]}
            userEventFormat={userEventFormat}
            userEventTransport={userEventTransport}
            userData={userData}
            tonightVibe={tonightVibe}
            onBlockUser={handleBlock}
            onReportUser={(p: any) => setReportTarget(p)}
            eventAttendeesMap={eventAttendeesMap}
            communityEventMembers={communityEventMembers}
            hostConfirmedMembers={hostConfirmedMembers}
            approvedAtMap={approvedAtMap}
            incomingCrewInvites={incomingCrewInvites}
            sentCrewInvites={sentCrewInvites}
            readyCountMap={readyCountMap}
            crewPreviewMap={crewPreviewMap}
            passedIdsByEvent={passedIdsByEvent}
            crewsByEvent={crewsByEvent}
            onJoinSpecificCrew={async (ev: any, chatId: number) => {
              if (!userData?.dbId) return
              // User picked an existing crew from the list — add them to that chat.
              // Must use the SECURITY DEFINER RPC: a direct chat_members upsert is
              // blocked by RLS for a non-member (you can't see / insert into a chat
              // you're not in yet), which surfaced as "Could not join crew" when a
              // 3rd user tried to join a crew they'd discovered via get_event_crews.
              const { error } = await supabase.rpc('join_party_chat', { p_chat_id: chatId, p_host_id: null })
              if (error) { console.warn('join_party_chat error (join specific crew):', error.message); showToast('Try again', 'Could not join crew', '⚠️'); return }
              // Cancel my pending outgoing crew_invites for this event — otherwise
              // a duo-seeker who sent a duo-invite then joined a party crew leaves a
              // dangling pending invite; if the recipient later accepts it the duo
              // path would spawn a stray duo chat (the bug we hit cross-format).
              await supabase.from('crew_invites').update({ status: 'cancelled' })
                .eq('event_ref_id', ev.id).eq('inviter_id', userData.dbId).eq('status', 'pending')
              setSentCrewInvites(prev => {
                const next = { ...prev }
                Object.keys(next).filter(k => k.startsWith(`${ev.id}_`)).forEach(k => delete next[k])
                return next
              })
              // Local user choice (userEventFormat) is the source of truth for sizes.
              // If user picked party (20), make sure the DB row reflects that — otherwise
              // AI scoring filter (size compatibility) excludes others on size mismatch.
              {
                const sizeMap: Record<string, [number, number]> = { '1+1': [2, 2], squad: [3, 5], party: [6, 20] }
                const fmt = userEventFormat[ev.id]
                const localSizes: [number, number] | null = (fmt && sizeMap[fmt]) || null
                const { data: myRow } = await supabase.from('event_attendees')
                  .select('group_size_min, group_size_max')
                  .eq('event_ref_id', ev.id).eq('profile_id', userData.dbId).maybeSingle()
                if (myRow && myRow.group_size_min != null && myRow.group_size_max != null) {
                  // Row exists — update sizes to local choice if it differs (drift fix)
                  const update: any = { status: 'confirmed' }
                  if (localSizes && (myRow.group_size_min !== localSizes[0] || myRow.group_size_max !== localSizes[1])) {
                    update.group_size_min = localSizes[0]
                    update.group_size_max = localSizes[1]
                  }
                  await supabase.from('event_attendees').update(update)
                    .eq('event_ref_id', ev.id).eq('profile_id', userData.dbId)
                } else {
                  // No row — use local choice, fallback to inheriting from crew creator
                  let sizes: [number, number] = localSizes || [3, 5]
                  if (!localSizes) {
                    const { data: other } = await supabase.from('event_attendees')
                      .select('group_size_min, group_size_max')
                      .eq('event_ref_id', ev.id).neq('profile_id', userData.dbId).limit(1).maybeSingle()
                    if (other && other.group_size_min != null && other.group_size_max != null) {
                      sizes = [other.group_size_min, other.group_size_max]
                    }
                  }
                  await supabase.from('event_attendees').upsert({
                    event_ref_id: ev.id, event_title: ev.title, profile_id: userData.dbId,
                    status: 'confirmed', group_size_min: sizes[0], group_size_max: sizes[1],
                  }, { onConflict: 'event_ref_id,profile_id' })
                }
              }
              setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
              setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: chatId }))
              // Pull fresh members for the chat list entry
              const { data: members } = await supabase
                .from('chat_members')
                .select('profile_id, profiles:profile_id(id, name, photos, color, age, bio, langs, interests, goal)')
                .eq('chat_id', chatId)
              const memberProfiles = (members || []).filter((m: any) => m.profile_id !== userData.dbId).map((m: any) => {
                const p = (m as any).profiles || {}
                return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍' }
              })
              // Anchor chat expiry to event time, not now. Otherwise joining a
              // crew for an event in the past would give the chat a fresh 24h
              // window and cleanup would never catch it.
              const evChatExpiry = (ev.expiresAt && ev.expiresAt > 0 ? ev.expiresAt : Date.now()) + 24 * 60 * 60 * 1000
              // If chat already in list (e.g., user previously created their own and now
              // is joining a different one) — merge fresh data instead of skipping update.
              setChatList(prev => {
                const existing = prev.find(c => c.id === chatId)
                const entry = {
                  id: chatId, type: 'group', event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                  eventRefId: ev.id, eventImage: ev.image_url || null,
                  members: (members || []).length,
                  avatars: memberProfiles.map((p: any) => p.photo).filter(Boolean),
                  colors: memberProfiles.map((p: any) => p.color), memberProfiles,
                  lastMsg: '🎉 You joined the crew!', time: new Date().toISOString(), isNew: true, chatExpiresAt: evChatExpiry,
                }
                if (existing) return prev.map(c => c.id === chatId ? { ...c, ...entry } : c)
                return [entry, ...prev]
              })
              showToast('Say hi to the crew!', 'Joined the crew! 🎉', '✅')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setMessagesInitialSubTab('messages'); setActiveTab('messages')
            }}
            onCreateNewCrew={async (ev: any) => {
              if (!userData?.dbId) return
              // Fresh chat for this event — no get-or-create, we want multiple chats per event.
              // Derive creator's format from event_attendees (DB truth) — local userEventFormat
              // can drift (AsyncStorage reset, stale backfill). Fall back to local state, then squad.
              const { data: myRow } = await supabase.from('event_attendees')
                .select('group_size_min, group_size_max')
                .eq('event_ref_id', ev.id).eq('profile_id', userData.dbId).maybeSingle()
              const hi = myRow?.group_size_max
              const creatorFormat = hi === 2 ? '1+1' : (hi != null && hi >= 6) ? 'party' : (hi != null ? 'squad' : (userEventFormat[ev.id] || 'squad'))
              const { data: newChat, error } = await supabase
                .from('chats')
                .insert({ event_id: ev.id, type: 'group', last_msg: '⏳ Waiting for crew to join...', format: creatorFormat })
                .select('id').single()
              if (!newChat) { console.error('chat insert error:', error); showToast('Try again', 'Could not create crew', '⚠️'); return }
              // Add the creator via the SECURITY DEFINER RPC — a direct chat_members
              // upsert is blocked by RLS and left the new crew chat memberless
              // (invisible to the creator). No host on a self-started crew.
              const { error: joinErr } = await supabase.rpc('join_party_chat', { p_chat_id: newChat.id, p_host_id: null })
              if (joinErr) console.warn('join_party_chat error (create crew):', joinErr.message)
              // Same pattern as onJoinSpecificCrew: don't overwrite existing sizes.
              {
                if (myRow && myRow.group_size_min != null && myRow.group_size_max != null) {
                  await supabase.from('event_attendees').update({ status: 'confirmed' })
                    .eq('event_ref_id', ev.id).eq('profile_id', userData.dbId)
                } else {
                  const sizeMap: Record<string, [number, number]> = { '1+1': [2, 2], squad: [3, 5], party: [6, 20] }
                  const fmt = userEventFormat[ev.id]
                  const sizes: [number, number] = (fmt && sizeMap[fmt]) || [3, 5]
                  await supabase.from('event_attendees').upsert({
                    event_ref_id: ev.id, event_title: ev.title, profile_id: userData.dbId,
                    status: 'confirmed', group_size_min: sizes[0], group_size_max: sizes[1],
                  }, { onConflict: 'event_ref_id,profile_id' })
                }
              }
              setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
              setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: newChat.id }))
              // Anchor chat expiry to event time so creating a crew for a past
              // event doesn't give it a fresh 24h window.
              const newCrewChatExpiry = (ev.expiresAt && ev.expiresAt > 0 ? ev.expiresAt : Date.now()) + 24 * 60 * 60 * 1000
              setChatList(prev => prev.some(c => c.id === newChat.id) ? prev : [{
                id: newChat.id, type: 'group', event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                eventRefId: ev.id, eventImage: ev.image_url || null,
                members: 1, avatars: [], colors: [], memberProfiles: [],
                lastMsg: '⏳ Waiting for crew to join...', time: new Date().toISOString(), isNew: true, chatExpiresAt: newCrewChatExpiry,
              }, ...prev])
              showToast('Others will see your crew and can join', 'Crew created 🎉', '✨')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setMessagesInitialSubTab('messages'); setActiveTab('messages')
            }}
            onInviteToMyCrew={async (ev: any, person: any) => {
              // Squad/party: invite a specific person into MY crew. Unifies the
              // discovery model — a squad-seeker can invite a lone attendee
              // (even a duo-seeker) instead of only joining existing crews.
              // The crew chat is created up-front (sized to my format) and its id
              // is carried on the invite so Accept just joins it (no duo chat).
              if (!userData?.dbId || !person?.id) return
              // Fresh block check — VibeCheck's 15s poll isn't fast enough for tap-to-invite.
              const [{ data: iBlocked }, { data: blockedMe }] = await Promise.all([
                supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData.dbId).eq('blocked_id', person.id),
                supabase.from('blocked_users').select('blocker_id').eq('blocked_id', userData.dbId).eq('blocker_id', person.id),
              ])
              if ((iBlocked && iBlocked.length > 0) || (blockedMe && blockedMe.length > 0)) {
                showToast('That user is not available', "Can't send invite", '🚫'); return
              }
              // Ensure my crew chat exists (reuse if I already have one for this event).
              let chatId: number | null = officialEventChatMap[ev.id] || null
              const { data: myRow } = await supabase.from('event_attendees')
                .select('group_size_min, group_size_max')
                .eq('event_ref_id', ev.id).eq('profile_id', userData.dbId).maybeSingle()
              if (!chatId) {
                const hi = myRow?.group_size_max
                const creatorFormat = hi === 2 ? '1+1' : (hi != null && hi >= 6) ? 'party' : (hi != null ? 'squad' : (userEventFormat[ev.id] || 'squad'))
                const { data: newChat, error } = await supabase.from('chats')
                  .insert({ event_id: ev.id, type: 'group', last_msg: '⏳ Waiting for crew to join...', format: creatorFormat })
                  .select('id').single()
                if (!newChat) { console.error('crew chat insert error (invite):', error); showToast('Try again', 'Could not create crew', '⚠️'); return }
                chatId = newChat.id as number
                const { error: joinErr } = await supabase.rpc('join_party_chat', { p_chat_id: chatId, p_host_id: null })
                if (joinErr) console.warn('join_party_chat error (invite create):', joinErr.message)
                if (myRow && myRow.group_size_min != null && myRow.group_size_max != null) {
                  await supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', ev.id).eq('profile_id', userData.dbId)
                } else {
                  const sizeMap: Record<string, [number, number]> = { '1+1': [2, 2], squad: [3, 5], party: [6, 20] }
                  const sizes: [number, number] = sizeMap[creatorFormat] || [3, 5]
                  await supabase.from('event_attendees').upsert({
                    event_ref_id: ev.id, event_title: ev.title, profile_id: userData.dbId,
                    status: 'confirmed', group_size_min: sizes[0], group_size_max: sizes[1],
                  }, { onConflict: 'event_ref_id,profile_id' })
                }
                setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
                setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: chatId as number }))
                const newCrewChatExpiry = (ev.expiresAt && ev.expiresAt > 0 ? ev.expiresAt : Date.now()) + 24 * 60 * 60 * 1000
                setChatList(prev => prev.some(c => c.id === chatId) ? prev : [{
                  id: chatId as number, type: 'group', event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                  eventRefId: ev.id, eventImage: ev.image_url || null,
                  members: 1, avatars: [], colors: [], memberProfiles: [],
                  lastMsg: '⏳ Waiting for crew to join...', time: new Date().toISOString(), isNew: true, chatExpiresAt: newCrewChatExpiry,
                }, ...prev])
              }
              // Send the invite carrying my crew chat id.
              const key = `${ev.id}_${person.id}`
              const { error: invErr } = await supabase.from('crew_invites').upsert({
                event_ref_id: ev.id, event_title: ev.title,
                inviter_id: userData.dbId, invitee_id: person.id, status: 'pending', chat_id: chatId,
              }, { onConflict: 'event_ref_id,inviter_id,invitee_id' })
              if (invErr) { console.warn('crew_invite upsert error (myCrew):', invErr.message); showToast('Try again', "Couldn't send invite", '⚠️'); return }
              setSentCrewInvites(prev => ({ ...prev, [key]: 'pending' }))
              sendPush([person.id], `${userData?.name || 'Someone'} invited you to their crew 💜`,
                `For "${ev.title}" — open VibeCheck to reply`, { screen: 'vibecheck', eventId: ev.id, type: 'match', emoji: '💜', color: '#EC4899' })
              showToast("They'll see your invite in VibeCheck", 'Invite sent! 🎯', '🎯')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            }}
            onPassMember={async (eventId: number, profileId: string) => {
              if (!userData?.dbId) return
              // Optimistic local update — realtime will mirror but UI stays snappy
              setPassedIdsByEvent(prev => {
                const next = new Set(prev[eventId] || []); next.add(profileId)
                return { ...prev, [eventId]: next }
              })
              setCrewPreviewMap(prev => {
                const cur = prev[eventId]
                if (!cur) return prev
                return { ...prev, [eventId]: { ...cur, members: cur.members.filter((m: any) => m.id !== profileId) } }
              })
              // CrewPoolSheet now reads from eventAttendeesMap, so update that too.
              setEventAttendeesMap(prev => prev[eventId]
                ? { ...prev, [eventId]: prev[eventId].filter((p: any) => p.id !== profileId) }
                : prev)
              const { error } = await supabase.from('passes')
                .insert({ passer_id: userData.dbId, passed_id: profileId, event_id: eventId })
              if (error && !error.message.includes('duplicate')) {
                console.warn('passes insert (CrewPoolSheet) error:', error.message)
              }
              Haptics.selectionAsync()
            }}
            officialEventChatMap={officialEventChatMap}
            onGoHome={() => setActiveTab('home')}
            onConfirm={async (ev: any, partners: any[], format: string) => {
                        const FORMAT_THRESHOLD: Record<string, number> = { '1+1': 2, squad: 3, party: 6 }
              const realPartners = partners.filter((p: any) => p._real)
              // Official events: never fall into the community fallback below.
              // Without real partners there's no one to match with — bail with a hint
              // instead of creating a fake "You matched" chat.
              if (ev.type === 'official' && realPartners.length === 0) {
                showToast('Check back when others join', 'No one in crew pool yet ⏳', '⏳')
                return
              }
              if (ev.type === 'official' && realPartners.length > 0) {
                // ── 1+1: mutual invite flow ──────────────────────────────────
                if (format === '1+1') {
                  // At-send-time block check — VibeCheck filtering on 15s poll
                  // isn't fast enough for a tap-and-invite flow. Pull blocks
                  // fresh now and bail if any partner is involved in a block.
                  // Two queries (forward + reverse) — cleaner than nested or/and
                  // syntax which mis-parses with UUID partner ids.
                  const partnerIds = realPartners.map((p: any) => p.id)
                  const [{ data: iBlocked }, { data: blockedMe }] = await Promise.all([
                    supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData?.dbId).in('blocked_id', partnerIds),
                    supabase.from('blocked_users').select('blocker_id').eq('blocked_id', userData?.dbId).in('blocker_id', partnerIds),
                  ])
                  if ((iBlocked && iBlocked.length > 0) || (blockedMe && blockedMe.length > 0)) {
                    showToast('That user is not available', 'Can\'t send invite', '🚫')
                    return
                  }
                  for (const partner of realPartners) {
                    const key = `${ev.id}_${partner.id}`
                    if (sentCrewInvites[key]) continue
                    const { error: inviteErr } = await supabase.from('crew_invites').upsert({
                      event_ref_id: ev.id, event_title: ev.title,
                      inviter_id: userData?.dbId, invitee_id: partner.id, status: 'pending',
                    }, { onConflict: 'event_ref_id,inviter_id,invitee_id' })
                    if (inviteErr) { console.warn('crew_invite upsert error:', inviteErr.message, inviteErr.code); continue }
                    setSentCrewInvites(prev => ({ ...prev, [key]: 'pending' }))
                    // Notify the invitee they've been asked to crew up — the
                    // "you got a like" moment that drives them back into the app.
                    sendPush([partner.id], `${userData?.name || 'Someone'} wants to crew up 💜`,
                      `For "${ev.title}" — open VibeCheck to reply`, { screen: 'vibecheck', eventId: ev.id, type: 'match', emoji: '💜', color: '#EC4899' })
                    const { data: mutualInvite } = await supabase
                      .from('crew_invites').select('*')
                      .eq('event_ref_id', ev.id).eq('inviter_id', partner.id)
                      .eq('invitee_id', userData?.dbId).eq('status', 'pending').maybeSingle()
                    if (mutualInvite) {
                      // If the partner already started a GROUP crew (they invited me
                      // via onInviteToMyCrew, which stores the crew chat id), JOIN
                      // that crew instead of creating a duo chat. Otherwise a squad
                      // inviter + a duo invitee pressing "Invite" would spawn a stray
                      // duo chat alongside the real squad crew (the bug we just hit).
                      if (mutualInvite.chat_id) {
                        const { data: grpChat } = await supabase.from('chats').select('id, type').eq('id', mutualInvite.chat_id).maybeSingle()
                        if (grpChat && grpChat.type === 'group') {
                          const { error: gJoinErr } = await supabase.rpc('join_party_chat', { p_chat_id: mutualInvite.chat_id, p_host_id: null })
                          if (gJoinErr) console.warn('join_party_chat error (confirm mutual group):', gJoinErr.message)
                          await supabase.from('crew_invites').update({ status: 'accepted' }).eq('id', mutualInvite.id)
                          // Drop my just-created reverse invite so it can't later be
                          // accepted into yet another (duo) chat.
                          await supabase.from('crew_invites').delete()
                            .eq('event_ref_id', ev.id).eq('inviter_id', userData?.dbId).eq('invitee_id', partner.id).eq('status', 'pending')
                          await supabase.from('event_attendees').upsert({
                            event_ref_id: ev.id, event_title: ev.title, profile_id: userData?.dbId, status: 'confirmed',
                          }, { onConflict: 'event_ref_id,profile_id' })
                          const { data: gm } = await supabase.from('chat_members')
                            .select('profile_id, profiles:profile_id(id, name, photos, color, age, bio, langs, interests, goal)')
                            .eq('chat_id', mutualInvite.chat_id)
                          const gmProfiles = (gm || []).filter((m: any) => m.profile_id !== userData?.dbId).map((m: any) => {
                            const p = (m as any).profiles || {}
                            return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍' }
                          })
                          setChatList(prev => {
                            const existing = prev.find(c => c.id === mutualInvite.chat_id)
                            const entry = {
                              id: mutualInvite.chat_id, type: 'group', event: ev.title,
                              eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉', eventRefId: ev.id, eventImage: ev.image_url || null,
                              members: (gm || []).length,
                              avatars: gmProfiles.map((p: any) => p.photo).filter(Boolean),
                              colors: gmProfiles.map((p: any) => p.color), memberProfiles: gmProfiles,
                              lastMsg: '🎉 You joined the crew!', time: new Date().toISOString(), isNew: true,
                              chatExpiresAt: (ev.expiresAt > 0 ? ev.expiresAt : Date.now()) + 24 * 60 * 60 * 1000,
                            }
                            if (existing) return prev.map(c => c.id === mutualInvite.chat_id ? { ...c, ...entry } : c)
                            return [entry, ...prev]
                          })
                          setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
                          setSentCrewInvites(prev => ({ ...prev, [key]: 'accepted' }))
                          setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: mutualInvite.chat_id }))
                          setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== mutualInvite.id))
                          showToast('Say hi to the crew!', 'Joined the crew! 🎉', '✅')
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                          setMessagesInitialSubTab('messages'); setActiveTab('messages')
                          return
                        }
                      }
                      const { data: chatData } = await supabase.from('chats')
                        .insert({ type: 'duo', last_msg: `🎉 ${ev.title}` }).select().single()
                      if (!chatData) continue
                      // Update both crew_invites rows BEFORE inserting chat_members
                      // so the partner's chat_members INSERT realtime listener can
                      // resolve event_ref_id when it queries crew_invites by chat_id.
                      await supabase.from('crew_invites').update({ status: 'accepted', chat_id: chatData.id }).in('id', [mutualInvite.id])
                      await supabase.from('chat_members').insert([
                        { chat_id: chatData.id, profile_id: userData?.dbId },
                        { chat_id: chatData.id, profile_id: partner.id },
                      ])
                      setChatList(prev => prev.some(c => c.id === chatData.id) ? prev : [{
                        id: chatData.id, type: 'duo', eventRefId: ev.id, name: partner.name || 'Your crew',
                        age: partner.age || '', color: partner.color || '#818CF8', photo: partner.photo || '',
                        lastMsg: '🎉 Mutual match! Say hi 👋', time: new Date().toISOString(), isNew: true, chatExpiresAt: (ev.expiresAt > 0 ? ev.expiresAt : Date.now()) + 24 * 60 * 60 * 1000,
                        event: ev.title, eventEmoji: '🎉', partnerProfile: partner,
                      }, ...prev])
                      setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
                      setSentCrewInvites(prev => ({ ...prev, [key]: 'accepted' }))
                      setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: chatData.id }))
                      setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== mutualInvite.id))
                      showToast('You both want to go together!', 'It\'s a match! 🎉', '🎉')
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                      setMessagesInitialSubTab('messages'); setActiveTab('messages')
                      return
                    }
                  }
                  showToast('They\'ll see your invite soon', 'Invite sent! 🎯', '🎯')
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  return
                }
                // ── Party: waiting flow — join only when others are ready ────
                if (format === 'party') {
                  // Mark self as ready
                  await supabase.from('event_attendees').update({ status: 'ready' })
                    .eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId)
                  // If a chat already exists — join immediately (atomic get-or-create)
                  const { data: existingChatId } = await supabase.rpc('get_or_create_party_chat', { p_event_id: ev.id, p_title: ev.title }).single()
                  if (existingChatId) {
                    const { error: joinErr } = await supabase.rpc('join_party_chat', { p_chat_id: existingChatId, p_host_id: ev.hostId ?? null })
                    if (joinErr) console.warn('join_party_chat error:', joinErr.message)
                    await supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId)
                    const { data: members } = await supabase.from('chat_members')
                      .select('profile_id, profiles:profile_id(id, name, photos, color, age)').eq('chat_id', existingChatId)
                    // Only count members who still have an active event_attendees record
                    const { data: activeAttendees } = await supabase.from('event_attendees')
                      .select('profile_id, transport').eq('event_ref_id', ev.id).in('status', ['ready', 'confirmed'])
                    const activeIds = new Set((activeAttendees || []).map((a: any) => a.profile_id))
                    const otherMembers = (members || [])
                      .filter((m: any) => m.profile_id !== userData?.dbId && (m as any).profiles?.name && (m as any).profiles?.id && activeIds.has(m.profile_id))
                      .map((m: any) => {
                        const p = (m as any).profiles
                        return { id: p.id, name: p.name, photo: p.photos?.[0] || null, color: p.color || '#818CF8', transport: (activeAttendees || []).find((a: any) => a.profile_id === p.id)?.transport }
                      })
                    // Only navigate to chat if others are already there
                    const hasOthers = otherMembers.length > 0
                    setChatList(prev => prev.some(c => c.id === existingChatId) ? prev : [{
                      id: existingChatId, type: 'group', event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                      members: (members || []).length, avatars: otherMembers.map((p: any) => p.photo).filter(Boolean),
                      colors: otherMembers.map((p: any) => p.color), memberProfiles: otherMembers,
                      lastMsg: '🎉 Party crew chat! Say hi 👋', time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                    }, ...prev])
                    setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
                    setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: existingChatId as number }))
                    setCrewPreviewMap(prev => ({ ...prev, [ev.id]: null }))
                    if (hasOthers) {
                      showToast('Check your Messages tab for the party chat', 'Joined the party! 🎉', '🎉')
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                      setMessagesInitialSubTab('messages'); setActiveTab('messages')
                    } else {
                      showToast('', 'You\'re in ✨', '✨', 2000)
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                    return
                  }
                  // No chat yet — check if others are ready
                  const { data: readyData } = await supabase.from('event_attendees')
                    .select('*, profiles(*)')
                    .eq('event_ref_id', ev.id).in('status', ['ready', 'confirmed'])
                    .neq('profile_id', userData?.dbId)
                    .lte('group_size_min', 20).gte('group_size_max', 6)
                  // Filter out attendees whose profile is incomplete (not yet registered)
                  const myPref_p = (await supabase.from('event_attendees').select('crew_pref').eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId).maybeSingle()).data?.crew_pref || 'any'
                  const myGender_p = (userData as any)?.gender
                  const registeredReady = (readyData || []).filter((r: any) => r.profiles?.name && r.profiles?.id && fitsCrewPref(myPref_p, myGender_p, r.crew_pref || 'any', r.profiles?.gender))
                  const othersCount = registeredReady.length
                  setReadyCountMap(prev => ({ ...prev, [ev.id]: othersCount }))
                  if (othersCount < 1) {
                    // First one — wait for others
                    showToast('', 'You\'re in ✨', '✨', 2000)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    return
                  }
                  // Others are ready — show Join button
                  const memberProfiles = registeredReady.map((r: any) => {
                    const p = r.profiles
                    return { id: p.id, name: p.name, photo: p.photos?.[0] || null, color: p.color || '#818CF8', transport: r.transport }
                  })
                  setCrewPreviewMap(prev => ({ ...prev, [ev.id]: { members: memberProfiles, chatId: null } }))
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  return
                }
                // ── Squad: threshold flow with crew preview ──────────────────
                const [userMin, userMax] = FORMAT_SIZES[format] || [3, 5]
                await supabase.from('event_attendees').update({ status: 'ready' })
                  .eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId)
                const { data: readyData } = await supabase
                  .from('event_attendees').select('*, profiles(*)')
                  .eq('event_ref_id', ev.id).in('status', ['ready', 'confirmed'])
                  .neq('profile_id', userData?.dbId)
                  .lte('group_size_min', userMax).gte('group_size_max', userMin)
                const myPref_s = (await supabase.from('event_attendees').select('crew_pref').eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId).maybeSingle()).data?.crew_pref || 'any'
                const myGender_s = (userData as any)?.gender
                const registeredSquadReady = (readyData || []).filter((r: any) => r.profiles?.name && r.profiles?.id && fitsCrewPref(myPref_s, myGender_s, r.crew_pref || 'any', r.profiles?.gender))
                const othersCount = registeredSquadReady.length
                setReadyCountMap(prev => ({ ...prev, [ev.id]: othersCount }))
                if (othersCount < 1) {
                  showToast('', 'You\'re in ✨', '✨', 2000)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  return
                }
                // Check if a crew chat already exists
                const otherReadyIds = registeredSquadReady.map((r: any) => r.profile_id)
                let existingChatId: number | null = null
                const { data: existingEventChat } = await supabase.from('chats').select('id').eq('event_id', ev.id).eq('type', 'group').maybeSingle()
                if (existingEventChat) existingChatId = existingEventChat.id
                const memberProfiles = registeredSquadReady.map((r: any) => {
                  const p = r.profiles
                  return { id: p.id, name: p.name, photo: p.photos?.[0] || null, color: p.color || '#818CF8', transport: r.transport }
                })
                setCrewPreviewMap(prev => ({ ...prev, [ev.id]: { members: memberProfiles, chatId: existingChatId } }))
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                return
              }
              // Community / non-official / no real attendees → create chat immediately
              const isGroup = format !== '1+1'
              const chatType = isGroup ? 'group' : 'duo'
              let dbChatId: number | null = null
              if (ev.type === 'community' && !ev.isHosted && userData?.dbId) {
                await supabase.from('join_requests')
                  .update({ status: 'confirmed' })
                  .eq('event_id', ev.id)
                  .eq('requester_id', userData.dbId)
                // Find or create the event's chat. For group chats use the
                // get_or_create_party_chat RPC (SECURITY DEFINER) so a re-joiner who
                // isn't a member yet still finds the EXISTING chat — a direct client
                // SELECT is hidden by RLS for non-members and was creating duplicate
                // chats (event split across two crews). Duo keeps the direct path.
                if (isGroup) {
                  const { data: rpcChatId, error: rpcErr } = await supabase
                    .rpc('get_or_create_party_chat', { p_event_id: ev.id, p_title: ev.title }).single()
                  if (rpcErr || !rpcChatId) console.warn('get_or_create_party_chat error:', rpcErr?.message)
                  else dbChatId = rpcChatId as number
                } else {
                  const { data: existingChat } = await supabase
                    .from('chats').select('id')
                    .eq('event_id', ev.id).eq('type', chatType).maybeSingle()
                  if (existingChat) {
                    dbChatId = existingChat.id
                  } else {
                    const { data: newDbChat } = await supabase
                      .from('chats')
                      .insert({ event_id: ev.id, type: chatType, last_msg: '👋 You matched!' })
                      .select('id').single()
                    if (newDbChat) dbChatId = newDbChat.id
                  }
                }
                // Add joiner + host to chat_members so both phones can restore the chat.
                // Done via the join_party_chat SECURITY DEFINER RPC: it resolves the
                // caller from auth.uid() server-side and inserts both rows bypassing
                // RLS, which the direct client upserts kept tripping on (silently
                // leaving the chat memberless → vanished for everyone but the host).
                if (dbChatId) {
                  const { error: joinErr } = await supabase.rpc('join_party_chat', {
                    p_chat_id: dbChatId,
                    p_host_id: ev.hostId ?? null,
                  })
                  if (joinErr) console.warn('join_party_chat error:', joinErr.message)
                  // Notify the host that the joiner confirmed and the chat is live.
                  // (Host already gets the local in-app member_joined via realtime/poll,
                  // but a push wakes them up if the app is in the background.)
                  if (ev.hostId) {
                    sendPush([ev.hostId], `${userData?.name || 'Someone'} joined "${ev.title}"`,
                      'Chat is ready — say hi 👋', { screen: 'chat', chatId: dbChatId, type: 'member_joined', emoji: '✅', color: '#10B981' })
                  }
                }
              }
              // For community events: prepend host profile to members list
              const communityHostProfile = ev.type === 'community' && ev.hostProfile && !ev.isHosted ? ev.hostProfile : null
              const chatMembers = communityHostProfile ? [communityHostProfile, ...partners] : partners
              const localId = dbChatId ?? Date.now()
              const newChat = isGroup ? {
                id: localId, type: 'group',
                event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                members: chatMembers.length + 1,
                avatars: chatMembers.map((p: any) => p.photo).filter(Boolean),
                colors: chatMembers.map((p: any) => p.color),
                memberProfiles: chatMembers,
                lastMsg: '🎉 Group chat created! Say hi',
                time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                communityEventId: ev.id,
              } : {
                id: localId, type: 'duo',
                name: partners[0]?.name || 'Your match',
                age: partners[0]?.age || '',
                transport: partners[0]?.transport || 'meet',
                color: partners[0]?.color || '#818CF8',
                photo: '', lastMsg: '👋 You matched! Say hello',
                time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                partnerProfile: partners[0] || null,
                communityEventId: ev.id,
              }
              const createdChatId = newChat.id
              if (ev.type === 'community') communityEventChatMap.current[ev.id] = createdChatId
              setChatList(prev => prev.some(c => c.id === createdChatId) ? prev : [newChat, ...prev])
              setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
              addNotif({ type: 'confirmed', emoji: '✅', color: '#10B981', title: 'You\'re in!', body: `Your crew for "${ev.title}" is ready`, chatId: createdChatId })
              showToast('Your crew is ready — say hi!', 'Chat created! 💬', '💬')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setMessagesInitialSubTab('messages')
              setActiveTab('messages')
            }}
            onJoinCrew={async (ev: any) => {
              const preview = crewPreviewMap[ev.id]
              if (preview && preview.chatId) {
                // Join existing chat (via RPC so RLS doesn't drop the membership)
                const { error: joinErr } = await supabase.rpc('join_party_chat', { p_chat_id: preview.chatId, p_host_id: ev.hostId ?? null })
                if (joinErr) console.warn('join_party_chat error:', joinErr.message)
                // Mark self as confirmed so we don't appear in others' VibeCheck
                await supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId)
                const memberProfiles = preview.members
                setChatList(prev => prev.some(c => c.id === preview.chatId) ? prev : [{
                  id: preview.chatId!, type: 'group', event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                  eventRefId: ev.id, eventImage: ev.image_url || null,
                  members: preview.members.length + 1,
                  avatars: memberProfiles.map((p: any) => p.photo).filter(Boolean),
                  colors: memberProfiles.map((p: any) => p.color), memberProfiles,
                  lastMsg: '🎉 You joined the crew!', time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                }, ...prev])
                setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
                setCrewPreviewMap(prev => ({ ...prev, [ev.id]: null }))
                setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: preview.chatId! }))
                showToast('Say hi to the crew!', 'Joined the chat! 🎉', '✅')
              } else {
                // Atomic get-or-create party/squad chat
                const { data: chatId, error: rpcErr } = await supabase.rpc('get_or_create_party_chat', { p_event_id: ev.id, p_title: ev.title }).single()
                if (!chatId) { console.error('get_or_create_party_chat error:', rpcErr); showToast('Please try again', 'Something went wrong', '⚠️'); return }
                // Add only self — others join when they tap confirm from vibe check
                const { error: joinErr } = await supabase.rpc('join_party_chat', { p_chat_id: chatId, p_host_id: ev.hostId ?? null })
                if (joinErr) console.warn('join_party_chat error:', joinErr.message)
                await supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', ev.id).eq('profile_id', userData?.dbId)
                const { data: members } = await supabase
                  .from('chat_members').select('profile_id, profiles:profile_id(id, name, photos, color, age, bio, langs, interests, goal)')
                  .eq('chat_id', chatId)
                const { data: attendeesT } = await supabase.from('event_attendees').select('profile_id, transport').eq('event_ref_id', ev.id)
                const transportMap: Record<number, string> = Object.fromEntries((attendeesT || []).map((a: any) => [a.profile_id, a.transport]))
                const memberProfiles = (members || []).filter((m: any) => m.profile_id !== userData?.dbId).map((m: any) => {
                  const p = (m as any).profiles || {}
                  return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍', transport: transportMap[p.id] || null }
                })
                setChatList(prev => prev.some(c => c.id === chatId) ? prev : [{
                  id: chatId, type: 'group', event: ev.title, eventEmoji: CATEGORY_EMOJI[ev.category] || '🎉',
                  eventRefId: ev.id, eventImage: ev.image_url || null,
                  members: (members || []).length, avatars: memberProfiles.map((p: any) => p.photo).filter(Boolean),
                  colors: memberProfiles.map((p: any) => p.color), memberProfiles,
                  lastMsg: '⏳ Waiting for crew to join...', time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                }, ...prev])
                setJoinedEvents(prev => ({ ...prev, [ev.id]: 'confirmed' }))
                setCrewPreviewMap(prev => ({ ...prev, [ev.id]: null }))
                setOfficialEventChatMap(prev => ({ ...prev, [ev.id]: chatId as number }))
                showToast('Others can still join from vibe check', 'Chat created! Waiting for crew 🎉', '💬')
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setMessagesInitialSubTab('messages'); setActiveTab('messages')
            }}
            onAcceptInvite={async (invite: any) => {
              if (acceptingInviteRef.current.has(invite.id)) return
              acceptingInviteRef.current.add(invite.id)
              // Stay / Switch crew — model decision C. If I'm already in another
              // crew chat for this event, ask before silently joining a second
              // one (which would leave me as a phantom member of the old crew).
              // Default = stay; explicit Switch leaves the current crew first.
              {
                const existingChatId = officialEventChatMap[invite.event_ref_id]
                if (existingChatId && existingChatId !== invite.chat_id) {
                  const choice = await new Promise<'stay' | 'switch' | 'cancel'>(resolve => {
                    Alert.alert(
                      "You're already in a crew",
                      "You're in another crew for this event. Switch to this one (you'll leave the current crew) or stay where you are?",
                      [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
                        { text: 'Stay', onPress: () => resolve('stay') },
                        { text: 'Switch', style: 'destructive', onPress: () => resolve('switch') },
                      ],
                      { cancelable: true, onDismiss: () => resolve('cancel') }
                    )
                  })
                  if (choice !== 'switch') {
                    acceptingInviteRef.current.delete(invite.id)
                    return
                  }
                  // Switch: leave the current crew first. Same cleanup pattern as
                  // onLeave for official events — drop my chat_members row, then
                  // either delete the chat if I was last member or write a "X
                  // left the group" system message so remaining members see why
                  // the count dropped.
                  await supabase.from('chat_members').delete().eq('chat_id', existingChatId).eq('profile_id', userData?.dbId)
                  const { data: remaining } = await supabase.from('chat_members').select('profile_id').eq('chat_id', existingChatId).limit(1).maybeSingle()
                  if (!remaining) {
                    await supabase.from('chats').delete().eq('id', existingChatId)
                  } else {
                    supabase.from('messages').insert({
                      chat_id: existingChatId, sender_id: userData?.dbId,
                      text: `${userData?.name || 'Someone'} left the group`,
                    }).then(({ error }) => { if (error) console.warn('switch system msg error:', error.message) })
                  }
                  setChatList(prev => prev.filter((c: any) => c.id !== existingChatId))
                  setOfficialEventChatMap(prev => { const n = { ...prev }; delete n[invite.event_ref_id]; return n })
                }
              }
              // Group-crew invite (squad/party via onInviteToMyCrew): the inviter
              // already created the crew chat and stored its id on the invite. Join
              // that existing group chat via the SECURITY DEFINER RPC instead of
              // creating a new duo chat. Duo invites have no chat_id at this point.
              // Re-read chat_id from DB — the local incomingCrewInvites copy can be
              // stale (loaded before the inviter set chat_id), which would wrongly
              // route a group invite down the duo path and create a duplicate chat.
              let inviteChatId = invite.chat_id
              if (!inviteChatId) {
                const { data: fresh } = await supabase.from('crew_invites').select('chat_id').eq('id', invite.id).maybeSingle()
                inviteChatId = fresh?.chat_id || null
              }
              if (inviteChatId) {
                const { data: chatRow } = await supabase.from('chats').select('id, type').eq('id', inviteChatId).maybeSingle()
                if (chatRow && chatRow.type === 'group') {
                  const { error: joinErr } = await supabase.rpc('join_party_chat', { p_chat_id: inviteChatId, p_host_id: null })
                  if (joinErr) { console.warn('join_party_chat error (accept group):', joinErr.message); acceptingInviteRef.current.delete(invite.id); showToast('Please try again', 'Something went wrong', '⚠️'); return }
                  await supabase.from('crew_invites').update({ status: 'accepted' }).eq('id', invite.id)
                  const evId = invite.event_ref_id
                  // Adopt the crew — mark my attendance confirmed for this event.
                  await supabase.from('event_attendees').upsert({
                    event_ref_id: evId, event_title: invite.event_title, profile_id: userData?.dbId, status: 'confirmed',
                  }, { onConflict: 'event_ref_id,profile_id' })
                  const { data: members } = await supabase.from('chat_members')
                    .select('profile_id, profiles:profile_id(id, name, photos, color, age, bio, langs, interests, goal)')
                    .eq('chat_id', inviteChatId)
                  const memberProfiles = (members || []).filter((m: any) => m.profile_id !== userData?.dbId).map((m: any) => {
                    const p = (m as any).profiles || {}
                    return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍' }
                  })
                  // eventImage + accurate expiry are backfilled by the chatList
                  // effects (officialEndById / event image map) — safe to default here.
                  const grpExpiry = Date.now() + 24 * 60 * 60 * 1000
                  setChatList(prev => {
                    const existing = prev.find(c => c.id === inviteChatId)
                    const entry = {
                      id: inviteChatId, type: 'group', event: invite.event_title,
                      eventEmoji: '🎉',
                      eventRefId: evId, eventImage: null,
                      members: (members || []).length,
                      avatars: memberProfiles.map((p: any) => p.photo).filter(Boolean),
                      colors: memberProfiles.map((p: any) => p.color), memberProfiles,
                      lastMsg: '🎉 You joined the crew!', time: new Date().toISOString(), isNew: true, chatExpiresAt: grpExpiry,
                    }
                    if (existing) return prev.map(c => c.id === inviteChatId ? { ...c, ...entry } : c)
                    return [entry, ...prev]
                  })
                  setJoinedEvents(prev => ({ ...prev, [evId]: 'confirmed' }))
                  setOfficialEventChatMap(prev => ({ ...prev, [evId]: inviteChatId }))
                  setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== invite.id))
                  acceptingInviteRef.current.delete(invite.id)
                  showToast('Say hi to the crew!', 'Joined the crew! 🎉', '✅')
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  setMessagesInitialSubTab('messages'); setActiveTab('messages')
                  return
                }
              }
              const { data: chatData } = await supabase
                .from('chats')
                .insert({ type: 'duo', last_msg: '🎉 Crew confirmed!' })
                .select()
                .single()
              // Must also check `.id` — if RLS blocks RETURNING, `chatData` may
              // come back as a non-null empty object and we'd write NULL chat_id
              // into crew_invites, leaving the inviter stuck on "Waiting".
              if (!chatData?.id) { acceptingInviteRef.current.delete(invite.id); showToast('Please try again', 'Something went wrong', '⚠️'); return }
              // Update crew_invites FIRST so the inviter's chat_members INSERT
              // realtime listener can find event_ref_id when it queries by chat_id.
              // Race window was: chat_members fired → inviter queried crew_invites →
              // row still had chat_id=null → effectiveEventId undefined → "Waiting" stuck.
              await supabase.from('crew_invites')
                .update({ status: 'accepted', chat_id: chatData.id })
                .eq('id', invite.id)
              await supabase.from('chat_members').insert([
                { chat_id: chatData.id, profile_id: userData?.dbId },
                { chat_id: chatData.id, profile_id: invite.inviter_id },
              ])
              const inviter = invite.inviter || {}
              const newChat = {
                id: chatData.id, type: 'duo', eventRefId: invite.event_ref_id,
                name: inviter.name || 'Your crew',
                age: inviter.age || '',
                color: inviter.color || '#818CF8',
                photo: inviter.photos?.[0] || '',
                lastMsg: '🎉 Crew confirmed! Say hi',
                time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                event: invite.event_title, eventEmoji: '🎉',
                partnerProfile: inviter,
              }
              setChatList(prev => prev.some(c => c.id === chatData.id) ? prev : [newChat, ...prev])
              setJoinedEvents(prev => ({ ...prev, [invite.event_ref_id]: 'confirmed' }))
              setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== invite.id))
              setOfficialEventChatMap(prev => ({ ...prev, [invite.event_ref_id]: chatData.id }))
              // Notify the inviter their invite was accepted — their "Waiting"
              // flips to a chat. Especially important when their app is closed.
              if (invite.inviter_id) {
                sendPush([invite.inviter_id], `${userData?.name || 'Someone'} accepted your invite!`,
                  `For "${invite.event_title || 'your plan'}" — say hi 💬`,
                  { screen: 'chat', chatId: chatData.id, eventTitle: invite.event_title || '', type: 'crew_accepted', emoji: '🎉', color: '#43E97B' })
              }
              showToast('Check your Messages tab for the group chat', 'Crew confirmed! 🎉', '✅')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setMessagesInitialSubTab('messages')
              setActiveTab('messages')
            }}
            onDeclineInvite={async (invite: any) => {
              await supabase.from('crew_invites').update({ status: 'declined' }).eq('id', invite.id)
              setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== invite.id))
              // Decline = explicit "I don't want them" — record a pass so they don't get
              // suggested to me (and I don't get suggested to them) on this event again.
              if (userData?.dbId && invite.inviter_id && invite.event_ref_id) {
                supabase.from('passes')
                  .insert({ passer_id: userData.dbId, passed_id: invite.inviter_id, event_id: invite.event_ref_id })
                  .then(({ error }) => { if (error && !error.message.includes('duplicate')) console.warn('passes insert (decline) error:', error.message) })
              }
              showToast('Invite removed', 'Declined', '👋')
            }}
            onLeave={(ev: any) => {
              setJoinedEvents(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              setChatList(prev => prev.filter(c => c.event !== ev.title && c.hostEventId !== ev.id))
              if (ev.type === 'official' && userData?.dbId) {
                cancelledEventIdsRef.current.add(ev.id)
                setCancelledEventIds(prev => [...new Set([...prev, ev.id])])
                supabase.from('event_attendees').delete().eq('event_ref_id', ev.id).eq('profile_id', userData.dbId)
                  .then(({ error }) => { if (error) console.warn('event_attendees delete error:', error.message) })
                supabase.from('crew_invites').update({ status: 'cancelled' }).eq('event_ref_id', ev.id).eq('inviter_id', userData.dbId).in('status', ['pending', 'accepted'])
                supabase.from('crew_invites').update({ status: 'cancelled' }).eq('event_ref_id', ev.id).eq('invitee_id', userData.dbId).in('status', ['pending', 'accepted'])
                // Remove self from any crew chats for this event so the count updates
                // for remaining members (and delete now-empty chat rows entirely).
                supabase.from('chats').select('id').eq('event_id', ev.id).eq('type', 'group')
                  .then(async ({ data: evChats }) => {
                    const chatIds = (evChats || []).map((c: any) => c.id)
                    if (chatIds.length === 0) return
                    // Find chats where we were a member (so we only post the system
                    // message in chats remaining members can actually see)
                    const { data: myMemberships } = await supabase.from('chat_members')
                      .select('chat_id').in('chat_id', chatIds).eq('profile_id', userData.dbId)
                    const myChatIds = (myMemberships || []).map((r: any) => r.chat_id)
                    await supabase.from('chat_members').delete().in('chat_id', chatIds).eq('profile_id', userData.dbId)
                    // Cleanup orphan chats (no members left)
                    const { data: remaining } = await supabase.from('chat_members').select('chat_id').in('chat_id', chatIds)
                    const stillPopulated = new Set((remaining || []).map((r: any) => r.chat_id))
                    const empties = chatIds.filter((id: number) => !stillPopulated.has(id))
                    if (empties.length > 0) await supabase.from('chats').delete().in('id', empties)
                    // Write "X left the group" system message in chats that survive
                    const survivingChatIds = myChatIds.filter((id: number) => stillPopulated.has(id))
                    if (survivingChatIds.length > 0) {
                      const inserts = survivingChatIds.map((cid: number) => ({
                        chat_id: cid, sender_id: userData.dbId,
                        text: `${userData.name || 'Someone'} left the group`,
                      }))
                      supabase.from('messages').insert(inserts)
                        .then(({ error }) => { if (error) console.warn('leave system msg error:', error.message) })
                    }
                  })
                setSentCrewInvites(prev => {
                  const next = { ...prev }
                  Object.keys(next).filter(k => k.startsWith(`${ev.id}_`)).forEach(k => delete next[k])
                  return next
                })
              }
              if (ev.type === 'community' && userData?.dbId) {
                supabase.from('join_requests').delete().eq('event_id', ev.id).eq('requester_id', userData.dbId)
                  .then(({ error }) => { if (error) console.warn('join_requests delete error:', error.message) })
              }
              showToast('They\'ve been notified', 'Plans changed 📅', '📅')
            }}
            hostedEvents={userCreatedEvents}
            pendingJoinRequests={pendingJoinRequests}
            approvedJoiners={approvedJoiners}
            onCancelHostedEvent={(ev: any) => {
              deletedCommunityEventIds.current.add(ev.id)
              setUserCreatedEvents(prev => prev.filter(e => e.id !== ev.id))
              setDbCommunityEvents(prev => prev.filter(e => e.id !== ev.id))
              setPendingJoinRequests(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              setApprovedJoiners(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              setChatList(prev => prev.filter(c => c.hostEventId !== ev.id))
              supabase.from('community_events').delete().eq('id', ev.id).then(({ error }) => { if (error) console.warn('event delete error:', error.message) })
              supabase.from('join_requests').delete().eq('event_id', ev.id).then(({ error }) => { if (error) console.warn('join_requests delete error:', error.message) })
              showToast('All requests and chats removed', 'Event cancelled 🗑️', '🗑️')
            }}
            onApproveJoiner={(eventId: number, joiner: any) => {
              const ev = userCreatedEvents.find(e => e.id === eventId)
              const maxParticipants = ev?.maxParticipants || 5
              const slotsTotal = maxParticipants - 1 // host takes 1 slot
              const alreadyApproved = (approvedJoiners[eventId] || []).length + (hostConfirmedMembers[eventId] || []).length
              if (alreadyApproved >= slotsTotal) {
                showToast('No more spots available', 'Event is full 🔒', '🔒')
                return
              }
              // Update DB if real joiner
              if (joiner._real && joiner.requestId) {
                supabase.from('join_requests')
                  .update({ status: 'approved' })
                  .eq('id', joiner.requestId)
                  .then(({ error }) => { if (error) console.warn('approve error:', error.message) })
                // Notify the joiner they're approved — they have a window to confirm.
                if (joiner.id) {
                  sendPush([joiner.id], `You're approved for ${ev?.title || 'the plan'}! ✅`,
                    'Open Parea to confirm your spot', { screen: 'plans', eventId: eventId, type: 'confirmed', emoji: '✅', color: '#43E97B' })
                }
              }
              setPendingJoinRequests(prev => ({
                ...prev,
                [eventId]: (prev[eventId] || []).filter((r: any) => r.requestId !== joiner.requestId),
              }))
              const isDuo = maxParticipants <= 2

              // Reject remaining pending joiners in DB when slots are now full
              const rejectRemainingInDb = (remaining: any[]) => {
                const realRemaining = remaining.filter((r: any) => r._real && r.requestId)
                if (realRemaining.length > 0) {
                  supabase.from('join_requests').delete()
                    .in('id', realRemaining.map((r: any) => r.requestId))
                    .then(({ error }) => { if (error) console.warn('reject remaining error:', error.message) })
                }
              }

              if (isDuo) {
                // 1-on-1 event → reject all other pending immediately (only 1 slot)
                const remaining = (pendingJoinRequests[eventId] || []).filter((r: any) => r.requestId !== joiner.requestId)
                rejectRemainingInDb(remaining)
                setPendingJoinRequests(prev => ({ ...prev, [eventId]: [] }))
                addNotif({ type: 'match', emoji: '✨', color: '#EC4899', title: `${joiner.name} approved! Waiting for their confirmation`, body: ev?.title || '' })
              } else {
                // Squad/Party — обновляем approvedJoiners, чат создастся когда участник нажмёт Confirm
                const newApproved = [...(approvedJoiners[eventId] || []), joiner]
                setApprovedJoiners(prev => ({ ...prev, [eventId]: newApproved }))
                if (newApproved.length >= slotsTotal) {
                  const remaining = (pendingJoinRequests[eventId] || [])
                  rejectRemainingInDb(remaining)
                  setPendingJoinRequests(prev => ({ ...prev, [eventId]: [] }))
                }
              }
              showToast('They have 6h to confirm their spot', `${joiner.name} approved ✅`, '✅')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            }}
            onRejectJoiner={(eventId: number, joiner: any) => {
              setPendingJoinRequests(prev => ({
                ...prev,
                [eventId]: (prev[eventId] || []).filter((r: any) => r.requestId !== joiner.requestId),
              }))
              if (joiner._real) {
                // UPDATE status='rejected' — keeps the row so joiner can't re-submit.
                // Match by id when we have it, otherwise by (event_id, requester_id)
                // pair as a fallback for callers that didn't carry requestId.
                const q = supabase.from('join_requests').update({ status: 'rejected' })
                const promise = joiner.requestId
                  ? q.eq('id', joiner.requestId)
                  : q.eq('event_id', eventId).eq('requester_id', joiner.id).eq('status', 'pending')
                promise.then(({ error }) => { if (error) console.warn('reject error:', error.message) })
              }
              showToast('Their request has been removed', 'Request declined ❌', '❌')
            }}
            passedRequests={passedRequests}
            onPassJoiner={(eventId: number, joiner: any) => {
              const passId = joiner.requestId || joiner.id
              setPendingJoinRequests(prev => ({
                ...prev,
                [eventId]: (prev[eventId] || []).filter((r: any) => r.requestId !== joiner.requestId),
              }))
              setPassedRequests(prev => ({
                ...prev,
                [eventId]: [...(prev[eventId] || []), passId],
              }))
              // Persist mutual pass to DB so the other user also stops seeing us in their queue.
              if (userData?.dbId && joiner.id && typeof joiner.id === 'string') {
                supabase.from('passes')
                  .insert({ passer_id: userData.dbId, passed_id: joiner.id, event_id: eventId })
                  .then(({ error }) => { if (error && !error.message.includes('duplicate')) console.warn('passes insert error:', error.message) })
              }
              // Also mark the join_request as rejected — otherwise the host poll
              // refetches it as 'pending' a few seconds later and the joiner
              // re-appears in the queue. The pass row alone doesn't filter the
              // pending list, only the AI-score candidate pool.
              if (joiner._real && joiner.requestId) {
                supabase.from('join_requests').update({ status: 'rejected' }).eq('id', joiner.requestId)
                  .then(({ error }) => { if (error) console.warn('pass→reject join_request error:', error.message) })
              }
            }}
            onGoToMessages={() => {
              setMessagesInitialSubTab('messages')
              setActiveTab('messages')
            }}
          />
          </View>
          <View style={{ flex: 1, display: activeTab === 'messages' ? 'flex' : 'none' }}>
          <MessagesTab
            initialSubTab={messagesInitialSubTab}
            plansLoading={!plansHydrated}
            chatList={chatList}
            passedRequests={passedRequests}
            onOpenChat={(chat) => {
              setOpenChat(chat)
              setChatList(prev => prev.map(c => c.id === chat.id ? { ...c, isNew: false } : c))
              const nowMs = Date.now()
              setLastReadAtMap(prev => ({ ...prev, [chat.id]: nowMs }))
              markNotifsReadForChat(chat.id)
              // Telegram-style read receipts: update our chat_members.last_read_at
              // so the OTHER member's UI can render ✓✓ for messages they sent
              // before this moment.
              if (typeof chat.id === 'number' && chat.id < 1e12 && userData?.dbId) {
                supabase.from('chat_members')
                  .update({ last_read_at: new Date(nowMs).toISOString() })
                  .eq('chat_id', chat.id).eq('profile_id', userData.dbId)
                  .then(({ error }) => { if (error) console.warn('last_read_at update error:', error.message) })
              }
            }}
            hostedEvents={userCreatedEvents}
            onLeaveChat={(id, addSystemMsg) => {
              if (addSystemMsg) {
                setChatMessages(prev => ({
                  ...prev,
                  [id]: [...(prev[id] || []), { from: 'system', text: 'You changed your plans 📅', time: 'now' }],
                }))
              }
              const leavingChat = chatList.find(c => c.id === id)

              if (leavingChat?.communityEventId && !leavingChat?.hostEventId && userData?.dbId) {
                // Петя выходит из чужого community-чата
                const evId = leavingChat.communityEventId
                // Удаляем join_request из DB
                supabase.from('join_requests')
                  .delete()
                  .eq('event_id', evId)
                  .eq('requester_id', userData.dbId)
                  .then(({ error }) => { if (error) console.warn('leave join_request delete error:', error.message) })
                // Удаляем chat_members чтобы не восстанавливался через fallback poll
                if (typeof leavingChat.id === 'number' && leavingChat.id < 1e12) {
                  supabase.from('chat_members')
                    .delete().eq('chat_id', leavingChat.id).eq('profile_id', userData.dbId)
                    .then(({ error }) => { if (error) console.warn('leave chat_members delete error:', error.message) })
                }
                // Пишем системное сообщение в DB → Даша увидит через realtime
                supabase.from('messages').insert({
                  community_event_id: evId,
                  sender_id: userData.dbId,
                  text: `${userData.name || 'Someone'} left the group`,
                }).then(({ error }) => { if (error) console.warn('leave system msg error:', error.message) })
                // Помечаем как cancelled чтобы fallback poll не вернул чат
                cancelledEventIdsRef.current.add(evId)
                setCancelledEventIds(prev => [...new Set([...prev, evId])])
                // Убираем ивент из планов Пети
                setJoinedEvents(prev => { const n = { ...prev }; delete n[evId]; return n })
                // Broadcast to host immediately
                const hostEvId = leavingChat.memberProfiles?.find((p: any) => p._isHost)?.id
                  || (dbCommunityEvents.find((e: any) => e.id === evId)?.hostId)
                if (hostEvId) {
                  // httpSend (REST) — explicit one-off broadcast without subscribing.
                  // Replaces the deprecated .send() implicit REST fallback.
                  supabase.channel(`host-events-${hostEvId}`).httpSend('member_left', { eventId: evId, requesterId: userData.dbId })
                }
              }

              // Group official crew chat (no communityEventId, no hostEventId — multi-crew)
              if (!leavingChat?.communityEventId && !leavingChat?.hostEventId && leavingChat?.eventRefId
                  && typeof leavingChat.id === 'number' && leavingChat.id < 1e12 && userData?.dbId) {
                supabase.from('chat_members')
                  .delete().eq('chat_id', leavingChat.id).eq('profile_id', userData.dbId)
                  .then(async () => {
                    // Check if anyone else still in the chat — if so, post "X left", otherwise delete it
                    const { data: remaining } = await supabase.from('chat_members')
                      .select('profile_id').eq('chat_id', leavingChat.id)
                    if (!remaining || remaining.length === 0) {
                      supabase.from('chats').delete().eq('id', leavingChat.id)
                    } else {
                      supabase.from('messages').insert({
                        chat_id: leavingChat.id, sender_id: userData.dbId,
                        text: `${userData.name || 'Someone'} left the group`,
                      }).then(({ error }) => { if (error) console.warn('leave system msg error:', error.message) })
                    }
                  })
              }

              // Если хост уходит из своего чата → удаляем ивент (cascade удалит chat у участников)
              if (leavingChat?.hostEventId) {
                supabase.from('community_events').delete().eq('id', leavingChat.hostEventId)
                  .then(({ error }) => { if (error) console.warn('host event delete error:', error.message) })
                setUserCreatedEvents(prev => prev.filter(e => e.id !== leavingChat.hostEventId))
                setPendingJoinRequests(prev => { const n = { ...prev }; delete n[leavingChat.hostEventId]; return n })
                setApprovedJoiners(prev => { const n = { ...prev }; delete n[leavingChat.hostEventId]; return n })
              }
              setChatList(prev => prev.filter(c => c.id !== id))
              showToast(
                leavingChat?.communityEventId && !leavingChat?.hostEventId
                  ? 'You\'ve left the group chat'
                  : 'Chat removed',
                leavingChat?.communityEventId && !leavingChat?.hostEventId
                  ? 'Left the group 👋'
                  : 'Event cancelled 🗑️',
                leavingChat?.communityEventId && !leavingChat?.hostEventId ? '👋' : '🗑️'
              )
            }}
            allEvents={[...feedOfficialDbEvents, ...dbCommunityEvents]}
            onEventDetail={setEventDetail}
            joinedEvents={joinedEvents}
            userEventFormat={userEventFormat}
            userEventTransport={userEventTransport}
            crewsByEvent={crewsByEvent}
            officialEventChatMap={officialEventChatMap}
            approvedJoiners={approvedJoiners}
            hostConfirmedMembers={hostConfirmedMembers}
            approvedAtMap={approvedAtMap}
            eventAttendeesMap={eventAttendeesMap}
            onCancelHostedEvent={(ev) => {
              deletedCommunityEventIds.current.add(ev.id)
              setUserCreatedEvents(prev => prev.filter(e => e.id !== ev.id))
              setDbCommunityEvents(prev => prev.filter(e => e.id !== ev.id))
              setPendingJoinRequests(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              setApprovedJoiners(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              setChatList(prev => prev.filter(c => c.hostEventId !== ev.id))
              supabase.from('community_events').delete().eq('id', ev.id).then(({ error, status, statusText }) => { console.log('community_events delete:', { eventId: ev.id, error: error?.message, status, statusText }) })
              supabase.from('join_requests').delete().eq('event_id', ev.id).then(({ error, count }) => { console.log('join_requests delete:', { eventId: ev.id, error: error?.message, count }) })
              showToast('All requests and chats removed', 'Event cancelled 🗑️', '🗑️')
            }}
            onVibeCheck={() => { setActiveTab('vibecheck'); markNotifsReadForPlans() }}
            onPlansOpen={markNotifsReadForPlans}
            onLeaveEvent={ev => {
              setJoinedEvents(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              const officialChatId = officialEventChatMapRef.current[ev.id]
              setChatList(prev => prev.filter(c => c.communityEventId !== ev.id && c.event !== ev.title && c.hostEventId !== ev.id && c.id !== officialChatId))
              // Clear chat map so re-joining creates a fresh chat
              setOfficialEventChatMap(prev => { const n = { ...prev }; delete n[ev.id]; return n })
              // Mark as cancelled so poll never re-adds it
              cancelledEventIdsRef.current.add(ev.id)
              if ((ev.type === 'official' || ev.id > 100000) && userData?.dbId) {
                setCancelledEventIds(prev => [...new Set([...prev, ev.id])])
                supabase.from('event_attendees').delete().eq('event_ref_id', ev.id).eq('profile_id', userData.dbId)
                  .then(({ error, count }) => { console.log('event_attendees delete (leave):', { eventId: ev.id, profileId: userData.dbId, error: error?.message, count }) })
                // Remove from chat_members; if no active members remain, delete the chat
                // so get_or_create_party_chat creates a fresh one on re-join
                if (officialChatId) {
                  // For duo chats: when one side leaves, the chat is useless to
                  // the other (just them with no one to talk to). Tear it down
                  // entirely so the remaining user's app stops showing "Open Chat 2/2"
                  // and they can re-match fresh on the event.
                  const leavingChatLocal = chatListRef.current.find((c: any) => c.id === officialChatId)
                  const isDuoLeave = leavingChatLocal?.type === 'duo'
                  if (isDuoLeave) {
                    // DELETE chats while we're still a member — CASCADE FK
                    // tears down chat_members and messages. RLS blocks cross-user
                    // chat_members deletes, so the old "delete each table in
                    // order" path orphaned the partner's row + the chat itself.
                    supabase.from('chats').delete().eq('id', officialChatId)
                      .then(({ error }) => { if (error) console.warn('duo leave chat delete error:', error.message) })
                  } else {
                    // Group leave: must inspect remaining BEFORE deleting our row
                    // so we can still `DELETE chats` (RLS requires we're a member).
                    ;(async () => {
                      const { data: remaining } = await supabase.from('chat_members')
                        .select('profile_id').eq('chat_id', officialChatId).neq('profile_id', userData.dbId)
                      const remainingIds = (remaining || []).map((r: any) => r.profile_id)
                      if (remainingIds.length === 0) {
                        // I'm the only member — DELETE chats (CASCADE cleans up).
                        await supabase.from('chats').delete().eq('id', officialChatId)
                        return
                      }
                      const { data: activeLeft } = await supabase.from('event_attendees')
                        .select('profile_id').eq('event_ref_id', ev.id).in('status', ['ready', 'confirmed']).in('profile_id', remainingIds)
                      if (!activeLeft || activeLeft.length === 0) {
                        // No one active left — tear down the whole chat (CASCADE).
                        await supabase.from('chats').delete().eq('id', officialChatId)
                        return
                      }
                      // Active members remain — remove just me + leave a trace.
                      await supabase.from('chat_members').delete().eq('chat_id', officialChatId).eq('profile_id', userData.dbId)
                      supabase.from('messages').insert({
                        chat_id: officialChatId,
                        sender_id: userData.dbId,
                        text: `${userData.name || 'Someone'} left the group`,
                      }).then(({ error }) => { if (error) console.warn('leave system msg error:', error.message) })
                    })()
                  }
                }
                supabase.from('crew_invites').update({ status: 'cancelled' }).eq('event_ref_id', ev.id).eq('inviter_id', userData.dbId).in('status', ['pending', 'accepted'])
                supabase.from('crew_invites').update({ status: 'cancelled' }).eq('event_ref_id', ev.id).eq('invitee_id', userData.dbId).in('status', ['pending', 'accepted'])
                // Broadcast "partner_left" only for duo (1+1) chats — in group
                // crews the chat survives our exit (others stay), so we must not
                // trigger the receiver's chat teardown.
                const partnerChatId = officialEventChatMapRef.current[ev.id]
                const partnerChat = chatListRef.current.find((c: any) => c.id === partnerChatId)
                if (partnerChat?.type === 'duo') {
                  const partnerId = partnerChat?.partnerProfile?.id
                    || partnerChat?.memberProfiles?.find((p: any) => p.id !== userData.dbId)?.id
                  if (partnerId) {
                    supabase.channel(`crew-partner-${partnerId}`).httpSend('partner_left', { eventId: ev.id, eventTitle: ev.title || partnerChat?.title || '' })
                  }
                }
                setSentCrewInvites(prev => {
                  const next = { ...prev }
                  Object.keys(next).filter(k => k.startsWith(`${ev.id}_`)).forEach(k => delete next[k])
                  return next
                })
              } else if (userData?.dbId) {
                // Community event: delete join_request from DB, then broadcast AFTER delete completes
                supabase.from('join_requests').delete().eq('event_id', ev.id).eq('requester_id', userData.dbId)
                  .then(() => {
                    if (ev.hostId) {
                      supabase.channel(`host-events-${ev.hostId}`).httpSend('member_left', { eventId: ev.id, requesterId: userData.dbId })
                    }
                  })
              }
              showToast('A new spot is now open for others', 'Spot freed 🎟️', '🎟️')
            }}
            onUpdatePlans={ev => {
              setActiveTab('home')
              setTimeout(() => setPendingJoinEv(ev), 150)
            }}
            onBlockUser={handleBlock}
            onReportUser={(p: any) => setReportTarget(p)}
          />
          </View>
          <View style={{ flex: 1, display: activeTab === 'profile' ? 'flex' : 'none' }}>
            <ProfileTab userData={userData} onUpdateUserData={onUpdateUserData} onLogOut={onLogOut} city={city ?? undefined} setCityOpen={setCityOpen} onUnblockUser={(id) => setBlockedIds(prev => { const n = new Set(prev); n.delete(id); return n })} />
          </View>
        </View>

        {/* Bottom nav */}
        <View style={[s.bottomNav, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : 8 }]}>
          <TouchableOpacity style={s.navItem} onPress={() => setActiveTab('home')}>
            <Feather name="home" size={22} color={activeTab === 'home' ? '#6366F1' : '#94A3B8'} />
            <Text style={[s.navLabel, activeTab === 'home' && { color: '#6366F1' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => { setActiveTab('vibecheck'); markNotifsReadForPlans() }}>
            <View style={{ position: 'relative' }}>
              <Feather name="zap" size={22} color={activeTab === 'vibecheck' ? '#43E97B' : '#94A3B8'} />
              {(() => {
                const allKnownEvs = [...MOCK_EVENTS, ...MOCK_COMMUNITY_EVENTS, ...feedOfficialDbEvents, ...dbCommunityEvents, ...userCreatedEvents]
                const now = Date.now()
                // Official events have date in date_label and time="-", so fall back to
                // parsing the visible date string when expiresAt isn't set.
                const isExpired = (ev: any) => ev.expiresAt
                  ? ev.expiresAt <= now
                  : isEventPast(ev.date_label || ev.time || '')
                // Trigger Vibe dot for events that still need user action.
                // Community: dot until joiner is 'confirmed' (then chat exists,
                // they shouldn't go back to VibeCheck — they go to Chats).
                // Official: dot while still finding partner/crew. Once duo is
                // confirmed (chat exists) or crew is full, the user has nothing
                // to do in VibeCheck for that event — drop the dot.
                const hasActiveJoined = Object.entries(joinedEvents).some(([id, v]) => {
                  if (!v) return false
                  const ev = allKnownEvs.find(e => e.id === Number(id))
                  if (!ev) return false
                  if (isExpired(ev)) return false
                  if (ev.type === 'official') {
                    if (v !== 'confirmed') return true
                    const format = userEventFormat[Number(id)]
                    if (format === '1+1') return false
                    const maxSize = VIBE_FORMAT_MAX[format] || 5
                    const crewChat = chatList.find((c: any) => c.eventRefId === Number(id) || c.hostEventId === Number(id))
                    const memberCount = crewChat?.members || 1
                    return memberCount < maxSize
                  }
                  if (ev.type === 'community' && !ev.isHosted) return v !== 'confirmed'
                  return false
                })
                const hasPending = Object.entries(pendingJoinRequests).some(([evId, reqs]) => {
                  if (!reqs.length) return false
                  const ev = userCreatedEvents.find((e: any) => e.id === Number(evId))
                  if (!ev) return false
                  if (isExpired(ev)) return false
                  return true
                })
                // hostActivity = pending requests OR approved-but-not-confirmed
                // (actionable: host needs to follow up). Just having empty spots
                // doesn't justify a dot — that's the default state of any host.
                const hasHostActivity = userCreatedEvents.some((ev: any) => {
                  if (isExpired(ev)) return false
                  const pending = (pendingJoinRequests[ev.id] || []).length
                  const approved = (approvedJoiners[ev.id] || []).length
                  return pending > 0 || approved > 0
                })
                if (!(hasActiveJoined || hasPending || hasHostActivity)) return null
                return <View style={{ position: 'absolute', top: -3, right: -5, width: 8, height: 8, borderRadius: 4, backgroundColor: hasPending ? '#FFD700' : '#43E97B', borderWidth: 1.5, borderColor: '#F8F7FF' }} />
              })()}
            </View>
            <Text style={[s.navLabel, activeTab === 'vibecheck' && { color: '#43E97B' }]}>Vibe</Text>
          </TouchableOpacity>

          {/* Center create button */}
          <TouchableOpacity style={s.navCreateBtn} onPress={() => { setCreateType(null); setCreateOpen(true) }} activeOpacity={0.85}>
            <LinearGradient colors={['#818CF8', '#6366F1']} style={s.navCreateGrad}>
              <Feather name="plus" size={26} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.navItem} onPress={() => { setMessagesInitialSubTab('messages'); setActiveTab('messages') }}>
            <View style={{ position: 'relative' }}>
              <Feather name="message-circle" size={22} color={activeTab === 'messages' ? '#06B6D4' : '#94A3B8'} />
              {chatList.some((c: any) => c.isNew) && activeTab !== 'messages' && (
                <View style={{ position: 'absolute', top: -3, right: -5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#06B6D4', borderWidth: 1.5, borderColor: '#F8F7FF' }} />
              )}
            </View>
            <Text style={[s.navLabel, activeTab === 'messages' && { color: '#06B6D4' }]}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => setActiveTab('profile')}>
            <Feather name="user" size={22} color={activeTab === 'profile' ? '#8B5CF6' : '#94A3B8'} />
            <Text style={[s.navLabel, activeTab === 'profile' && { color: '#8B5CF6' }]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Create event modal */}
        <Modal visible={createOpen} animationType="slide" onRequestClose={() => {
          setCreateOpen(false); setCreateStep(1); setCreateSize(null); setCreateType(null);
          setCreateDay(''); setCreateHour(''); setCreateLocation(''); setCreateDriving(false);
          setCreateLangs([]); setCreateVibe(null); setCreateCustom(''); setCreateNameError(false); setCreateImage(null); setCreateVisibility('public');
          setCreateSummaryOpen(false);
          setCalViewYear(new Date().getFullYear()); setCalViewMonth(new Date().getMonth());
        }}>
          <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F0F9FF']} style={s.fill}>
            <View style={[s.fill, { paddingBottom: insets.bottom }]}>
              {/* On Android the system already adjustResize-shrinks the window
                  for the keyboard, so adding KeyboardAvoidingView padding
                  doubled the offset — Next button hovered far above the
                  keyboard. iOS still needs the manual avoidance. */}
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'height' : undefined} keyboardVerticalOffset={0}>

                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 4, paddingBottom: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (createStep > 1) {
                        setCreateStep(cs => cs - 1);
                      } else {
                        setCreateOpen(false); setCreateStep(1); setCreateSize(null); setCreateType(null);
                        setCreateDay(''); setCreateHour(''); setCreateLocation(''); setCreateDescription(''); setCreateDriving(false);
                        setCreateLangs([]); setCreateVibe(null); setCreateCustom(''); setCreateImage(null); setCreateVisibility('public');
                        setCalViewYear(new Date().getFullYear()); setCalViewMonth(new Date().getMonth());
                      }
                    }}
                    style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                    <CaretLeft size={20} color="#475569" weight="regular" />
                  </TouchableOpacity>
                  {/* Step counter pill */}
                  <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                    {[1,2,3,4].map(i => (
                      <View key={i} style={{ height: 6, borderRadius: 99,
                        width: i === createStep ? 22 : 6,
                        backgroundColor: i < createStep ? '#6366F1' : i === createStep ? '#6366F1' : '#E2E8F0' }} />
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setCreateOpen(false); setCreateStep(1); setCreateSize(null); setCreateType(null);
                      setCreateDay(''); setCreateHour(''); setCreateLocation(''); setCreateDriving(false);
                      setCreateLangs([]); setCreateVibe(null); setCreateCustom(''); setCreateImage(null); setCreateVisibility('public');
                      setCalViewYear(new Date().getFullYear()); setCalViewMonth(new Date().getMonth());
                    }}
                    style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                    <Feather name="x" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>

                {/* Big step title + subtitle */}
                <View style={{ paddingHorizontal: 22, paddingBottom: 20 }}>
                  <Text style={{ fontSize: 28, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.5 }}>
                    {[
                      { title: "Choose your crew size", emoji: '' },
                      { title: "What's the plan?", emoji: '' },
                      { title: "When & where?", emoji: '' },
                      { title: "Final touches", emoji: '' },
                    ][createStep - 1].title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 5, fontWeight: '500', lineHeight: 20 }}>
                    {[
                      'Choose the format that fits your vibe',
                      'Pick the activity for your event',
                      'Set the date, time and place',
                      'Set who can join and how people find your plan',
                    ][createStep - 1]}
                  </Text>
                </View>

                {/* Step content in ScrollView */}
                <ScrollView
                  ref={createScrollRef}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + createKbHeight }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ flex: 1 }}>

                  {/* ── Step 1: Pod Size ── */}
                  {createStep === 1 && (
                    <View style={{ gap: 12 }}>
                      {([
                        {
                          id: 'duo', Icon: Users, label: 'Duo', tag: 'You + 1 guest',
                          sub: 'Most personal — just the two of you',
                          grad: ['#6366F1', '#818CF8'] as [string,string],
                          bg: '#EEF2FF', accent: '#6366F1', tagBg: '#C7D2FE',
                        },
                        {
                          id: 'squad', Icon: UsersRound, label: 'Squad', tag: 'Up to 5 people',
                          sub: 'Small group energy — tight circle, good vibes',
                          grad: ['#16a34a', '#22c55e'] as [string,string],
                          bg: '#F0FDF4', accent: '#16a34a', tagBg: '#BBF7D0',
                        },
                        {
                          id: 'party', Icon: PartyPopper, label: 'Group', tag: 'Up to 20 people',
                          sub: 'Open gathering — the more the merrier',
                          grad: ['#ea580c', '#f97316'] as [string,string],
                          bg: '#FFF7ED', accent: '#ea580c', tagBg: '#FED7AA',
                        },
                      ] as const).map(opt => {
                        const sel = createSize === opt.id
                        return (
                          <TouchableOpacity key={opt.id} onPress={() => setCreateSize(opt.id)} activeOpacity={0.85}
                            style={{ borderRadius: 22, borderWidth: 2,
                              borderColor: sel ? opt.accent : '#F1F5F9',
                              backgroundColor: sel ? opt.bg : '#fff',
                              shadowColor: sel ? opt.accent : '#000',
                              shadowOpacity: sel ? 0.18 : 0.04, shadowRadius: sel ? 12 : 3,
                              shadowOffset: { width: 0, height: sel ? 4 : 1 }, elevation: sel ? 5 : 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 }}>
                              {/* Icon circle with gradient */}
                              <LinearGradient
                                colors={sel ? opt.grad : ['#F1F5F9', '#E2E8F0']}
                                style={{ width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
                                start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
                                <opt.Icon size={26} color={sel ? '#fff' : '#94A3B8'} strokeWidth={1.8} />
                              </LinearGradient>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <Text style={{ fontSize: 18, fontWeight: '900', color: sel ? opt.accent : '#1E1B4B' }}>{opt.label}</Text>
                                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
                                    backgroundColor: sel ? opt.tagBg : '#F1F5F9' }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: sel ? opt.accent : '#94A3B8' }}>{opt.tag}</Text>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 13, color: sel ? '#475569' : '#94A3B8', lineHeight: 18, fontWeight: '500' }}>{opt.sub}</Text>
                              </View>
                              <View style={{ width: 24, height: 24, borderRadius: 12,
                                backgroundColor: sel ? opt.accent : '#E2E8F0',
                                alignItems: 'center', justifyContent: 'center' }}>
                                {sel && <Feather name="check" size={13} color="#fff" />}
                              </View>
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  )}

                  {/* ── Step 2: Activity with category tabs ── */}
                  {createStep === 2 && (() => {
                    const CATS: Record<string, { PhIcon: any; color: string; bg: string; items: { id: string; Icon: any; label: string }[] }> = {
                      'Sport':   { PhIcon: Barbell,      color: '#3B82F6', bg: '#EFF6FF', items: [{ id:'padel',   Icon: TennisBall,     label:'Padel' },{ id:'tennis',  Icon: TennisBall,     label:'Tennis' },{ id:'yoga',    Icon: YinYang,        label:'Yoga' },{ id:'gym',     Icon: Barbell,        label:'Gym' },{ id:'water',   Icon: WaveSine,       label:'Water Sports' }] },
                      'Food':    { PhIcon: ForkKnife,   color: '#EC4899', bg: '#FDF2F8', items: [{ id:'coffee',  Icon: PhCoffee,       label:'Coffee' },{ id:'meze',    Icon: ForkKnife,      label:'Meze' },{ id:'wine',    Icon: PhWine,         label:'Wine' },{ id:'brunch',  Icon: Egg,            label:'Brunch' },{ id:'sunset',  Icon: SunHorizon,     label:'Sunset' }] },
                      'Work':    { PhIcon: PhBriefcase, color: '#8B5CF6', bg: '#F5F3FF', items: [{ id:'networking', Icon: Handshake,   label:'Networking' },{ id:'crypto',  Icon: Coins,          label:'Crypto' },{ id:'cowork',  Icon: Laptop,         label:'Co-working' }] },
                      'Chill':   { PhIcon: PhLeaf,      color: '#10B981', bg: '#F0FDF4', items: [{ id:'beach',   Icon: Umbrella,       label:'Beach' },{ id:'hiking',  Icon: Mountains,      label:'Hiking' },{ id:'boat',    Icon: Sailboat,       label:'Boat' },{ id:'boardgames', Icon: GameController, label:'Board Games' }] },
                      'Culture': { PhIcon: PhPalette,   color: '#F59E0B', bg: '#FFFBEB', items: [{ id:'dance',   Icon: MusicNotes,     label:'Dance' },{ id:'concert',  Icon: MicrophoneStage, label:'Concert' },{ id:'theatre', Icon: MaskHappy,      label:'Theatre' },{ id:'music',   Icon: MusicNotes,     label:'Music' },{ id:'art',     Icon: PhPalette,      label:'Art' }] },
                    }
                    const activeCat = CATS[createCategory] || CATS['Sport']
                    const catItems = [...(activeCat.items || []), { id: 'other', Icon: Pencil as any, label: 'Other' }]
                    const cardW = (W - 40 - 10) / 2
                    return (
                      <View>
                        {/* Category tabs — Phosphor Duotone icons */}
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
                          {Object.entries(CATS).map(([cat, { PhIcon, color, bg }]) => {
                            const active = createCategory === cat
                            return (
                              <TouchableOpacity key={cat} onPress={() => { setCreateCategory(cat); setCreateType(null) }} activeOpacity={0.8}
                                style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 16,
                                  backgroundColor: active ? bg : '#F8FAFC',
                                  borderWidth: 1.5, borderColor: active ? color : 'transparent' }}>
                                <PhIcon size={18} color={active ? color : '#94A3B8'} weight={active ? 'duotone' : 'regular'} />
                                <Text style={{ fontSize: 9, fontFamily: 'Outfit-Bold', marginTop: 4,
                                  color: active ? color : '#94A3B8', letterSpacing: 0.3 }}>{cat}</Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                        {/* Activity grid — 2 columns, Phosphor Duotone icons */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                          {catItems.map(t => {
                            const sel = createType === t.id
                            const TIcon = t.Icon
                            return (
                              <Pressable key={t.id} onPress={() => { setCreateType(t.id); if (t.id !== 'other') setCreateCustom('') }}
                                style={({ pressed }) => ({ width: cardW, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10,
                                  paddingHorizontal: 12, paddingVertical: 13, borderRadius: 16,
                                  backgroundColor: sel ? activeCat.bg : '#F8FAFC',
                                  borderWidth: 1.5, borderColor: sel ? activeCat.color : 'transparent',
                                  shadowColor: sel ? activeCat.color : 'transparent',
                                  shadowOpacity: sel ? 0.15 : 0, shadowRadius: 6, elevation: sel ? 3 : 0,
                                  transform: [{ scale: pressed ? 0.95 : 1 }] })}>
                                <View style={{ width: 38, height: 38, borderRadius: 12,
                                  backgroundColor: sel ? activeCat.color : '#F1F5F9',
                                  alignItems: 'center', justifyContent: 'center' }}>
                                  <TIcon size={18} color={sel ? '#fff' : activeCat.color} weight="duotone" />
                                </View>
                                <Text style={{ fontSize: 13, fontFamily: sel ? 'Outfit-Bold' : 'Outfit-SemiBold',
                                  color: sel ? activeCat.color : '#475569', flex: 1 }}>{t.label}</Text>
                              </Pressable>
                            )
                          })}
                        </View>
                        {/* Plan name — always visible, required */}
                        <View style={{ marginTop: 18, marginBottom: 10 }}>
                          <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3 }}>Name your plan</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                          backgroundColor: createNameError ? '#FEF2F2' : (createCustom.length > 0 ? '#EEF2FF' : '#fff'),
                          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                          borderWidth: 1.5,
                          borderColor: createNameError ? '#EF4444' : (createCustom.length > 0 ? '#6366F1' : 'rgba(139, 92, 246, 0.18)') }}>
                          <Pencil size={15} color={createNameError ? '#EF4444' : (createCustom.length > 0 ? '#6366F1' : '#94A3B8')} strokeWidth={2} />
                          <TextInput value={createCustom}
                            onChangeText={(t) => { setCreateCustom(t); if (createNameError) setCreateNameError(false) }}
                            placeholder="e.g. Wine & chat at Marina" placeholderTextColor="#94A3B8"
                            returnKeyType="done"
                            style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }} />
                          {createCustom.length > 0 && (
                            <TouchableOpacity onPress={() => setCreateCustom('')}>
                              <Feather name="x-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>
                        {createNameError && (
                          <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: '600' }}>
                            Give your plan a name first
                          </Text>
                        )}
                      </View>
                    )
                  })()}

                  {/* ── Step 3: Calendar + Time + Location ── */}
                  {createStep === 3 && (() => {
                    const today = new Date(); today.setHours(0,0,0,0)
                    const todayIso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
                    const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`
                    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                    const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                    const dayLabel = createDay
                      ? createDay === todayIso ? 'Today'
                        : createDay === tomorrowIso ? 'Tomorrow'
                        : (() => { const d = new Date(createDay); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}` })()
                      : 'Pick date'
                    return (
                      <View>
                        {/* Date & time — two compact cards with internal label */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3 }}>Date & time</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                          <TouchableOpacity onPress={() => setDateSheetOpen(true)} activeOpacity={0.85}
                            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
                              backgroundColor: createDay ? '#EEF2FF' : '#fff',
                              borderWidth: 1.5, borderColor: createDay ? '#6366F1' : 'rgba(139, 92, 246, 0.18)' }}>
                            <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Outfit-Medium', marginBottom: 4 }}>Date</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 15 }}>📅</Text>
                              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Outfit-SemiBold', color: createDay ? '#1E1B4B' : '#94A3B8' }} numberOfLines={1}>{dayLabel}</Text>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setTimeSheetOpen(true)} activeOpacity={0.85}
                            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
                              backgroundColor: createHour ? '#EEF2FF' : '#fff',
                              borderWidth: 1.5, borderColor: createHour ? '#6366F1' : 'rgba(139, 92, 246, 0.18)' }}>
                            <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Outfit-Medium', marginBottom: 4 }}>Time</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 15 }}>🕐</Text>
                              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Outfit-SemiBold', color: createHour ? '#1E1B4B' : '#94A3B8' }} numberOfLines={1}>{createHour || 'Pick time'}</Text>
                            </View>
                          </TouchableOpacity>
                        </View>

                        {/* Date Sheet */}
                        <Modal visible={dateSheetOpen} transparent animationType="slide" onRequestClose={() => setDateSheetOpen(false)}>
                          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setDateSheetOpen(false)} />
                          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Math.max(insets.bottom + 16, 28), maxHeight: '70%' }}>
                            <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                            <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', paddingHorizontal: 20, marginBottom: 14 }}>Pick a date</Text>
                            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                              {Array.from({ length: 60 }).map((_, i) => {
                                const d = new Date(today); d.setDate(d.getDate() + i)
                                const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                                const sel = createDay === iso
                                const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
                                return (
                                  <TouchableOpacity key={iso} activeOpacity={0.85}
                                    onPress={() => {
                                      setCreateDay(iso)
                                      // Reset hour if today and selected hour passed
                                      if (iso === todayIso && createHour) {
                                        const [hh, mm] = createHour.split(':').map(Number)
                                        const now = new Date()
                                        if (hh < now.getHours() || (hh === now.getHours() && mm <= now.getMinutes())) setCreateHour('')
                                      }
                                      setDateSheetOpen(false)
                                    }}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: sel ? '#6366F1' : 'transparent', marginBottom: 2 }}>
                                    <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: sel ? '#fff' : '#1E1B4B' }}>{label}</Text>
                                    {sel && <Ionicons name="checkmark" size={18} color="#fff" />}
                                  </TouchableOpacity>
                                )
                              })}
                            </ScrollView>
                          </View>
                        </Modal>

                        {/* Time Sheet */}
                        <Modal visible={timeSheetOpen} transparent animationType="slide" onRequestClose={() => setTimeSheetOpen(false)}>
                          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setTimeSheetOpen(false)} />
                          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Math.max(insets.bottom + 16, 28), maxHeight: '70%' }}>
                            <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                            <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', paddingHorizontal: 20, marginBottom: 14 }}>Pick a time</Text>
                            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                              {(() => {
                                const slots: string[] = []
                                for (let h = 8; h <= 23; h++) {
                                  for (const mm of ['00','30']) slots.push(`${String(h).padStart(2,'0')}:${mm}`)
                                }
                                const isToday = createDay === todayIso
                                const now = new Date()
                                return slots.map(slot => {
                                  const sel = createHour === slot
                                  const [hh, mm] = slot.split(':').map(Number)
                                  const isPast = isToday && (hh < now.getHours() || (hh === now.getHours() && mm <= now.getMinutes()))
                                  return (
                                    <TouchableOpacity key={slot} disabled={isPast} activeOpacity={isPast ? 1 : 0.85}
                                      onPress={() => { setCreateHour(slot); setTimeSheetOpen(false) }}
                                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: sel ? '#6366F1' : 'transparent', opacity: isPast ? 0.3 : 1, marginBottom: 2 }}>
                                      <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: sel ? '#fff' : '#1E1B4B' }}>{slot}</Text>
                                      {sel && <Ionicons name="checkmark" size={18} color="#fff" />}
                                    </TouchableOpacity>
                                  )
                                })
                              })()}
                            </ScrollView>
                          </View>
                        </Modal>

                        {/* Location */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3 }}>Location</Text>
                        </View>
                        <TouchableOpacity onPress={() => setLocationPickerOpen(true)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14,
                            paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5,
                            backgroundColor: createLocation.length > 0 ? '#EEF2FF' : '#fff',
                            borderColor: createLocation.length > 0 ? '#6366F1' : 'rgba(139, 92, 246, 0.18)' }}>
                          <Feather name="map-pin" size={16} color={createLocation.length > 0 ? '#6366F1' : '#94A3B8'} />
                          <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: createLocation.length > 0 ? '#1E1B4B' : '#94A3B8' }} numberOfLines={1}>
                            {createLocation.length > 0 ? createLocation : 'Search venue or pick on map'}
                          </Text>
                          {createLocation.length > 0 ? (
                            <TouchableOpacity onPress={() => { setCreateLocation(''); setLocationCoords(null) }}>
                              <Feather name="x" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          ) : (
                            <Feather name="chevron-right" size={16} color="#94A3B8" />
                          )}
                        </TouchableOpacity>

                        {/* Location Picker Modal */}
                        <Modal visible={locationPickerOpen} animationType="slide" onRequestClose={() => setLocationPickerOpen(false)}>
                          <LocationPicker
                            apiKey={GOOGLE_MAPS_KEY}
                            initialCity={city}
                            initialLocation={createLocation}
                            initialCoords={locationCoords}
                            insets={insets}
                            onClose={() => setLocationPickerOpen(false)}
                            onConfirm={(desc, lat, lng) => {
                              setCreateLocation(desc)
                              setLocationCoords({ lat, lng })
                              setLocationPickerOpen(false)
                            }}
                          />
                        </Modal>

                        {/* Description */}
                        <View style={{ marginTop: 18, marginBottom: 8 }}>
                          <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3 }}>What should people know?</Text>
                          <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit-Medium', marginTop: 2 }}>Optional</Text>
                        </View>
                        <View style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: createDescription.length > 0 ? '#6366F1' : 'rgba(139, 92, 246, 0.18)' }}>
                          <TextInput
                            value={createDescription}
                            onChangeText={setCreateDescription}
                            placeholder="Tell people what to expect, what to bring, vibe..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={3}
                            style={{ fontSize: 14, color: '#1E1B4B', fontWeight: '500', minHeight: 72, textAlignVertical: 'top' }}
                          />
                        </View>

                        {/* Cover photo — optional, compact horizontal card */}
                        <TouchableOpacity activeOpacity={0.8} onPress={() => {
                          const pickImage = async () => {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
                            if (status !== 'granted') return
                            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true, exif: false })
                            if (!result.canceled && result.assets[0]) {
                              const asset = result.assets[0]
                              if ((asset.width || 0) < 50 || (asset.height || 0) < 50) { Alert.alert('Invalid image', 'Please choose a proper photo.'); return }
                              setCreateImage({ uri: asset.uri, base64: asset.base64 || '' })
                            }
                          }
                          Alert.alert(
                            'Community Guidelines',
                            'By uploading a photo you confirm it does not contain nudity, violence, or inappropriate content. Violations may result in account suspension.',
                            [{ text: 'Cancel', style: 'cancel' }, { text: 'I agree', onPress: pickImage }]
                          )
                        }}
                          style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: createImage ? '#6366F1' : 'rgba(139, 92, 246, 0.18)' }}>
                          {createImage ? (
                            <Image source={{ uri: createImage.uri }} style={{ width: 56, height: 56, borderRadius: 12 }} resizeMode="cover" />
                          ) : (
                            <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
                              <Feather name="image" size={22} color="#94A3B8" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }}>
                              {createImage ? 'Change cover photo' : 'Add cover photo'}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit-Medium', marginTop: 2 }}>Optional</Text>
                          </View>
                          <Feather name="chevron-right" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    )
                  })()}

                  {/* ── Step 4: Vibe + Language + Driving ── */}
                  {createStep === 4 && (() => {
                    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                    const summaryTitle = createCustom.trim() || (createType ? createType.charAt(0).toUpperCase() + createType.slice(1) : 'Your plan')
                    const SIZE_LABEL: Record<string, string> = { duo: '1+1', squad: 'Squad · up to 5', party: 'Party · up to 20' }
                    const sizeLabel = createSize ? (SIZE_LABEL[createSize] || createSize) : ''
                    const dateLabel = createDay
                      ? (() => { const d = new Date(createDay); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}` })()
                      : 'Date not set'
                    const timeLabel = createHour || 'Time not set'
                    const locLabel = createLocation.trim() || 'Location not set'
                    return (
                    <View style={{ gap: 16 }}>
                      {/* Collapsible summary — toggled by a single row at the top */}
                      <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.18)', overflow: 'hidden' }}>
                        <TouchableOpacity activeOpacity={0.7}
                          onPress={() => setCreateSummaryOpen(v => !v)}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: createSummaryOpen ? 12 : 14 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, fontFamily: 'Outfit-Medium', color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase' }}>Your plan</Text>
                            {!createSummaryOpen && (
                              <Text style={{ fontSize: 15, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.2, marginTop: 2 }} numberOfLines={1}>
                                Review your plan
                              </Text>
                            )}
                          </View>
                          <Feather name={createSummaryOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#6366F1" />
                        </TouchableOpacity>
                        {createSummaryOpen && (
                          <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, borderTopWidth: 1, borderTopColor: 'rgba(139, 92, 246, 0.08)' }}>
                            <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.2, marginTop: 10, marginBottom: 4 }} numberOfLines={2}>{summaryTitle}</Text>
                            {sizeLabel ? <Text style={{ fontSize: 13, color: '#475569', fontFamily: 'Outfit-Medium' }}>{sizeLabel}</Text> : null}
                            <Text style={{ fontSize: 13, color: '#475569', fontFamily: 'Outfit-Medium', marginTop: 2 }}>
                              {dateLabel}<Text style={{ color: '#94A3B8' }}> · </Text>{timeLabel}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#475569', fontFamily: 'Outfit-Medium', marginTop: 2 }} numberOfLines={1}>{locLabel}</Text>
                          </View>
                        )}
                      </View>

                      {/* Vibe */}
                      <View>
                        <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3, marginBottom: 10 }}>Vibe</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {[
                            { id:'chill',        Icon: Leaf,      label:'Chill' },
                            { id:'active',       Icon: Zap,       label:'Active' },
                            { id:'professional', Icon: Briefcase, label:'Professional' },
                          ].map(v => {
                            const sel = createVibe === v.id
                            const VibeIcon = v.Icon
                            return (
                              <TouchableOpacity key={v.id} onPress={() => setCreateVibe(v.id)} activeOpacity={0.8}
                                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
                                  backgroundColor: sel ? '#EEF2FF' : '#F8FAFC',
                                  borderWidth: 2, borderColor: sel ? '#6366F1' : 'transparent' }}>
                                <VibeIcon size={22} color={sel ? '#6366F1' : '#94A3B8'} strokeWidth={2} />
                                <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 6, color: sel ? '#6366F1' : '#64748B' }}>{v.label}</Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                      {/* Languages */}
                      <View>
                        <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3 }}>Languages</Text>
                        <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit-Medium', marginTop: 2, marginBottom: 10 }}>Pick at least one — we use it to match the right people</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {LANGUAGES_LIST.map((l: any) => (
                            <TouchableOpacity key={l.code} onPress={() => setCreateLangs(prev => prev.includes(l.code) ? prev.filter((x: string) => x !== l.code) : [...prev, l.code])} activeOpacity={0.8}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99,
                                backgroundColor: createLangs.includes(l.code) ? '#EEF2FF' : '#F8FAFC',
                                borderWidth: 1.5, borderColor: createLangs.includes(l.code) ? '#6366F1' : 'transparent' }}>
                              <Text style={{ fontSize: 15 }}>{l.flag || '🌐'}</Text>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: createLangs.includes(l.code) ? '#6366F1' : '#64748B' }}>{l.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      {/* Driving */}
                      <TouchableOpacity onPress={() => setCreateDriving(v => !v)} activeOpacity={0.85}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          backgroundColor: createDriving ? '#EEF2FF' : '#F8FAFC', borderRadius: 16, padding: 14,
                          borderWidth: 1.5, borderColor: createDriving ? '#6366F1' : 'transparent' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: createDriving ? '#fff' : '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                            <Car size={18} color="#6366F1" strokeWidth={2} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }}>I can give a lift</Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Others can ride with you</Text>
                          </View>
                        </View>
                        <Switch value={createDriving} onValueChange={setCreateDriving} trackColor={{ false: '#E2E8F0', true: '#818CF8' }} thumbColor={createDriving ? '#6366F1' : '#f4f3f4'} />
                      </TouchableOpacity>

                      {/* Plan visibility */}
                      <View>
                        <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3, marginBottom: 10 }}>Who can see it</Text>
                        <View style={{ gap: 8 }}>
                          {[
                            { id: 'public',  label: 'Public',   sub: 'Anyone in the community can find this plan', Icon: Globe },
                            { id: 'private', label: 'Private',  sub: 'Only people with the invite link can join',  Icon: Lock },
                          ].map(opt => {
                            const sel = createVisibility === opt.id
                            const OptIcon = opt.Icon
                            return (
                              <TouchableOpacity key={opt.id} onPress={() => setCreateVisibility(opt.id as 'public' | 'private')} activeOpacity={0.85}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14,
                                  backgroundColor: sel ? '#EEF2FF' : '#F8FAFC',
                                  borderWidth: 1.5, borderColor: sel ? '#6366F1' : 'transparent' }}>
                                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: sel ? '#fff' : '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                                  <OptIcon size={16} color="#6366F1" strokeWidth={2} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: sel ? '#4338CA' : '#1E1B4B' }}>{opt.label}</Text>
                                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: '#64748B', marginTop: 1 }}>{opt.sub}</Text>
                                </View>
                                {sel && <CheckCircle size={20} color="#6366F1" strokeWidth={2} />}
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                        {/* TODO: generate/share invite link for private plans */}
                      </View>

                      {/* Who can join */}
                      <View>
                        <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3, marginBottom: 10 }}>Who can join</Text>
                        <View style={{ gap: 8 }}>
                          {[
                            { id: 'any',    label: 'Anyone',       sub: 'Open to everyone' },
                            { id: 'women',  label: 'Women only',   sub: 'Only women can join' },
                            { id: 'men',    label: 'Men only',     sub: 'Only men can join' },
                          ].map(opt => {
                            const sel = createCrewPref === opt.id
                            return (
                              <TouchableOpacity key={opt.id} onPress={() => setCreateCrewPref(opt.id)} activeOpacity={0.85}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14,
                                  backgroundColor: sel ? '#EEF2FF' : '#F8FAFC',
                                  borderWidth: 1.5, borderColor: sel ? '#6366F1' : 'transparent' }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: sel ? '#4338CA' : '#1E1B4B' }}>{opt.label}</Text>
                                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: '#64748B', marginTop: 1 }}>{opt.sub}</Text>
                                </View>
                                {sel && <CheckCircle size={20} color="#6366F1" strokeWidth={2} />}
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    </View>
                    )
                  })()}

                </ScrollView>

                {/* Bottom button — pinned to bottom */}
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: 'transparent' }}>
                  {createStep < 4 ? (() => {
                    const isDisabled = (createStep === 1 && !createSize) || (createStep === 2 && (!createType || !createCustom.trim())) || (createStep === 3 && (!createDay || !createHour || !createLocation.trim()))
                    const disabledLabel = ['Pick a format', 'Pick activity & name it', 'Choose date & time', ''][createStep - 1]
                    const activeLabel   = ['Next: Activity →', 'Next: Date & time →', 'Next: Final step →', ''][createStep - 1]
                    // Single brand gradient across all steps — used to bounce
                    // pink/green/amber per step but it read as chaotic.
                    const STEP_COLORS: [string,string][] = [['#6366F1','#818CF8'],['#6366F1','#818CF8'],['#6366F1','#818CF8'],['#6366F1','#818CF8']]
                    if (isDisabled) return (
                      <Pressable
                        onPress={() => {
                          // Flag the name field red only when the missing piece
                          // is the plan name on step 2 — other disabled cases
                          // (no format / no date) keep their own affordances.
                          if (createStep === 2 && !createCustom.trim()) {
                            setCreateNameError(true)
                          }
                        }}
                        style={[s.btnPrimary, { backgroundColor: '#E0E7FF' }]}>
                        <Text style={[s.btnPrimaryText, { color: '#A5B4FC', fontFamily: 'Outfit-SemiBold' }]}>{disabledLabel}</Text>
                      </Pressable>
                    )
                    return (
                      <BreathingButton
                        label={activeLabel}
                        onPress={() => setCreateStep(cs => cs + 1)}
                        colors={STEP_COLORS[createStep - 1]}
                      />
                    )
                  })() : (!createVibe || createLangs.length === 0) ? (
                    <View style={[s.btnPrimary, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={[s.btnPrimaryText, { color: '#A5B4FC', fontFamily: 'Outfit-SemiBold' }]}>
                        {!createVibe ? 'Pick a vibe' : 'Pick at least one language'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={creatingEvent}
                      style={[s.btnPrimary, { shadowColor: '#6366F1', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }, creatingEvent && { opacity: 0.7 }]}
                      onPress={async () => {
                        if (creatingEvent) return
                        setCreatingEvent(true)
                        try {
                        // Build a proper event object
                        const TYPE_TO_CAT: Record<string, string> = {
                          padel:'sports',tennis:'sports',yoga:'sports',gym:'sports',water:'sports',
                          coffee:'coffee',meze:'food',wine:'wine',brunch:'food',sunset:'outdoors',
                          networking:'tech',crypto:'tech',coworking:'tech',cowork:'tech',
                          beach:'outdoors',hiking:'outdoors',boat:'outdoors',boardgames:'gaming',
                          dance:'dance',concert:'music',theatre:'dance',music:'music',art:'culture',
                        }
                        const SIZE_MAX: Record<string, number> = { duo: 2, squad: 5, party: 20 }
                        const GRAD_POOL: [string,string][] = [
                          ['#6366F1','#F43F5E'],
                          ['#10B981','#059669'],['#F59E0B','#F97316'],
                        ]
                        const tempId = Date.now()
                        const grad = GRAD_POOL[tempId % GRAD_POOL.length]
                        const rawLabel = createCustom.trim() || createType || 'Social'
                        const actLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

                        // Build expiry timestamp from selected date + time
                        let expiresAt = 0
                        if (createDay && createHour) {
                          const [h, m] = createHour.split(':').map(Number)
                          const d = new Date(createDay)
                          d.setHours(h, m, 0, 0)
                          expiresAt = d.getTime()
                        }

                        // Upload cover image if selected. Reuse the proven profile-photo
                        // upload helper so the path matches Storage RLS rules ({userId}/...)
                        // and we don't get a silent permission denial.
                        let imageUrl: string | null = null
                        if (createImage?.base64 && userData?.dbId) {
                          // Use a high slot number namespace to avoid colliding with profile photos.
                          const eventSlot = 9000 + Math.floor(Math.random() * 1000)
                          imageUrl = await uploadPhotoToStorage(createImage.base64, userData.dbId, eventSlot)
                          if (!imageUrl) console.warn('Event cover upload returned null')
                        }

                        // Save to Supabase, use DB id
                        let newId = tempId
                        try {
                          if (userData?.dbId) {
                            const { data: dbEv, error: dbErr } = await supabase.from('community_events').insert({
                              host_id: userData.dbId,
                              title: actLabel,
                              category: TYPE_TO_CAT[createType || ''] || 'outdoors',
                              location: createLocation,
                              description: createDescription || null,
                              city,
                              time: createDay && createHour ? `${createDay}, ${createHour}` : 'TBD',
                              max_participants: SIZE_MAX[createSize || 'squad'] || 5,
                              gradient: grad,
                              host_transport: createDriving ? 'car' : null,
                              image_url: imageUrl,
                              crew_pref: createCrewPref || 'any',
                              visibility: createVisibility,
                            }).select().single()
                            if (dbErr) console.warn('community_events insert error:', dbErr.message)
                            if (dbEv?.id) newId = dbEv.id
                          }
                        } catch (e) {
                          console.warn('community_events insert exception:', e)
                        }

                        const newEvent: any = {
                          id: newId,
                          city,
                          type: 'community',
                          title: actLabel,
                          time: createDay && createHour ? `${createDay}, ${createHour}` : 'TBD',
                          distance: '0km',
                          category: TYPE_TO_CAT[createType || ''] || 'outdoors',
                          gradient: grad,
                          seekerColors: ['#818CF8'],
                          seekingCount: 0,
                          participantsCount: 1,
                          maxParticipants: SIZE_MAX[createSize || 'squad'] || 5,
                          description: createDescription || null,
                          location: createLocation,
                          isHosted: true,
                          hostId: userData?.dbId,
                          hostDriving: createDriving,
                          hostLangs: createLangs,
                          hostVibe: createVibe,
                          expiresAt,
                          createdAt: Date.now(),
                          image_url: imageUrl,
                          visibility: createVisibility,
                        }
                        setUserCreatedEvents(prev => [...prev, newEvent])

                        // Reset form
                        setCreateOpen(false); setCreateStep(1); setCreateSize(null); setCreateType(null);
                        setCreateDay(''); setCreateHour(''); setCreateLocation(''); setCreateDescription(''); setCreateDriving(false);
                        setCreateLangs([]); setCreateVibe(null); setCreateCustom(''); setCreateImage(null); setCreateVisibility('public');
                        setCalViewYear(new Date().getFullYear()); setCalViewMonth(new Date().getMonth());
                        showToast('Others can find it in the feed now', 'Plan published', '✓')
                        } catch (e) {
                          console.warn('create event failed:', e)
                          showToast('Please try again', 'Could not publish', '⚠️')
                        } finally {
                          setCreatingEvent(false)
                        }
                      }}>
                      {creatingEvent
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={[s.btnPrimaryText, { color: '#fff' }]}>Create plan</Text>}
                    </TouchableOpacity>
                  )}
                </View>

              </KeyboardAvoidingView>
            </View>
          </LinearGradient>
        </Modal>
      </SafeAreaView>

      {/* City picker */}
      <Modal visible={cityOpen} transparent animationType="fade" onRequestClose={() => setCityOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setCityOpen(false)}>
          <View style={s.cityPickerSheet}>
            <Text style={s.cityPickerTitle}>Select City</Text>
            {/* Feed filter only — does NOT change the user's home city (profiles.city).
                Home city is set in registration / Edit Profile. */}
            <TouchableOpacity style={[s.cityPickerItem, city === null && { backgroundColor: 'rgba(99,102,241,0.08)' }]}
              onPress={() => { setCity(null); setCityOpen(false) }}>
              <Text style={[{ fontSize: 16, color: '#334155' }, city === null && { color: '#6366F1', fontWeight: '700' }]}>All Cities</Text>
              {city === null && <Ionicons name="checkmark" size={18} color="#6366F1" />}
            </TouchableOpacity>
            {CITIES.map(c => (
              <TouchableOpacity key={c} style={[s.cityPickerItem, city === c && { backgroundColor: 'rgba(99,102,241,0.08)' }]}
                onPress={() => { setCity(c); setCityOpen(false) }}>
                <Text style={[{ fontSize: 16, color: '#334155' }, city === c && { color: '#6366F1', fontWeight: '700' }]}>{c}</Text>
                {city === c && <Ionicons name="checkmark" size={18} color="#6366F1" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Event detail */}
      {eventDetail && (
          <Modal visible animationType="slide" onRequestClose={() => setEventDetail(null)}>
            <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F0F9FF']} style={s.fill}>
              <StatusBar style="dark" />
              <SafeAreaView style={s.fill}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header */}
                  <View style={{ position: 'relative' }}>
                    {eventDetail.image_url ? (
                      <View style={{ width: '100%', height: 360, backgroundColor: '#0A0812' }}>
                        <Image
                          source={{ uri: eventDetail.image_url }}
                          style={{ width: '100%', height: '100%' }}
                          // Official events are usually portrait posters → letterbox with contain
                          // so nothing gets cropped. Community events tend to be landscape user
                          // photos that look fine cover-cropped.
                          resizeMode={eventDetail.type === 'official' ? 'contain' : 'cover'}
                        />
                      </View>
                    ) : (
                      <LinearGradient colors={eventDetail.gradient as any} style={{ height: 280 }} />
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20 }}>
                      {(() => {
                        // Drop the category for official events (scraper miscategorized — e.g. RUES
                        // CINE ART as "Kids Shows"). Community events keep it (user-set, reliable).
                        const isOfficial = eventDetail.type === 'official'
                        const dist = eventDetail.distance && eventDetail.distance !== '0km' ? eventDetail.distance : ''
                        let line = ''
                        if (isOfficial) {
                          line = dist ? `📍 ${dist}` : ''
                        } else {
                          line = `${CATEGORY_EMOJI[eventDetail.category] || '📍'} ${eventDetail.category?.toUpperCase() || ''}${dist ? ` · ${dist}` : ''}`
                        }
                        if (!line) return null
                        return (
                          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                            {line}
                          </Text>
                        )
                      })()}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4, lineHeight: 28, flexShrink: 1 }}>{eventDetail.title}</Text>
                        {eventDetail.visibility === 'private' && (
                          <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Private 🔒</Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                    <TouchableOpacity onPress={() => setEventDetail(null)} style={[s.detailBackBtn, { position: 'absolute', top: 52, left: 20 }]}>
                      <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const deepLink = `https://joinparea.app/event/${eventDetail.id}`
                        const text = `${eventDetail.title}\n📅 ${eventDetail.time || ''}\n📍 ${eventDetail.location || eventDetail.city || ''}\n\nJoin me on Parea 👉 ${deepLink}`
                        Share.share({ message: text, title: eventDetail.title })
                      }}
                      style={{ position: 'absolute', top: 52, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="share-2" size={17} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ padding: 16, gap: 10 }}>
                    {/* Time + Location + Address link — one compact card */}
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="clock" size={16} color="#6366F1" />
                        </View>
                        <View>
                          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date & Time</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginTop: 1 }}>{eventDetail.date_label ? `${eventDetail.date_label}${eventDetail.time_label ? '\n' + eventDetail.time_label : ''}` : eventDetail.time_label || eventDetail.time || '—'}</Text>
                        </View>
                      </View>
                      <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="map-pin" size={16} color="#6366F1" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginTop: 1 }}>{eventDetail.location || eventDetail.city}{eventDetail.distance && eventDetail.distance !== '0km' ? ` · ${eventDetail.distance} from you` : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(eventDetail.location || eventDetail.city)}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>Open</Text>
                          <Feather name="external-link" size={12} color="#6366F1" />
                        </TouchableOpacity>
                      </View>
                      {(() => {
                        const myT = userEventTransport[eventDetail.id] || (eventDetail.isHosted && eventDetail.hostTransport === 'car' ? 'car' : '')
                        if (!myT) return null
                        const tIcon = myT === 'car' ? 'truck' : myT === 'lift' ? 'thumbs-up' : 'map-pin'
                        const tLabel = myT === 'car' ? "I'm driving · Open to giving a lift"
                                     : myT === 'lift' ? 'I need a ride · Open to carpooling'
                                     : "I'll meet there"
                        return (
                          <>
                            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                                <Feather name={tIcon as any} size={16} color="#6366F1" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your transport</Text>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginTop: 1 }}>{tLabel}</Text>
                              </View>
                            </View>
                          </>
                        )
                      })()}
                    </View>

                    {/* Description */}
                    {(() => {
                      const cleaned = (eventDetail.description || '').replace(/^[\s.:;,•·\-–—]+/, '').trim()
                      if (!cleaned) return null
                      return (
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14 }}>
                          <Text style={{ fontSize: 14, color: '#334155', lineHeight: 21 }}>{cleaned}</Text>
                        </View>
                      )
                    })()}

                    {/* Price / Language / Age — official events */}
                    {eventDetail.type === 'official' && (eventDetail.price || eventDetail.language || eventDetail.age_restriction) && (
                      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {eventDetail.price && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Text style={{ fontSize: 13 }}>🎟</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>{eventDetail.price}</Text>
                          </View>
                        )}
                        {eventDetail.language && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Text style={{ fontSize: 13 }}>🌍</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6366F1' }}>{eventDetail.language}</Text>
                          </View>
                        )}
                        {eventDetail.age_restriction && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Text style={{ fontSize: 13 }}>🔞</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#ea580c' }}>{eventDetail.age_restriction}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Participants — community events use join_requests, official events
                        use event_attendees (everyone interested in this event, across crews). */}
                    {eventDetail.type !== 'official' ? (
                      <Pressable
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          const isHost = eventDetail.isHosted || eventDetail.host_id === userData?.dbId
                          if (isHost && (hostConfirmedMembers[eventDetail.id] || []).length > 0) {
                            setEventParticipants({ ev: eventDetail, members: hostConfirmedMembers[eventDetail.id] }); return
                          }
                          if (!isHost && (communityEventMembers[eventDetail.id] || []).length > 0) {
                            setEventParticipants({ ev: eventDetail, members: communityEventMembers[eventDetail.id] }); return
                          }
                          const { data: reqs } = await supabase.from('join_requests').select('requester_id').eq('event_id', eventDetail.id).in('status', ['approved', 'confirmed'])
                          const ids = (reqs || []).map((r: any) => r.requester_id).filter(Boolean)
                          if (ids.length === 0) { setEventParticipants({ ev: eventDetail, members: [] }); return }
                          const { data: profiles } = await supabase.from('profiles').select('id, name, photos, bio, age, color').in('id', ids)
                          setEventParticipants({ ev: eventDetail, members: (profiles || []).map((p: any) => ({ id: p.id, name: p.name || 'Member', photo: p.photos?.[0] || null, bio: p.bio || '', age: p.age || '', color: p.color || '#818CF8' })) })
                        }}
                        style={({ pressed }) => ({ backgroundColor: pressed ? '#F5F3FF' : '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 })}>
                        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="users" size={18} color="#6366F1" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Participants</Text>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginTop: 2 }}>
                            {(eventDetail.isHosted || eventDetail.host_id === userData?.dbId) ? (hostConfirmedMembers[eventDetail.id] || []).length + 1 : eventDetail.participantsCount} going{evSpotsLeft !== null ? `  ·  ${evSpotsLeft} spots left` : ''}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: evIsFull ? '#fef2f2' : '#f0fdf4', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: evIsFull ? '#EF4444' : '#22c55e' }}>{evIsFull ? 'Full' : 'Open'}</Text>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          // For official events: show all event_attendees (people who joined
                          // this event in Parea, across all crews + still in pool).
                          // event_attendees.event_ref_id stores the app-side id with the
                          // 100_000 offset (matches eventDetail.id) — _dbId is the raw DB
                          // id (e.g. 232 for 100232) which would query the wrong key.
                          const evRefId = eventDetail.id
                          const { data: attendees } = await supabase
                            .from('event_attendees')
                            .select('profile_id, profiles:profile_id(id, name, photos, bio, age, color)')
                            .eq('event_ref_id', evRefId)
                          const members = (attendees || []).map((a: any) => {
                            const p = a.profiles || {}
                            return { id: p.id, name: p.name || 'Member', photo: p.photos?.[0] || null, bio: p.bio || '', age: p.age || '', color: p.color || '#818CF8' }
                          }).filter((m: any) => m.id)
                          setEventParticipants({ ev: eventDetail, members })
                        }}
                        style={({ pressed }) => ({ backgroundColor: pressed ? '#F5F3FF' : '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 })}>
                        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="users" size={18} color="#6366F1" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Participants</Text>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginTop: 2 }}>
                            See who's going
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={18} color="#94A3B8" />
                      </Pressable>
                    )}

                    {/* Organizer (official) */}
                    {eventDetail.type === 'official' && eventDetail.organizer && (
                      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 22 }}>{eventDetail.organizer.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Organizer</Text>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginTop: 2 }}>{eventDetail.organizer.name}</Text>
                          {eventDetail.source && <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>via {eventDetail.source}</Text>}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EEF2FF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 }}>
                          <Ionicons name="checkmark-circle" size={12} color="#6366F1" />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>Verified</Text>
                        </View>
                      </View>
                    )}

                    {/* Get Tickets */}
                    {(eventDetail.ticketLink || eventDetail.ticket_link) && (
                      <TouchableOpacity style={s.ticketBtn} onPress={() => Linking.openURL(eventDetail.ticketLink || eventDetail.ticket_link)} activeOpacity={0.8}>
                        <Ionicons name="ticket-outline" size={16} color="#6366F1" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#6366F1' }}>Get Tickets 🎫</Text>
                      </TouchableOpacity>
                    )}

                    {/* Host card (community events) */}
                    {evHost && (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginTop: 4, letterSpacing: -0.3 }}>Event Host</Text>
                        <TouchableOpacity
                          onPress={() => setChatPartnerPreview(evHost)}
                          style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                          activeOpacity={0.85}>
                          <Image source={{ uri: evHost.photo }} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEF2FF' }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>{evHost.name}, {evHost.age}</Text>
                            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 3, lineHeight: 18 }} numberOfLines={2}>{evHost.bio}</Text>
                            <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                              {evHost.langs.map((l: string) => <Text key={l} style={{ fontSize: 15 }}>{FLAG_MAP[l]}</Text>)}
                              {evHost.transport && evHost.transport !== 'meet' && <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 4 }}>{TRANSPORT_LABEL[evHost.transport]}</Text>}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </ScrollView>

                {/* Sticky Join button */}
                {!eventDetail.isHosted && !joinedEvents[eventDetail.id] && (
                  <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, backgroundColor: 'rgba(245,243,255,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.08)' }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={evIsFull}
                      onPress={() => {
                        setEventDetail(null)
                        setPendingJoinEv(eventDetail)
                        setActiveTab('home')
                      }}
                      style={[s.btnPrimary, evIsFull
                        ? { backgroundColor: '#E2E8F0', shadowOpacity: 0 }
                        : { shadowColor: '#6366F1', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }
                      ]}>
                      <Text style={[s.btnPrimaryText, { color: evIsFull ? '#94A3B8' : '#fff' }]}>
                        {evIsFull ? 'Event is full' : eventDetail.type === 'official' ? "I'm Going →" : 'Join this Social →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Participants sheet — inside event detail modal (iOS: can't nest Modals) */}
                {eventParticipants && (
                  <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 }}>
                    <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }} activeOpacity={1} onPress={() => setEventParticipants(null)} />
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 32, maxHeight: '80%' }}>
                      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
                      </View>
                      <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.08)' }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B' }}>{eventParticipants.ev.title}</Text>
                        <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '700', marginTop: 4 }}>
                          👥 {eventParticipants.members.length} participant{eventParticipants.members.length !== 1 ? 's' : ''} confirmed
                        </Text>
                      </View>
                      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                        {eventParticipants.members.length === 0 ? (
                          <Text style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14, paddingVertical: 24 }}>No confirmed participants yet</Text>
                        ) : eventParticipants.members.map((p: any, i: number) => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: `${p.color}08`, borderWidth: 1, borderColor: `${p.color}20` }}>
                            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {p.photo ? <Image source={{ uri: p.photo }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 22, color: '#fff', fontWeight: '800' }}>{(p.name || '?')[0]}</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>{p.name}{p.age ? `, ${p.age}` : ''}</Text>
                              {p.bio ? <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }} numberOfLines={2}>{p.bio}</Text> : null}
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}
              </SafeAreaView>
            </LinearGradient>
          </Modal>
      )}

      {/* Match modal */}
      {matchedWith && (
        <Modal visible transparent animationType="none" onRequestClose={() => setMatchedWith(null)}>
          <Animated.View style={{ flex: 1, opacity: matchFlash }}>
            <LinearGradient colors={['#0f0c29', '#1a1040', '#6d28d9']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              {/* Stars */}
              {['✨','⭐','💫','✨','⭐','💫'].map((s2, i) => (
                <Text key={i} style={{ position: 'absolute', fontSize: 22, opacity: 0.5,
                  top: `${10 + i * 12}%` as any, left: i % 2 === 0 ? `${8 + i * 5}%` as any : undefined,
                  right: i % 2 !== 0 ? `${8 + i * 5}%` as any : undefined }}>{s2}</Text>
              ))}

              <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(167,139,250,0.8)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
                You Found Your Parea
              </Text>

              {/* Animated avatars */}
              <Animated.View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28, transform: [{ scale: matchScale }] }}>
                <Animated.Image
                  source={{ uri: 'https://i.pravatar.cc/120?img=1' }}
                  style={[s.matchAvatar, { transform: [{ translateX: matchLeftX }] }]} />
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center', zIndex: 5, marginHorizontal: -8 }}>
                  <Text style={{ fontSize: 18 }}>🤝</Text>
                </View>
                <Animated.Image
                  source={{ uri: matchedWith.photo }}
                  style={[s.matchAvatar, { transform: [{ translateX: matchRightX }] }]} />
              </Animated.View>

              <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.8, marginBottom: 10, textAlign: 'center' }}>
                Found a Buddy! 🤝
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 36, textAlign: 'center', lineHeight: 22 }}>
                Say hi in your new{'\n'}Parea chat 🚀
              </Text>

              <TouchableOpacity
                style={{ backgroundColor: '#6d28d9', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 48, borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)', shadowColor: '#6d28d9', shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 }}
                onPress={() => { setMatchedWith(null); setEventDetail(null); setVibeResults({}); setActiveTab('messages') }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>Open Chat 💬</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMatchedWith(null)} style={{ marginTop: 18 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Maybe later</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Modal>
      )}

      {/* Chat screen — extracted to lib/screens/ChatScreen.tsx */}
      <ChatScreen
        openChat={openChat} setOpenChat={setOpenChat}
        chatInput={chatInput} setChatInput={setChatInput}
        chatMessages={chatMessages} setChatMessages={setChatMessages}
        replyTo={replyTo} setReplyTo={setReplyTo} replyToRef={replyToRef}
        chatList={chatList} setChatList={setChatList}
        groupMembersOpen={groupMembersOpen} setGroupMembersOpen={setGroupMembersOpen}
        chatPartnerPreview={chatPartnerPreview} setChatPartnerPreview={setChatPartnerPreview}
        chatKeyboardVisible={chatKeyboardVisible} chatSpacerH={chatSpacerH}
        blockedIds={blockedIds} setReportTarget={setReportTarget}
        scrollRef={scrollRef} chatBodyMaxH={chatBodyMaxH} chatBodyCurH={chatBodyCurH}
        officialEventChatMapRef={officialEventChatMapRef} cancelledEventIdsRef={cancelledEventIdsRef}
        userData={userData}
        userCreatedEvents={userCreatedEvents} setUserCreatedEvents={setUserCreatedEvents}
        dbCommunityEvents={dbCommunityEvents} feedOfficialDbEvents={feedOfficialDbEvents}
        joinedEvents={joinedEvents} setJoinedEvents={setJoinedEvents}
        setPendingJoinRequests={setPendingJoinRequests} setApprovedJoiners={setApprovedJoiners}
        setCancelledEventIds={setCancelledEventIds} setOfficialEventChatMap={setOfficialEventChatMap}
        insets={insets}
        handleSend={handleSend} handleBlock={handleBlock} showToast={showToast}
      />

      {/* Profile preview when triggered from outside chat (event detail host card,
          etc). Rendered as a Modal here so it works on its own. The inline copy
          above handles taps from inside the chat. */}
      {chatPartnerPreview && !openChat && <ProfilePreviewSheet profile={chatPartnerPreview} onClose={() => setChatPartnerPreview(null)} onBlock={handleBlock} onReport={(p) => setReportTarget(p)} />}
      {reportTarget && <ReportModal profile={reportTarget} onClose={() => setReportTarget(null)} onSubmit={(reason, details) => handleReport(reportTarget, reason, details)} />}


      {/* ── Notification Panel ─────────────────────────────────────────────── */}
      {notifOpen && (
        <Modal visible transparent animationType="none" onRequestClose={closeNotifPanel}>
          <View style={{ flex: 1 }}>
            {/* Backdrop */}
            <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,8,18,0.55)' }}
              activeOpacity={1} onPress={closeNotifPanel} />
            {/* Panel */}
            <Animated.View style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              transform: [{ translateY: notifPanelY }],
              backgroundColor: '#fff', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
              maxHeight: '78%',
              shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, elevation: 20,
            }}>
              {/* Top safe area fill */}
              <View style={{ height: 52, backgroundColor: '#fff', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5 }}>Notifications</Text>
                  {unreadCount > 0 && <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: '700', marginTop: 1 }}>{unreadCount} new</Text>}
                </View>
                <TouchableOpacity onPress={closeNotifPanel} activeOpacity={0.7}
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}>
                {(() => { const bellNotifs = notifications.filter(n => n.type !== 'new_message'); return (
                bellNotifs.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Text style={{ fontSize: 42, marginBottom: 12 }}>🔔</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E1B4B', marginBottom: 6 }}>All caught up!</Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Notifications will appear here{'\n'}when something happens</Text>
                  </View>
                ) : (
                  bellNotifs.map(n => {
                    const handleNotifTap = () => {
                      dismissNotif(n.id)
                      closeNotifPanel()
                      if (n.type === 'join_request' || n.type === 'member_left') {
                        setActiveTab('vibecheck')
                      } else if (n.type === 'match' || n.type === 'group_chat' || n.type === 'new_message' || n.type === 'member_joined') {
                        setMessagesInitialSubTab('messages')
                        setActiveTab('messages')
                      } else if (n.type === 'confirmed' || n.type === 'crew_ready') {
                        setMessagesInitialSubTab('messages')
                        setActiveTab('messages')
                      } else if (n.type === 'host_full' || n.type === 'reminder_24h' || n.type === 'reminder_2h' || n.type === 'event_cancelled') {
                        setMessagesInitialSubTab('going')
                        setActiveTab('messages')
                      } else if (n.type === 'crew_match' || n.type === 'crew_invite') {
                        setActiveTab('vibecheck')
                      } else if (n.type === 'crew_accepted') {
                        setMessagesInitialSubTab('messages')
                        setActiveTab('messages')
                      }
                    }
                    return (
                      <TouchableOpacity key={n.id} activeOpacity={0.8} onPress={handleNotifTap}
                        style={{
                          flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                          backgroundColor: n.read ? '#FAFAFA' : '#F5F3FF',
                          borderRadius: 18, padding: 14,
                          borderLeftWidth: 3, borderLeftColor: n.read ? '#E2E8F0' : n.color,
                          shadowColor: n.read ? 'transparent' : n.color,
                          shadowOpacity: n.read ? 0 : 0.12, shadowRadius: 8, elevation: n.read ? 0 : 2,
                        }}>
                        {/* Emoji icon */}
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${n.color}18`,
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Text style={{ fontSize: 20 }}>{n.emoji}</Text>
                        </View>
                        {/* Text */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: n.read ? '600' : '800', color: '#1E1B4B', marginBottom: 2 }}>{n.title}</Text>
                          <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17 }}>{n.body}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                            <Text style={{ fontSize: 11, color: n.color, fontWeight: '600' }}>{timeAgo(n.time)}</Text>
                            {!n.read && n.type !== 'welcome' && (
                              <Text style={{ fontSize: 11, color: '#94A3B8' }}>· {
                                n.type === 'join_request' ? 'tap to review →' :
                                n.type === 'match' || n.type === 'group_chat' || n.type === 'new_message' || n.type === 'member_joined' ? 'tap to open chat →' :
                                n.type === 'reminder_24h' || n.type === 'reminder_2h' ? 'tap to see plans →' :
                                n.type === 'event_cancelled' || n.type === 'member_left' ? 'tap to view →' : 'tap to open →'
                              }</Text>
                            )}
                          </View>
                        </View>
                        {/* Dismiss */}
                        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); dismissNotif(n.id) }} activeOpacity={0.7}
                          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                          <Feather name="x" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    )
                  })
                ))})()}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Group members sheet — outside chat Modal, kept here only so the closing
          tags below remain syntactically balanced. The actually-used sheet is
          rendered INSIDE the chat Modal in a sibling block earlier so iOS can
          stack it over the chat (Modal-over-Modal doesn't work on iOS). */}
      {false && groupMembersOpen && openChat && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 9999, elevation: 9999 }}>
          <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }} activeOpacity={1} onPress={() => setGroupMembersOpen(false)} />
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
              </View>
              {/* Header */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.08)' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B' }}>{openChat.event}</Text>
                <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '600', marginTop: 2 }}>
                  {openChat.eventEmoji} {openChat.members} members
                </Text>
              </View>
              <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: Math.max(insets.bottom + 16, 40) }}>
                {/* You */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.15)' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>😊</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>You</Text>
                      {openChat.hostEventId && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#6366F1' }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>HOST</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>That's you</Text>
                  </View>
                </View>
                {/* Approved members — compact: photo + name + chevron, no bio/transport/flags */}
                {(openChat.memberProfiles || []).map((p: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.04)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.1)' }}>
                    <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
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
                      }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: p.color }}>
                        {p.photo
                          ? <Image source={{ uri: p.photo }} style={{ width: '100%', height: '100%' }} />
                          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>👤</Text></View>}
                      </View>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: '#1E1B4B' }}>{p.name}{p.age ? `, ${p.age}` : ''}</Text>
                        {p._isHost && (
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: '#6366F1' }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>HOST</Text>
                          </View>
                        )}
                      </View>
                      <Feather name="chevron-right" size={18} color="#94A3B8" />
                    </TouchableOpacity>

                    {/* Remove button — only for host */}
                    {openChat.hostEventId && (
                      <TouchableOpacity activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                          Alert.alert(
                            `Remove ${p.name}?`,
                            'They will be removed from the group chat.',
                            [
                              { text: 'Remove', style: 'destructive', onPress: () => {
                                // Remove from approvedJoiners so slot opens up for refill
                                setApprovedJoiners(prev => ({
                                  ...prev,
                                  [openChat.hostEventId]: (prev[openChat.hostEventId] || []).filter((_: any, idx: number) => idx !== i),
                                }))
                                // Remove from memberProfiles + avatars in chatList
                                setChatList(prev => prev.map(c => {
                                  if (c.id !== openChat.id) return c
                                  const newProfiles = (c.memberProfiles || []).filter((_: any, idx: number) => idx !== i)
                                  return {
                                    ...c,
                                    memberProfiles: newProfiles,
                                    avatars: newProfiles.map((m: any) => m.photo).filter(Boolean),
                                    colors: newProfiles.map((m: any) => m.color),
                                    members: newProfiles.length + 1,
                                    lastMsg: `🚫 ${p.name} was removed`,
                                    time: 'now',
                                  }
                                }))
                                // Update openChat in-place
                                setOpenChat((prev: any) => {
                                  if (!prev) return prev
                                  const newProfiles = (prev.memberProfiles || []).filter((_: any, idx: number) => idx !== i)
                                  return {
                                    ...prev,
                                    memberProfiles: newProfiles,
                                    avatars: newProfiles.map((m: any) => m.photo).filter(Boolean),
                                    colors: newProfiles.map((m: any) => m.color),
                                    members: newProfiles.length + 1,
                                  }
                                })
                                // Add system message
                                setChatMessages(prev => ({
                                  ...prev,
                                  [openChat.id]: [...(prev[openChat.id] || []), { from: 'system', text: `🚫 ${p.name} was removed from the group`, time: 'now' }],
                                }))
                                addNotif({ type: 'member_left', emoji: '👋', color: '#F59E0B', title: `${p.name} left the group`, body: openChat.event || '' })
                                setGroupMembersOpen(false)
                                showToast('They\'ve been removed from the group', `${p.name} removed`, '👋')
                              }},
                              { text: 'Cancel', style: 'cancel' },
                            ]
                          )
                        }}
                        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="user-x" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
        </View>
      )}


      {/* Toast notification */}
      {toast.visible && (() => {
        const TOAST_ICON: Record<string, any> = {
          '🔍': MagnifyingGlass, '✅': PhCheckCircle, '🎉': Confetti,
          '💬': ChatTeardrop, '⏳': PhClock, '⚠️': Warning,
          '👋': HandWaving, '🎯': Crosshair, '📅': CalendarBlank,
          '🗑️': PhTrash, '✨': Sparkle,
        }
        const TOAST_GRAD: Record<string, [string,string]> = {
          '🔍': ['#6366F1','#7C3AED'], '✅': ['#10B981','#059669'],
          '🎉': ['#F59E0B','#EF4444'], '💬': ['#06B6D4','#0EA5E9'],
          '⏳': ['#F59E0B','#F97316'], '⚠️': ['#EF4444','#DC2626'],
          '👋': ['#64748B','#475569'], '🎯': ['#8B5CF6','#6366F1'],
          '📅': ['#6366F1','#4F46E5'], '🗑️': ['#EF4444','#DC2626'],
          '✨': ['#6366F1','#7C3AED'],
        }
        const key = toast.emoji || '✨'
        const ToastIcon = TOAST_ICON[key] || Sparkle
        const grad = TOAST_GRAD[key] || ['#6366F1','#7C3AED']
        return (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', top: 56, left: 20, right: 20, zIndex: 9999,
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }, { scale: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          }}>
            <View style={{ borderRadius: 24, overflow: 'hidden', shadowColor: grad[0], shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 18 }}>
              <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}>
                {toast.emoji && (
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ToastIcon size={20} color="#fff" weight="duotone" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'ClashDisplay-Semibold', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>{toast.title || toast.text}</Text>
                  {toast.title ? <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }} numberOfLines={1}>{toast.text}</Text> : null}
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )
      })()}
    </LinearGradient>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<'loading' | 'landing' | 'register' | 'otp' | 'onboarding' | 'feed'>('loading')
  const [userData, setUserData] = useState<any>({})
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [authCredential, setAuthCredential] = useState('')
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  const PROFILE_COLORS = ['#6366F1','#10B981','#F59E0B','#3B82F6','#8B5CF6','#EF4444','#14B8A6']

  const loadProfileForUser = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', userId)
      .single()
    if (profile) {
      if (profile.is_banned) {
        await supabase.auth.signOut()
        Alert.alert('Account suspended', 'Your account has been suspended for violating our community guidelines.')
        setScreen('landing')
        return
      }
      setAuthUserId(userId)
      setUserData({
        name: profile.name,
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        bio: profile.bio,
        photos: profile.photos || [],
        langs: profile.langs || [],
        interests: profile.interests || [],
        socialEnergy: profile.social_energy,
        drinksPref: profile.drinks_pref,
        smokingPref: profile.smoking_pref,
        musicGenres: profile.music_genres || [],
        transport: profile.transport,
        format: profile.format,
        petsPref: profile.pets_pref || '',
        hasPets: !!profile.has_pets,
        dealbreakers: profile.dealbreakers || [],
        city: profile.city,
        color: profile.color,
        dbId: profile.id,
        authId: userId,
      })
      setScreen('feed')
    } else {
      setAuthUserId(userId)
      setScreen('onboarding')
    }
  }

  // Check existing session on mount
  useEffect(() => {
    // Pre-clear stale/invalid refresh token before auto-refresh tries it
    supabase.auth.getSession().catch(async (err: any) => {
      const msg = err?.message || ''
      if (msg.includes('Refresh Token') || msg.includes('refresh_token')) {
        await supabase.auth.signOut().catch(() => {})
        setScreen('landing')
      }
    })
    // onAuthStateChange catches both initial restore from AsyncStorage and new logins
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          await loadProfileForUser(session.user.id)
        } else {
          setScreen('landing')
        }
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        setScreen('landing')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const saveProfileToDB = async (data: any, userId: string) => {
    try {
      const color = PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]
      // Use photos as-is (onboarding uploads happen in pickPhoto via base64)
      const finalPhotos: string[] = (data.photos || []).filter(Boolean)
      const { data: row, error } = await supabase.from('profiles').insert({
        auth_id: userId,
        name: data.name,
        age: parseInt(data.age) || null,
        gender: data.gender || null,
        city: data.city || null,
        bio: data.bio,
        photos: finalPhotos,
        langs: data.langs || [],
        interests: data.interests || [],
        social_energy: data.socialEnergy,
        drinks_pref: data.drinksPref,
        smoking_pref: data.smokingPref,
        music_genres: data.musicGenres || [],
        transport: data.transport,
        format: data.format,
        pets_pref: data.petsPref || null,
        dealbreakers: data.dealbreakers || [],
        color,
      }).select().single()
      if (error) console.warn('Supabase save error:', error.message)
      return row
    } catch (e) {
      console.warn('Supabase error:', e)
      return null
    }
  }

  const handleFinishOnboarding = async (data: any) => {
    const row = await saveProfileToDB(data, authUserId || '')
    setUserData({ ...data, dbId: row?.id, authId: authUserId })
    setScreen('feed')
  }

  const handleGoogleSignIn = async () => {
    try {
      // Use Linking.createURL so the redirect scheme matches the runtime:
      // - In Expo Go: exp://192.168.x.x:8081/--/
      // - In dev-client / prod build: pareaapp://
      // The static 'pareaapp://' redirectTo only works in standalone builds —
      // testing via Expo Go would hang on the loading screen because the
      // browser tries to open pareaapp:// which Expo Go isn't registered for.
      const redirectTo = ExpoLinking.createURL('/')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (error) { Alert.alert('Google Sign In failed', error.message); return }
      if (!data?.url) return
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'success' && result.url) {
        const url = result.url
        const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || ''
        const params = new URLSearchParams(hashPart)
        // PKCE flow returns ?code=xxx; implicit flow returns #access_token=xxx.
        // Supabase JS v2 defaults to PKCE — handle both for safety.
        const code = params.get('code')
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (code) {
          const { data: s, error: exErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exErr) { Alert.alert('Google Sign In failed', exErr.message); return }
          if (s?.user) await loadProfileForUser(s.user.id)
        } else if (access_token) {
          const { data: s } = await supabase.auth.setSession({ access_token, refresh_token: refresh_token || '' })
          if (s.user) await loadProfileForUser(s.user.id)
        }
      }
    } catch (e: any) {
      Alert.alert('Google Sign In failed', e.message)
    }
  }

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      })
      if (error) { Alert.alert('Apple Sign In failed', error.message); return }
      if (data.user) await loadProfileForUser(data.user.id)
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign In failed', e.message)
      }
    }
  }

  const handleLogOut = async () => {
    if (userData?.authId) await AsyncStorage.removeItem(`parea_feed_${userData.authId}`)
    await supabase.auth.signOut()
    setUserData({})
    setAuthUserId(null)
    setScreen('landing')
  }

  if (screen === 'loading') return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  )
  const handleOtpVerify = async (userId: string) => {
    setAuthUserId(userId)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', userId)
      .single()
    if (profile) {
      setUserData({
        name: profile.name,
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        bio: profile.bio,
        photos: profile.photos || [],
        langs: profile.langs || [],
        interests: profile.interests || [],
        socialEnergy: profile.social_energy,
        drinksPref: profile.drinks_pref,
        smokingPref: profile.smoking_pref,
        musicGenres: profile.music_genres || [],
        transport: profile.transport,
        format: profile.format,
        petsPref: profile.pets_pref || '',
        hasPets: !!profile.has_pets,
        dealbreakers: profile.dealbreakers || [],
        city: profile.city,
        color: profile.color,
        dbId: profile.id,
        authId: userId,
      })
      setScreen('feed')
    } else {
      setScreen('onboarding')
    }
  }

  if (screen === 'landing') return <LandingScreen onCreateAccount={() => setScreen('register')} onLogin={() => setScreen('register')} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} />
  if (screen === 'register') return <RegistrationScreen onBack={() => setScreen('landing')} onSendOtp={(method, cred) => { setAuthMethod(method); setAuthCredential(cred); setScreen('otp') }} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} />
  if (screen === 'otp') return <OTPScreen onBack={() => setScreen('register')} method={authMethod} credential={authCredential} onVerify={handleOtpVerify} />
  if (screen === 'onboarding') return <OnboardingScreen onBack={() => setScreen('otp')} onFinish={handleFinishOnboarding} userId={authUserId || undefined} />
  const handleUpdateUserData = async (patch: any) => {
    setUserData((prev: any) => ({ ...prev, ...patch }))
    if (userData?.dbId) {
      const dbPatch: any = {}
      // Photos are saved to DB directly from pickProfilePhoto after Storage upload —
      // skip here to avoid overwriting public URLs with local file:// URIs.
      if (patch.name        !== undefined) dbPatch.name          = patch.name
      if (patch.age         !== undefined) dbPatch.age           = parseInt(patch.age) || null
      if (patch.gender      !== undefined) dbPatch.gender        = patch.gender || null
      if (patch.langs       !== undefined) dbPatch.langs         = patch.langs
      if (patch.interests   !== undefined) dbPatch.interests     = patch.interests
      if (patch.musicGenres !== undefined) dbPatch.music_genres  = patch.musicGenres
      if (patch.socialEnergy!== undefined) dbPatch.social_energy = patch.socialEnergy
      if (patch.drinksPref  !== undefined) dbPatch.drinks_pref   = patch.drinksPref
      if (patch.smokingPref !== undefined) dbPatch.smoking_pref  = patch.smokingPref
      if (patch.petsPref    !== undefined) dbPatch.pets_pref     = patch.petsPref
      if (patch.hasPets     !== undefined) dbPatch.has_pets      = !!patch.hasPets
      if (patch.dealbreakers!== undefined) dbPatch.dealbreakers  = patch.dealbreakers
      if (patch.transport   !== undefined) dbPatch.transport     = patch.transport
      if (patch.format      !== undefined) dbPatch.format        = patch.format
      if (patch.city        !== undefined) dbPatch.city          = patch.city
      if (patch.bio         !== undefined) dbPatch.bio           = patch.bio
      if (Object.keys(dbPatch).length > 0) {
        await supabase.from('profiles').update(dbPatch).eq('id', userData.dbId)
      }
    }
  }
  return <FeedScreen userData={userData} onUpdateUserData={handleUpdateUserData} onLogOut={handleLogOut} />
}

