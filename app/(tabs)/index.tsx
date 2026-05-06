// app/(tabs)/index.tsx — Parea Mobile
import { Feather, Ionicons } from '@expo/vector-icons'
import { Users, UsersRound, PartyPopper, Dumbbell, UtensilsCrossed, Briefcase, Leaf, Palette, Pencil, CheckCircle, Zap, Car, MapPin, ThumbsUp, User, Radio, Clock, Search, Trash2, Crown, Check, Minus, MessageCircle, X, ChevronRight, CalendarDays, MoreHorizontal, Coffee, Wine, Cpu, Gamepad2, Music, Drama } from 'lucide-react-native'
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
import MapView, { Marker } from 'react-native-maps'
import * as ExpoLinking from 'expo-linking'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import ConfettiCannon from 'react-native-confetti-cannon'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../lib/supabase'
import { BreathingButton } from '../../lib/components/BreathingButton'
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
import { prettyEventTime, scoreRequesterForHost, scoreEventForRequester } from '../../lib/feed-helpers'

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ''

const { width: W, height: H } = Dimensions.get('window')
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY || ''

// ─── UPLOAD PHOTO TO SUPABASE STORAGE ────────────────────────────────────────
const uploadPhotoToStorage = async (base64: string, userId: string, slot: number): Promise<string | null> => {
  try {
    const path = `${userId}/${slot}_${Date.now()}.jpg`
    const byteChars = atob(base64)
    const byteArr = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, byteArr, { upsert: true, contentType: 'image/jpeg' })
    if (error) { console.warn('Storage upload error:', error.message); return null }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    console.log('✅ Upload success, public URL:', data.publicUrl)
    return data.publicUrl
  } catch (e) {
    console.warn('Upload failed:', e)
    return null
  }
}

// ─── AURORA BACKGROUND ────────────────────────────────────────────────────────

function AuroraBg({ width, height }: { width: number; height: number }) {
  const a1 = useRef(new Animated.Value(0)).current
  const a2 = useRef(new Animated.Value(0)).current
  const a3 = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = (val: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])).start()
    loop(a1, 7000)
    loop(a2, 11000)
    loop(a3, 9000)
  }, [])
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width, height, pointerEvents: 'none' }}>
      <Animated.View style={{
        position: 'absolute', top: height * 0.06, left: -width * 0.1, right: -width * 0.1, height: 140,
        opacity: a1.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.22] }),
        transform: [{ scaleX: a1.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.08] }) }],
      }}>
        <LinearGradient colors={['transparent', 'rgba(139,92,246,0.7)', 'transparent']} style={{ flex: 1, borderRadius: 70 }} />
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', top: height * 0.18, left: -width * 0.15, right: -width * 0.05, height: 110,
        opacity: a2.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.18] }),
        transform: [{ scaleX: a2.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.85] }) }],
      }}>
        <LinearGradient colors={['transparent', 'rgba(6,182,212,0.65)', 'transparent']} style={{ flex: 1, borderRadius: 55 }} />
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', top: height * 0.30, left: -width * 0.05, right: -width * 0.12, height: 90,
        opacity: a3.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] }),
        transform: [{ scaleX: a3.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) }],
      }}>
        <LinearGradient colors={['transparent', 'rgba(139,92,246,0.5)', 'transparent']} style={{ flex: 1, borderRadius: 45 }} />
      </Animated.View>
    </View>
  )
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const LANDING_SLIDES = [
  {
    img: require('../../assets/images/characters_dark.png.png'),
    line1: "What's",
    line2: 'happening',
    line3: 'tonight?',
    sub: 'Find events and people going out in your city.',
    btnLabel: "Show me what's on",
    imgScale: 0.85,
    tags: ['Wine bar', 'Live music', 'Theatre'],
  },
  {
    img: require('../../assets/images/characters_scene2.png.png'),
    line1: 'No plans?',
    line2: 'we got you.',
    line3: '',
    sub: 'Browse events, join spontaneously, meet your crew.',
    btnLabel: 'Find something tonight',
    imgScale: 1.0,
    tags: ['🎉 Party', '🌴 Beach', '🎤 Concerts'],
  },
  {
    img: require('../../assets/images/characters_scene3.png'),
    line1: 'Everything',
    line2: 'in one place.',
    line3: '',
    sub: 'Official events, community hangs, and people who make it fun.',
    btnLabel: 'Find my people',
    imgScale: 1.0,
    tags: ['🎨 Art', '🍕 Food', '💻 Tech'],
  },
]


const INTEREST_ICON_MAP: Record<string, any> = {
  '☕ Coffee': PhCoffee, '🍷 Wine': PhWine, '🎾 Tennis': TennisBall, '🎬 Movies': FilmSlate,
  '🥾 Hiking': Mountains, '🍕 Foodie': ForkKnife, '🧘 Yoga': YinYang, '🎨 Art': PhPalette,
  '🎸 Music': MusicNotes, '✈️ Travel': AirplaneTilt, '💃 Dance': MusicNotes, '📚 Books': Books,
  '💻 IT': PhCpu, '🎮 Gaming': GameController, '📷 Photography': PhCamera, '🎭 Theatre': MaskHappy,
  '🏖️ Beach': Umbrella, '🎲 Board Games': GameController, '🎤 Concerts': MicrophoneStage,
  '🏊 Swimming': PersonSimpleSwim, '🏓 Padel': TennisBall, '✂️ Crafts': PhScissors,
  '👗 Fashion': TShirt, '🏄 Water Sports': WaveSine,
}

const CATEGORY_ICON: Record<string, any> = { coffee: PhCoffee, sports: Barbell, wine: PhWine, gaming: GameController, tech: PhCpu, outdoors: PhLeaf, food: ForkKnife, culture: PhPalette, music: MusicNotes, dance: MaskHappy, theatre: MaskHappy, art: PhPalette }


// ─── AI COMPANION MATCHING ────────────────────────────────────────────────────

type MatchResult = { id: number; score: number; reason: string }

async function aiScoreRealAttendees(
  user: { name?: string; age?: any; langs?: string[]; interests?: string[]; drinksPref?: string; smokingPref?: string; bio?: string; transport?: string },
  candidates: { id: string; name: string; age?: any; langs?: string[]; interests?: string[]; drinksPref?: string; smokingPref?: string; bio?: string; transport?: string }[]
): Promise<{ id: string; score: number; vibe: string }[]> {
  if (candidates.length === 0) return []
  if (!ANTHROPIC_KEY) return candidates.map(c => ({ id: c.id, score: 75, vibe: 'Real attendee' }))
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are a social compatibility matcher for Parea. Score each candidate's compatibility with the user (0-100).

User: ${user.name}, age ${user.age}, langs=[${(user.langs||[]).join(',')}], interests=[${(user.interests||[]).join(',')}], drinks=${user.drinksPref||'?'}, smoking=${user.smokingPref||'?'}, transport=${user.transport||'?'}, bio="${user.bio||''}"

Candidates:
${candidates.map((c,i) => `${i+1}. id="${c.id}" ${c.name} age=${c.age} langs=[${(c.langs||[]).join(',')}] interests=[${(c.interests||[]).join(',')}] drinks=${c.drinksPref||'?'} smoking=${c.smokingPref||'?'} transport=${c.transport||'?'} bio="${c.bio||''}"`).join('\n')}

Scoring: shared interests 40%, language overlap 25%, lifestyle (drinks+smoking) 20%, bio vibe 10%, transport complement 5%.
Return ONLY valid JSON array: [{"id":"exact-id-string","score":85,"vibe":"Short 2-3 word tag"}]`,
        }],
      }),
    })
    const data = await res.json()
    const text = data?.content?.[0]?.text?.trim() || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const parsed: { id: string; score: number; vibe: string }[] = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return candidates.map(c => {
      const m = parsed.find(p => p.id === c.id)
      return { id: c.id, score: m?.score ?? 75, vibe: m?.vibe ?? 'Real attendee' }
    })
  } catch {
    return candidates.map(c => ({ id: c.id, score: 75, vibe: 'Real attendee' }))
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

Score each candidate 0-100 for companion compatibility.${user.eventContext ? ' Boost score for candidates whose interests align with the event context.' : ''} Weigh: shared interests & music taste (40%), lifestyle compatibility (25%), language overlap (20%), age proximity (15%). Lifestyle = compatible habits, not identical. Return ONLY valid JSON, no other text:
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

async function isImageSafe(base64: string): Promise<boolean> {
  if (!base64 || base64.length < 100) return true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return true // not logged in yet — skip
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    const res = await fetch(`${supabaseUrl}/functions/v1/moderate-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ base64 }),
    })
    const json = await res.json()
    return json?.safe !== false // safe by default if response malformed
  } catch { return true }
}

// ─── LANDING SCREEN ───────────────────────────────────────────────────────────

const ls = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B16',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 10,
    marginLeft: -8,
  },
  logoImg: {
    width: 120,
    height: 40,
  },
  logoText: {
    fontFamily: 'ClashDisplay-Bold',
    fontSize: 26,
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#7C3AED',
    opacity: 0.35,
  },
  charsImage: {
    // width/height set dynamically in component
  },
  tag: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 42,
    overflow: 'hidden',
  },
  tagText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.1,
  },
  headlineBlock: {
    marginTop: 12,
  },
  headlineLine: {
    fontFamily: 'ClashDisplay-Bold',
    color: '#F8FAFC',
    letterSpacing: -1.5,
    // fontSize/lineHeight set dynamically
  },
  headlineAccent: {
    fontFamily: 'ClashDisplay-Bold',
    color: '#FB923C',
    letterSpacing: -1.5,
    // fontSize/lineHeight set dynamically
  },
  subtitle: {
    fontFamily: 'Outfit-Regular',
    color: 'rgba(255,255,255,0.55)',
    // fontSize/lineHeight/marginTop set dynamically
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: 14,
    paddingBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  ctaGradient: {
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'ClashDisplay-Semibold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: -0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Outfit-Medium',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  socialBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#fff',
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Outfit-Regular',
  },
  loginLink: {
    color: '#8B5CF6',
    fontFamily: 'Outfit-Bold',
  },
  // ── Slide 2 floating event cards ──
  s2card: {
    position: 'absolute',
    width: 78,
    borderRadius: 14,
    padding: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(14, 10, 28, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  s2cardFeatured: {
    width: 88,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  s2icon: {
    marginBottom: 6,
  },
  s2iconFeatured: {},
  s2title: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: '#fff',
    marginBottom: 1,
  },
  s2sub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 13,
  },
  s2check: {
    position: 'absolute',
    top: 7,
    right: 7,
  },
})


function LandingScreen({ onCreateAccount, onLogin, onGoogleSignIn, onAppleSignIn }: {
  onCreateAccount: () => void
  onLogin: () => void
  onGoogleSignIn?: () => void
  onAppleSignIn?: () => void
}) {
  const [slide, setSlide] = useState(0)
  const touchX = useRef<number | null>(null)

  const logoOpacity     = useRef(new Animated.Value(0)).current
  const headlineY       = useRef(new Animated.Value(28)).current
  const headlineOpacity = useRef(new Animated.Value(0)).current
  const charsScale      = useRef(new Animated.Value(0.93)).current
  const btnOpacity      = useRef(new Animated.Value(0)).current

  const runEntrance = () => {
    headlineY.setValue(28)
    headlineOpacity.setValue(0)
    charsScale.setValue(0.93)
    btnOpacity.setValue(0)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headlineY,       { toValue: 0, duration: 360, useNativeDriver: true }),
        Animated.timing(headlineOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(charsScale,      { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
  }

  useEffect(() => {
    Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  useEffect(() => { runEntrance() }, [slide])

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= LANDING_SLIDES.length) return
    setSlide(idx)
  }

  const cur    = LANDING_SLIDES[slide]
  const isLast = slide === LANDING_SLIDES.length - 1
  const insets = useSafeAreaInsets()

  // Responsive breakpoints: compact < 720, medium < 820, large ≥ 820
  const heroH    = H < 720 ? 220 : H < 820 ? 260 : 300
  const heroMT   = H < 720 ? 6   : H < 820 ? 12  : 18
  const imgW     = H < 720 ? 210 : H < 820 ? 255 : 295
  const imgHt    = H < 720 ? 200 : H < 820 ? 245 : 280
  const glowSz   = H < 720 ? 160 : H < 820 ? 200 : 230
  const hFz      = H < 720 ? 32  : H < 820 ? 36  : 40
  const hLh      = H < 720 ? 36  : H < 820 ? 42  : 46
  const subFz    = H < 720 ? 14  : 16
  const subLh    = H < 720 ? 20  : 24
  const subMT    = H < 720 ? 10  : 14

  return (
    <View
      style={ls.container}
      onTouchStart={e => { touchX.current = e.nativeEvent.pageX }}
      onTouchEnd={e => {
        if (touchX.current === null) return
        const dx = e.nativeEvent.pageX - touchX.current
        if (dx < -50) goTo(slide + 1)
        else if (dx > 50) goTo(slide - 1)
        touchX.current = null
      }}>
      <AuroraBg width={W} height={H} />
      <StatusBar style="light" />
      <SafeAreaView style={ls.safe}>

        {/* ── Logo ── */}
        <Animated.View style={[ls.logoRow, { opacity: logoOpacity }]}>
          <Image source={require('../../assets/images/logo.png')} style={ls.logoImg} resizeMode="contain" />
        </Animated.View>

        {/* ── Hero block ── */}
        <View style={[ls.hero, { height: heroH, marginTop: heroMT, justifyContent: slide === 1 ? 'flex-end' : 'center' }]}>
          <View style={{ position: 'relative' }}>
            <Animated.Image
              source={cur.img}
              style={{ width: imgW, height: imgHt, transform: [{ scale: charsScale }] }}
              resizeMode="contain"
            />
          </View>

          {/* Slide 2 only: floating event cards */}
          {slide === 1 && (
            <>
              {/* Left — Theatre */}
              <View style={[ls.s2card, { top: 10, left: 16, transform: [{ rotate: '-6deg' }] }]}>
                <View style={ls.s2icon}>
                  <MaskHappy size={14} color="#fff" weight="duotone" />
                </View>
                <Text style={ls.s2title}>Theatre</Text>
                <Text style={ls.s2sub}>Friday · 7:30 PM</Text>
              </View>

              {/* Center — Tech Talk (highlighted) */}
              <View style={[ls.s2card, ls.s2cardFeatured, { top: -4, alignSelf: 'center' }]}>
                <View style={[ls.s2icon, ls.s2iconFeatured]}>
                  <MicrophoneStage size={14} color="#8B5CF6" weight="duotone" />
                </View>
                <Text style={ls.s2title}>Tech Talk</Text>
                <Text style={ls.s2sub}>Sat · 2:00 PM</Text>
                <View style={ls.s2check}>
                  <PhCheckCircle size={13} color="#8B5CF6" weight="fill" />
                </View>
              </View>

              {/* Right — Food Market */}
              <View style={[ls.s2card, { top: 18, right: 16, transform: [{ rotate: '6deg' }] }]}>
                <View style={ls.s2icon}>
                  <ForkKnife size={14} color="#fff" weight="duotone" />
                </View>
                <Text style={ls.s2title}>Food Market</Text>
                <Text style={ls.s2sub}>Sun · 11:00 AM</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Headline ── */}
        <Animated.View
          style={[ls.headlineBlock, { opacity: headlineOpacity, transform: [{ translateY: headlineY }] }]}>
          <Text style={[ls.headlineLine,   { fontSize: hFz, lineHeight: hLh }]} numberOfLines={1} adjustsFontSizeToFit>{cur.line1}</Text>
          <Text style={[ls.headlineAccent, { fontSize: hFz, lineHeight: hLh }]} numberOfLines={1} adjustsFontSizeToFit>{cur.line2}</Text>
          {!!cur.line3 && <Text style={[ls.headlineLine, { fontSize: hFz, lineHeight: hLh }]} numberOfLines={1} adjustsFontSizeToFit>{cur.line3}</Text>}
          <Text style={[ls.subtitle, { fontSize: subFz, lineHeight: subLh, marginTop: subMT }]}>{cur.sub}</Text>
        </Animated.View>

        {/* ── Bottom ── */}
        <Animated.View style={[ls.bottom, { opacity: btnOpacity, paddingBottom: insets.bottom + 8 }]}>

          {/* Dots */}
          <View style={ls.dotsRow}>
            {LANDING_SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={i === slide ? ls.dotActive : ls.dot} />
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA button */}
          <TouchableOpacity
            onPress={isLast ? onCreateAccount : () => goTo(slide + 1)}
            activeOpacity={1}
            style={{ marginTop: 10 }}>
            <LinearGradient
              colors={['#8B5CF6', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ls.ctaGradient}>
              <Text style={ls.ctaText} numberOfLines={1}>
                {isLast ? 'Find my people' : cur.btnLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Last slide: Apple only */}
          {isLast && Platform.OS === 'ios' && onAppleSignIn && (
            <>
              <View style={ls.dividerRow}>
                <View style={ls.dividerLine} />
                <Text style={ls.dividerText}>or continue with</Text>
                <View style={ls.dividerLine} />
              </View>
              <View style={ls.socialRow}>
                <TouchableOpacity style={ls.socialBtn} onPress={onAppleSignIn}>
                  <Svg width={16} height={16} viewBox="0 0 814 1000">
                    <Path fill="#fff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 74.1zm-56.4-173.7c24.3-29.4 41.5-70.5 41.5-111.5 0-5.8-.6-11.7-1.9-16.2-39.5 1.3-86.2 26.3-114.4 55.7-22.7 25.3-43.5 66.3-43.5 108 0 6.4 1.3 13 1.9 14.9 2.6.6 6.5 1.3 10.4 1.3 35.7 0 79.8-23.9 105.9-52.2z"/>
                  </Svg>
                  <Text style={ls.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Login link */}
          <TouchableOpacity style={ls.loginRow} onPress={onLogin}>
            <Text style={ls.loginText}>
              {isLast ? 'Already a member?' : 'Already have an account?'}
              {'  '}<Text style={ls.loginLink}>Log in</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

// ─── REGISTRATION SCREEN ──────────────────────────────────────────────────────


function formatLocal(digits: string, groups: number[]) {
  let result = ''; let pos = 0
  for (const g of groups) {
    if (pos >= digits.length) break
    if (pos > 0) result += ' '
    result += digits.slice(pos, pos + g)
    pos += g
  }
  return result
}

function RegistrationScreen({ onBack, onSendOtp, onGoogleSignIn, onAppleSignIn }: {
  onBack: () => void
  onSendOtp: (method: 'email' | 'phone', credential: string) => void
  onGoogleSignIn?: () => void
  onAppleSignIn?: () => void
}) {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [localPhone, setLocalPhone] = useState('')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [countryModal, setCountryModal] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showAgreementWarning, setShowAgreementWarning] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const isPhoneValid = localPhone.replace(/\D/g, '').length >= country.digits
  const isCredentialValid = tab === 'email' ? isEmailValid : isPhoneValid
  const isValid = isCredentialValid && agreed

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, country.digits)
    setLocalPhone(formatLocal(digits, country.groups))
  }

  const handleContinue = async () => {
    if (isChecking) return
    if (isCredentialValid && !agreed) {
      setShowAgreementWarning(true)
      return
    }
    if (!isValid) return
    setIsChecking(true)
    try {
      if (tab === 'email') {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
        if (error) { Alert.alert('Error', error.message); setIsChecking(false); return }
        onSendOtp('email', email.trim())
      } else {
        const fullPhone = `${country.code}${localPhone.replace(/\D/g, '')}`
        const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
        if (error) { Alert.alert('Error', error.message + '\n\nPhone OTP requires Twilio setup in Supabase dashboard.'); setIsChecking(false); return }
        onSendOtp('phone', fullPhone)
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong')
      setIsChecking(false)
    }
  }

  const hFz = H < 700 ? 40 : 48
  const hLh = H < 700 ? 46 : 54

  return (
    <LinearGradient colors={['#F8F7FF', '#FFF7F5']} style={s.fill}>
      {/* Background blobs */}
      <View style={{ position: 'absolute', top: -90, right: -90, width: 340, height: 340, borderRadius: 170, backgroundColor: '#C4B5FD', opacity: 0.18 }} />
      <View style={{ position: 'absolute', top: 140, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: '#DDD6FE', opacity: 0.13 }} />
      <View style={{ position: 'absolute', bottom: 200, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: '#C4B5FD', opacity: 0.11 }} />
      <View style={{ position: 'absolute', bottom: 100, right: 50, width: 48, height: 48, borderRadius: 24, backgroundColor: '#FED7AA', opacity: 0.65 }} />
      <View style={{ position: 'absolute', top: 220, left: 28, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FED7AA', opacity: 0.5 }} />

      <StatusBar style="dark" />
      <SafeAreaView style={s.fill}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            {/* Back + Logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
              <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <CaretLeft size={18} color="#7C3AED" weight="bold" />
              </TouchableOpacity>
              <Image source={require('../../assets/images/logo3.png')} style={{ width: 120, height: 46 }} resizeMode="contain" />
            </View>

            {/* Hero */}
            <View style={{ paddingHorizontal: 24, paddingTop: 18, minHeight: 210, overflow: 'visible' }}>
              <View>
                <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: hFz, color: '#111827', letterSpacing: -1.5, lineHeight: hLh }}>Find your</Text>
                <MaskedView
                  maskElement={<Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: hFz, letterSpacing: -1.5, lineHeight: hLh, color: '#000' }}>people</Text>}
                >
                  <LinearGradient colors={['#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: hFz, letterSpacing: -1.5, lineHeight: hLh, opacity: 0 }}>people</Text>
                  </LinearGradient>
                </MaskedView>
              </View>
              <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12 }}>
                {'Join companions going to the\nsame events in your city.'}
              </Text>
            </View>

            {/* Form */}
            <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 44 }}>

              {/* Google */}
              {onGoogleSignIn && (
                <TouchableOpacity onPress={onGoogleSignIn}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    height: 54, borderRadius: 16, backgroundColor: '#fff',
                    borderWidth: 1, borderColor: 'rgba(139,92,246,0.12)',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
                    marginBottom: 16 }}>
                  <Svg width={18} height={18} viewBox="0 0 48 48">
                    <Path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                    <Path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.6 0-14.2 4.1-17.7 10.2z" transform="translate(0,1)"/>
                    <Path fill="#FBBC05" d="M24 46c5.8 0 10.8-1.9 14.6-5.2l-6.7-5.5C29.9 37 27.1 38 24 38c-5.8 0-10.8-3.8-12.6-9.1l-6.9 5.3C8 39.9 15.4 46 24 46z" transform="translate(0,-1)"/>
                    <Path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.9-2.8 5.3-5.3 6.9l6.7 5.5C41.6 37.2 45 31 45 24c0-1.3-.2-2.7-.5-4z"/>
                  </Svg>
                  <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#111827' }}>Continue with Google</Text>
                </TouchableOpacity>
              )}

              {/* Apple (iOS only) */}
              {Platform.OS === 'ios' && onAppleSignIn && (
                <TouchableOpacity onPress={onAppleSignIn}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    height: 54, borderRadius: 16, backgroundColor: '#111827', marginBottom: 16 }}>
                  <Svg width={16} height={16} viewBox="0 0 814 1000">
                    <Path fill="#fff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 74.1zm-56.4-173.7c24.3-29.4 41.5-70.5 41.5-111.5 0-5.8-.6-11.7-1.9-16.2-39.5 1.3-86.2 26.3-114.4 55.7-22.7 25.3-43.5 66.3-43.5 108 0 6.4 1.3 13 1.9 14.9 2.6.6 6.5 1.3 10.4 1.3 35.7 0 79.8-23.9 105.9-52.2z"/>
                  </Svg>
                  <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#fff' }}>Continue with Apple</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(139,92,246,0.12)' }} />
                <Text style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Outfit-Regular' }}>or use email / phone</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(139,92,246,0.12)' }} />
              </View>

              {/* Tab toggle */}
              <View style={{ flexDirection: 'row', backgroundColor: '#F3F0FF', borderRadius: 14, padding: 4, marginBottom: 14 }}>
                {(['email', 'phone'] as const).map(t => (
                  <TouchableOpacity key={t} onPress={() => setTab(t)}
                    style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: tab === t ? '#fff' : 'transparent',
                      shadowColor: '#000', shadowOpacity: tab === t ? 0.05 : 0, shadowRadius: 5, elevation: tab === t ? 1 : 0 }}>
                    <Text style={{ fontSize: 14, fontFamily: tab === t ? 'Outfit-SemiBold' : 'Outfit-Regular', color: tab === t ? '#111827' : '#9CA3AF' }}>
                      {t === 'email' ? 'Email' : 'Phone'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input */}
              {tab === 'email' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                  borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
                  paddingHorizontal: 16, height: 56, marginBottom: 4,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                  <Feather name="mail" size={17} color="#9CA3AF" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#111827', fontFamily: 'Outfit-Regular' }}
                    value={email} onChangeText={t => setEmail(t.replace(/\s/g, ''))}
                    placeholder="your@email.com" placeholderTextColor="#9CA3AF"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  {isEmailValid && <PhCheckCircle size={20} color="#22c55e" weight="duotone" />}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                  borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
                  paddingHorizontal: 16, height: 56, marginBottom: 4,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                  <TouchableOpacity onPress={() => setCountryModal(true)} style={s.countryBtn}>
                    <Text style={{ fontSize: 20 }}>{country.flag}</Text>
                    <Text style={[s.countryCode, { fontFamily: 'Outfit-Medium' }]}>{country.code}</Text>
                    <CaretDown size={12} color="#9CA3AF" weight="bold" />
                  </TouchableOpacity>
                  <View style={s.countryDivider} />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#111827', fontFamily: 'Outfit-Regular' }}
                    value={localPhone} onChangeText={handlePhoneChange}
                    placeholder="99 123 456" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
                  {isPhoneValid && <PhCheckCircle size={20} color="#22c55e" weight="duotone" />}
                </View>
              )}

              {/* Country picker modal */}
              <Modal visible={countryModal} transparent animationType="slide" onRequestClose={() => setCountryModal(false)}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPress={() => setCountryModal(false)} />
                <View style={s.countryModal}>
                  <View style={s.countryModalHandle} />
                  <Text style={[s.countryModalTitle, { fontFamily: 'ClashDisplay-Semibold' }]}>Select country</Text>
                  <ScrollView>
                    {COUNTRIES.map(c => (
                      <TouchableOpacity key={c.code + c.name} style={[s.countryRow, country.name === c.name && { backgroundColor: 'rgba(139,92,246,0.07)' }]}
                        onPress={() => { setCountry(c); setLocalPhone(''); setCountryModal(false) }}>
                        <Text style={{ fontSize: 24 }}>{c.flag}</Text>
                        <Text style={[s.countryRowName, { fontFamily: 'Outfit-Medium' }]}>{c.name}</Text>
                        <Text style={[s.countryRowCode, { fontFamily: 'Outfit-Regular' }]}>{c.code}</Text>
                        {country.name === c.name && <PhCheckCircle size={18} color="#8B5CF6" weight="duotone" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Modal>

              {/* Continue */}
              <TouchableOpacity onPress={handleContinue} disabled={isChecking} activeOpacity={0.88}
                style={{ marginTop: 18, borderRadius: 28, overflow: 'hidden', opacity: isValid ? 1 : 0.55 }}>
                <LinearGradient colors={['#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                  {isChecking
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: '#fff', letterSpacing: 0.2 }}>Continue</Text>}
                </LinearGradient>
              </TouchableOpacity>

              {/* Checkbox */}
              <TouchableOpacity
                onPress={() => { setAgreed(v => !v); setShowAgreementWarning(false) }}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20 }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
                  borderColor: showAgreementWarning ? '#EF4444' : agreed ? '#8B5CF6' : '#D1D5DB',
                  backgroundColor: agreed ? '#8B5CF6' : 'transparent',
                  alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
                }}>
                  {agreed && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={{ flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18, fontFamily: 'Outfit-Regular' }}>
                  {'I have read and agree to the '}
                  <Text style={{ color: '#8B5CF6', fontFamily: 'Outfit-SemiBold' }}
                    onPress={() => WebBrowser.openBrowserAsync('https://averinpa.github.io/parea-app/terms')}>
                    Terms of Service
                  </Text>
                  {' and '}
                  <Text style={{ color: '#8B5CF6', fontFamily: 'Outfit-SemiBold' }}
                    onPress={() => WebBrowser.openBrowserAsync('https://averinpa.github.io/parea-app/privacy')}>
                    Privacy Policy
                  </Text>
                  {'. I confirm I am 18 years of age or older.'}
                </Text>
              </TouchableOpacity>
              {showAgreementWarning && (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 30, fontFamily: 'Outfit-Regular' }}>
                  Please agree to the Terms of Service and Privacy Policy to continue
                </Text>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

// ─── OTP SCREEN ───────────────────────────────────────────────────────────────

function OTPScreen({ onBack, onVerify, method, credential }: { onBack: () => void; onVerify: (userId: string) => void; method: 'email' | 'phone'; credential: string }) {
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const shakeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const id = setInterval(() => setSeconds(s => {
      if (s <= 1) { clearInterval(id); setCanResend(true); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(id)
  }, [])

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const handleVerify = async () => {
    const token = code.trim()
    if (!token || isVerifying) return
    setIsVerifying(true)
    try {
      const { data, error: err } = method === 'email'
        ? await supabase.auth.verifyOtp({ email: credential, token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: credential, token, type: 'sms' })
      if (err) {
        setError('Wrong code. Please try again.')
        shake()
        setCode('')
      } else {
        onVerify(data.user!.id)
      }
    } catch (e: any) {
      setError('Verification failed. Try again.')
    }
    setIsVerifying(false)
  }

  const handleResend = async () => {
    setSeconds(59); setCanResend(false); setCode(''); setError('')
    if (method === 'email') await supabase.auth.signInWithOtp({ email: credential })
    else await supabase.auth.signInWithOtp({ phone: credential })
  }

  return (
    <LinearGradient colors={['#EDE9FE', '#E0E7FF', '#DBEAFE']} style={s.fill}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.fill}>
        <View style={s.authTopBar}>
          <TouchableOpacity onPress={onBack} style={s.authBackBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(51,65,85,0.7)" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <View style={[s.authContent, { alignItems: 'center' }]}>
          <Text style={[s.authTitle, { marginBottom: 12 }]}>Check your {method === 'email' ? 'email' : 'phone'}</Text>
          <Text style={[s.authSub, { marginBottom: 40 }]}>Enter the code sent to{'\n'}{credential}</Text>

          <Animated.View style={{ width: '100%', transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              style={[s.glassInput, { fontSize: 28, fontWeight: '800', letterSpacing: 6, textAlign: 'center', color: '#1E1B4B', borderWidth: error ? 1.5 : 0, borderColor: error ? '#EF4444' : 'transparent' }]}
              value={code}
              onChangeText={v => { setCode(v.replace(/\D/g, '')); setError('') }}
              keyboardType="number-pad"
              autoFocus
              placeholder="——————"
              placeholderTextColor="#CBD5E1"
              maxLength={10}
            />
          </Animated.View>

          {error ? (
            <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 10, fontWeight: '500' }}>{error}</Text>
          ) : <View style={{ height: 23 }} />}

          <View style={{ marginTop: 16 }}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ fontSize: 14, color: '#818CF8', fontWeight: '600' }}>Resend code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>Resend code in 00:{String(seconds).padStart(2, '0')}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[s.btnPrimary, { width: '100%', marginTop: 40, backgroundColor: code.length >= 4 && !isVerifying ? '#6366F1' : 'rgba(99,102,241,0.35)', shadowColor: '#6366F1', shadowOpacity: code.length >= 4 ? 0.45 : 0, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: code.length >= 4 ? 8 : 0 }]}
            onPress={handleVerify} disabled={code.length < 4 || isVerifying}>
            {isVerifying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[s.btnPrimaryText, { color: '#fff' }]}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

// ─── ONBOARDING SCREEN ────────────────────────────────────────────────────────


const SOCIAL_ENERGY = [
  { id: 'homebody',  label: 'Homebody',        Icon: HouseLine, color: '#8B5CF6', grad: ['#EDE9FE','#C4B5FD'] as [string,string] },
  { id: 'chill',     label: 'Chill vibes',     Icon: Couch,     color: '#06B6D4', grad: ['#E0F2FE','#7DD3FC'] as [string,string] },
  { id: 'balanced',  label: 'Balanced',        Icon: Scales,    color: '#10B981', grad: ['#D1FAE5','#6EE7B7'] as [string,string] },
  { id: 'social',    label: 'Extrovert',        Icon: Butterfly, color: '#F59E0B', grad: ['#FEF3C7','#FCD34D'] as [string,string] },
  { id: 'party',     label: 'Party animal',    Icon: Confetti,  color: '#EF4444', grad: ['#FEE2E2','#FCA5A5'] as [string,string] },
]

function AnimatedInterestChip({ item, isOn, onPress, palette }: {
  item: string
  isOn: boolean
  onPress: () => void
  palette: typeof INTEREST_CATEGORY_PALETTE[keyof typeof INTEREST_CATEGORY_PALETTE]
}) {
  const scale = useRef(new Animated.Value(1)).current
  const Icon = INTEREST_ICON_MAP[item] || Sparkle
  const label = item.indexOf(' ') !== -1 ? item.slice(item.indexOf(' ') + 1) : item

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, speed: 20, bounciness: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start()
    onPress()
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={{
        transform: [{ scale }],
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99,
        backgroundColor: isOn ? palette.selectedBg : palette.bg,
        borderWidth: 1.5, borderColor: isOn ? palette.selectedBorder : palette.border,
      }}>
        <Icon size={15} color={isOn ? palette.text : palette.iconColor} weight="duotone" />
        <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: isOn ? palette.text : '#64748B' }}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

function WheelColumn({ data, value, onChange, width }: {
  data: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
  width: number
}) {
  const ITEM_HEIGHT = 44
  const VISIBLE = 5
  const HEIGHT = ITEM_HEIGHT * VISIBLE
  const listRef = useRef<FlatList<{ label: string; value: number }>>(null)
  const initialIdx = Math.max(0, data.findIndex(d => d.value === value))
  const [activeIdx, setActiveIdx] = useState(initialIdx)

  useEffect(() => {
    const idx = Math.max(0, data.findIndex(d => d.value === value))
    setActiveIdx(idx)
    const t = setTimeout(() => listRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false }), 30)
    return () => clearTimeout(t)
  }, [data.length])

  return (
    <View style={{ width, height: HEIGHT, position: 'relative' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT, backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 12, zIndex: 0 }} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        scrollEventThrottle={16}
        onScroll={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
          if (idx !== activeIdx && idx >= 0 && idx < data.length) setActiveIdx(idx)
        }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
          const clamped = Math.max(0, Math.min(data.length - 1, idx))
          setActiveIdx(clamped)
          onChange(data[clamped].value)
        }}
        renderItem={({ item, index }) => {
          const active = index === activeIdx
          return (
            <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: active ? 20 : 16, fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular', color: active ? '#1E1B4B' : '#94A3B8', opacity: active ? 1 : 0.5 }}>{item.label}</Text>
            </View>
          )
        }}
      />
    </View>
  )
}

function DobBottomSheet({ initialDay, initialMonth, initialYear, onClose, onConfirm }: {
  initialDay: number
  initialMonth: number
  initialYear: number
  onClose: () => void
  onConfirm: (day: number, month: number, year: number) => void
}) {
  const sheetInsets = useSafeAreaInsets()
  const [day, setDay] = useState(initialDay)
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const slide = useRef(new Animated.Value(0)).current
  const backdrop = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide,    { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
  }, [])

  const closeWithAnim = () => {
    Animated.parallel([
      Animated.timing(slide,    { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const YEARS  = Array.from({ length: 2008 - 1940 + 1 }, (_, i) => 1940 + i)
  const daysInMonth = new Date(year, month, 0).getDate()
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth)
  }, [daysInMonth])

  const today = new Date()
  let calcAge = today.getFullYear() - year
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) calcAge--
  const isAdult = calcAge >= 18

  return (
    <Modal visible transparent animationType="none" onRequestClose={closeWithAnim} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', opacity: backdrop, justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} onPress={closeWithAnim} style={{ flex: 1 }} />
        <Animated.View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 12,
          paddingBottom: Math.max(sheetInsets.bottom + 16, 32),
          paddingHorizontal: 20,
          shadowColor: '#0F172A',
          shadowOpacity: 0.18,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: -6 },
          elevation: 16,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', textAlign: 'center', marginBottom: 4 }}>Date of birth</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: '#94A3B8', textAlign: 'center', marginBottom: 18 }}>Pick day, month and year</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <WheelColumn data={DAYS.map(d => ({ label: String(d), value: d }))} value={day} onChange={setDay} width={66} />
            <WheelColumn data={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))} value={month} onChange={setMonth} width={86} />
            <WheelColumn data={YEARS.map(y => ({ label: String(y), value: y }))} value={year} onChange={setYear} width={86} />
          </View>

          {!isAdult && (
            <Text style={{ fontSize: 13, fontFamily: 'Outfit-Medium', color: '#EF4444', textAlign: 'center', marginTop: 14 }}>
              You must be 18 or older to use Parea
            </Text>
          )}

          <TouchableOpacity
            onPress={() => { if (isAdult) { onConfirm(day, month, year); closeWithAnim() } }}
            disabled={!isAdult}
            activeOpacity={0.85}
            style={{ marginTop: 18, opacity: isAdult ? 1 : 0.5, borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontFamily: 'Outfit-SemiBold', color: '#fff', letterSpacing: 0.2 }}>Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

function OnboardingScreen({ onBack, onFinish, userId }: { onBack: () => void; onFinish: (data: any) => void; userId?: string }) {
  const insets = useSafeAreaInsets()
  const TOTAL = 5
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [dobPickerOpen, setDobPickerOpen] = useState(false)
  const [expandedCats, setExpandedCats] = useState<string[]>([INTERESTS_BY_CATEGORY[0].id])
  const toggleCat = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [gender, setGender] = useState<string | null>(null)
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null])
  const [photoLoading, setPhotoLoading] = useState([false, false, false])
  const [photoStatus, setPhotoStatus] = useState<('idle' | 'verified' | 'error')[]>(['idle', 'idle', 'idle'])
  const [photoError, setPhotoError] = useState<(string | null)[]>([null, null, null])
  const [photoBadge, setPhotoBadge] = useState([false, false, false])
  const [checklist, setChecklist] = useState<('idle' | 'ok' | 'warn')[]>(['idle', 'idle', 'idle'])
  const photoFadeAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [langs, setLangs] = useState<string[]>([])
  const [musicGenres, setMusicGenres] = useState<string[]>([])
  const [drinksPref, setDrinksPref] = useState('')
  const [smokingPref, setSmokingPref] = useState('')
  const [petsPref, setPetsPref] = useState('')
  const [socialEnergy, setSocialEnergy] = useState('')
  const [dealbreakers, setDealbreakers] = useState<string[]>([])
  const [vibeTab, setVibeTab] = useState<'music' | 'vibe' | 'limits'>('music')
  const [bentoSong, setBentoSong] = useState('')
  const [bentoFlags, setBentoFlags] = useState('')
  const [bentoMood, setBentoMood] = useState('')
  const [bentoModal, setBentoModal] = useState<{ visible: boolean; type: 'song' | 'flags' | 'mood' | null }>({ visible: false, type: null })
  const [vibeCheckPassed, setVibeCheckPassed] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const welcomeOpacity = useRef(new Animated.Value(0)).current
  const welcomeScale = useRef(new Animated.Value(0.7)).current
  const tabPulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(tabPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(tabPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
    ])).start()
  }, [])
  const vibeFlashAnim = useRef(new Animated.Value(0)).current
  const counterBounceAnim = useRef(new Animated.Value(1)).current
  const barAnims = useRef([new Animated.Value(0.3), new Animated.Value(0.6), new Animated.Value(0.45), new Animated.Value(0.75)]).current
  const [emojiParticles, setEmojiParticles] = useState<Array<{ id: number; x: Animated.Value; y: Animated.Value; opacity: Animated.Value; rotate: Animated.Value }>>([])
  const slideAnim = useRef(new Animated.Value(0)).current
  const ageRef = useRef<TextInput>(null)

  // Music visualizer animation
  useEffect(() => {
    if (!bentoSong) { barAnims.forEach(a => a.setValue(0.2)); return }
    const loops = barAnims.map((anim, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 250 + i * 90, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.15, duration: 250 + i * 90, useNativeDriver: true }),
      ]))
    )
    loops.forEach(l => l.start())
    return () => loops.forEach(l => l.stop())
  }, [bentoSong])

  const ageNum = parseInt(age, 10)
  const ageError = age.length === 2 && (ageNum < 18 || ageNum > 99)
  const ageValid = age.length >= 2 && ageNum >= 18 && ageNum <= 99

  const handleAgeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 2)
    setAge(digits)
    if (digits.length === 2) ageRef.current?.blur()
  }

  const dobFilled = dobDay.length === 2 && dobMonth.length === 2 && dobYear.length === 4
  const dobAgeNum = (() => {
    if (!dobFilled) return 0
    const birth = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay))
    const today = new Date()
    let a = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) a--
    return a
  })()
  const dobValid = dobFilled && dobAgeNum >= 18 && dobAgeNum <= 99

  const handleGender = (g: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setGender(g)
  }

  const animSlide = (dir = 1) => {
    slideAnim.setValue(dir * 40)
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 14 }).start()
  }

  const canNext = () => {
    if (step === 1) return name.trim().length >= 2 && dobValid && !!gender
    if (step === 2) return photoStatus[0] === 'verified'
    if (step === 3) return interests.length > 0
    if (step === 4) return langs.length > 0
    if (step === 5) return true
    return true
  }

  const fireEmojiBurst = () => {
    const raw = bentoMood || bentoFlags || '🎉'
    const emoji = raw.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u)?.[0] ?? '🎉'
    const particles = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: new Animated.Value(W / 2),
      y: new Animated.Value(700),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
    setEmojiParticles(particles)
    particles.forEach(p => {
      const angle = Math.random() * Math.PI * 2
      const dist = 120 + Math.random() * 220
      const dur = 700 + Math.random() * 500
      Animated.parallel([
        Animated.timing(p.x, { toValue: W / 2 + Math.cos(angle) * dist, duration: dur, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: 150 + Math.random() * 450, duration: dur, useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: (Math.random() - 0.5) * 6, duration: dur, useNativeDriver: true }),
        Animated.sequence([Animated.delay(dur * 0.6), Animated.timing(p.opacity, { toValue: 0, duration: dur * 0.4, useNativeDriver: true })]),
      ]).start()
    })
    setTimeout(() => setEmojiParticles([]), 1400)
  }

  const next = () => {
    if (step < TOTAL) { animSlide(1); setStep(p => p + 1) }
    else {
      setShowWelcome(true)
      Animated.parallel([
        Animated.timing(welcomeOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(welcomeScale,   { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      ]).start()
      setTimeout(() => {
        Animated.timing(welcomeOpacity, { toValue: 0, duration: 320, useNativeDriver: true }).start(() => {
          setShowWelcome(false)
          onFinish({ name, age: String(dobAgeNum || ageNum), gender, photos, bio, interests, langs, musicGenres, drinksPref, smokingPref, petsPref, socialEnergy, dealbreakers })
        })
      }, 1600)
    }
  }

  const back = () => {
    if (step > 1) { animSlide(-1); setStep(p => p - 1) }
    else onBack()
  }

  const removePhoto = (idx: number) => {
    setPhotos(p => { const n = [...p]; n[idx] = null; return n })
    setPhotoStatus(s => { const n = [...s]; n[idx] = 'idle'; return n })
    setPhotoError(e => { const n = [...e]; n[idx] = null; return n })
    if (idx === 0) setChecklist(['idle', 'idle', 'idle'])
  }

  // ── Replace this function body with a real API call when ready ──────────────
  // Expected: return 'verified' | 'blocked' | 'error'
  const verifyPhoto = (imageUri: string, base64: string): Promise<'verified' | 'blocked' | 'error'> =>
    new Promise(resolve =>
      setTimeout(async () => {
        const isTestFail = imageUri.toLowerCase().includes('test_fail')
        if (isTestFail) { resolve('error'); return }
        const safe = await isImageSafe(base64)
        resolve(!safe ? 'blocked' : 'verified')
      }, 2500)
    )
  // ─────────────────────────────────────────────────────────────────────────────

  const pickPhoto = async (idx: number, source: 'gallery' | 'camera' = 'gallery') => {
    let result
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Camera access needed', 'Enable camera in Settings to take a selfie.'); return }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, base64: true, exif: false, cameraType: ImagePicker.CameraType.front })
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos.'); return }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true, exif: false })
    }
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]

    setPhotos(p => { const n = [...p]; n[idx] = null; return n })
    setPhotoStatus(s => { const n = [...s]; n[idx] = 'idle'; return n })
    setPhotoError(e => { const n = [...e]; n[idx] = null; return n })
    setPhotoLoading(l => { const n = [...l]; n[idx] = true; return n })

    const result2 = await verifyPhoto(asset.uri, asset.base64 ?? '')
    setPhotoLoading(l => { const n = [...l]; n[idx] = false; return n })

    if (result2 === 'blocked') {
      setPhotoStatus(s => { const n = [...s]; n[idx] = 'error'; return n })
      setPhotoError(e => { const n = [...e]; n[idx] = 'Photo not allowed. Please use an appropriate photo.'; return n })
      return
    }
    if (result2 === 'error') {
      setPhotoStatus(s => { const n = [...s]; n[idx] = 'error'; return n })
      setPhotoError(e => { const n = [...e]; n[idx] = 'Face not detected. Try another photo.'; return n })
      return
    }

    // Upload to Storage if userId available, otherwise keep local URI
    let finalUri = asset.uri
    if (userId && asset.base64) {
      const publicUrl = await uploadPhotoToStorage(asset.base64, userId, idx)
      if (publicUrl) finalUri = publicUrl
    }
    setPhotos(p => { const n = [...p]; n[idx] = finalUri; return n })
    setPhotoStatus(s => { const n = [...s]; n[idx] = 'verified'; return n })
    setPhotoError(e => { const n = [...e]; n[idx] = null; return n })
    setPhotoBadge(b => { const n = [...b]; n[idx] = true; return n })
    if (idx === 0) {
      const hasGlasses = asset.uri.toLowerCase().includes('glasses')
      setChecklist(['ok', 'ok', hasGlasses ? 'warn' : 'ok'])
      if (hasGlasses) Alert.alert('Sunglasses detected', 'Your photo may be rejected by moderation. Consider using a photo without sunglasses.')
    }
    photoFadeAnims[idx].setValue(0)
    Animated.timing(photoFadeAnims[idx], { toValue: 1, duration: 400, useNativeDriver: true }).start()
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => setPhotoBadge(b => { const n = [...b]; n[idx] = false; return n }), 1500)
  }

  const onPhotoPress = (idx: number) => {
    if (photos[idx]) {
      Alert.alert('Photo options', '', [
        { text: 'Take a selfie', onPress: () => pickPhoto(idx, 'camera') },
        { text: 'Choose from gallery', onPress: () => pickPhoto(idx, 'gallery') },
        { text: 'Delete', style: 'destructive', onPress: () => removePhoto(idx) },
        { text: 'Cancel', style: 'cancel' },
      ])
    } else if (!photoLoading[idx]) {
      Alert.alert('Add a photo', '', [
        { text: 'Take a selfie', onPress: () => pickPhoto(idx, 'camera') },
        { text: 'Choose from gallery', onPress: () => pickPhoto(idx, 'gallery') },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const handleBioChange = (text: string) => {
    setBio(text.slice(0, 150))
    // Counter bounce
    counterBounceAnim.setValue(1.18)
    Animated.spring(counterBounceAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start()
    // Vibe check at 20 chars
    if (!vibeCheckPassed && text.length >= 20) {
      setVibeCheckPassed(true)
      Animated.sequence([
        Animated.timing(vibeFlashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(vibeFlashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    if (text.length < 20) setVibeCheckPassed(false)
  }

  const magicRewrite = () => {
    if (magicLoading) return
    setMagicLoading(true)
    setTimeout(() => {
      setBio(MAGIC_BIOS[Math.floor(Math.random() * MAGIC_BIOS.length)])
      setMagicLoading(false)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }, 1500)
  }

  const openBento = (type: 'song' | 'flags' | 'mood') => setBentoModal({ visible: true, type })
  const closeBento = () => setBentoModal({ visible: false, type: null })
  const selectBentoOption = (value: string) => {
    if (bentoModal.type === 'song') setBentoSong(value)
    else if (bentoModal.type === 'flags') setBentoFlags(value)
    else if (bentoModal.type === 'mood') setBentoMood(value)
    Haptics.selectionAsync()
    closeBento()
  }
  const bentoModalOptions = bentoModal.type === 'song' ? BENTO_SONGS : bentoModal.type === 'flags' ? BENTO_FLAGS : BENTO_MOODS
  const bentoModalValue = bentoModal.type === 'song' ? bentoSong : bentoModal.type === 'flags' ? bentoFlags : bentoMood
  const bentoModalTitle = bentoModal.type === 'song' ? '🎧  Music Taste' : bentoModal.type === 'flags' ? '🚩🟢  My Flag' : '⚡  Weekend Mood'

  const step5BgColors = (): [string, string, string] => {
    if (step !== 5) return ['#EDE9FE', '#E0E7FF', '#DBEAFE']
    if (/sport|tennis|gym|swim|run|hik/i.test(bio)) return ['#F0FDF4', '#DCFCE7', '#D1FAE5']
    if (/music|concert|jazz|guitar|song|beat/i.test(bio)) return ['#F5F3FF', '#EDE9FE', '#DDD6FE']
    if (/coffee|food|eat|restaurant|wine/i.test(bio)) return ['#FFF7ED', '#FEF3C7', '#FDE68A']
    if (/travel|beach|sea|explore|adventure/i.test(bio)) return ['#EFF6FF', '#DBEAFE', '#BFDBFE']
    return ['#EDE9FE', '#E0E7FF', '#DBEAFE']
  }

  const progress = (step / TOTAL) * 100

  return (
    <LinearGradient colors={step5BgColors()} style={s.fill}>
      <StatusBar style="dark" />
      {/* Vibe flash overlay */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: vibeFlashAnim, zIndex: 99 }} />
      {/* Emoji burst particles */}
      {emojiParticles.map(p => (
        <Animated.Text key={p.id} style={{ position: 'absolute', fontSize: 28, zIndex: 101, transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: p.rotate.interpolate({ inputRange: [-6, 6], outputRange: ['-360deg', '360deg'] }) }], opacity: p.opacity, pointerEvents: 'none' }}>
          {(bentoMood || bentoFlags || '🎉').match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u)?.[0] ?? '🎉'}
        </Animated.Text>
      ))}
      <SafeAreaView style={s.fill}>
        <View style={s.onbHeader}>
          <TouchableOpacity onPress={back} style={s.authBackBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(51,65,85,0.7)" />
          </TouchableOpacity>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 99 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>{step}/{TOTAL}</Text>
          </View>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.stepScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

              {step === 1 && (
                <View>
                  {/* Header */}
                  <View style={{ marginBottom: 28, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 26, fontWeight: '800', color: '#1E1B4B', letterSpacing: -0.5, lineHeight: 32 }}>
                        Tell us{'\n'}about you ✨
                      </Text>
                      <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, lineHeight: 18 }}>
                        Your profile · visible to others
                      </Text>
                    </View>
                    <Image
                      source={require('../../assets/images/step1_bubble.png')}
                      style={{ width: 150, height: 150, marginLeft: 4, marginRight: -8 }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Name */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={s.label}>Name</Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 18, paddingVertical: 4, boxShadow: '0 2px 12px rgba(129,140,248,0.08)' } as any}>
                      <TextInput
                        style={{ fontSize: 17, color: '#1E1B4B', fontWeight: '600', paddingVertical: 14 }}
                        value={name}
                        onChangeText={t => setName(t.replace(/[^a-zA-ZА-Яа-яЁёÀ-ÿ\s\-']/g, ''))}
                        placeholder="Your name"
                        placeholderTextColor="#CBD5E1"
                        maxLength={30}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Date of birth */}
                  <View style={{ marginBottom: 28 }}>
                    <Text style={s.label}>Date of birth</Text>
                    <TouchableOpacity
                      onPress={() => setDobPickerOpen(true)}
                      activeOpacity={0.85}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: dobFilled && dobValid ? '#818CF8' : '#E2E8F0',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={{
                        fontSize: 17,
                        fontFamily: 'Outfit-SemiBold',
                        color: dobFilled ? '#1E1B4B' : '#94A3B8',
                      }}>
                        {dobFilled
                          ? `${parseInt(dobDay)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(dobMonth) - 1]} ${dobYear}`
                          : 'Select date'}
                      </Text>
                      <CalendarBlank size={20} color={dobFilled ? '#818CF8' : '#94A3B8'} weight="regular" />
                    </TouchableOpacity>
                    {dobFilled && dobAgeNum < 18 && (
                      <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#EF4444', marginTop: 8 }}>
                        You must be 18 or older
                      </Text>
                    )}
                  </View>

                  {/* Gender */}
                  <View>
                    <Text style={s.label}>Gender</Text>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {['Male', 'Female', 'Other'].map(label => {
                        const active = gender === label
                        return (
                          <TouchableOpacity
                            key={label}
                            onPress={() => handleGender(label)}
                            activeOpacity={0.8}
                            style={{
                              paddingVertical: 9,
                              paddingHorizontal: 18,
                              borderRadius: 99,
                              backgroundColor: active ? '#818CF8' : 'rgba(255,255,255,0.7)',
                              borderWidth: 1.5,
                              borderColor: active ? '#818CF8' : '#E2E8F0',
                            }}>
                            <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: active ? '#fff' : '#475569' }}>{label}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                </View>
              )}

              {step === 2 && (() => {
                const mainW = (W - 48 - 10) * 0.58
                const mainH = mainW * (4 / 3)
                const smallH = (mainH - 8) / 2

                const renderSlot = (idx: number, width: number | `${number}%`, height: number) => {
                  const uri = photos[idx]
                  const isMain = idx === 0
                  const borderR = isMain ? 22 : 16
                  const statusBorder = photoStatus[idx] === 'verified' ? '#22c55e' : photoStatus[idx] === 'error' ? '#EF4444' : undefined

                  return (
                    <View key={idx}>
                      <TouchableOpacity
                        onPress={() => onPhotoPress(idx)}
                        activeOpacity={0.85}
                        style={{
                          width, height, borderRadius: borderR, overflow: 'hidden',
                          backgroundColor: 'rgba(185,208,235,0.35)',
                          borderWidth: statusBorder ? 2 : 1.5,
                          borderColor: statusBorder ?? (isMain ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.8)'),
                          borderStyle: uri ? 'solid' : 'dashed',
                        }}>
                        {photoLoading[idx] ? (
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <ActivityIndicator color="#6366F1" size="small" />
                            <Text style={{ fontSize: 10, color: '#818CF8', fontWeight: '600' }}>Checking...</Text>
                          </View>
                        ) : uri ? (
                          <>
                            <Animated.Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            <TouchableOpacity
                              style={{ position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
                              onPress={() => removePhoto(idx)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Ionicons name="close" size={13} color="#fff" />
                            </TouchableOpacity>
                            {isMain && photoStatus[0] === 'verified' && (
                              <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(34,197,94,0.88)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '800', letterSpacing: 0.5 }}>✓ MAIN</Text>
                              </View>
                            )}
                            {photoBadge[idx] && !isMain && (
                              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(34,197,94,0.85)', paddingVertical: 4, alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>✓ Verified</Text>
                              </View>
                            )}
                          </>
                        ) : (
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <View style={{ width: isMain ? 44 : 32, height: isMain ? 44 : 32, borderRadius: isMain ? 22 : 16, backgroundColor: 'rgba(129,140,248,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name={isMain ? 'camera-outline' : 'add'} size={isMain ? 22 : 18} color="rgba(99,102,241,0.55)" />
                            </View>
                            {isMain && <Text style={{ fontSize: 11, color: 'rgba(99,102,241,0.5)', fontWeight: '600', marginTop: 2 }}>Main photo</Text>}
                          </View>
                        )}
                      </TouchableOpacity>
                      {photoError[idx] && (
                        <Text style={{ fontSize: 10, color: '#EF4444', marginTop: 4, textAlign: 'center' }}>{photoError[idx]}</Text>
                      )}
                    </View>
                  )
                }

                return (
                  <View>
                    {/* Header */}
                    <View style={{ marginBottom: 28 }}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.8, lineHeight: 38 }}>
                        Your photos ✦
                      </Text>
                      <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>First photo is required · auto-verified</Text>
                    </View>

                    {/* Grid */}
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                      {renderSlot(0, mainW, mainH)}
                      <View style={{ flex: 1, gap: 8 }}>
                        {renderSlot(1, '100%', smallH)}
                        {renderSlot(2, '100%', smallH)}
                      </View>
                    </View>

                    {/* Checklist */}
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        'Face clearly visible',
                        '18+ only',
                        'No nudity',
                        'No violence or hate symbols',
                      ].map(label => (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' }}>
                          <Text style={{ fontSize: 11 }}>·</Text>
                          <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              })()}

              {step === 3 && (() => {
                const count = interests.length
                const aiLevel = count === 0 ? 0 : count === 1 ? 20 : count === 2 ? 40 : count === 3 ? 60 : count <= 5 ? 80 : 100
                const aiLabel = count === 0 ? '' : count < 3 ? 'Low' : count < 6 ? 'Good' : 'Great'
                const aiMsg = count === 0
                  ? 'Pick 3+ interests to unlock better suggestions.'
                  : count < 3
                  ? `${3 - count} more to unlock smart matches`
                  : count < 6
                  ? 'Adding more improves quality'
                  : 'Your AI is ready to find your people ✦'
                const aiColor = count >= 6 ? '#22c55e' : count >= 3 ? '#818CF8' : '#CBD5E1'

                return (
                  <View>
                    {/* Header */}
                    <View style={{ marginBottom: 28 }}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.8, lineHeight: 38 }}>
                        Your{'\n'}interests ✦
                      </Text>
                      <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>
                        Helps us tailor your matches
                      </Text>
                    </View>

                    {/* Categories — collapsible */}
                    {INTERESTS_BY_CATEGORY.map(cat => {
                      const palette = INTEREST_CATEGORY_PALETTE[cat.id as keyof typeof INTEREST_CATEGORY_PALETTE]
                      const isOpen = expandedCats.includes(cat.id)
                      const selectedInCat = cat.items.filter(i => interests.includes(i)).length
                      return (
                        <View key={cat.id} style={{ marginBottom: 10 }}>
                          <TouchableOpacity
                            onPress={() => toggleCat(cat.id)}
                            activeOpacity={0.85}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: 'rgba(255,255,255,0.7)',
                              borderRadius: 14,
                              borderWidth: 1.5,
                              borderColor: isOpen ? palette.selectedBorder : 'rgba(255,255,255,0.85)',
                            }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                              <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }}>{cat.label}</Text>
                              {selectedInCat > 0 && (
                                <View style={{ backgroundColor: palette.selectedBorder, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, marginLeft: 2 }}>
                                  <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#fff' }}>{selectedInCat}</Text>
                                </View>
                              )}
                            </View>
                            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                          </TouchableOpacity>
                          {isOpen && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingHorizontal: 2 }}>
                              {cat.items.map(item => (
                                <AnimatedInterestChip
                                  key={item}
                                  item={item}
                                  isOn={interests.includes(item)}
                                  onPress={() => { setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); Haptics.selectionAsync() }}
                                  palette={palette}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      )
                    })}

                    {/* AI confidence bar */}
                    <View style={{ marginTop: 8, padding: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>🤖 AI Match Quality</Text>
                        {aiLabel ? (
                          <Text style={{ fontSize: 12, fontWeight: '800', color: aiColor }}>{aiLabel}</Text>
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#94A3B8' }}>Starts after 3 interests</Text>
                        )}
                      </View>
                      <View style={{ height: 6, backgroundColor: 'rgba(203,213,225,0.5)', borderRadius: 99, overflow: 'hidden' }}>
                        <View style={{ height: 6, width: `${aiLevel}%` as any, backgroundColor: aiColor, borderRadius: 99 }} />
                      </View>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>{aiMsg}</Text>
                    </View>
                  </View>
                )
              })()}

              {step === 4 && (
                <View>
                  <Text style={s.stepTitle}>Languages</Text>
                  <Text style={s.stepSub}>Pick at least 1 language</Text>
                  <View style={s.chipsWrap}>
                    {LANGUAGES_LIST.map(l => (
                      <TouchableOpacity key={l.code} onPress={() => setLangs(prev => prev.includes(l.code) ? prev.filter(x => x !== l.code) : [...prev, l.code])} style={[s.chip, langs.includes(l.code) && s.chipOn]}>
                        <Text style={[s.chipTxt, langs.includes(l.code) && s.chipTxtOn]}>{l.flag}  {l.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {step === 5 && (
                <View>
                  {/* Header */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.8, lineHeight: 34 }}>
                      Your vibe ✦
                    </Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 18 }}>
                      Choose what helps us match you better. You can change this later.
                    </Text>
                  </View>

                  {/* Mini tab bar */}
                  {(() => {
                    const VIBE_TABS = [
                      { id: 'music',  label: 'Music',  num: 1, done: musicGenres.length > 0, optional: false },
                      { id: 'vibe',   label: 'Vibe',   num: 2, done: !!socialEnergy,           optional: false },
                      { id: 'limits', label: 'Limits', num: 3, done: false,                    optional: true  },
                    ]
                    const currentIdx = VIBE_TABS.findIndex(t => t.id === vibeTab)
                    const nextId = VIBE_TABS[currentIdx + 1]?.id ?? null
                    return (
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                        {VIBE_TABS.map(tab => {
                          const active = vibeTab === tab.id
                          const showPulse = nextId === tab.id && !active
                          return (
                            <TouchableOpacity
                              key={tab.id}
                              onPress={() => setVibeTab(tab.id as any)}
                              activeOpacity={0.8}
                              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
                                backgroundColor: active ? '#818CF8' : 'rgba(255,255,255,0.65)',
                                borderWidth: 1.5,
                                borderColor: active ? '#818CF8' : 'rgba(203,213,225,0.5)',
                                boxShadow: active ? '0 4px 12px rgba(129,140,248,0.4)' : 'none',
                              } as any}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: active ? 'rgba(255,255,255,0.75)' : '#94A3B8' }}>{tab.num}</Text>
                                {tab.done && !tab.optional ? (
                                  <Ionicons name="checkmark" size={12} color={active ? 'rgba(255,255,255,0.9)' : '#10B981'} />
                                ) : (
                                  <Text style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.55)' : '#CBD5E1', fontWeight: '700' }}>·</Text>
                                )}
                                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#64748B' }}>{tab.label}</Text>
                                {tab.optional && (
                                  <Text style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.6)' : '#CBD5E1', fontWeight: '600' }}>opt</Text>
                                )}
                                {showPulse && (
                                  <Animated.View style={{
                                    width: 7, height: 7, borderRadius: 3.5,
                                    backgroundColor: '#F97316',
                                    opacity: tabPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                                    transform: [{ scale: tabPulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) }],
                                  }} />
                                )}
                              </View>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    )
                  })()}

                  {/* ── TAB: Music ── */}
                  {vibeTab === 'music' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#94A3B8' }}>Pick up to 5</Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: musicGenres.length >= 5 ? '#818CF8' : '#94A3B8' }}>{musicGenres.length}/5</Text>
                      </View>
                      {(showAllGenres ? MUSIC_GENRES : MUSIC_GENRES.slice(0, PRIMARY_GENRE_COUNT)).map(g => {
                        const on = musicGenres.includes(g.id)
                        const atMax = musicGenres.length >= 5 && !on
                        return (
                          <TouchableOpacity
                            key={g.id}
                            onPress={() => {
                              if (on) setMusicGenres(prev => prev.filter(x => x !== g.id))
                              else if (musicGenres.length < 5) setMusicGenres(prev => [...prev, g.id])
                            }}
                            activeOpacity={atMax ? 1 : 0.8}
                            style={{ width: (W - 48 - 16) / 3, borderRadius: 12, overflow: 'hidden', opacity: atMax ? 0.4 : 1 }}>
                            <LinearGradient
                              colors={on ? g.colors : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.35)']}
                              style={{ paddingVertical: 9, alignItems: 'center', gap: 3, borderWidth: on ? 2 : 1.5, borderRadius: 12, borderColor: on ? '#fff' : 'rgba(255,255,255,0.85)', boxShadow: on ? `0 3px 10px ${g.colors[1]}55` : 'none' } as any}>
                              <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: on ? '#fff' : '#334155', textAlign: 'center' }}>{g.label}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )
                      })}
                      <TouchableOpacity
                        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowAllGenres(v => !v) }}
                        activeOpacity={0.85}
                        style={{ width: '100%', marginTop: 4, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#6366F1' }}>{showAllGenres ? 'Show less' : 'More genres'}</Text>
                        <Ionicons name={showAllGenres ? 'chevron-up' : 'chevron-down'} size={15} color="#6366F1" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ── TAB: Vibe ── */}
                  {vibeTab === 'vibe' && (
                    <View>
                      {/* Social energy */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={s.label}>Social energy</Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#94A3B8', textTransform: 'none' }}>Pick 1</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                        {SOCIAL_ENERGY.map(e => {
                          const on = socialEnergy === e.id
                          return (
                            <TouchableOpacity key={e.id} onPress={() => setSocialEnergy(e.id)} activeOpacity={0.8}
                              style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14,
                                backgroundColor: on ? '#818CF8' : 'rgba(255,255,255,0.65)',
                                borderWidth: on ? 2 : 1.5, borderColor: on ? '#fff' : 'rgba(255,255,255,0.85)',
                                boxShadow: on ? '0 4px 14px rgba(129,140,248,0.55)' : 'none',
                              } as any}>
                              <e.Icon size={18} color={on ? '#fff' : '#94A3B8'} weight="duotone" />
                              <Text style={{ fontSize: 9, fontWeight: '700', color: on ? '#fff' : '#94A3B8', textAlign: 'center', marginTop: 3 }}>{e.label}</Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>

                      {/* Bio */}
                      <Text style={[s.label, { marginBottom: 10 }]}>One line about you · optional</Text>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 14, paddingVertical: 4, marginBottom: 10 }}>
                        <TextInput
                          style={{ fontSize: 15, color: '#1E1B4B', paddingVertical: 11 }}
                          value={bio}
                          onChangeText={handleBioChange}
                          placeholder="e.g. Rock concerts & good coffee ☕"
                          placeholderTextColor="#CBD5E1"
                          maxLength={60}
                          underlineColorAndroid="transparent"
                        />
                      </View>
                      <TouchableOpacity onPress={magicRewrite} disabled={magicLoading} activeOpacity={0.7}
                        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 2 }}>
                        <Text style={{ color: '#6366F1', fontFamily: 'Outfit-SemiBold', fontSize: 13, opacity: magicLoading ? 0.5 : 1 }}>
                          {magicLoading ? 'Writing…' : '✨ Need help? Write with AI'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ── TAB: Limits ── */}
                  {vibeTab === 'limits' && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(148,163,184,0.15)' }}>
                          <Text style={{ fontSize: 10, fontFamily: 'Outfit-SemiBold', color: '#64748B', letterSpacing: 0.4 }}>OPTIONAL</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 18 }}>
                        These people will never appear in your matches — no exceptions. Skip if no hard limits.
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {DEALBREAKERS.map(db => {
                          const on = dealbreakers.includes(db.id)
                          return (
                            <TouchableOpacity
                              key={db.id}
                              onPress={() => setDealbreakers(prev => prev.includes(db.id) ? prev.filter(x => x !== db.id) : [...prev, db.id])}
                              activeOpacity={0.75}
                              style={{
                                width: (W - 48 - 10) / 2,
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                paddingHorizontal: 12, paddingVertical: 12,
                                borderRadius: 16,
                                backgroundColor: on ? '#FFF1F2' : 'rgba(255,255,255,0.65)',
                                borderWidth: 1.5,
                                borderColor: on ? '#F43F5E' : 'rgba(203,213,225,0.6)',
                              } as any}
                            >
                              <Text style={{ fontSize: 22 }}>{db.emoji}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#BE123C' : '#334155' }}>{db.label}</Text>
                                <Text style={{ fontSize: 10, color: on ? '#FDA4AF' : '#94A3B8', marginTop: 1 }}>{db.desc}</Text>
                              </View>
                              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#F43F5E', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0 }}>
                                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>✕</Text>
                              </View>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Bento picker bottom sheet */}
              <Modal visible={bentoModal.visible} transparent animationType="slide" onRequestClose={closeBento}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={closeBento} />
                <View style={s.bentoSheet}>
                  <View style={s.bentoSheetHandle} />
                  <Text style={s.bentoSheetTitle}>{bentoModalTitle}</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                    {bentoModalOptions.map(opt => {
                      const selected = bentoModalValue === opt
                      return (
                        <TouchableOpacity key={opt} onPress={() => selectBentoOption(opt)} activeOpacity={0.75}
                          style={[s.bentoSheetItem, selected && s.bentoSheetItemOn]}>
                          <Text style={[s.bentoSheetItemTxt, selected && { color: '#6366F1', fontWeight: '700' }]}>{opt}</Text>
                          {selected && <Ionicons name="checkmark-circle" size={20} color="#6366F1" />}
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              </Modal>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[s.bottomBar, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 12) + 6 : insets.bottom > 0 ? insets.bottom + 8 : 12 }]}>
          {step === TOTAL ? (
            <View>
              <TouchableOpacity style={[s.bentoFinishBtn, !canNext() && { opacity: 0.5 }, canNext() && { shadowOpacity: 0.55, shadowRadius: 28, elevation: 14 }]} onPress={next} disabled={!canNext() || showWelcome} activeOpacity={0.88}>
                <BlurView intensity={40} tint="light" style={s.bentoFinishBlur}>
                  <LinearGradient colors={['#a78bfa', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.bentoFinishGrad}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>Complete profile</Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: '#94A3B8', textAlign: 'center', marginTop: 10 }}>
                You can edit this later
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={[s.btnPrimary, !canNext() && { opacity: 0.4 }, canNext() && { shadowColor: '#818CF8', shadowOpacity: 0.6, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 14, boxShadow: '0 8px 32px rgba(129, 140, 248, 0.7)' } as any]} onPress={next} disabled={!canNext()}>
              <Text style={[s.btnPrimaryText, { color: '#fff' }]}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      {showWelcome && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: welcomeOpacity, zIndex: 200, alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['rgba(139,92,246,0.96)', 'rgba(99,102,241,0.96)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: welcomeScale }] }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </View>
            <Text style={{ fontSize: 30, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.6, marginBottom: 6 }}>You're in ✦</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.2 }}>Welcome to Parea</Text>
          </Animated.View>
        </Animated.View>
      )}
      {dobPickerOpen && (
        <DobBottomSheet
          initialDay={dobDay ? parseInt(dobDay) : 1}
          initialMonth={dobMonth ? parseInt(dobMonth) : 1}
          initialYear={dobYear ? parseInt(dobYear) : 1998}
          onClose={() => setDobPickerOpen(false)}
          onConfirm={(d, m, y) => {
            setDobDay(String(d).padStart(2, '0'))
            setDobMonth(String(m).padStart(2, '0'))
            setDobYear(String(y))
          }}
        />
      )}
    </LinearGradient>
  )
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────

function HomeTab({ city, setCityOpen, feedFilter, setFeedFilter, onEventPress, joinedEvents, onJoin, userInterests, setUserEventFormat, setUserEventTransport, onJoinConfirmed, pendingJoinEv, onPendingJoinConsumed, extraEvents, approvedJoiners = {}, tonightVibe, setTonightVibe, onBellPress, unreadCount, bellShake, userData, onCancelHostedEvent }: any) {
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
  const parseEventDate = (timeStr: string): Date | null => {
    if (!timeStr) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const lower = timeStr.toLowerCase()
    if (lower.startsWith('today')) return today
    if (lower.startsWith('tomorrow')) { const d = new Date(today); d.setDate(d.getDate() + 1); return d }
    // Format: "2026-03-31" (ISO, from community event createDay)
    const isoMatch = timeStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
      d.setHours(0, 0, 0, 0)
      return d
    }
    // Format: "26/03/2026" or "26.03.2026" — check before day-of-week
    const dmyMatch = timeStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/)
    if (dmyMatch) {
      const d = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]))
      d.setHours(0, 0, 0, 0)
      return d
    }
    // Format: "Thursday, 26 March 2026" or "26 March 2026" — check before day-of-week
    const monthMap: Record<string, number> = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 }
    const longMatch = timeStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
    if (longMatch) {
      const month = monthMap[longMatch[2].toLowerCase()]
      if (month !== undefined) {
        const d = new Date(parseInt(longMatch[3]), month, parseInt(longMatch[1]))
        d.setHours(0, 0, 0, 0)
        return d
      }
    }
    // Format: "Sat, 20:30" or "Mon" — day of week (relative)
    const dayMap: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 }
    const prefix = lower.slice(0, 3)
    if (prefix in dayMap) {
      const d = new Date(today)
      const diff = ((dayMap[prefix] - d.getDay()) + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return d
    }
    return null
  }

  const parseEventDateTime = (timeStr: string): Date | null => {
    const date = parseEventDate(timeStr)
    if (!date) return null
    const match = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (match) {
      date.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0)
    } else {
      date.setHours(23, 59, 59, 0)
    }
    return date
  }

  const isEventPast = (timeStr: string): boolean => {
    const dt = parseEventDateTime(timeStr)
    if (!dt) return false
    return dt < new Date()
  }
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
    return true
  })

  // Apply search + category filter to community
  const communityFiltered = communityAll.filter(ev => {
    if (categoryFilter && ev.category !== categoryFilter) return false
    if (forYouFilter && userCategories.length > 0 && !userCategories.includes(ev.category)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!ev.title.toLowerCase().includes(q) && !(ev.description || '').toLowerCase().includes(q)) return false
    }
    if (selectedDate) {
      const evDate = parseEventDate(ev.time)
      if (!evDate || evDate.toDateString() !== selectedDate.toDateString()) return false
    }
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
    if (city && ev.city && ev.city.toLowerCase() !== city.toLowerCase()) return false
    if (categoryFilter && ev.category !== categoryFilter) return false
    if (forYouFilter && userCategories.length > 0 && !userCategories.includes(ev.category)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!(ev.title || '').toLowerCase().includes(q) && !(ev.category || '').toLowerCase().includes(q)) return false
    }
    if (selectedDate) {
      const evDate = parseEventDate(ev.date_label || ev.time || '')
      if (!evDate || evDate.toDateString() !== selectedDate.toDateString()) return false
    }
    return true
  }).sort((a, b) => {
    const aVibe = vibeCats.includes(a.category) ? 2 : 0
    const bVibe = vibeCats.includes(b.category) ? 2 : 0
    const aInt = userCategories.includes(a.category) ? 1 : 0
    const bInt = userCategories.includes(b.category) ? 1 : 0
    return (bVibe + bInt) - (aVibe + aInt)
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
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#B45309' }}>Your plan 👑</Text>
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
              <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Medium', color: '#475569', letterSpacing: -0.2 }}>Hey, {userName}</Text>
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

              {/* Calendar — ghost */}
              <TouchableOpacity onPress={() => { setCalendarOpen(v => !v); if (calendarOpen) setSelectedDate(null) }}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 7 }}>
                <CalendarBlank size={14} color={calendarOpen || selectedDate ? '#6366F1' : '#94A3B8'} weight="regular" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: calendarOpen || selectedDate ? '#6366F1' : '#94A3B8' }}>
                  {selectedDate ? selectedDate.toLocaleDateString('en', { day: 'numeric', month: 'short' }) : 'Calendar'}
                </Text>
              </TouchableOpacity>

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
            const officialDates = new Set([...officialAll.filter((ev: any) => !ev.city || ev.city === city), ...communityAll.filter(ev => ev.type === 'official')].map(ev => parseEventDate(ev.date_label || ev.time || '')?.toDateString()).filter(Boolean))
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
        {!forYouFilter && officialDbLoading && (
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
        {!forYouFilter && !officialDbLoading && officialDbEvents.length > 0 && (
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
                  <View style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(30,27,75,0.65)' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.4, textTransform: 'capitalize' }}>{ev.category || 'Event'}</Text>
                  </View>
                  {ev.is_promoted && (
                    <View style={{ position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#f59e0b' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><PushPin size={9} color="#fff" weight="duotone" /><Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>FEATURED</Text></View>
                    </View>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
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
                <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
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
        {!forYouFilter && (<>
        {communityAll.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UsersThree size={18} color="#6366F1" weight="duotone" />
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 }}>Community</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>{communityEvents.length} events</Text>
        </View>
        )}

        {/* Category filter chips */}
        {communityAll.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 14 }}>
          <TouchableOpacity onPress={() => { setCategoryFilter(null); setForYouFilter(false) }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: !categoryFilter ? '#6366F1' : '#fff' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: !categoryFilter ? '#fff' : '#64748B' }}>All</Text>
          </TouchableOpacity>
          {CAT_FILTERS.map(f => {
            const isOn = categoryFilter === f.id
            return (
              <TouchableOpacity key={f.id} onPress={() => setCategoryFilter(isOn ? null : f.id)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: isOn ? '#6366F1' : '#fff' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isOn ? '#fff' : '#64748B' }}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>}

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
        <View style={[s.joinSheetWrap, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
          <View style={s.joinSheetHandle} />

          {joinSheet.ev?.type === 'official' && joinSheet.step !== 4 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3].map(n => (
                  <View key={n} style={{ width: joinSheet.step === n ? 20 : 6, height: 6, borderRadius: 3,
                    backgroundColor: joinSheet.step >= n ? '#6366F1' : 'rgba(99,102,241,0.2)' }} />
                ))}
              </View>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Step {joinSheet.step} of 3</Text>
            </View>
          )}
          {joinSheet.ev?.type === 'community' && joinSheet.step !== 4 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(99,102,241,0.2)' }} />
                <View style={{ width: 20, height: 6, borderRadius: 3, backgroundColor: '#6366F1' }} />
              </View>
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
                  { id: 'mixed',  label: 'Mixed group',  sub: 'Mix of women and men' },
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

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────

function MessagesTab({ chatList, onOpenChat, onLeaveChat, joinedEvents = {}, userEventFormat = {}, userEventTransport = {}, onVibeCheck, onLeaveEvent, onUpdatePlans, initialSubTab, hostedEvents = [], approvedJoiners = {}, hostConfirmedMembers = {}, approvedAtMap = {}, onCancelHostedEvent, onPlansOpen, allEvents = [], onEventDetail, eventAttendeesMap = {}, passedRequests = {}, onBlockUser, onReportUser }: {
  chatList: any[]; onOpenChat: (c: any) => void; onLeaveChat?: (id: number, addSystemMsg?: boolean) => void;
  joinedEvents?: Record<number, string>; userEventFormat?: Record<number, string>; userEventTransport?: Record<number, string>; allEvents?: any[]; onEventDetail?: (ev: any) => void;
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
  const myEvents = [...MOCK_EVENTS, ...allEvents.filter((e: any) => e._fromDb || e.type === 'community')].filter(ev => ['joined', 'pending', 'confirmed'].includes(joinedEvents[ev.id]) && (!ev.expiresAt || ev.expiresAt > now))
  const activeHostedEvents = hostedEvents.filter(ev => !ev.expiresAt || ev.expiresAt > now)
  const expiredHostedEvents = hostedEvents.filter(ev => ev.expiresAt && ev.expiresAt <= now)

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
              {activeHostedEvents.map((ev: any) => (
                <View key={ev.id} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.2)', shadowColor: PLANS_COLOR, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 }}>
                  <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />
                  <View style={{ padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E1B4B', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(245,158,11,0.1)' }}>
                          <Crown size={10} color={PLANS_COLOR} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: PLANS_COLOR }}>Host</Text>
                        </View>
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
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                        <CalendarDays size={12} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>{prettyEventTime(ev.time)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                        <Users size={12} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>{(approvedJoiners[ev.id] || []).length + (hostConfirmedMembers[ev.id] || []).length + 1}/{ev.maxParticipants}</Text>
                      </View>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity activeOpacity={0.8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEventDetail?.(ev) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PLANS_COLOR, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>View event</Text>
                        <ChevronRight size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              {myEvents.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginTop: 4 }}>
                  <CheckCircle size={12} color={PLANS_COLOR} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: PLANS_COLOR, letterSpacing: 1, textTransform: 'uppercase' }}>Attending</Text>
                </View>
              )}
            </View>
          )}
          {/* Expired hosted events — show only for cleanup */}
          {expiredHostedEvents.length > 0 && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
                <Clock size={12} color="#94A3B8" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>Expired</Text>
              </View>
              {expiredHostedEvents.map((ev: any) => (
                <View key={ev.id} style={{ borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                  <TouchableOpacity
                    onPress={() => onCancelHostedEvent?.(ev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {myEvents.length === 0 && activeHostedEvents.length === 0 && expiredHostedEvents.length === 0 ? (
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
              const fmt    = FORMAT_CHIP[userEventFormat[ev.id]]
              const trsp   = TRANSPORT_CHIP[userEventTransport[ev.id]]
              const isLive = isToday(ev.time)

              // Use actual data for crew count
              const format        = userEventFormat[ev.id] || (ev.type === 'official' ? '1+1' : 'squad')
              const cap           = VIBE_FORMAT_MAX[format] || 5
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
                ? (isConfirmed ? 'Confirmed ✅' : joinedEvents[ev.id] === 'pending' ? 'Pending ⏳' : 'Approved ✓')
                : isConfirmed ? 'Confirmed ✅'
                : hasReal ? `${nonPassedAttendees.length} found 🎯`
                : 'Looking...'
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
                            <Text style={{ fontSize: 12, color: '#64748B' }}>{ev.date_label ? `${ev.date_label}${ev.time_label ? ' · ' + ev.time_label : ''}` : prettyEventTime(ev.time) || '—'}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: statusBg }}>
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

                    {/* Format + transport chips */}
                    {(fmt || trsp) && (
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                        {fmt && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${fmt.color}18`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
                            <Text style={{ fontSize: 13 }}>{fmt.emoji}</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: fmt.color }}>{fmt.label}</Text>
                          </View>
                        )}
                        {trsp && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(100,116,139,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
                            <Text style={{ fontSize: 13 }}>{trsp.emoji}</Text>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>{trsp.label}</Text>
                          </View>
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
                            {found}/{cap} joined
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
          {chatList.map(chat => (
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
                  <View style={{ width: 54, height: 54, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
                    <Image source={{ uri: chat.eventImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
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
                    <Text style={{ fontSize: 11, color: CHATS_COLOR, fontWeight: '600' }} numberOfLines={1}>
                      {chat.type === 'duo' ? chat.event : `${chat.members} members`}
                    </Text>
                    {chat.chatExpiresAt && Math.ceil((chat.chatExpiresAt - Date.now()) / 3600000) <= 6 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(239,68,68,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 }}>
                        <Clock size={9} color="#EF4444" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>Expiring</Text>
                      </View>
                    )}
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

// ─── VIBE CHECK TAB ───────────────────────────────────────────────────────────


function ProfilePreviewSheet({ profile, onClose, onBlock, onReport }: { profile: any; onClose: () => void; onBlock?: (profile: any) => void; onReport?: (profile: any) => void }) {
  const insets = useSafeAreaInsets()
  const screenH = Dimensions.get('window').height
  const sheetMaxH = screenH - insets.top - 16
  const [photoIdx, setPhotoIdx] = useState(0)
  const slideAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start()
  }, [])

  const close = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(onClose)
  }

  // Support both photos array and single photo fallback
  const allPhotos: string[] = profile.photos?.filter(Boolean).length > 0
    ? profile.photos.filter(Boolean)
    : profile.photo ? [profile.photo] : []
  const c0 = (profile.colors?.[0]) || profile.color || '#6366F1'
  const c1 = (profile.colors?.[1]) || profile.color || '#818CF8'
  const totalSlots = Math.max(allPhotos.length, 1)

  return (
    <Modal transparent animationType="none" onRequestClose={close}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)' }} activeOpacity={1} onPress={close} />
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: sheetMaxH,
        backgroundColor: '#100D20', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        overflow: 'hidden', transform: [{ translateY: slideAnim }],
      }}>
        {/* Photo carousel */}
        <View style={{ height: 320, position: 'relative', backgroundColor: '#0A0812' }}>
          {allPhotos[photoIdx] ? (
            <Image source={{ uri: allPhotos[photoIdx] }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <LinearGradient colors={[c0, c1]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 72 }}>{profile.emoji || '👤'}</Text>
            </LinearGradient>
          )}
          {/* Gradient overlay bottom */}
          <LinearGradient colors={['transparent', '#100D20']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }} />
          {/* Dot indicators */}
          {totalSlots > 1 && (
            <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {Array.from({ length: totalSlots }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                  <View style={{ width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Swipe areas */}
          <TouchableOpacity style={{ position: 'absolute', left: 0, top: 0, width: '45%', height: '100%', justifyContent: 'center', paddingLeft: 14, opacity: photoIdx > 0 ? 1 : 0 }}
            onPress={() => setPhotoIdx(i => Math.max(0, i - 1))}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="chevron-left" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 14, opacity: photoIdx < totalSlots - 1 ? 1 : 0 }}
            onPress={() => setPhotoIdx(i => Math.min(totalSlots - 1, i + 1))}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="chevron-right" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          {/* Close */}
          <TouchableOpacity onPress={close} style={{
            position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
          }}>
            <Feather name="x" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom + 16, 40) }}>
          {/* Name + age */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>{profile.name}</Text>
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{profile.age}</Text>
            <Text style={{ fontSize: 20 }}>{profile.flag}</Text>
          </View>

          {/* Looking for event companions */}
          <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: 'rgba(167,139,250,0.85)', marginBottom: 14 }}>Looking for event companions</Text>

          {/* Bio */}
          {profile.bio ? (
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 21, marginBottom: 18 }}>{profile.bio}</Text>
          ) : null}

          {/* About — text rows */}
          {(() => {
            const interests = profile.interests || []
            const langs = profile.langs || []
            const usually = interests.slice(0, 3).map((t: string) => t.indexOf(' ') !== -1 ? t.slice(t.indexOf(' ') + 1) : t).join(' · ')
            const langText = langs.map((c: string) => LANGUAGES_LIST.find(l => l.code === c)?.label || c).join(' · ')
            const transportText = profile.transport === 'car' ? 'Driving (open to giving a lift)' : profile.transport === 'lift' ? 'Open to carpooling' : 'Meeting there'
            const rows = [
              usually && { label: 'Usually goes for', value: usually },
              langText && { label: 'Languages', value: langText },
              { label: 'Getting there', value: transportText },
            ].filter(Boolean) as { label: string; value: string }[]
            return (
              <View style={{ marginBottom: 22, gap: 8 }}>
                {rows.map(r => (
                  <Text key={r.label} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit-Medium' }}>{r.label}: </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit-SemiBold' }}>{r.value}</Text>
                  </Text>
                ))}
              </View>
            )
          })()}

          {/* AI Match badge */}
          {profile.aiScore != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, padding: 12, borderRadius: 16, backgroundColor: 'rgba(129,140,248,0.12)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)' }}>
              <Sparkle size={20} color="#818CF8" weight="duotone" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: profile.aiScore >= 75 ? '#43E97B' : '#818CF8' }}>
                  {profile.aiScore}% AI Match
                </Text>
                {profile.aiReason && (
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{profile.aiReason}</Text>
                )}
              </View>
            </View>
          )}

          {/* Interests */}
          {(profile.interests || []).length > 0 && (
            <>
              <Text style={{ fontSize: 10, fontFamily: 'ClashDisplay-Semibold', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, marginBottom: 10 }}>INTERESTS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(profile.interests || []).slice(0, 8).map((tag: string, i: number) => {
                  const Icon = INTEREST_ICON_MAP[tag] || Sparkle
                  const label = tag.indexOf(' ') !== -1 ? tag.slice(tag.indexOf(' ') + 1) : tag
                  const cat = INTERESTS_BY_CATEGORY.find(c => c.items.includes(tag))
                  const palette = cat ? INTEREST_CATEGORY_PALETTE[cat.id as keyof typeof INTEREST_CATEGORY_PALETTE] : null
                  const chipColor = palette?.iconColor || '#A78BFA'
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: `${chipColor}22`, borderWidth: 1, borderColor: `${chipColor}55` }}>
                      <Icon size={14} color={chipColor} weight="duotone" />
                      <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: chipColor }}>{label}</Text>
                    </View>
                  )
                })}
                {(profile.interests || []).length > 8 && (
                  <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: 'rgba(255,255,255,0.55)' }}>+{(profile.interests || []).length - 8} more</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Block / Report */}
          {(onBlock || onReport) && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              {onReport && (
                <TouchableOpacity onPress={() => { onReport(profile); close() }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}>
                  <Feather name="flag" size={15} color="#F59E0B" />
                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#F59E0B' }}>Report</Text>
                </TouchableOpacity>
              )}
              {onBlock && (
                <TouchableOpacity onPress={() => { onBlock(profile); close() }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }}>
                  <Feather name="slash" size={15} color="#EF4444" />
                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#EF4444' }}>Block</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}


function ReportModal({ profile, onClose, onSubmit }: { profile: any; onClose: () => void; onSubmit: (reason: string, details: string) => void }) {
  const [selected, setSelected] = useState('')
  const [details, setDetails] = useState('')
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }}>
        <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', marginBottom: 4 }}>Report {profile?.name}</Text>
        <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18 }}>Select a reason. We review all reports.</Text>
        {REPORT_REASONS.map(r => (
          <TouchableOpacity key={r} onPress={() => setSelected(r)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected === r ? '#6366F1' : '#CBD5E1', backgroundColor: selected === r ? '#6366F1' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {selected === r && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#1E1B4B' }}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          placeholder="Describe what happened (optional)"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={details}
          onChangeText={setDetails}
          style={{ marginTop: 16, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 14, color: '#1E1B4B', minHeight: 72, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' }}
        />
        <TouchableOpacity onPress={() => { if (selected) { onSubmit(selected, details); onClose() } }}
          style={{ marginTop: 16, backgroundColor: selected ? '#6366F1' : '#E2E8F0', borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: selected ? '#fff' : '#94A3B8' }}>Submit Report</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

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

function RockingTransportPill({ transport }: { transport: string }) {
  const rock = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (transport !== 'lift') return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(rock, { toValue: 1,  duration: 280, useNativeDriver: true }),
        Animated.timing(rock, { toValue: -1, duration: 280, useNativeDriver: true }),
        Animated.timing(rock, { toValue: 0,  duration: 200, useNativeDriver: true }),
        Animated.delay(3200),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [transport])
  const rotate = rock.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] })
  const label = transport === 'car' ? 'Can give a lift' : transport === 'lift' ? 'Need a ride' : 'Meeting there'
  const Icon = transport === 'meet' ? PhMapPin : PhCar
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)' }}>
      <Animated.View style={transport === 'lift' ? { transform: [{ rotate }] } : undefined}>
        <Icon size={12} color="rgba(255,255,255,0.55)" weight="duotone" />
      </Animated.View>
      <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: 'rgba(255,255,255,0.55)' }}>{label}</Text>
    </View>
  )
}

function VibeCheckTab({ joinedEvents, allEvents, userEventFormat, userEventTransport, onGoHome, onConfirm, onLeave, hostedEvents = [], pendingJoinRequests = {}, approvedJoiners = {}, hostConfirmedMembers = {}, approvedAtMap = {}, onApproveJoiner, onRejectJoiner, onPassJoiner, passedRequests = {}, userData, tonightVibe, onGoToMessages, eventAttendeesMap = {}, communityEventMembers = {}, incomingCrewInvites = [], sentCrewInvites = {}, onAcceptInvite, onDeclineInvite, onCancelHostedEvent, readyCountMap = {}, crewPreviewMap = {}, onJoinCrew, officialEventChatMap = {}, topInset = 0, onBlockUser, onReportUser }: any) {
  // Official + approved community events — shown as crew cards
  const myEvents = (allEvents || []).filter((e: any) => {
    const status = joinedEvents?.[e.id]
    if (!status || e.isHosted) return false
    if (e.type === 'community') return status === 'joined'
    // Official: always show confirmed events so squad can track crew filling up
    if (status === 'confirmed') return true
    return true
  })
  const myApprovedCommunityEvents: any[] = [] // kept for subtitle logic only
  // Community events pending host approval — shown as waiting cards
  const myCommunityEvents = (allEvents || []).filter((e: any) => joinedEvents?.[e.id] === 'pending' && !e.isHosted && e.type === 'community' && (!e.expiresAt || e.expiresAt > Date.now()))
  // User-created socials the user requested to join — shown as "awaiting approval"
  const pendingHostedEvents = (allEvents || []).filter((e: any) => joinedEvents?.[e.id] === 'pending' && e.isHosted && (!e.expiresAt || e.expiresAt > Date.now()))
  const activeHosted = (hostedEvents || []).filter((e: any) => !e.expiresAt || e.expiresAt > Date.now())
  const hasHostActivity = activeHosted.some((e: any) => (pendingJoinRequests[e.id] || []).length > 0)
  const [previewProfile, setPreviewProfile] = useState<any>(null)
  const [aiMatches, setAiMatches] = useState<MatchResult[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const aiRankedProfiles = aiMatches.length > 0
    ? [...QUEUE_PROFILES].sort((a, b) => {
        const sa = aiMatches.find(m => m.id === a.id)?.score ?? 0
        const sb = aiMatches.find(m => m.id === b.id)?.score ?? 0
        return sb - sa
      })
    : QUEUE_PROFILES

  const eventContext = myEvents.length > 0
    ? myEvents.map((e: any) => `${e.title} (${e.category})`).join(', ')
    : undefined

  useEffect(() => {
    if (!userData?.interests?.length) return
    setAiLoading(true)
    aiMatchCompanions(
      {
        interests: userData.interests,
        bio: userData.bio || '',
        age: userData.age || '',
        langs: userData.langs || ['en'],
        musicGenres: userData.musicGenres || [],
        drinksPref: userData.drinksPref || '',
        smokingPref: userData.smokingPref || '',
        socialEnergy: tonightVibe?.energy || userData.socialEnergy || '',
        dealbreakers: userData.dealbreakers || [],
        eventContext,
      },
      QUEUE_PROFILES
    ).then(results => {
      setAiMatches(results)
      setAiLoading(false)
    })
  }, [tonightVibe?.energy, eventContext])

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
  if (myEvents.length === 0 && myApprovedCommunityEvents.length === 0 && myCommunityEvents.length === 0 && !hasHostActivity && pendingHostedEvents.length === 0 && (activeHosted.length === 0 || allHostedFull)) {
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
    if (hasHostActivity) return '👑 You have join requests'
    const totalReal = myEvents.reduce((sum: number, e: any) => sum + (eventAttendeesMap[e.id]?.length || 0), 0)
    if (myEvents.length > 0 && totalReal > 0) return `${totalReal} ${totalReal === 1 ? 'person' : 'people'} joined · tap to review`
    const lookingCount = myEvents.length + activeHosted.length
    if (lookingCount > 0) return `${lookingCount} event${lookingCount > 1 ? 's' : ''} · looking for crew...`
    if (myApprovedCommunityEvents.length > 0) return `You're in — open the chat`
    if (myCommunityEvents.length > 0) return `${myCommunityEvents.length} request${myCommunityEvents.length > 1 ? 's' : ''} · waiting for host`
    return `${pendingHostedEvents.length} social${pendingHostedEvents.length > 1 ? 's' : ''} · waiting for host approval`
  })()

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0812' }}>
      <AuroraBg />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: topInset + 16, paddingBottom: 26 }}>
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.13)', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 6, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(99,102,241,0.28)' }}>
            <Radio size={10} color="#818CF8" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#818CF8', letterSpacing: 1.5, textTransform: 'uppercase' }}>Live</Text>
          </View>
          <Text style={{ fontSize: 46, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -1.5, lineHeight: 52 }}>Vibe{'\n'}Check</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: hasHostActivity ? '#FBBF24' : myEvents.length > 0 ? '#43E97B' : 'rgba(255,255,255,0.25)' }} />
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
            // Score + sort, show top 12
            const scored = allRequests
              .map(req => ({ ...req, _score: scoreRequesterForHost(req, userData || {}, ev.category) }))
              .sort((a, b) => b._score - a._score)
              .slice(0, 12)
            const autoFillCount = Math.min(slotsLeft, scored.length)
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
                        Alert.alert(`Cancel "${ev.title}"?`, 'This will delete the event.', [
                          { text: 'Cancel Event', style: 'destructive', onPress: () => onCancelHostedEvent?.(ev) },
                          { text: 'Keep', style: 'cancel' },
                        ])
                      }}
                      activeOpacity={0.7}
                      style={{ padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <Trash2 size={15} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                      {allRequests.length === 0
                        ? `⏳ Waiting for requests · ${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} open`
                        : `${allRequests.length} request${allRequests.length > 1 ? 's' : ''} · ${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} left · AI-ranked ✨`}
                    </Text>
                  </View>
                  {/* Auto-fill button */}
                  {slotsLeft > 0 && scored.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        scored.slice(0, autoFillCount).forEach(req => onApproveJoiner?.(ev.id, req))
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                      }}
                      activeOpacity={0.8}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.25)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.5)' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#A5B4FC' }}>⚡ Auto-fill {autoFillCount} best match{autoFillCount !== 1 ? 'es' : ''}</Text>
                    </TouchableOpacity>
                  )}
                  {/* Ranked request cards */}
                  {scored.map((req: any, idx: number) => {
                    const score = req._score as number
                    const scoreColor = score >= 75 ? '#43E97B' : score >= 50 ? '#FBBF24' : '#F87171'
                    return (
                      <View key={req.requestId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12 }}>
                        {/* Rank indicator */}
                        {idx === 0 && <Text style={{ position: 'absolute', top: 8, left: 10, fontSize: 11 }}>🏆</Text>}
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
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{req.name}, {req.age}</Text>
                              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>tap →</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }} numberOfLines={1}>{req.bio}</Text>
                            <View style={{ flexDirection: 'row', gap: 4, marginTop: 5, alignItems: 'center' }}>
                              {(req.langs || []).map((l: string) => (
                                <Text key={l} style={{ fontSize: 13 }}>{FLAG_MAP[l] || '🌐'}</Text>
                              ))}
                              {req.transport === 'car' && <Text style={{ fontSize: 12 }}>🚗</Text>}
                              {req.transport === 'lift' && <Text style={{ fontSize: 12 }}>🙋</Text>}
                              {req.transport === 'meet' && <Text style={{ fontSize: 12 }}>📍</Text>}
                            </View>
                          </View>
                        </TouchableOpacity>
                        {/* Action buttons */}
                        <View style={{ gap: 6 }}>
                          <TouchableOpacity onPress={() => onApproveJoiner?.(ev.id, req)} activeOpacity={0.8}
                            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(67,233,123,0.15)', borderWidth: 1.5, borderColor: '#43E97B', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={18} color="#43E97B" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => onPassJoiner?.(ev.id, req)} activeOpacity={0.8}
                            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(148,163,184,0.08)', borderWidth: 1.5, borderColor: 'rgba(148,163,184,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={16} color="rgba(255,255,255,0.4)" />
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
                        onPress={() => onGoToMessages?.()}
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
                        <TouchableOpacity onPress={() => onGoToMessages?.()} style={{ marginLeft: 'auto' as any }}>
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
            return (
              <View key={invite.id} style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)' }}>
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
              </View>
            )
          })}

          {myEvents.map((ev: any) => {
            const isCommunity = ev.type === 'community'
            const format     = userEventFormat?.[ev.id]    || (ev.type === 'official' ? '1+1' : 'squad')
            const transport  = userEventTransport?.[ev.id] || 'meet'
            // For community events: use real participant count as crew size
            const cap        = isCommunity ? Math.min(ev.participantsCount || 5, 5) : (VIBE_FORMAT_MAX[format] || 5)
            const threshold  = isCommunity ? cap : (VIBE_FORMAT_THRESHOLD[format] || cap)
            const isParty    = !isCommunity && format === 'party'
            // For official events: use real attendees from DB; for community: use other approved members
            const realAttendees = isCommunity ? (communityEventMembers[ev.id] || []) : (ev.type === 'official' ? (eventAttendeesMap[ev.id] || []) : [])
            const passedIds = new Set(passedRequests[ev.id] || [])
            const partners   = isCommunity ? realAttendees : realAttendees
            const realPartners = partners.filter((p: any) => p._real && !passedIds.has(p.id))
            const hasRealAttendees = realPartners.length > 0
            // found = me (1) + non-skipped real partners
            const found      = hasRealAttendees ? realPartners.length + 1 : 1
            const isActive   = hasRealAttendees || isCommunity
            // Status label (excludes skipped people from count)
            const statusLabel = isCommunity
              ? (hasRealAttendees ? `${realAttendees.length + 1} in group 🎯` : 'HOST APPROVED ✓')
              : realPartners.length > 0 ? `${realPartners.length} found 🎯` : (isParty ? 'GROUP ACTIVE 🔥' : 'Looking...')
            const hasReal = realPartners.length > 0
            const statusColor = (isActive || hasReal) ? '#43E97B' : '#FBBF24'
            const statusBg    = (isActive || hasReal) ? 'rgba(67,233,123,0.15)' : 'rgba(251,191,36,0.13)'
            const statusBorder= (isActive || hasReal) ? 'rgba(67,233,123,0.35)' : 'rgba(251,191,36,0.28)'
            const inviteSentToAll = realPartners.length > 0 && realPartners.every((p: any) => !!sentCrewInvites[`${ev.id}_${p.id}`])
            // Hide "Let's go!" if we have an incoming invite from any of these partners for this event
            const hasIncomingInviteForEvent = incomingCrewInvites.some((inv: any) => inv.event_ref_id === ev.id)

            return (
              <View key={ev.id} style={{
                borderRadius: 28, overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.055)',
                borderWidth: 1, borderColor: isActive ? 'rgba(67,233,123,0.3)' : 'rgba(255,255,255,0.08)',
              }}>
                <LinearGradient colors={ev.gradient as any} style={{ height: 6 }} />

                <View style={{ padding: 20 }}>
                  {/* Title + status */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: '#fff', letterSpacing: -0.3, lineHeight: 21 }} numberOfLines={2}>{ev.title}</Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{prettyEventTime(ev.time)}{ev.distance && ev.distance !== '0km' ? ` · ${ev.distance}` : ev.location ? ` · ${ev.location}` : ''}</Text>
                    </View>
                    <PulsingStatusBadge label={statusLabel} color={statusColor} bg={statusBg} border={statusBorder} />
                  </View>

                  {/* My choices pills */}
                  <View style={{ flexDirection: 'row', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: 'rgba(255,255,255,0.55)' }}>
                        {isCommunity ? ev.category : VIBE_FORMAT_LABEL[format]}
                      </Text>
                    </View>
                    <RockingTransportPill transport={transport} />
                  </View>

                  {/* Confirmation deadline banner for approved community joiners */}
                  {isCommunity && joinedEvents?.[ev.id] === 'joined' && (() => {
                    const approvedAt = approvedAtMap[ev.id]
                    if (!approvedAt) return null
                    const hoursLeft = Math.max(0, Math.ceil(6 - (Date.now() - approvedAt) / 3600000))
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' }}>
                        <Text style={{ fontSize: 18 }}>⏰</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#FBBF24' }}>Confirm your spot!</Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{hoursLeft}h left — tap "Open Chat" below to confirm</Text>
                        </View>
                      </View>
                    )
                  })()}

                  {/* Progress */}
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

                  {/* ── DUO (1+1) official event — one person at a time ── */}
                  {!isCommunity && format === '1+1' ? (() => {
                    const existingChatId = officialEventChatMap[ev.id]
                    // If chat already created → show Open Chat
                    if (existingChatId) {
                      return (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => onGoToMessages?.()}
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
                      return (
                        <View style={{ gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {inviter.photos?.[0] ? (
                              <Image source={{ uri: inviter.photos[0] }} style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(99,102,241,0.4)' }} />
                            ) : (
                              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: inviter.color || '#818CF8', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{(inviter.name || '?')[0]}</Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{inviter.name || 'Someone'}</Text>
                              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>wants to go together 🎯</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity activeOpacity={0.85} onPress={() => onAcceptInvite?.(anyIncoming)} style={{ flex: 1, borderRadius: 99, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 12, elevation: 5 }}>
                              <Zap size={14} color="#052e16" fill="#052e16" />
                              <Text style={{ fontSize: 14, fontWeight: '900', color: '#052e16' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => onDeclineInvite?.(anyIncoming)} style={{ flex: 1, borderRadius: 99, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )
                    }

                    // Show current person with action buttons
                    const inviteSent = !!sentCrewInvites[`${ev.id}_${currentPerson!.id}`]
                    const scoreVal = currentPerson!.score
                    const scoreColor = scoreVal != null && scoreVal >= 75 ? '#43E97B' : '#818CF8'
                    return (
                      <View style={{ gap: 14 }}>
                        {/* Profile card */}
                        <TouchableOpacity activeOpacity={0.85} onPress={() => {
                          setPreviewProfile({ ...currentPerson, flag: FLAG_MAP[currentPerson.langs?.[0]] || '🌍', langs: (currentPerson.langs || []).map((l: string) => FLAG_MAP[l] || l), aiScore: scoreVal, aiReason: currentPerson.vibe || 'Real attendee' })
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                            {currentPerson!.photo ? (
                              <Image source={{ uri: currentPerson!.photo }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: scoreColor + '60' }} />
                            ) : (
                              <LinearGradient colors={currentPerson!.colors || ['#6366F1','#818CF8']} style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
                                <Text style={{ fontSize: 28 }}>{currentPerson!.emoji || '🎵'}</Text>
                              </LinearGradient>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{currentPerson!.name}</Text>
                              {currentPerson!.bio ? <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 17 }} numberOfLines={2}>{currentPerson!.bio}</Text> : null}
                            </View>
                            {scoreVal != null && (
                              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: scoreColor + '22', borderWidth: 1, borderColor: scoreColor + '55' }}>
                                <Text style={{ fontSize: 13, fontWeight: '900', color: scoreColor }}>{scoreVal}%</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Action buttons */}
                        {incomingFromCurrent ? (
                          // B sees A pressed Let's go → show Accept / Decline
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity activeOpacity={0.85} onPress={() => onAcceptInvite?.(incomingFromCurrent)} style={{ flex: 1, borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                              <Zap size={15} color="#052e16" fill="#052e16" />
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => onDeclineInvite?.(incomingFromCurrent)} style={{ flex: 1, borderRadius: 99, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>Decline</Text>
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
                          // Default: Invite + Skip
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => { onConfirm?.(ev, [currentPerson], format); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) }}
                              style={{ flex: 1, borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 }}>
                              <Zap size={15} color="#052e16" fill="#052e16" />
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>Invite</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => { onPassJoiner?.(ev.id, currentPerson); Haptics.selectionAsync() }}
                              style={{ paddingHorizontal: 22, borderRadius: 99, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}>Skip</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )
                  })() : (
                  <>
                  {/* ── Non-duo: avatar row + CTA (squad / party / community) ── */}
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

                  {/* CTA */}
                  {isCommunity && !hasRealAttendees && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', marginBottom: 10 }}>
                      <Text style={{ fontSize: 18 }}>✅</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 }}>You're approved! More people may join. Open the chat to say hi.</Text>
                    </View>
                  )}
                  {!isActive && !isCommunity && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(251,191,36,0.07)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(251,191,36,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Search size={16} color="#FBBF24" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.48)', lineHeight: 18 }}>We're looking for people going to this event. You'll get notified when someone matches!</Text>
                    </View>
                  )}
                  {(isActive || (joinedEvents?.[ev.id] === 'confirmed' && !!officialEventChatMap[ev.id])) && (
                    <View style={{ gap: 10 }}>
                      {(() => {
                        const isAlreadyConfirmed = joinedEvents?.[ev.id] === 'confirmed' && !!officialEventChatMap[ev.id]
                        const crewPreview = !isCommunity && (format === 'squad' || format === 'party') && !isAlreadyConfirmed ? crewPreviewMap[ev.id] : null
                        const readyCount = readyCountMap[ev.id] // others ready (excludes self)
                        const isWaiting = !isCommunity && (format === 'squad' || format === 'party') && readyCount === 0 && !crewPreview && !isAlreadyConfirmed
                        if (isAlreadyConfirmed) {
                          const confirmedSoFar = (crewPreview?.confirmedCount || 0) + 1 // +1 for self
                          const maxSize = VIBE_FORMAT_MAX[format] || 5
                          return (
                            <View style={{ gap: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(67,233,123,0.07)', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(67,233,123,0.22)' }}>
                                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(67,233,123,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckCircle size={16} color="#43E97B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#43E97B' }}>You're in the crew!</Text>
                                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                                    We'll keep looking for more people.
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
                        if (crewPreview) {
                          const confirmedCount = crewPreview.confirmedCount || 0
                          const confirmBtnLabel = 'Join crew'
                          return (
                            <View style={{ gap: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(67,233,123,0.1)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(67,233,123,0.3)' }}>
                                <Text style={{ fontSize: 15 }}>{transport === 'car' ? '🚗' : '🎯'}</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#43E97B' }}>
                                    {confirmedCount >= 2 ? `${confirmedCount} confirmed, chat started!` : 'Crew matched'}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }} numberOfLines={1}>
                                    {(() => {
                                      const names = crewPreview.members.map((m: any) => m.name)
                                      const head = names.slice(0, 2).join(', ')
                                      const rest = names.length - 2
                                      const namesStr = rest > 0 ? `${head} +${rest} more` : head
                                      return confirmedCount > 0 ? `${namesStr} · ${confirmedCount} confirmed` : namesStr
                                    })()}
                                  </Text>
                                  {crewPreview.members.some((m: any) => m.transport) && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                      {crewPreview.members.filter((m: any) => m.transport).map((m: any, i: number) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                                          <Text style={{ fontSize: 10 }}>{m.transport === 'car' ? '🚗' : m.transport === 'lift' ? '🙋' : '📍'}</Text>
                                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{m.name.split(' ')[0]} · {m.transport === 'car' ? 'has car' : m.transport === 'lift' ? 'needs lift' : 'meet there'}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                                <View style={{ flexDirection: 'row', gap: -8 }}>
                                  {crewPreview.members.slice(0, 3).map((m: any, i: number) => (
                                    m.photo ? <Image key={i} source={{ uri: m.photo }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: m.status === 'confirmed' ? '#43E97B' : '#0A0812', marginLeft: i > 0 ? -8 : 0 }} /> :
                                    <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: m.color || '#818CF8', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: m.status === 'confirmed' ? '#43E97B' : '#0A0812', marginLeft: i > 0 ? -8 : 0 }}><Text style={{ fontSize: 10 }}>👤</Text></View>
                                  ))}
                                </View>
                              </View>
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => onJoinCrew?.(ev)}
                                style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', backgroundColor: '#43E97B', shadowColor: '#43E97B', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
                                <Text style={{ fontSize: 15, fontWeight: '900', color: '#052e16' }}>{confirmBtnLabel}</Text>
                              </TouchableOpacity>
                            </View>
                          )
                        }
                        const isSquadOrParty = !isCommunity && (format === 'squad' || format === 'party')
                        return (
                          <TouchableOpacity
                            activeOpacity={inviteSentToAll ? 1 : 0.85}
                            disabled={inviteSentToAll}
                            onPress={() => isSquadOrParty ? onJoinCrew?.(ev) : onConfirm?.(ev, partners, format)}
                            style={{ borderRadius: 99, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: inviteSentToAll ? 'rgba(67,233,123,0.2)' : '#43E97B', shadowColor: '#43E97B', shadowOpacity: inviteSentToAll ? 0 : 0.4, shadowRadius: 14, elevation: inviteSentToAll ? 0 : 6 }}>
                            {!inviteSentToAll && (isCommunity ? <MessageCircle size={15} color="#052e16" /> : <Zap size={15} color="#052e16" fill="#052e16" />)}
                            {inviteSentToAll && <CheckCircle size={15} color="#43E97B" />}
                            <Text style={{ fontSize: 15, fontWeight: '900', color: inviteSentToAll ? '#43E97B' : '#052e16' }}>
                              {isCommunity ? 'Confirm & Open Chat' : inviteSentToAll ? 'Invite sent' : 'Join crew'}
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
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{prettyEventTime(ev.time)}{ev.location ? ` · ${ev.location}` : ''}</Text>
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
            const langMatch = userLangs.some(l => hostLangs.includes(l))
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
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{prettyEventTime(ev.time)}</Text>
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
      </SafeAreaView>

      {previewProfile && <ProfilePreviewSheet profile={previewProfile} onClose={() => setPreviewProfile(null)} onBlock={onBlockUser} onReport={onReportUser} />}
    </View>
  )
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────

function ProfileTab({ userData, onUpdateUserData, onLogOut, city, setCityOpen, onUnblockUser }: { userData: any; onUpdateUserData?: (patch: any) => void; onLogOut?: () => void; city?: string; setCityOpen?: (v: boolean) => void; onUnblockUser?: (id: string) => void }) {
  const insets = useSafeAreaInsets()
  const nm = userData?.name || 'Your Profile'
  const ag = userData?.age || ''
  const userPhotos: string[] = (userData?.photos || []).filter(Boolean)
  const [vibeEditOpen, setVibeEditOpen] = useState(false)
  const [langEditOpen, setLangEditOpen] = useState(false)
  const [interestsEditOpen, setInterestsEditOpen] = useState(false)
  const [draftLangs, setDraftLangs] = useState<string[]>([])
  const [draftInterests, setDraftInterests] = useState<string[]>([])
  const [draft, setDraft] = useState<any>({})

  // Per-slot status: null = idle, 'checking' = moderation running, 'rejected' = failed
  const [slotStatus, setSlotStatus] = useState<Record<number, 'checking' | 'rejected'>>({})

  const setSlot = (idx: number, status: 'checking' | 'rejected' | null) =>
    setSlotStatus(prev => { const n = { ...prev }; if (status === null) delete n[idx]; else n[idx] = status; return n })

  const pickProfilePhoto = async (replaceIdx?: number, source: 'gallery' | 'camera' = 'gallery') => {
    try {
      let result
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') { Alert.alert('Camera access needed', 'Enable camera in Settings to take a selfie.'); return }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, base64: true, exif: false, cameraType: ImagePicker.CameraType.front })
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos.'); return }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.4,
          base64: true,
          exif: false,
        })
      }
      if (result.canceled || !result.assets?.[0]) return
      const { uri, base64 } = result.assets[0]

      const targetIdx = replaceIdx !== undefined ? replaceIdx : userPhotos.length

      // Save immediately so photo appears right away
      const photosBeforePick = [...userPhotos]
      const newPhotos = [...userPhotos]
      if (replaceIdx !== undefined) { newPhotos[replaceIdx] = uri } else { newPhotos.push(uri) }
      onUpdateUserData?.({ photos: newPhotos })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Background moderation
      if (base64) {
        setSlot(targetIdx, 'checking')
        try {
          const safe = await isImageSafe(base64)
          if (!safe) {
            setSlot(targetIdx, 'rejected')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            setTimeout(() => {
              onUpdateUserData?.({ photos: photosBeforePick })
              setSlot(targetIdx, null)
              Alert.alert('Photo removed 🚫', 'This photo doesn\'t meet our content guidelines. Please choose a different one.')
            }, 1200)
            return
          }
        } catch { /* keep photo on moderation error */ }
        setSlot(targetIdx, null)
      }

      // Upload to Supabase Storage — save public URL to DB
      const userId = userData?.authId || userData?.dbId
      if (userId && base64) {
        const publicUrl = await uploadPhotoToStorage(base64, userId, targetIdx)
        const uploadedPhotos = [...newPhotos]
        if (publicUrl) {
          uploadedPhotos[targetIdx] = publicUrl
          // Update local state with public URL so it persists correctly
          onUpdateUserData?.({ photos: uploadedPhotos })
        }
        // Always save to DB (public URL if upload succeeded, local URI as fallback)
        if (userData?.dbId) {
          supabase.from('profiles').update({ photos: uploadedPhotos }).eq('id', userData.dbId)
            .then(({ error }) => { if (error) console.warn('Photo DB update error:', error.message) })
        }
      }
    } catch { /* picker cancelled or error */ }
  }

  const deleteProfilePhoto = (idx: number) => {
    if (idx === 0 && userPhotos.length === 1) {
      Alert.alert('Main photo required', 'You need at least one photo. Replace it instead.')
      return
    }
    Alert.alert('Delete photo?', undefined, [
      { text: 'Delete', style: 'destructive', onPress: () => {
        const updated = userPhotos.filter((_, i) => i !== idx)
        onUpdateUserData?.({ photos: updated })
        // Persist to DB directly — handleUpdateUserData skips photos to avoid clobbering public URLs
        if (userData?.dbId) {
          supabase.from('profiles').update({ photos: updated }).eq('id', userData.dbId)
            .then(({ error }) => { if (error) console.warn('Photo delete DB update error:', error.message) })
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }},
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; name: string; photo?: string }[]>([])
  const [faqOpen, setFaqOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<string | null>(null)

  useEffect(() => {
    if (!userData?.dbId) return
    supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData.dbId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const ids = data.map((r: any) => r.blocked_id)
        const { data: profiles } = await supabase.from('profiles').select('id, name, photos').in('id', ids)
        if (profiles) setBlockedUsers(profiles.map((p: any) => ({ id: p.id, name: p.name, photo: p.photos?.[0] })))
      })
  }, [userData?.dbId])

  const unblockUser = async (userId: string) => {
    if (!userData?.dbId) return
    await supabase.from('blocked_users').delete().eq('blocker_id', userData.dbId).eq('blocked_id', userId)
    setBlockedUsers(prev => prev.filter(b => b.id !== userId))
    onUnblockUser?.(userId)
  }

  return (
    <View style={{ flex: 1 }}>

      {/* ── Profile Preview (same sheet as other users) ─────────────────────── */}
      {profilePreviewOpen && (
        <ProfilePreviewSheet
          profile={{
            name: nm,
            age: ag,
            bio: userData?.bio || '',
            photos: userPhotos,
            interests: userData?.interests || [],
            langs: userData?.langs || [],
            color: userData?.color || '#6366F1',
            emoji: '👤',
          }}
          onClose={() => setProfilePreviewOpen(false)}
        />
      )}

      {/* Vibe Edit Modal */}
      <Modal visible={vibeEditOpen} transparent animationType="slide" onRequestClose={() => setVibeEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setVibeEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Edit vibe</Text>
            <TouchableOpacity onPress={() => setVibeEditOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Music taste</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {MUSIC_GENRES.map(g => {
                const on = (draft.musicGenres || []).includes(g.id)
                return (
                  <TouchableOpacity key={g.id} onPress={() => setDraft((v: any) => ({ ...v, musicGenres: on ? v.musicGenres.filter((x: string) => x !== g.id) : [...(v.musicGenres || []), g.id] }))}
                    style={{ width: (W - 40 - 20) / 3, borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={on ? g.colors : ['#F8FAFC', '#F1F5F9']}
                      style={{ paddingVertical: 10, alignItems: 'center', gap: 3, borderWidth: 1.5, borderRadius: 12, borderColor: on ? 'transparent' : '#E2E8F0' }}>
                      <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: on ? '#fff' : '#475569', textAlign: 'center' }}>{g.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Social energy</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
              {SOCIAL_ENERGY.map(e => {
                const on = draft.socialEnergy === e.id
                return (
                  <TouchableOpacity key={e.id} onPress={() => setDraft((v: any) => ({ ...v, socialEnergy: e.id }))}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#3730A3' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#3730A3' : '#E2E8F0' }}>
                    <e.Icon size={18} color={on ? '#fff' : '#94A3B8'} weight="duotone" />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: on ? '#fff' : '#94A3B8', textAlign: 'center', marginTop: 3 }}>{e.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {[
              { key: 'drinksPref', label: '🍷 Alcohol', opts: ['Social drinker', 'Rarely', "Don't drink"] },
              { key: 'smokingPref', label: '🚬 Smoking', opts: ['Non-smoker', 'Social', 'Smoker'] },
            ].map(row => (
              <View key={row.key} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{row.label}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {row.opts.map(opt => {
                    const on = draft[row.key] === opt
                    return (
                      <TouchableOpacity key={opt} onPress={() => setDraft((v: any) => ({ ...v, [row.key]: opt }))}
                        style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#3730A3' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#3730A3' : '#E2E8F0' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: on ? '#fff' : '#475569' }}>{opt}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => { onUpdateUserData?.(draft); setVibeEditOpen(false) }}
              style={{ backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Lang Edit Modal */}
      <Modal visible={langEditOpen} transparent animationType="slide" onRequestClose={() => setLangEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setLangEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Languages</Text>
            <TouchableOpacity onPress={() => setLangEditOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {LANGUAGES_LIST.map(l => {
                const on = draftLangs.includes(l.code)
                return (
                  <TouchableOpacity key={l.code} onPress={() => { setDraftLangs(prev => on ? prev.filter(x => x !== l.code) : [...prev, l.code]); Haptics.selectionAsync() }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#F3EEFF' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#8B5CF6' : '#E2E8F0' }}>
                    <Text style={{ fontSize: 22 }}>{l.flag}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: on ? '#4338CA' : '#64748B' }}>{l.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity onPress={() => { onUpdateUserData?.({ langs: draftLangs }); setLangEditOpen(false) }}
              style={{ backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save{draftLangs.length > 0 ? ` (${draftLangs.length})` : ''}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Interests Edit Modal */}
      <Modal visible={interestsEditOpen} transparent animationType="slide" onRequestClose={() => setInterestsEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setInterestsEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Your interests</Text>
            <TouchableOpacity onPress={() => setInterestsEditOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {INTERESTS_BY_CATEGORY.map(cat => {
              const palette = INTEREST_CATEGORY_PALETTE[cat.id as keyof typeof INTEREST_CATEGORY_PALETTE]
              return (
                <View key={cat.id} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'ClashDisplay-Semibold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10 }}>{cat.label}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {cat.items.map(item => (
                      <AnimatedInterestChip
                        key={item}
                        item={item}
                        isOn={draftInterests.includes(item)}
                        onPress={() => { setDraftInterests(prev => draftInterests.includes(item) ? prev.filter(x => x !== item) : [...prev, item]); Haptics.selectionAsync() }}
                        palette={palette}
                      />
                    ))}
                  </View>
                </View>
              )
            })}
            <TouchableOpacity onPress={() => { onUpdateUserData?.({ interests: draftInterests }); setInterestsEditOpen(false) }}
              style={{ backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save{draftInterests.length > 0 ? ` (${draftInterests.length})` : ''}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Edit Profile sheet ────────────────────────────────────────────── */}
      <Modal visible={editProfileOpen} transparent animationType="slide" onRequestClose={() => setEditProfileOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setEditProfileOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditProfileOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Interests */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>Interests</Text>
              <TouchableOpacity onPress={() => { setDraftInterests(userData?.interests || []); setEditProfileOpen(false); setTimeout(() => setInterestsEditOpen(true), 300) }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
            {(userData?.interests || []).length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(userData.interests as string[]).map((item: string) => {
                  const Icon = INTEREST_ICON_MAP[item] || Sparkle
                  const label = item.indexOf(' ') !== -1 ? item.slice(item.indexOf(' ') + 1) : item
                  return (
                    <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3EEFF', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 }}>
                      <Icon size={13} color="#8B5CF6" weight="duotone" />
                      <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#7C3AED' }}>{label}</Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setDraftInterests([]); setEditProfileOpen(false); setTimeout(() => setInterestsEditOpen(true), 300) }}
                style={{ alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>✨ Add interests</Text>
              </TouchableOpacity>
            )}

            {/* Languages */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>Languages</Text>
              <TouchableOpacity onPress={() => { setDraftLangs(userData?.langs || []); setEditProfileOpen(false); setTimeout(() => setLangEditOpen(true), 300) }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
            {(userData?.langs || []).length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(userData.langs as string[]).map((code: string) => {
                  const l = LANGUAGES_LIST.find(x => x.code === code)
                  return l ? (
                    <View key={code} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F8FAFC', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }}>
                      <Text style={{ fontSize: 18 }}>{l.flag}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>{l.label}</Text>
                    </View>
                  ) : null
                })}
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setDraftLangs([]); setEditProfileOpen(false); setTimeout(() => setLangEditOpen(true), 300) }}
                style={{ alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>🌍 Add languages</Text>
              </TouchableOpacity>
            )}

            {/* Vibe */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Vibe</Text>
              <TouchableOpacity onPress={() => { setDraft({ musicGenres: userData?.musicGenres || [], socialEnergy: userData?.socialEnergy, drinksPref: userData?.drinksPref, smokingPref: userData?.smokingPref }); setEditProfileOpen(false); setTimeout(() => setVibeEditOpen(true), 300) }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, gap: 10 }}>
                <Sparkle size={20} color="#8B5CF6" weight="duotone" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', flex: 1 }}>Music, energy, drinks & smoking</Text>
                <Feather name="chevron-right" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Main Profile ─────────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>

        {/* Header */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 16 : Math.max(insets.top, 20) + 4, paddingHorizontal: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <MaskedView maskElement={
              <Text style={{ fontSize: 44, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, lineHeight: 50, backgroundColor: 'transparent' }}>Profile</Text>
            }>
              <LinearGradient colors={['#8B5CF6', '#C4B5FD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={{ fontSize: 44, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, lineHeight: 50, opacity: 0 }}>Profile</Text>
              </LinearGradient>
            </MaskedView>
            <TouchableOpacity
              onPress={() => { setProfilePreviewOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#F3EEFF' }}>
              <Feather name="eye" size={14} color="#8B5CF6" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}>

        {/* Photos: 3 equal squares */}
        {(() => {
          const SZ = (W - 40 - 16) / 3
          return (
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 18 }}>
              {[0, 1, 2].map(i => {
                const uri = userPhotos[i]
                const isMain = i === 0
                const status = slotStatus[i] ?? null
                const isChecking = status === 'checking'
                const isRejected = status === 'rejected'
                if (uri) return (
                  <TouchableOpacity key={`${i}_${uri}`} activeOpacity={0.85}
                    onPress={() => {
                      if (isChecking || isRejected) return
                      const acts: any[] = [
                        { text: '🤳  Take a selfie', onPress: () => pickProfilePhoto(i, 'camera') },
                        { text: '🖼️  Choose from gallery', onPress: () => pickProfilePhoto(i, 'gallery') },
                      ]
                      if (!isMain) acts.push({ text: '🗑️  Delete', style: 'destructive', onPress: () => deleteProfilePhoto(i) })
                      acts.push({ text: 'Cancel', style: 'cancel' })
                      Alert.alert(isMain ? 'Main photo' : `Photo ${i + 1}`, undefined, acts)
                    }}
                    style={{ width: SZ, height: SZ * 1.3, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E2E8F0' }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {isChecking && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(99,102,241,0.7)', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fff" size="small" /></View>}
                    {isRejected && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(239,68,68,0.75)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>🚫</Text></View>}
                    {isMain && !isChecking && !isRejected && <View style={{ position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.5)' }}><Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>Main ★</Text></View>}
                    {!isChecking && !isRejected && <View style={{ position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}><Feather name="edit-2" size={10} color="#fff" /></View>}
                  </TouchableOpacity>
                )
                if (i <= userPhotos.length) return (
                  <TouchableOpacity key={i} onPress={() => Alert.alert('Add a photo', undefined, [
                    { text: '🤳  Take a selfie', onPress: () => pickProfilePhoto(undefined, 'camera') },
                    { text: '🖼️  Choose from gallery', onPress: () => pickProfilePhoto(undefined, 'gallery') },
                    { text: 'Cancel', style: 'cancel' },
                  ])}
                    style={{ width: SZ, height: SZ * 1.3, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Feather name="plus" size={20} color="#94A3B8" />
                    <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                )
                return <View key={i} style={{ width: SZ, height: SZ * 1.3, borderRadius: 16, backgroundColor: '#F1F5F9', opacity: 0.3 }} />
              })}
            </View>
          )
        })()}

        {/* Name + bio — centered */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3, textAlign: 'center' }}>{nm}{ag ? `, ${ag}` : ''}</Text>
          {userData?.bio ? (
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 19, textAlign: 'center' }} numberOfLines={2}>{userData.bio}</Text>
          ) : null}
        </View>

        {/* Edit Profile + Settings buttons */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => { setEditProfileOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F3EEFF', borderRadius: 16, paddingVertical: 14 }}>
            <Feather name="edit-2" size={16} color="#8B5CF6" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#8B5CF6' }}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setSettingsOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', borderRadius: 16, paddingVertical: 14 }}>
            <Feather name="settings" size={16} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Summary blocks */}
        {(() => {
          const photos = userPhotos
          const bio = (userData?.bio || '').trim()
          const interests = userData?.interests || []
          const langs = userData?.langs || []
          const socialEnergy = userData?.socialEnergy
          const musicGenres = userData?.musicGenres || []
          const drinksPref = userData?.drinksPref
          const transport = userData?.transport

          // Profile strength scoring
          let strength = 0
          const tips: string[] = []
          if (photos.length >= 1) strength += 20; else tips.push('Add a main photo')
          if (photos.length >= 3) strength += 15; else if (photos.length < 3) tips.push(`Add ${3 - photos.length} more photo${3 - photos.length === 1 ? '' : 's'}`)
          if (bio) strength += 15; else tips.push('Add a one-line bio')
          if (interests.length >= 3) strength += 15; else tips.push(`Pick ${3 - interests.length} more interest${3 - interests.length === 1 ? '' : 's'}`)
          if (langs.length >= 1) strength += 10; else tips.push('Add at least 1 language')
          if (socialEnergy) strength += 10; else tips.push('Set your social energy')
          if (musicGenres.length >= 1) strength += 10; else tips.push('Pick a music vibe')
          if (drinksPref) strength += 5
          strength = Math.min(100, strength)

          const energyLabel = SOCIAL_ENERGY.find(e => e.id === socialEnergy)?.label
          const transportLabel = transport === 'car' ? 'Has a car' : transport === 'lift' ? 'Open to carpool' : transport === 'meet' ? 'Meet there' : null
          const langLabels = langs.slice(0, 3).map((c: string) => LANGUAGES_LIST.find(l => l.code === c)?.label || c)
          const vibeParts = [energyLabel, transportLabel, langLabels.join(' / ')].filter(Boolean)

          return (
            <View style={{ paddingHorizontal: 20, gap: 14, marginBottom: 32 }}>
              {/* Profile strength */}
              {strength < 100 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', letterSpacing: -0.1 }}>Profile strength</Text>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: strength >= 70 ? '#10B981' : strength >= 50 ? '#6366F1' : '#F97316' }}>{strength}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#EEF2FF', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                    <LinearGradient colors={strength >= 70 ? ['#34D399', '#10B981'] : strength >= 50 ? ['#818CF8', '#6366F1'] : ['#FBBF24', '#F97316']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ width: `${strength}%` as any, height: '100%' }} />
                  </View>
                  {tips[0] && (
                    <TouchableOpacity onPress={() => setEditProfileOpen(true)} activeOpacity={0.8}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontFamily: 'Outfit-Medium' }}>💡 {tips[0]} <Text style={{ color: '#8B5CF6', fontFamily: 'Outfit-SemiBold' }}>→</Text></Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Your vibe */}
              {vibeParts.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Your vibe</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: '#1E1B4B', lineHeight: 21 }}>{vibeParts.join(' · ')}</Text>
                </View>
              )}

              {/* Interests preview */}
              {interests.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' }}>Interests</Text>
                    <TouchableOpacity onPress={() => { setDraftInterests(interests); setInterestsEditOpen(true) }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#8B5CF6' }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {interests.slice(0, 6).map((it: string) => (
                      <View key={it} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#E9E5FF' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#4338CA' }}>{it}</Text>
                      </View>
                    ))}
                    {interests.length > 6 && (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: '#EEF2FF' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#6366F1' }}>+{interests.length - 6}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Safety */}
              <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Safety</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={{ fontSize: 13, fontFamily: 'Outfit-Medium', color: '#475569' }}>Profile visible to crew</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={{ fontSize: 13, fontFamily: 'Outfit-Medium', color: '#475569' }}>18+ confirmed</Text>
                </View>
              </View>
            </View>
          )
        })()}

        {/* Settings Modal */}
        <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
          <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F0F9FF']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                <TouchableOpacity onPress={() => setSettingsOpen(false)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                  <Feather name="x" size={18} color="#475569" />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 22, color: '#1E1B4B', marginLeft: 14 }}>Settings</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}>

                {/* Profile section */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Profile</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    {[
                      { icon: 'edit-2', label: 'Edit Profile', iconColor: '#8B5CF6', bg: '#F3EEFF' },
                      { icon: 'map-pin', label: 'City', iconColor: '#6366F1', bg: '#EEF2FF', value: city },
                    ].map((item, idx) => (
                      <React.Fragment key={item.label}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                          onPress={() => {
                            if (item.label === 'Edit Profile') { setSettingsOpen(false); setTimeout(() => setEditProfileOpen(true), 300) }
                            if (item.label === 'City') { setSettingsOpen(false); setTimeout(() => setCityOpen?.(true), 300) }
                          }}>
                          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Feather name={item.icon as any} size={17} color={item.iconColor} />
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>{item.label}</Text>
                          {'value' in item && <Text style={{ fontSize: 13, color: '#94A3B8', marginRight: 6 }}>{item.value}</Text>}
                          <Feather name="chevron-right" size={15} color="#CBD5E1" />
                        </TouchableOpacity>
                        {idx === 0 && <View style={{ height: 1, backgroundColor: '#F8FAFC', marginLeft: 66 }} />}
                      </React.Fragment>
                    ))}
                  </View>
                </View>

                {/* Preferences */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Preferences</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="bell" size={17} color="#F59E0B" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Push Notifications</Text>
                      <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#E2E8F0', true: '#8B5CF6' }} thumbColor="#fff" />
                    </View>
                  </View>
                </View>

                {/* Privacy & Safety */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Privacy & Safety</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                      onPress={() => setSettingsSection('blocked')}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="slash" size={17} color="#EF4444" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Blocked Users</Text>
                      {blockedUsers.length > 0 && <Text style={{ fontSize: 13, color: '#94A3B8', marginRight: 6 }}>{blockedUsers.length}</Text>}
                      <Feather name="chevron-right" size={15} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Support & Legal */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Support & Legal</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    {[
                      { icon: 'help-circle', label: 'Help & FAQ',           iconColor: '#6366F1', bg: '#EEF2FF', action: 'faq' },
                      { icon: 'mail',        label: 'Contact Support',      iconColor: '#06B6D4', bg: '#E0F2FE', action: 'support' },
                      { icon: 'alert-octagon', label: 'Report a problem',   iconColor: '#F97316', bg: '#FFEDD5', action: 'report' },
                      { icon: 'users',       label: 'Community Guidelines', iconColor: '#10B981', bg: '#D1FAE5', action: 'guidelines' },
                      { icon: 'shield',      label: 'Privacy Policy',       iconColor: '#3B82F6', bg: '#EFF6FF', action: 'privacy' },
                      { icon: 'file-text',   label: 'Terms of Service',     iconColor: '#F59E0B', bg: '#FFFBEB', action: 'terms' },
                    ].map((item, idx, arr) => (
                      <React.Fragment key={item.label}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                          onPress={() => {
                            if (item.action === 'faq') setSettingsSection('faq')
                            if (item.action === 'support') Linking.openURL('mailto:support@joinparea.app?subject=Support Request')
                            if (item.action === 'report') {
                              Alert.alert(
                                'Report a problem',
                                'What kind of problem do you want to report?',
                                [
                                  { text: 'A bug or glitch', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Bug%20report&body=What%20happened%3A%0A%0ASteps%20to%20reproduce%3A%0A%0ADevice%2FOS%3A%0A') },
                                  { text: 'A problem with an event', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Event%20issue&body=Event%20name%3A%0A%0AWhat%20happened%3A%0A') },
                                  { text: 'An unsafe profile or chat', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Safety%20report&body=User%20name%3A%0A%0AWhat%20happened%3A%0A') },
                                  { text: 'Something else', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Report%20a%20problem&body=Describe%20the%20problem%3A%0A') },
                                  { text: 'Cancel', style: 'cancel' },
                                ]
                              )
                            }
                            if (item.action === 'guidelines') setSettingsSection('guidelines')
                            if (item.action === 'privacy') Linking.openURL('https://joinparea.app/privacy')
                            if (item.action === 'terms') Linking.openURL('https://joinparea.app/terms')
                          }}>
                          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Feather name={item.icon as any} size={17} color={item.iconColor} />
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>{item.label}</Text>
                          <Feather name="chevron-right" size={15} color="#CBD5E1" />
                        </TouchableOpacity>
                        {idx < arr.length - 1 && <View style={{ height: 1, backgroundColor: '#F8FAFC', marginLeft: 66 }} />}
                      </React.Fragment>
                    ))}
                  </View>
                </View>

                {/* Account */}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Account</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                      onPress={() => Alert.alert('Log out?', 'You can sign back in anytime.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Log out', style: 'destructive', onPress: () => { setSettingsOpen(false); setTimeout(() => onLogOut?.(), 300) } },
                      ])}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="log-out" size={17} color="#EF4444" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Log Out</Text>
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: '#F8FAFC', marginLeft: 66 }} />
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                      onPress={() => Alert.alert('Delete Account', 'This will permanently delete your profile and all your data. This cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => {
                          try {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (!session?.access_token) throw new Error('Not logged in')
                            const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json', 'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! },
                            })
                            const json = await resp.json()
                            if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`)
                          } catch (e: any) { Alert.alert('Error', String(e?.message || e)); return }
                          await supabase.auth.signOut(); onLogOut?.()
                        }},
                      ])}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="trash-2" size={17} color="#EF4444" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Delete Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center', marginTop: 16, marginBottom: 8 }}>Parea v1.0.0</Text>

              </ScrollView>

              {/* Sub-screens */}

              {/* Blocked Users */}
              {settingsSection === 'blocked' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F3FF' }}>
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                      <TouchableOpacity onPress={() => setSettingsSection(null)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="chevron-left" size={20} color="#475569" />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 20, color: '#1E1B4B', marginLeft: 14 }}>Blocked Users</Text>
                    </View>
                    {blockedUsers.length === 0 ? (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <Feather name="slash" size={40} color="#CBD5E1" />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#94A3B8' }}>No blocked users</Text>
                        <Text style={{ fontSize: 13, color: '#CBD5E1' }}>Block someone from their profile</Text>
                      </View>
                    ) : (
                      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                        {blockedUsers.map(u => (
                          <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12 }}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                              {u.photo ? <Image source={{ uri: u.photo }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : <Feather name="user" size={20} color="#6366F1" />}
                            </View>
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>{u.name}</Text>
                            <TouchableOpacity onPress={() => unblockUser(u.id)}
                              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#FEF2F2' }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Unblock</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </SafeAreaView>
                </View>
              )}

              {/* FAQ */}
              {settingsSection === 'faq' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F3FF' }}>
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                      <TouchableOpacity onPress={() => setSettingsSection(null)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="chevron-left" size={20} color="#475569" />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 20, color: '#1E1B4B', marginLeft: 14 }}>Help & FAQ</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 40 }}>
                      {[
                        { q: 'How does VibeCheck work?', a: 'VibeCheck uses AI to match you with people who share your interests, lifestyle, and tonight\'s energy. Swipe right to invite someone to your event, left to pass. When both of you match — you\'re connected.' },
                        { q: 'What is Tonight\'s Vibe?', a: 'It\'s your mood for the evening — from Homebody to Party Animal. Setting your vibe helps us sort relevant events to the top of your feed and improves your VibeCheck matches.' },
                        { q: 'How do I join an event?', a: 'Tap any event card, then press "I\'m Going" (official events) or "Request to Join" (community events). For community events, the host approves your request.' },
                        { q: 'How do I create an event?', a: 'Tap the + button at the bottom of the screen. Choose the format (duo, squad, party), type, date/time, and location. You can also add a cover photo.' },
                        { q: 'Can I share an event with a friend?', a: 'Yes — open any event and tap the share button in the top right corner. Your friend will get a link that opens the event directly if they have Parea installed.' },
                        { q: 'How does the crew chat work?', a: 'Once you and your match both confirm attendance at the same event, a crew chat is automatically created. You\'ll find it in the Messages tab.' },
                        { q: 'How do I block someone?', a: 'Open their profile and scroll to the bottom — you\'ll find a "Block" option. Blocked users won\'t appear in your VibeCheck and can\'t see your profile.' },
                        { q: 'Is Parea free?', a: 'Yes, Parea is free to use. We may introduce premium features in the future, but the core experience will always be free.' },
                      ].map((item, idx) => (
                        <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
                          <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#1E1B4B', marginBottom: 8 }}>{item.q}</Text>
                          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#64748B', lineHeight: 20 }}>{item.a}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </SafeAreaView>
                </View>
              )}

              {settingsSection === 'guidelines' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F3FF' }}>
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                      <TouchableOpacity onPress={() => setSettingsSection(null)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="chevron-left" size={20} color="#475569" />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 20, color: '#1E1B4B', marginLeft: 14 }}>Community Guidelines</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 40 }}>
                      <View style={{ backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderRadius: 16, padding: 16 }}>
                        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#475569', lineHeight: 20 }}>
                          Parea is for meeting real people in real life. Keep it kind, safe, and honest — these rules apply to chats, profiles, and offline meetups.
                        </Text>
                      </View>
                      {[
                        { emoji: '🤝', title: 'Be respectful', body: 'Treat everyone the way you\'d want to be treated. No harassment, hate speech, or discrimination based on age, gender, race, religion, or orientation.' },
                        { emoji: '🪞', title: 'Be real', body: 'Use your real photos, real name, real age (18+). Misleading profiles are removed without warning.' },
                        { emoji: '💬', title: 'No spam or sales', body: 'Don\'t use chats or profiles to promote services, sell things, or invite people off-platform for non-event reasons.' },
                        { emoji: '🚫', title: 'No nudity or explicit content', body: 'Photos must be safe-for-work. Sexual content, nudity, or violence is not allowed anywhere on Parea.' },
                        { emoji: '🌃', title: 'Show up safely', body: 'Meet in public places first. Tell a friend where you\'re going. If something feels off — leave and report the user.' },
                        { emoji: '🔒', title: 'Respect privacy', body: 'Don\'t share other users\' photos, contacts, or personal info outside Parea without permission.' },
                        { emoji: '📅', title: 'Honor your plans', body: 'If you can\'t make it to an event you joined — open the chat and let your crew know. Last-minute drops without notice may affect future invites.' },
                        { emoji: '🚨', title: 'Report abuse', body: 'Use the Report and Block buttons on any profile if someone breaks the rules. We review reports quickly.' },
                      ].map((item, idx) => (
                        <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#1E1B4B' }}>{item.title}</Text>
                          </View>
                          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#64748B', lineHeight: 20 }}>{item.body}</Text>
                        </View>
                      ))}
                      <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
                        Violating these rules may result in warnings, account suspension, or permanent ban.
                      </Text>
                    </ScrollView>
                  </SafeAreaView>
                </View>
              )}

            </SafeAreaView>
          </LinearGradient>
        </Modal>

        </ScrollView>
      </View>
    </View>
  )
}

// ─── FEED SCREEN ──────────────────────────────────────────────────────────────


function LocationPicker({ apiKey, initialCity, initialLocation, initialCoords, insets, onClose, onConfirm }: {
  apiKey: string; initialCity?: string | null; initialLocation: string;
  initialCoords: { lat: number; lng: number } | null; insets: any;
  onClose: () => void; onConfirm: (desc: string, lat: number, lng: number) => void
}) {
  const startCenter = initialCoords || (initialCity && CITY_CENTERS[initialCity]) || CITY_CENTERS.Limassol
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>(startCenter)
  const [pinAddress, setPinAddress] = useState<string>(initialLocation || '')
  const [resolving, setResolving] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef<MapView | null>(null)

  const animateMapTo = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400)
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true)
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`
      const res = await fetch(url)
      const json = await res.json()
      if (json.status === 'OK' && json.results?.[0]) setPinAddress(json.results[0].formatted_address)
      else setPinAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      setPinAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally { setResolving(false) }
  }

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    setPinCoords({ lat: latitude, lng: longitude })
    reverseGeocode(latitude, longitude)
    setResults([])
  }

  const search = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}&language=en`
        const res = await fetch(url)
        const json = await res.json()
        if (json.status === 'OK') setResults(json.predictions); else setResults([])
      } catch { setResults([]) }
    }, 350)
  }

  const pickSuggestion = async (place: any) => {
    setQuery(place.description)
    setResults([])
    Keyboard.dismiss()
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${apiKey}&fields=geometry,formatted_address,name`
      const res = await fetch(url)
      const json = await res.json()
      const loc = json.result?.geometry?.location
      const name = json.result?.name
      const addr = json.result?.formatted_address
      // Prepend the place name if it isn't already in the address (e.g. "Klok Café, Anexartisias 12, ...")
      let full = addr || place.description
      if (name && full && !full.toLowerCase().startsWith(name.toLowerCase())) {
        full = `${name}, ${full}`
      } else if (name && !full) {
        full = name
      }
      if (loc) {
        setPinCoords({ lat: loc.lat, lng: loc.lng })
        setPinAddress(full)
        animateMapTo(loc.lat, loc.lng)
      }
    } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
          <Feather name="x" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B' }}>Pick a location</Text>
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ latitude: startCenter.lat, longitude: startCenter.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          onPress={handleMapPress}
        >
          <Marker
            coordinate={{ latitude: pinCoords.lat, longitude: pinCoords.lng }}
            draggable
            onDragEnd={handleMapPress}
          />
        </MapView>

        {/* Search overlay */}
        <View style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              value={query}
              onChangeText={search}
              placeholder="Search a place or address..."
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-Medium', color: '#1E1B4B' }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]) }}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          {results.length > 0 && (
            <View style={{ marginTop: 6, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, maxHeight: 240 }}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {results.slice(0, 6).map((r: any) => (
                  <TouchableOpacity key={r.place_id} onPress={() => pickSuggestion(r)} activeOpacity={0.7}
                    style={{ paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }} numberOfLines={1}>{r.structured_formatting?.main_text || r.description}</Text>
                    {!!r.structured_formatting?.secondary_text && (
                      <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: '#94A3B8', marginTop: 2 }} numberOfLines={1}>{r.structured_formatting.secondary_text}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Bottom address + confirm */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Outfit-Medium', color: '#94A3B8', marginBottom: 4 }}>Selected location</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', marginBottom: 12, minHeight: 20 }} numberOfLines={2}>
          {resolving ? 'Loading address…' : (pinAddress || 'Tap the map or search above')}
        </Text>
        <TouchableOpacity
          disabled={!pinAddress}
          onPress={() => onConfirm(pinAddress, pinCoords.lat, pinCoords.lng)}
          style={{ backgroundColor: pinAddress ? '#6366F1' : '#CBD5E1', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'ClashDisplay-Semibold' }}>Use this location</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

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
  const [calViewYear, setCalViewYear] = useState(new Date().getFullYear())
  const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth())
  const [createCategory, setCreateCategory] = useState<string>('Sport')
  const [createVibe, setCreateVibe] = useState<string | null>(null)
  const [createCustom, setCreateCustom] = useState('')
  const [createImage, setCreateImage] = useState<{ uri: string; base64: string } | null>(null)
  const createScrollRef = useRef<ScrollView>(null)
  // Scroll create form to top on step change
  useEffect(() => { createScrollRef.current?.scrollTo({ y: 0, animated: false }) }, [createStep])
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [cityOpen, setCityOpen] = useState(false)
  const [feedFilter, setFeedFilter] = useState('all')
  const [eventDetail, setEventDetail] = useState<any>(null)
  const [eventParticipants, setEventParticipants] = useState<{ ev: any; members: any[] } | null>(null)
  const [matchedWith, setMatchedWith] = useState<any>(null)
  const [vibeResults, setVibeResults] = useState<Record<number, string>>({})
  const [openChat, setOpenChat] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<Record<number, any[]>>({ ...MOCK_MESSAGES })
  const [chatInput, setChatInput] = useState('')
  const [chatSpacerH, setChatSpacerH] = useState(0)
  const [chatKeyboardVisible, setChatKeyboardVisible] = useState(false)
  const chatBodyMaxH = useRef(0)
  const chatBodyCurH = useRef(0)

  useEffect(() => {
    if (!userData?.dbId) return
    supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData.dbId)
      .then(({ data }) => {
        if (data) setBlockedIds(new Set(data.map((r: any) => r.blocked_id)))
      })
  }, [userData?.dbId])

  const handleBlock = async (profile: any) => {
    if (!userData?.dbId || !profile?.id) return
    await supabase.from('blocked_users').upsert({ blocker_id: userData.dbId, blocked_id: profile.id }, { onConflict: 'blocker_id,blocked_id' })
    setBlockedIds(prev => new Set([...prev, profile.id]))
    // Duo chats — delete entirely from DB and local state
    const duoChats = chatList.filter(c => c.type === 'duo' && c.partnerProfile?.id === profile.id)
    for (const chat of duoChats) {
      await supabase.from('messages').delete().eq('chat_id', chat.id)
      await supabase.from('chat_members').delete().eq('chat_id', chat.id)
      await supabase.from('chats').delete().eq('id', chat.id)
    }
    setChatList(prev => prev.filter(c => !(c.type === 'duo' && c.partnerProfile?.id === profile.id)))
    Alert.alert('Blocked', `${profile.name} has been blocked.`)
  }

  const handleReport = async (profile: any, reason: string, details?: string) => {
    if (!userData?.dbId || !profile?.id) return
    await supabase.from('reports').insert({ reporter_id: userData.dbId, reported_id: profile.id, reason, details: details || null })
    Alert.alert('Report submitted', "Thank you. We'll review it shortly.")
  }

  useEffect(() => {
    if (Platform.OS === 'android') {
      const show = Keyboard.addListener('keyboardDidShow', e => {
        const kbH = e.endCoordinates.height
        // After keyboard is fully shown, give layout one frame to update
        requestAnimationFrame(() => {
          const maxH = chatBodyMaxH.current
          const curH = chatBodyCurH.current
          const containerShrank = maxH > 0 && curH < maxH - 50
          if (!containerShrank) {
            setChatSpacerH(kbH)
          }
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
  const [replyTo, setReplyTo] = useState<{ text: string; senderName: string } | null>(null)
  const [chatList, setChatList] = useState(MOCK_CHATS)
  const [chatPartnerPreview, setChatPartnerPreview] = useState<any>(null)
  const [groupMembersOpen, setGroupMembersOpen] = useState(false)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [reportTarget, setReportTarget] = useState<any>(null)
  const scrollRef = useRef<ScrollView>(null)
  const realtimeChatRef = useRef<any>(null)
  const inboxChannelRef = useRef<any>(null)
  const duoBroadcastRef = useRef<any>(null)
  const communityBroadcastRef = useRef<any>(null)
  const duoBroadcastQueueRef = useRef<any[]>([])
  const communityBroadcastQueueRef = useRef<any[]>([])
  const chatListRef = useRef<any[]>([])
  const openChatRef = useRef<any>(null)
  chatListRef.current = chatList
  openChatRef.current = openChat

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
          description: e.description || (e.location ? `📍 ${e.location}` : ''),
          expiresAt: (() => { try { const t = (e.time || '').replace(', ', 'T') + ':00'; const d = new Date(t); return isNaN(d.getTime()) ? 0 : d.getTime(); } catch { return 0 } })(),
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
  // Group chat: refresh members from DB on open (covers cases where realtime missed updates)
  useEffect(() => {
    if (!openChat || openChat.type !== 'group' || !openChat.id || !userData?.dbId) return
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
  }, [openChat?.id, openChat?.type, userData?.dbId])

  const persistLoaded = useRef(false)
  const [persistLoadedState, setPersistLoadedState] = useState(false)

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

  useEffect(() => {
    const officialJoined = Object.keys(joinedEvents)
      .map(Number)
      .filter(id => joinedEvents[id] && id > 100000) // official events have offset id
    // Clear stale entries for events no longer joined
    setEventAttendeesMap(prev => {
      const cleaned: Record<number, any[]> = {}
      officialJoined.forEach(id => { if (prev[id]) cleaned[id] = prev[id] })
      return cleaned
    })
    if (officialJoined.length === 0 || !userData?.dbId) return
    const fetchAttendees = async () => {
      const map: Record<number, any[]> = {}
      await Promise.all(officialJoined.map(async (evId) => {
        const evFormat = userEventFormat[evId] || 'squad'
        const [userMin, userMax] = FORMAT_SIZES[evFormat] || [2, 5]
        // Include confirmed users so others can see them and join existing crew chats
        const statusFilter = ['looking', 'ready', 'confirmed']
        // Fetch own row to know my crew_pref for this event
        const { data: mine } = await supabase.from('event_attendees').select('crew_pref').eq('event_ref_id', evId).eq('profile_id', userData.dbId).maybeSingle()
        const myPref = mine?.crew_pref || 'any'
        const myGender = (userData as any)?.gender
        const { data: rawData } = await supabase
          .from('event_attendees')
          .select('*, profiles(*)')
          .eq('event_ref_id', evId)
          .neq('profile_id', userData.dbId)
          .in('status', statusFilter)
          .lte('group_size_min', userMax)
          .gte('group_size_max', userMin)
          .limit(20)
        // Bidirectional crew_pref + gender filter
        const data = (rawData || []).filter((row: any) => fitsCrewPref(myPref, myGender, row.crew_pref || 'any', row.profiles?.gender))
        if (data && data.length > 0) {
          const candidates = data.map((row: any) => {
            const p = row.profiles || {}
            return {
              id: p.id, name: p.name || 'User', age: p.age || '',
              color: p.color || '#818CF8', colors: [p.color || '#818CF8', p.color ? p.color + 'AA' : '#6366F1'],
              emoji: '🎵', photo: p.photos?.[0] || null, photos: p.photos || [],
              bio: p.bio || '', langs: p.langs || [],
              interests: p.interests || [], drinksPref: p.drinksPref || '', smokingPref: p.smokingPref || '',
              transport: row.transport, groupMin: row.group_size_min, groupMax: row.group_size_max,
              _real: true, score: null as number | null, vibe: '',
            }
          })
          const scores = await aiScoreRealAttendees(
            {
              name: userData.name, age: userData.age,
              langs: userData.langs || [], interests: userData.interests || [],
              drinksPref: userData.drinksPref || '', smokingPref: userData.smokingPref || '',
              bio: userData.bio || '', transport: userEventTransport[evId] || '',
            },
            candidates
          )
          map[evId] = candidates.map(c => {
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
    return () => { clearInterval(interval); supabase.removeChannel(rtChannel) }
  }, [Object.keys(joinedEvents).join(','), userData?.dbId, JSON.stringify(userEventFormat)])

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
        const { data: rawReady } = await supabase
          .from('event_attendees').select('*, profiles(*)')
          .eq('event_ref_id', evId).in('status', ['ready', 'confirmed'])
          .neq('profile_id', userData.dbId)
          .lte('group_size_min', userMax).gte('group_size_max', userMin)
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
            return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, photos: p.photos || [], color: p.color || '#818CF8', colors: [p.color || '#818CF8', '#1E1B4B'], age: p.age || '', bio: p.bio || '', langs: p.langs || [], interests: p.interests || [], goal: p.goal || 'chill', flag: FLAG_MAP[p.langs?.[0]] || '🌍', status: r.status, transport: r.transport }
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
        if (saved.chatList) setChatList(saved.chatList)
        if (saved.chatMessages) {
          // Filter out system messages — they're session-only, shouldn't survive restart
          const cleaned: Record<string, any[]> = {}
          Object.entries(saved.chatMessages).forEach(([id, msgs]: [string, any]) => {
            const filtered = (msgs || []).filter((m: any) => m.from !== 'system')
            if (filtered.length > 0) cleaned[id] = filtered
          })
          setChatMessages(cleaned)
        }
        if (saved.cancelledEventIds) {
          setCancelledEventIds(saved.cancelledEventIds)
          cancelledEventIdsRef.current = new Set(saved.cancelledEventIds)
        }
        if (saved.sentCrewInvites) {
          setSentCrewInvites(saved.sentCrewInvites)
          // Pre-populate ref so poll doesn't re-add already-processed invites after restart
          Object.entries(saved.sentCrewInvites).forEach(([key, val]) => {
            if (val === 'accepted') acceptedInviteKeysRef.current.add(key)
          })
        }
        if (saved.officialEventChatMap) {
          setOfficialEventChatMap(saved.officialEventChatMap)
          officialEventChatMapRef.current = saved.officialEventChatMap
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
    }))
  }, [joinedEvents, userEventFormat, userEventTransport, userCreatedEvents, pendingJoinRequests, approvedJoiners, passedRequests, chatList, chatMessages, sentCrewInvites, cancelledEventIds, officialEventChatMap])

  // ── Cleanup stale event_attendees rows once after persist loaded ─────────
  useEffect(() => {
    if (!userData?.dbId || !persistLoadedState) return
    // Use joinedEvents state directly (not ref) to avoid race with ref update order
    const joinedOfficialIds = new Set(
      Object.keys(joinedEvents).map(Number).filter(id => joinedEvents[id] && id > 100000)
    )
    supabase.from('event_attendees').select('event_ref_id').eq('profile_id', userData.dbId)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const staleIds = data.map((r: any) => r.event_ref_id).filter((id: number) => !joinedOfficialIds.has(id))
        if (staleIds.length > 0) {
          supabase.from('event_attendees').delete().eq('profile_id', userData.dbId).in('event_ref_id', staleIds)
            .then(({ error }) => { if (error) console.warn('stale event_attendees cleanup error:', error.message) })
        }
      })
  }, [userData?.dbId, persistLoadedState])

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
  type Notif = { id: string; type: string; title: string; body: string; emoji: string; color: string; time: number; read: boolean; chatId?: number; eventId?: number }

  // Which types are read only via the bell panel (general info)
  const BELL_TYPES = ['welcome', 'host_full', 'event_cancelled', 'reminder_24h', 'reminder_2h']
  // Which types are read when a specific chat is opened
  const CHAT_TYPES = ['match', 'confirmed', 'group_chat', 'new_message', 'member_joined', 'crew_ready']
  // Which types are read when Plans / VibeCheck tab is opened
  const PLANS_TYPES = ['join_request', 'member_left', 'reminder_24h', 'reminder_2h']
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const bellShake = useRef(new Animated.Value(0)).current
  const notifPanelY = useRef(new Animated.Value(-600)).current
  const prevPendingRef = useRef<Record<number, any[]>>({})
  const prevChatCountRef = useRef(0)

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotif = (n: Omit<Notif, 'id' | 'time' | 'read'>) => {
    const newN: Notif = { ...n, id: `${Date.now()}-${Math.random()}`, time: Date.now(), read: false }
    setNotifications(prev => [newN, ...prev].slice(0, 30))
    // Bell shake animation
    bellShake.setValue(0)
    Animated.sequence([
      Animated.timing(bellShake, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start()
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }

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
      const { data } = await supabase
        .from('crew_invites')
        .select('*, inviter:profiles!crew_invites_inviter_id_fkey(*)')
        .eq('invitee_id', userData.dbId)
        .eq('status', 'pending')
      if (data) setIncomingCrewInvites(data)
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
        // For party/squad: chat created via chat_members (no crew_invite) — verify user is still in chat
        let chatId = officialEventChatMapRef.current[evId]
        if (!chatId) {
          // officialEventChatMap may not be set yet — look up by event_id
          const { data: chatRow } = await supabase.from('chats').select('id').eq('event_id', evId).limit(1).maybeSingle()
          if (chatRow?.id) chatId = chatRow.id
        }
        if (chatId) {
          const { data: membership } = await supabase.from('chat_members').select('chat_id').eq('chat_id', chatId).eq('profile_id', userData.dbId).maybeSingle()
          if (membership) {
            // Update local map so next check is faster
            if (!officialEventChatMapRef.current[evId]) setOfficialEventChatMap(prev => ({ ...prev, [evId]: chatId }))
            continue // still in chat — not a "partner left" scenario
          }
        }
        console.log('Partner left event', evId, '— resetting to looking')
        // Remove duo chat for this event
        const chatIdToRemove = officialEventChatMapRef.current[evId]
        if (chatIdToRemove) setChatList(prev => prev.filter((c: any) => c.id !== chatIdToRemove))
        setOfficialEventChatMap(prev => { const n = { ...prev }; delete n[evId]; return n })
        // Reset event status back to 'going'
        setJoinedEvents(prev => ({ ...prev, [evId]: 'joined' }))
        // Reset event_attendees status back to 'looking' in DB
        supabase.from('event_attendees').update({ status: 'looking' })
          .eq('event_ref_id', evId).eq('profile_id', userData.dbId)
        showToast('We\'ll find you a new match', 'Partner left 👋', '🔍')
      }
    }
    checkPartnerLeft()
    const interval = setInterval(checkPartnerLeft, 15000)

    // Broadcast: listen for instant "partner_left" from crew partner
    const broadcastChannel = supabase.channel(`crew-partner-${userData.dbId}`)
      .on('broadcast', { event: 'partner_left' }, ({ payload }: any) => {
        const evId = payload?.eventId
        if (!evId) return
        // Same logic as checkPartnerLeft but instant
        const chatIdToRemove = officialEventChatMapRef.current[evId]
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
          supabase.from('crew_invites').select('event_title').eq('chat_id', chatId).limit(1).single(),
        ])
        if (!members || members.length < 2) return
        const otherMembers = members.filter((m: any) => m.profile_id !== userData.dbId).map((m: any) => {
          const p = (m as any).profiles || {}
          return { id: p.id, name: p.name || 'User', photo: p.photos?.[0] || null, color: p.color || '#818CF8', age: p.age }
        })
        // Community events have raw IDs (<100000); official events shift +100000
        const isCommunityChat = !!chatData?.event_id && chatData.event_id < 100000
        const isDuo = chatData?.type === 'duo' || (!isCommunityChat && members.length === 2)
        const partner = otherMembers[0]
        const eventTitle = inviteData?.event_title || dbCommunityEventsRef.current?.find((e: any) => e.id === chatData?.event_id)?.title || feedOfficialDbEventsRef.current?.find((e: any) => e.id === chatData?.event_id)?.title || 'Crew Chat'
        const foundEv = dbCommunityEventsRef.current?.find((e: any) => e.id === chatData?.event_id) || feedOfficialDbEventsRef.current?.find((e: any) => e.id === chatData?.event_id)
        const evChatExpiry = (foundEv?.expiresAt > 0 ? foundEv.expiresAt : Date.now()) + 24 * 60 * 60 * 1000
        const newChat: any = isDuo ? {
          id: chatId, type: 'duo', eventRefId: chatData?.event_id,
          name: partner?.name || 'Your crew',
          age: partner?.age || '',
          color: partner?.color || '#818CF8',
          photo: partner?.photo || '',
          lastMsg: '🎉 Crew confirmed! Say hi',
          time: new Date().toISOString(), isNew: true, chatExpiresAt: evChatExpiry,
          event: eventTitle, eventEmoji: '🎉',
          partnerProfile: partner,
        } : {
          id: chatId, type: 'group', eventRefId: chatData?.event_id,
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
        if (chatData?.event_id && cancelledEventIdsRef.current.has(chatData.event_id)) return
        setChatList(prev => prev.some(c => c.id === chatId) ? prev : [newChat, ...prev])
        if (isCommunityChat && chatData?.event_id) communityEventChatMap.current[chatData.event_id] = chatId
        if (chatData?.event_id) {
          setOfficialEventChatMap(prev => ({ ...prev, [chatData.event_id]: chatId }))
          setJoinedEvents(prev => ({ ...prev, [chatData.event_id]: 'confirmed' }))
          setCrewPreviewMap(prev => ({ ...prev, [chatData.event_id]: null }))
          setReadyCountMap(prev => { const n = { ...prev }; delete n[chatData.event_id]; return n })
          // Mark self as confirmed so we don't appear in others' VibeCheck
          supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', chatData.event_id).eq('profile_id', userData.dbId).then(() => {})
        }
        showToast('Check your Messages tab for the chat', 'You\'re in! 🎉', '✅')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
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
          const newMember = { id: profile.id, name: profile.name || 'User', photo: (profile as any).photos?.[0] || null, color: (profile as any).color || '#818CF8' }
          setChatList(prev => prev.map(c => {
            if (c.id !== chatId) return c
            const already = (c.memberProfiles || []).some((m: any) => m.id === profile.id)
            if (already) return c
            return {
              ...c,
              members: (c.members || 1) + 1,
              memberProfiles: [...(c.memberProfiles || []), newMember],
              avatars: [...(c.avatars || []), newMember.photo].filter(Boolean),
              colors: [...(c.colors || []), newMember.color],
            }
          }))
          setOpenChat((cur: any) => {
            if (!cur || cur.id !== chatId) return cur
            const already = (cur.memberProfiles || []).some((m: any) => m.id === profile.id)
            if (already) return cur
            return {
              ...cur,
              members: (cur.members || 1) + 1,
              memberProfiles: [...(cur.memberProfiles || []), newMember],
              avatars: [...(cur.avatars || []), newMember.photo].filter(Boolean),
              colors: [...(cur.colors || []), newMember.color],
            }
          })
          setChatMessages(prev => {
            const msgs = prev[chatId] || []
            const sysMsg = { from: 'system', text: `${profile.name || 'Someone'} joined`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            return { ...prev, [chatId]: [...msgs, sysMsg] }
          })
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
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
            const newMsg = { from: 'them', text: payload.text, time, date: t.toISOString().slice(0, 10), senderName: sender?.name || payload.sender_name || '', senderPhoto: sender?.photo || payload.sender_photo || null, senderColor: sender?.color || payload.sender_color || '#818CF8' }
            setChatMessages((prev: any) => ({ ...prev, [chatId]: [...(prev[chatId] || []), newMsg] }))
            setChatList((prev: any) => prev.map((c: any) => c.id === chatId ? { ...c, lastMsg: payload.text, time } : c))
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
        const newChat: any = {
          id: chat.id, type: correctType, eventRefId: chat.event_id,
          event: dbCommunityEventsRef.current.find((e: any) => e.id === chat.event_id)?.title || feedOfficialDbEventsRef.current.find((e: any) => e.id === chat.event_id)?.title || 'Crew Chat',
          eventEmoji: '🎉', members: members.length,
          avatars: otherMembers.map((p: any) => p.photo).filter(Boolean),
          colors: otherMembers.map((p: any) => p.color), memberProfiles: otherMembers,
          lastMsg: chat.last_msg || '🎉 You\'re in the crew!',
          time: new Date().toISOString(), isNew: existing?.isNew ?? true, chatExpiresAt: existing?.chatExpiresAt || (Date.now() + 24 * 60 * 60 * 1000),
        }
        if (isCommunityChat) newChat.communityEventId = chat.event_id
        setChatList(prev => {
          const idx = prev.findIndex((c: any) => c.id === chat.id)
          if (idx === -1) return [newChat, ...prev]
          const updated = [...prev]
          updated[idx] = { ...prev[idx], ...newChat }
          return updated
        })
        if (isCommunityChat) communityEventChatMap.current[chat.event_id] = chat.id
        setJoinedEvents(prev => ({ ...prev, [chat.event_id]: 'confirmed' }))
        setOfficialEventChatMap(prev => ({ ...prev, [chat.event_id]: chat.id }))
        setCrewPreviewMap(prev => ({ ...prev, [chat.event_id]: null }))
        setReadyCountMap(prev => { const n = { ...prev }; delete n[chat.event_id]; return n })
        // Mark self as confirmed so we don't appear in others' VibeCheck
        supabase.from('event_attendees').update({ status: 'confirmed' }).eq('event_ref_id', chat.event_id).eq('profile_id', userData.dbId).then(() => {})
        showToast('Check your Messages tab', 'You\'re in the crew! 🎉', '✅')
      }
    }
    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [userData?.dbId])

  // ── Poll for accepted invites (inviter side) — sync chat to local state ───
  useEffect(() => {
    if (!userData?.dbId) return
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
      // Check which events the user is still attending (not cancelled)
      const { data: attendeeRows } = await supabase
        .from('event_attendees').select('event_ref_id').eq('profile_id', userData.dbId)
      const stillAttending = new Set((attendeeRows || []).map((r: any) => r.event_ref_id))
      for (const inv of acceptedData) {
        const key = `${inv.event_ref_id}_${inv.invitee_id}`
        if (acceptedInviteKeysRef.current.has(key) || !inv.chat_id) continue
        // Skip if user explicitly cancelled this event
        if (cancelledEventIdsRef.current.has(inv.event_ref_id)) continue
        // Skip if user already left this event (not in event_attendees)
        if (!stillAttending.has(inv.event_ref_id)) continue
        acceptedInviteKeysRef.current.add(key)
        setSentCrewInvites(prev => ({ ...prev, [key]: 'accepted' }))
        setOfficialEventChatMap(prev => ({ ...prev, [inv.event_ref_id]: inv.chat_id }))
        setChatList(prev => {
          if (prev.some(c => c.id === inv.chat_id)) return prev
          const partner = inv.invitee
          return [{
            id: inv.chat_id, type: 'duo',
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
        addNotif({ type: 'crew_accepted', emoji: '🎉', color: '#43E97B', title: `${inv.invitee?.name} accepted your invite!`, body: `For "${inv.event_title}" — say hi 💬` })
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
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

  const dismissNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
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

  // Watch for host's group becoming full → auto-navigate to chat
  const prevFullHostEventsRef = useRef<Set<number>>(new Set())
  useEffect(() => {
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
  }, [approvedJoiners, userCreatedEvents])

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
        if (ev.expiresAt > 0 && ev.expiresAt < Date.now()) return
        setChatList(prev => {
          const existingIdx = prev.findIndex(c => c.hostEventId === evId)
          if (existingIdx >= 0) {
            const updated = [...prev]
            const existingProfiles: any[] = updated[existingIdx].memberProfiles || []
            const newProfiles = [...existingProfiles]
            let added = false
            confirmedJoiners.forEach(joiner => {
              if (!newProfiles.find((p: any) => p.id === joiner.id)) {
                newProfiles.push(joiner); added = true
                addNotif({ type: 'member_joined', emoji: '✅', color: '#10B981', title: `${joiner.name} joined the group`, body: ev.title || '', chatId: updated[existingIdx].id })
              }
            })
            if (!added) return prev
            updated[existingIdx] = {
              ...updated[existingIdx],
              members: newProfiles.length + 1,
              memberProfiles: newProfiles,
              avatars: newProfiles.map((p: any) => p.photo).filter(Boolean),
              colors: newProfiles.map((p: any) => p.color),
              lastMsg: `✅ ${confirmedJoiners[confirmedJoiners.length - 1]?.name} joined`,
              time: new Date().toISOString(), isNew: true,
            }
            return updated
          } else {
            addNotif({ type: 'member_joined', emoji: '✅', color: '#10B981', title: `${confirmedJoiners[0]?.name} joined the group`, body: ev.title || '', chatId: 0 })
            return [{
              id: Date.now(), type: 'group', hostEventId: evId,
              event: ev.title || 'Your Social', eventEmoji: CATEGORY_EMOJI[ev.category || ''] || '🎉',
              members: confirmedJoiners.length + 1,
              memberProfiles: confirmedJoiners,
              avatars: confirmedJoiners.map((p: any) => p.photo).filter(Boolean),
              colors: confirmedJoiners.map((p: any) => p.color),
              lastMsg: `✅ ${confirmedJoiners[0]?.name} joined the group`,
              time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
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
            if (!isMockOrOfficial && !validEventIds.has(numId)) {
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
            if (cancelledEventIdsRef.current.has(req.event_id)) return
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
      // Remove chats that have explicit chatExpiresAt in the past
      // Also remove community event chats (legacy, no chatExpiresAt) linked to events that ended 24h+ ago
      setChatList(cl => cl.filter(c => {
        if (c.chatExpiresAt) return c.chatExpiresAt > now
        if (c.communityEventId) {
          const ev = dbCommunityEventsRef.current.find((e: any) => e.id === c.communityEventId)
          if (ev?.expiresAt > 0 && ev.expiresAt + EXPIRE_AFTER < now) return false
        }
        return true
      }))
    }
    check()
    const interval = setInterval(check, 60 * 60 * 1000) // check every hour
    return () => clearInterval(interval)
  }, [persistLoadedState])

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

  // Watch for new chats (approvals / matches)
  useEffect(() => {
    if (chatList.length > prevChatCountRef.current && prevChatCountRef.current > 0) {
      const newest = chatList[0]
      if (newest.type === 'duo') {
        addNotif({ type: 'match', emoji: '✨', color: '#EC4899', title: `You matched with ${newest.name}!`, body: newest.event || 'Check your chats' })
      } else {
        addNotif({ type: 'group_chat', emoji: '🎉', color: '#10B981', title: 'Group chat is live!', body: newest.event || 'Your crew is ready' })
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

  const handleJoinEvent = (ev: any, transport?: string) => {
    const isFull = ev.participantsCount >= ev.maxParticipants
    if (isFull) return
    const currentState = joinedEvents[ev.id]
    // Pure state update — no side effects inside
    setJoinedEvents(prev => {
      if (!prev[ev.id]) return { ...prev, [ev.id]: 'pending' }
      if (prev[ev.id] === 'pending') {
        if (ev.type === 'community' && !ev.isHosted) return prev // wait for host
        return { ...prev, [ev.id]: 'joined' }
      }
      const next = { ...prev }
      delete next[ev.id]
      return next
    })
    // Side effects OUTSIDE the state updater
    if (!currentState && ev.type === 'community' && !ev.isHosted) {
      // Insert real join request into DB
      if (userData?.dbId && ev.hostId) {
        supabase.from('join_requests').insert({
          event_id: ev.id,
          requester_id: userData.dbId,
          host_id: ev.hostId,
          status: 'pending',
          transport: transport || null,
        }).then(({ error }) => {
          if (error) console.warn('join_request insert error:', error.message)
        })
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
    const _now = new Date()
    const newMsg = { from: 'me', text, time: _now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: _now.toISOString().slice(0, 10), replyTo: replyTo || undefined }
    setChatMessages(prev => ({ ...prev, [openChat.id]: [...(prev[openChat.id] || []), newMsg] }))
    setChatList(prev => prev.map(c => c.id === openChat.id ? { ...c, lastMsg: `You: ${text}`, time: new Date().toISOString() } : c))
    setChatInput('')
    setReplyTo(null)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)

    // Для community-чатов — пишем в Supabase + broadcast
    const chatEvId = openChat.communityEventId || openChat.hostEventId
    if (chatEvId && userData?.dbId) {
      const payload = { text, sender_id: userData.dbId, created_at: new Date().toISOString(), reply_to_text: replyTo?.text || null, reply_to_sender: replyTo?.senderName || null }
      supabase.from('messages').insert({ community_event_id: chatEvId, sender_id: userData.dbId, text, reply_to_text: replyTo?.text || null, reply_to_sender: replyTo?.senderName || null })
        .then(({ error }) => { if (error) console.warn('message insert error:', error.message) })
      const bcast = { type: 'broadcast', event: 'message', payload }
      if (communityBroadcastRef.current) communityBroadcastRef.current.send(bcast)
      else communityBroadcastQueueRef.current.push(bcast)
      return
    }

    // Для дуо чатов (crew invite) — пишем в Supabase через chat_id + broadcast
    const isChatDuoSend = openChat.type === 'duo' || (openChat.type === 'group' && !openChat.communityEventId && !openChat.hostEventId)
    if (isChatDuoSend && openChat.id && userData?.dbId) {
      const payload = { text, sender_id: userData.dbId, created_at: new Date().toISOString(), reply_to_text: replyTo?.text || null, reply_to_sender: replyTo?.senderName || null, sender_name: userData.name || '', sender_photo: (userData as any).photos?.[0] || null, sender_color: (userData as any).color || '#818CF8' }
      // Skip DB insert if chat has a fake local ID (Date.now() > 1e12) — not a real DB chat
      if (openChat.id < 1e12) {
        supabase.from('messages').insert({ chat_id: openChat.id, sender_id: userData.dbId, text, reply_to_text: replyTo?.text || null, reply_to_sender: replyTo?.senderName || null })
          .then(({ error }) => {
            if (error) {
              console.warn('duo message insert error:', error.message)
              if (error.code === '42501' || error.message?.includes('policy')) {
                setChatMessages(prev => ({ ...prev, [openChat.id]: (prev[openChat.id] || []).slice(0, -1) }))
                Alert.alert('Cannot send', 'You cannot message this person.')
              }
            }
          })
      }
      const bcast = { type: 'broadcast', event: 'message', payload }
      if (duoBroadcastRef.current) { console.log('broadcasting on duo_chat_' + openChat.id); duoBroadcastRef.current.send(bcast) }
      else { console.log('queuing broadcast'); duoBroadcastQueueRef.current.push(bcast) }
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
            }
          })
          setChatMessages(prev => ({ ...prev, [chatId]: msgs }))
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
            const newMsg = { from: 'them', text: payload.text, time, date: t.toISOString().slice(0, 10), senderName: sender?.name || payload.sender_name || '', senderPhoto: sender?.photo || payload.sender_photo || null, senderColor: sender?.color || payload.sender_color || '#818CF8' }
            setChatMessages((prev: any) => ({ ...prev, [chatId]: [...(prev[chatId] || []), newMsg] }))
            setChatList((prev: any) => prev.map((c: any) => c.id === chatId ? { ...c, lastMsg: payload.text, time } : c))
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
      // Flush queued messages
      duoBroadcastQueueRef.current.forEach(p => persistentChannel.send(p))
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
          const newMsg = { from: 'them', text: payload.text, time, date: new Date(payload.created_at).toISOString().slice(0, 10), senderName: payload.sender_name || '', senderPhoto: payload.sender_photo || null, senderColor: payload.sender_color || '#818CF8', replyTo: payload.reply_to_text ? { text: payload.reply_to_text, senderName: payload.reply_to_sender || '' } : undefined }
          setChatMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), newMsg] }))
          setChatList(prev => prev.map(c => c.id === chatId ? { ...c, lastMsg: payload.text, time, isNew: true } : c))
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
        })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          duoBroadcastRef.current = channel
          duoBroadcastQueueRef.current.forEach(p => channel.send(p))
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
          }
        })
        setChatMessages(prev => ({ ...prev, [chatId]: msgs }))
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
        const isSystemMsg = m.text?.includes('left the group')
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
        }
        setChatMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), newMsg] }))
        const lastMsgText = isSystemMsg ? m.text : `${sender?.name || 'Someone'}: ${m.text}`
        setChatList(prev => prev.map(c => c.id === chatId ? { ...c, lastMsg: lastMsgText, time: new Date().toISOString(), isNew: !isSystemMsg } : c))
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
          communityBroadcastQueueRef.current.forEach(p => channel.send(p))
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
        if (m.sender_id === userData.dbId) return // своё сообщение
        if (m.text?.includes('left the group')) return // системные скипаем
        // Найти чат по community_event_id или по chat_id (для дуо чатов)
        const chat = chatListRef.current.find(c =>
          c.communityEventId === m.community_event_id || c.hostEventId === m.community_event_id
          || (m.chat_id && c.id === m.chat_id && c.type === 'duo')
        )
        if (!chat) return
        // Если чат сейчас открыт — его обновляет chat-specific подписка
        if (openChatRef.current?.id === chat.id) return
        // Найти имя отправителя из memberProfiles чата
        const sender = (chat.memberProfiles || []).find((p: any) => p.id === m.sender_id)
        const senderName = sender?.name || chat.name || 'Someone'
        const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setChatList(prev => prev.map(c =>
          c.id === chat.id
            ? { ...c, lastMsg: chat.type === 'duo' ? m.text : `${senderName}: ${m.text}`, time, isNew: true }
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
          if (existing.some((msg: any) => msg._dbId === m.id)) return prev // dedupe
          return { ...prev, [chat.id]: [...existing, inboxMsg] }
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
            <HomeTab city={city} setCityOpen={setCityOpen} feedFilter={feedFilter} setFeedFilter={setFeedFilter} onEventPress={setEventDetail} joinedEvents={joinedEvents} onJoin={handleJoinEvent} userInterests={userData?.interests || []} setUserEventFormat={setUserEventFormat} setUserEventTransport={setUserEventTransport} onJoinConfirmed={handleJoinConfirmed} pendingJoinEv={pendingJoinEv} onPendingJoinConsumed={() => setPendingJoinEv(null)} extraEvents={[...userCreatedEvents.map(uc => { const dbVer = dbCommunityEvents.find(d => d.id === uc.id); return dbVer ? { ...uc, participantsCount: dbVer.participantsCount } : uc }), ...dbCommunityEvents.filter(e => !userCreatedEvents.some(u => u.id === e.id))]} approvedJoiners={approvedJoiners} tonightVibe={tonightVibe} setTonightVibe={(v: any) => { setTonightVibe(v); onUpdateUserData?.({ socialEnergy: v.energy, drinksPref: v.drinks, smokingPref: v.smoking }) }} onBellPress={openNotifPanel} unreadCount={unreadCount} bellShake={bellShake} userData={userData} onCancelHostedEvent={(ev: any) => { setUserCreatedEvents(prev => prev.filter(e => e.id !== ev.id)); setPendingJoinRequests(prev => { const n = { ...prev }; delete n[ev.id]; return n }); setApprovedJoiners(prev => { const n = { ...prev }; delete n[ev.id]; return n }); setChatList(prev => prev.filter(c => c.hostEventId !== ev.id)); showToast("Event deleted 🗑️") }} />
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
            officialEventChatMap={officialEventChatMap}
            onGoHome={() => setActiveTab('home')}
            onConfirm={async (ev: any, partners: any[], format: string) => {
                        const FORMAT_THRESHOLD: Record<string, number> = { '1+1': 2, squad: 3, party: 6 }
              const realPartners = partners.filter((p: any) => p._real)
              if (ev.type === 'official' && realPartners.length > 0) {
                // ── 1+1: mutual invite flow ──────────────────────────────────
                if (format === '1+1') {
                  for (const partner of realPartners) {
                    const key = `${ev.id}_${partner.id}`
                    if (sentCrewInvites[key]) continue
                    const { error: inviteErr } = await supabase.from('crew_invites').upsert({
                      event_ref_id: ev.id, event_title: ev.title,
                      inviter_id: userData?.dbId, invitee_id: partner.id, status: 'pending',
                    }, { onConflict: 'event_ref_id,inviter_id,invitee_id' })
                    if (inviteErr) { console.warn('crew_invite upsert error:', inviteErr.message, inviteErr.code); continue }
                    setSentCrewInvites(prev => ({ ...prev, [key]: 'pending' }))
                    const { data: mutualInvite } = await supabase
                      .from('crew_invites').select('*')
                      .eq('event_ref_id', ev.id).eq('inviter_id', partner.id)
                      .eq('invitee_id', userData?.dbId).eq('status', 'pending').maybeSingle()
                    if (mutualInvite) {
                      const { data: chatData } = await supabase.from('chats')
                        .insert({ type: 'duo', last_msg: `🎉 ${ev.title}` }).select().single()
                      if (!chatData) continue
                      await supabase.from('chat_members').insert([
                        { chat_id: chatData.id, profile_id: userData?.dbId },
                        { chat_id: chatData.id, profile_id: partner.id },
                      ])
                      await supabase.from('crew_invites').update({ status: 'accepted', chat_id: chatData.id }).in('id', [mutualInvite.id])
                      setChatList(prev => prev.some(c => c.id === chatData.id) ? prev : [{
                        id: chatData.id, type: 'duo', name: partner.name || 'Your crew',
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
                    await supabase.from('chat_members').upsert({ chat_id: existingChatId, profile_id: userData?.dbId }, { onConflict: 'chat_id,profile_id' })
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
                // Find or create real chat row in DB so it persists across devices
                const { data: existingChat } = await supabase
                  .from('chats').select('id')
                  .eq('event_id', ev.id).eq('type', chatType).maybeSingle()
                if (existingChat) {
                  dbChatId = existingChat.id
                } else {
                  const { data: newDbChat } = await supabase
                    .from('chats')
                    .insert({ event_id: ev.id, type: chatType, last_msg: isGroup ? '🎉 Group chat created!' : '👋 You matched!' })
                    .select('id').single()
                  if (newDbChat) dbChatId = newDbChat.id
                }
                // Add joiner + host to chat_members so both phones can restore the chat
                if (dbChatId) {
                  const inserts: any[] = [{ chat_id: dbChatId, profile_id: userData.dbId }]
                  if (ev.hostId) inserts.push({ chat_id: dbChatId, profile_id: ev.hostId })
                  await supabase.from('chat_members').upsert(inserts, { onConflict: 'chat_id,profile_id' })
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
              setChatList(prev => [newChat, ...prev])
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
                // Join existing chat
                await supabase.from('chat_members').insert({ chat_id: preview.chatId, profile_id: userData?.dbId })
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
                await supabase.from('chat_members').upsert({ chat_id: chatId, profile_id: userData?.dbId }, { onConflict: 'chat_id,profile_id' })
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
              const { data: chatData } = await supabase
                .from('chats')
                .insert({ type: 'duo', last_msg: '🎉 Crew confirmed!' })
                .select()
                .single()
              if (!chatData) { acceptingInviteRef.current.delete(invite.id); showToast('Please try again', 'Something went wrong', '⚠️'); return }
              await supabase.from('chat_members').insert([
                { chat_id: chatData.id, profile_id: userData?.dbId },
                { chat_id: chatData.id, profile_id: invite.inviter_id },
              ])
              await supabase.from('crew_invites')
                .update({ status: 'accepted', chat_id: chatData.id })
                .eq('id', invite.id)
              const inviter = invite.inviter || {}
              const newChat = {
                id: chatData.id, type: 'duo',
                name: inviter.name || 'Your crew',
                age: inviter.age || '',
                color: inviter.color || '#818CF8',
                photo: inviter.photos?.[0] || '',
                lastMsg: '🎉 Crew confirmed! Say hi',
                time: new Date().toISOString(), isNew: true, chatExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                event: invite.event_title, eventEmoji: '🎉',
                partnerProfile: inviter,
              }
              setChatList(prev => [newChat, ...prev])
              setJoinedEvents(prev => ({ ...prev, [invite.event_ref_id]: 'confirmed' }))
              setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== invite.id))
              setOfficialEventChatMap(prev => ({ ...prev, [invite.event_ref_id]: chatData.id }))
              showToast('Check your Messages tab for the group chat', 'Crew confirmed! 🎉', '✅')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setMessagesInitialSubTab('messages')
              setActiveTab('messages')
            }}
            onDeclineInvite={async (invite: any) => {
              await supabase.from('crew_invites').update({ status: 'declined' }).eq('id', invite.id)
              setIncomingCrewInvites(prev => prev.filter((i: any) => i.id !== invite.id))
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
              if (joiner._real && joiner.requestId) {
                supabase.from('join_requests').delete().eq('id', joiner.requestId)
                  .then(({ error }) => { if (error) console.warn('reject error:', error.message) })
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
            chatList={chatList}
            passedRequests={passedRequests}
            onOpenChat={(chat) => {
              setOpenChat(chat)
              setChatList(prev => prev.map(c => c.id === chat.id ? { ...c, isNew: false } : c))
              markNotifsReadForChat(chat.id)
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
                  supabase.channel(`host-events-${hostEvId}`).send({
                    type: 'broadcast', event: 'member_left',
                    payload: { eventId: evId, requesterId: userData.dbId },
                  })
                }
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
                  supabase.from('chat_members').delete().eq('chat_id', officialChatId).eq('profile_id', userData.dbId)
                    .then(async () => {
                      // Check if anyone else with active event_attendees is still in the chat
                      const { data: remaining } = await supabase.from('chat_members')
                        .select('profile_id').eq('chat_id', officialChatId)
                      const remainingIds = (remaining || []).map((r: any) => r.profile_id)
                      if (remainingIds.length === 0) {
                        // Chat is empty — delete it so RPC creates a fresh one next time
                        supabase.from('chats').delete().eq('id', officialChatId)
                      } else {
                        // Check if remaining members still have active event_attendees
                        const { data: activeLeft } = await supabase.from('event_attendees')
                          .select('profile_id').eq('event_ref_id', ev.id).in('status', ['ready', 'confirmed']).in('profile_id', remainingIds)
                        if (!activeLeft || activeLeft.length === 0) {
                          // All remaining members left the event too — delete the chat
                          supabase.from('chat_members').delete().eq('chat_id', officialChatId)
                            .then(() => supabase.from('chats').delete().eq('id', officialChatId))
                        }
                      }
                    })
                }
                supabase.from('crew_invites').update({ status: 'cancelled' }).eq('event_ref_id', ev.id).eq('inviter_id', userData.dbId).in('status', ['pending', 'accepted'])
                supabase.from('crew_invites').update({ status: 'cancelled' }).eq('event_ref_id', ev.id).eq('invitee_id', userData.dbId).in('status', ['pending', 'accepted'])
                // Broadcast instantly to crew partner so they don't wait 15s
                const partnerChatId = officialEventChatMapRef.current[ev.id]
                const partnerChat = chatListRef.current.find((c: any) => c.id === partnerChatId)
                const partnerId = partnerChat?.partnerProfile?.id
                  || partnerChat?.memberProfiles?.find((p: any) => p.id !== userData.dbId)?.id
                if (partnerId) {
                  supabase.channel(`crew-partner-${partnerId}`).send({
                    type: 'broadcast', event: 'partner_left',
                    payload: { eventId: ev.id, eventTitle: ev.title || partnerChat?.title || '' },
                  })
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
                      supabase.channel(`host-events-${ev.hostId}`).send({
                        type: 'broadcast',
                        event: 'member_left',
                        payload: { eventId: ev.id, requesterId: userData.dbId },
                      })
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
                // Only official events trigger Vibe Check (joiners use it to find crew). Community events handled in chats.
                const hasActiveJoined = Object.entries(joinedEvents).some(([id, v]) => {
                  if (!v) return false
                  const ev = allKnownEvs.find(e => e.id === Number(id))
                  if (!ev) return false
                  if (ev.type !== 'official') return false
                  if (ev.expiresAt && ev.expiresAt <= now) return false
                  return true
                })
                const hasPending = Object.entries(pendingJoinRequests).some(([evId, reqs]) => {
                  if (!reqs.length) return false
                  const ev = userCreatedEvents.find((e: any) => e.id === Number(evId))
                  if (!ev) return false
                  if (ev.expiresAt && ev.expiresAt <= now) return false
                  return true
                })
                const hasHostActivity = userCreatedEvents.some((ev: any) => (!ev.expiresAt || ev.expiresAt > now) && (approvedJoiners[ev.id] || []).length < (ev.maxParticipants || 5) - 1)
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
          setCreateLangs([]); setCreateVibe(null); setCreateCustom(''); setCreateImage(null); setCreateVisibility('public');
          setCalViewYear(new Date().getFullYear()); setCalViewMonth(new Date().getMonth());
        }}>
          <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F0F9FF']} style={s.fill}>
            <View style={[s.fill, { paddingBottom: insets.bottom }]}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'height' : 'padding'} keyboardVerticalOffset={0}>

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
                      'Almost there — set the mood',
                    ][createStep - 1]}
                  </Text>
                </View>

                {/* Step content in ScrollView */}
                <ScrollView
                  ref={createScrollRef}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, textTransform: 'uppercase' }}>Plan name</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#EF4444' }}>*</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                          backgroundColor: createCustom.length > 0 ? '#EEF2FF' : '#F8FAFC',
                          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                          borderWidth: 1.5, borderColor: createCustom.length > 0 ? '#6366F1' : '#E2E8F0' }}>
                          <Pencil size={15} color={createCustom.length > 0 ? '#6366F1' : '#94A3B8'} strokeWidth={2} />
                          <TextInput value={createCustom} onChangeText={setCreateCustom}
                            placeholder="e.g. Wine & chat at Marina" placeholderTextColor="#94A3B8"
                            returnKeyType="done"
                            onFocus={() => setTimeout(() => createScrollRef.current?.scrollToEnd({ animated: true }), 300)}
                            style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }} />
                          {createCustom.length > 0 && (
                            <TouchableOpacity onPress={() => setCreateCustom('')}>
                              <Feather name="x-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>
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
                        : (() => { const d = new Date(createDay); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}` })()
                      : 'Pick date'
                    return (
                      <View>
                        {/* When pills */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>When</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                          <TouchableOpacity onPress={() => setDateSheetOpen(true)} activeOpacity={0.85}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14,
                              backgroundColor: createDay ? '#EEF2FF' : '#F8FAFC',
                              borderWidth: 1.5, borderColor: createDay ? '#6366F1' : '#E2E8F0' }}>
                            <Text style={{ fontSize: 17 }}>📅</Text>
                            <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: createDay ? '#1E1B4B' : '#94A3B8' }} numberOfLines={1}>{dayLabel}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setTimeSheetOpen(true)} activeOpacity={0.85}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14,
                              backgroundColor: createHour ? '#EEF2FF' : '#F8FAFC',
                              borderWidth: 1.5, borderColor: createHour ? '#6366F1' : '#E2E8F0' }}>
                            <Text style={{ fontSize: 17 }}>🕐</Text>
                            <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: createHour ? '#1E1B4B' : '#94A3B8' }} numberOfLines={1}>{createHour || 'Pick time'}</Text>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, textTransform: 'uppercase' }}>Location</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#EF4444' }}>*</Text>
                        </View>
                        <TouchableOpacity onPress={() => setLocationPickerOpen(true)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14,
                            paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5,
                            backgroundColor: createLocation.length > 0 ? '#EEF2FF' : '#FFF7ED',
                            borderColor: createLocation.length > 0 ? '#6366F1' : '#FB923C' }}>
                          <Feather name="map-pin" size={16} color={createLocation.length > 0 ? '#6366F1' : '#F97316'} />
                          <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-SemiBold', color: createLocation.length > 0 ? '#1E1B4B' : '#9A3412' }} numberOfLines={1}>
                            {createLocation.length > 0 ? createLocation : 'Tap to pick on map or search'}
                          </Text>
                          {createLocation.length > 0 ? (
                            <TouchableOpacity onPress={() => { setCreateLocation(''); setLocationCoords(null) }}>
                              <Feather name="x" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          ) : (
                            <Feather name="chevron-right" size={16} color="#F97316" />
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
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Description <Text style={{ fontSize: 11, fontWeight: '500', textTransform: 'none' }}>(optional)</Text></Text>
                        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: createDescription.length > 0 ? '#6366F1' : 'transparent' }}>
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

                        {/* Cover image — last, optional */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, marginTop: 18 }}>Cover Photo <Text style={{ fontSize: 11, fontWeight: '500', textTransform: 'none' }}>(optional)</Text></Text>
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
                          style={{ height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: createImage ? '#6366F1' : '#E2E8F0', borderStyle: createImage ? 'solid' : 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                          {createImage ? (
                            <>
                              <Image source={{ uri: createImage.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                              <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Change</Text>
                              </View>
                            </>
                          ) : (
                            <View style={{ alignItems: 'center', gap: 8 }}>
                              <Feather name="image" size={28} color="#94A3B8" />
                              <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '600' }}>Add a cover photo</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    )
                  })()}

                  {/* ── Step 4: Vibe + Language + Driving ── */}
                  {createStep === 4 && (
                    <View style={{ gap: 16 }}>
                      {/* Vibe */}
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Vibe</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {[{ id:'chill', emoji:'😌', label:'Chill' },{ id:'active', emoji:'⚡', label:'Active' },{ id:'professional', emoji:'🤝', label:'Professional' }].map(v => (
                            <TouchableOpacity key={v.id} onPress={() => setCreateVibe(v.id)} activeOpacity={0.8}
                              style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16,
                                backgroundColor: createVibe === v.id ? '#EEF2FF' : '#F8FAFC',
                                borderWidth: 2, borderColor: createVibe === v.id ? '#6366F1' : 'transparent' }}>
                              <Text style={{ fontSize: 22 }}>{v.emoji}</Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 4, color: createVibe === v.id ? '#6366F1' : '#64748B' }}>{v.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      {/* Languages */}
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Languages</Text>
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
                          <Text style={{ fontSize: 22 }}>🚗</Text>
                          <View>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B' }}>I can give a lift</Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Others can ride with you</Text>
                          </View>
                        </View>
                        <Switch value={createDriving} onValueChange={setCreateDriving} trackColor={{ false: '#E2E8F0', true: '#818CF8' }} thumbColor={createDriving ? '#6366F1' : '#f4f3f4'} />
                      </TouchableOpacity>

                      {/* Plan visibility */}
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Plan visibility</Text>
                        <View style={{ gap: 8 }}>
                          {[
                            { id: 'public',  label: 'Public',       sub: 'Visible in Community' },
                            { id: 'private', label: 'Private 🔒',  sub: 'Only people with invite can join' },
                          ].map(opt => {
                            const sel = createVisibility === opt.id
                            return (
                              <TouchableOpacity key={opt.id} onPress={() => setCreateVisibility(opt.id as 'public' | 'private')} activeOpacity={0.85}
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
                        {/* TODO: generate/share invite link for private plans */}
                      </View>

                      {/* Who can join */}
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Who can join</Text>
                        <View style={{ gap: 8 }}>
                          {[
                            { id: 'any',    label: 'Anyone',       sub: 'Open to everyone' },
                            { id: 'women',  label: 'Women only',   sub: 'Only women can join' },
                            { id: 'men',    label: 'Men only',     sub: 'Only men can join' },
                            { id: 'mixed',  label: 'Mixed group',  sub: 'Mix of women and men' },
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
                  )}

                </ScrollView>

                {/* Bottom button — pinned to bottom */}
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: 'transparent' }}>
                  {createStep < 4 ? (() => {
                    const isDisabled = (createStep === 1 && !createSize) || (createStep === 2 && (!createType || !createCustom.trim())) || (createStep === 3 && (!createDay || !createHour || !createLocation.trim()))
                    const disabledLabel = ['Pick a format', 'Pick activity & name it', 'Choose date & time', ''][createStep - 1]
                    const activeLabel   = ['Next: Activity →', 'Next: Date & time →', 'Next: Final step →', ''][createStep - 1]
                    const STEP_COLORS: [string,string][] = [['#6366F1','#818CF8'],['#EC4899','#F472B6'],['#10B981','#34D399'],['#F59E0B','#FBBF24']]
                    if (isDisabled) return (
                      <View style={[s.btnPrimary, { opacity: 0.38, backgroundColor: '#CBD5E1' }]}>
                        <Text style={[s.btnPrimaryText, { color: '#fff', fontFamily: 'Outfit-SemiBold' }]}>{disabledLabel}</Text>
                      </View>
                    )
                    return (
                      <BreathingButton
                        label={activeLabel}
                        onPress={() => setCreateStep(cs => cs + 1)}
                        colors={STEP_COLORS[createStep - 1]}
                      />
                    )
                  })() : (
                    <TouchableOpacity
                      style={[s.btnPrimary, { shadowColor: '#6366F1', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }]}
                      onPress={async () => {
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

                        // Upload cover image if selected
                        let imageUrl: string | null = null
                        if (createImage?.base64 && userData?.dbId) {
                          try {
                            const path = `events/${userData.dbId}_${Date.now()}.jpg`
                            const byteChars = atob(createImage.base64)
                            const byteArr = new Uint8Array(byteChars.length)
                            for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
                            const { error: upErr } = await supabase.storage.from('avatars').upload(path, byteArr, { upsert: true, contentType: 'image/jpeg' })
                            if (!upErr) {
                              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
                              imageUrl = urlData.publicUrl
                            }
                          } catch (e) { console.warn('Event image upload failed:', e) }
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
                        showToast('Others can find it in the feed now', 'Your social is live! 🎉', '🎉')
                      }}>
                      <Text style={[s.btnPrimaryText, { color: '#fff' }]}>Create Social 🚀</Text>
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
                      <View style={{ width: '100%', height: 280, overflow: 'hidden' }}>
                        <Image source={{ uri: eventDetail.image_url }} style={{ width: '100%', height: 420, position: 'absolute', top: 0 }} resizeMode="cover" />
                      </View>
                    ) : (
                      <LinearGradient colors={eventDetail.gradient as any} style={{ height: 280 }} />
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                        {CATEGORY_EMOJI[eventDetail.category] || '📍'} {eventDetail.category?.toUpperCase()}{eventDetail.distance && eventDetail.distance !== '0km' ? ` · ${eventDetail.distance}` : ''}
                      </Text>
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

                    {/* Participants — only for community events */}
                    {eventDetail.type !== 'official' && (
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

      {/* Chat screen */}
      {openChat && (
        <Modal visible animationType="slide" statusBarTranslucent onRequestClose={() => { setOpenChat(null); setReplyTo(null) }}>
          <StatusBar style="dark" backgroundColor="#ffffff" translucent />
          <View style={{ flex: 1, backgroundColor: '#F0F2F5' }} onLayout={e => {
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
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                        {openChat.eventEmoji} {openChat.event}
                      </Text>
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
                    <LinearGradient
                      colors={[
                        ((openChat.colors || [])[0] && typeof (openChat.colors || [])[0] === 'string') ? (openChat.colors || [])[0] : '#818CF8',
                        ((openChat.colors || [])[1] && typeof (openChat.colors || [])[1] === 'string') ? (openChat.colors || [])[1] : '#6366F1',
                      ]}
                      style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{openChat.eventEmoji || '🎉'}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E1B4B', letterSpacing: -0.2 }} numberOfLines={1}>{openChat.event}</Text>
                      {(() => {
                        const chatEvId = openChat.hostEventId || openChat.communityEventId || openChat.eventRefId
                        const ev = chatEvId ? [...userCreatedEvents, ...dbCommunityEvents, ...feedOfficialDbEvents].find((e: any) => e.id === chatEvId || e._dbId === chatEvId) : null
                        const dateStr = prettyEventTime(ev?.date_label || ev?.time_label || ev?.time) || ''
                        const venueShort = (ev?.location || ev?.venue || '').split(',')[0].trim()
                        const dateAndVenue = [dateStr, venueShort].filter(Boolean).join(' · ')
                        const memberCount = openChat.memberProfiles?.length || openChat.members || 0
                        return (
                          <>
                            {!!dateAndVenue && (
                              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }} numberOfLines={1}>{dateAndVenue}</Text>
                            )}
                            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }} numberOfLines={1}>Crew chat · {memberCount + 1} members</Text>
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
                  if (openChat.hostEventId) {
                    Alert.alert(
                      openChat.event,
                      'What do you want to do?',
                      [
                        { text: 'Cancel Event 🗑️', style: 'destructive', onPress: () => {
                          setUserCreatedEvents(prev => prev.filter(e => e.id !== openChat.hostEventId))
                          setPendingJoinRequests(prev => { const n = { ...prev }; delete n[openChat.hostEventId]; return n })
                          setApprovedJoiners(prev => { const n = { ...prev }; delete n[openChat.hostEventId]; return n })
                          setChatList(prev => prev.filter(c => c.id !== openChat.id))
                          setOpenChat(null)
                          showToast('All requests and chats removed', 'Event cancelled 🗑️', '🗑️')
                        }},
                        { text: 'Close', style: 'cancel' },
                      ]
                    )
                  } else {
                    Alert.alert(
                      openChat.type === 'duo' ? `Chat with ${openChat.name}` : openChat.event,
                      'What do you want to do?',
                      [
                        { text: 'Leave chat', style: 'destructive', onPress: () => {
                          const chatId = openChat.id
                          const evId = openChat.communityEventId
                          if (evId && !openChat.hostEventId && userData?.dbId) {
                            // Удаляем join_request + пишем системное сообщение
                            supabase.from('join_requests').delete().eq('event_id', evId).eq('requester_id', userData.dbId)
                              .then(({ error }) => { if (error) console.warn('leave join_request error:', error.message) })
                            supabase.from('messages').insert({ community_event_id: evId, sender_id: userData.dbId, text: `${userData.name || 'Someone'} left the group` })
                              .then(({ error }) => { if (error) console.warn('leave msg error:', error.message) })
                            setJoinedEvents(prev => { const n = { ...prev }; delete n[evId]; return n })
                          }
                          setChatMessages(prev => ({
                            ...prev,
                            [chatId]: [...(prev[chatId] || []), { from: 'system', text: 'You changed your plans 📅', time: 'now' }],
                          }))
                          setChatList(prev => prev.filter(c => c.id !== chatId))
                          setOpenChat(null)
                          showToast('They\'ve been notified', 'Plans changed 📅', '📅')
                        }},
                        { text: 'Close', style: 'cancel' },
                      ]
                    )
                  }
                }}>
                  <Feather name="more-vertical" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

              {(() => {
                const chatEvId = openChat.hostEventId || openChat.communityEventId
                const chatEv = chatEvId ? [...userCreatedEvents, ...dbCommunityEvents].find(e => e.id === chatEvId) : null
                const isExpired = chatEv?.expiresAt > 0 && chatEv.expiresAt < Date.now()
                if (!isExpired) return null
                const expiresAt = openChat.chatExpiresAt || (chatEv?.expiresAt ? chatEv.expiresAt + 24 * 60 * 60 * 1000 : 0)
                const hoursLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 3600000)) : 0
                const expiryText = hoursLeft <= 0 ? 'This chat will be deleted soon.' : hoursLeft === 1 ? 'This event has ended. Chat deletes in less than 1 hour.' : `This event has ended. Chat deletes in ${hoursLeft}h.`
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
                  {(chatMessages[openChat.id] || []).filter((msg: any) =>
                    msg.from === 'me' || msg.from === 'system' || !blockedIds.has(msg.senderId)
                  ).map((msg: any, i: number) => {
                    const allMsgs = (chatMessages[openChat.id] || []).filter((m: any) => m.from === 'me' || m.from === 'system' || !blockedIds.has(m.senderId))
                    const prevMsg = allMsgs[i - 1]
                    const showDateSep = msg.date && msg.date !== prevMsg?.date
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
                            {msg.senderName && <Text style={{ fontSize: 11, color: msg.senderColor || '#818CF8', fontWeight: '600', marginBottom: 3, marginLeft: 4 }}>{msg.senderName}</Text>}
                            <TouchableOpacity activeOpacity={0.8} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReplyTo({ text: msg.text, senderName: msg.senderName || 'them' }) }}>
                              <View style={s.msgBubbleThem}>
                                {msg.replyTo && (
                                  <View style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: 7, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: '#6366F1' }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>{msg.replyTo.senderName}</Text>
                                    <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={2}>{msg.replyTo.text}</Text>
                                  </View>
                                )}
                                <Text style={{ fontSize: 14, color: '#1E1B4B', lineHeight: 20 }}>{msg.text}</Text>
                                <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 2 }}>{msg.time}</Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      {msg.from === 'them' && openChat.type === 'duo' && (
                        <View style={{ maxWidth: W * 0.72 }}>
                          <TouchableOpacity activeOpacity={0.8} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReplyTo({ text: msg.text, senderName: msg.senderName || openChat.name || 'them' }) }}>
                            <View style={s.msgBubbleThem}>
                              {msg.replyTo && (
                                <View style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: 7, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: '#6366F1' }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>{msg.replyTo.senderName}</Text>
                                  <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={2}>{msg.replyTo.text}</Text>
                                </View>
                              )}
                              <Text style={{ fontSize: 14, color: '#1E1B4B', lineHeight: 20 }}>{msg.text}</Text>
                              <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 2 }}>{msg.time}</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                      {msg.from === 'me' && (
                        <View style={{ maxWidth: W * 0.72 }}>
                          <TouchableOpacity activeOpacity={0.8} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReplyTo({ text: msg.text, senderName: 'You' }) }}>
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
          </View>
        </Modal>
      )}

      {chatPartnerPreview && <ProfilePreviewSheet profile={chatPartnerPreview} onClose={() => setChatPartnerPreview(null)} onBlock={handleBlock} onReport={(p) => setReportTarget(p)} />}
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
                {notifications.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Text style={{ fontSize: 42, marginBottom: 12 }}>🔔</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E1B4B', marginBottom: 6 }}>All caught up!</Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Notifications will appear here{'\n'}when something happens</Text>
                  </View>
                ) : (
                  notifications.map(n => {
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
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Group members sheet */}
      {groupMembersOpen && openChat && (
        <Modal transparent animationType="slide" onRequestClose={() => setGroupMembersOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
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
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>HOST 👑</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>That's you 👋</Text>
                  </View>
                </View>
                {/* Approved members */}
                {(openChat.memberProfiles || []).map((p: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: `${p.color}0D`, borderWidth: 1.5, borderColor: `${p.color}25` }}>
                    {/* Photo + info — tappable to view profile */}
                    <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}
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
                      <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: p.color }}>
                        {p.photo
                          ? <Image source={{ uri: p.photo }} style={{ width: '100%', height: '100%' }} />
                          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24 }}>👤</Text></View>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>{p.name}{p.age ? `, ${p.age}` : ''}</Text>
                          {p._isHost && (
                            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: '#6366F1' }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>HOST 👑</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }} numberOfLines={1}>{p.bio}</Text>
                        {p.transport && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Text style={{ fontSize: 12 }}>{p.transport === 'car' ? '🚗' : p.transport === 'lift' ? '🙋' : '📍'}</Text>
                            <Text style={{ fontSize: 12, color: p.transport === 'car' ? '#6366F1' : '#64748B', fontWeight: '600' }}>
                              {p.transport === 'car' ? 'Has a car · can give a lift' : p.transport === 'lift' ? 'Needs a lift' : 'Meeting there'}
                            </Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                          {(p.langs || []).map((l: string) => (
                            <Text key={l} style={{ fontSize: 14 }}>{FLAG_MAP[l] || '🌐'}</Text>
                          ))}
                        </View>
                      </View>
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
        </Modal>
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'pareaapp://', skipBrowserRedirect: true },
      })
      if (error) { Alert.alert('Google Sign In failed', error.message); return }
      if (!data?.url) return
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'pareaapp://')
      if (result.type === 'success' && result.url) {
        const url = result.url
        const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || ''
        const params = new URLSearchParams(hashPart)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token) {
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
      // Only save photos to DB if all are public HTTPS URLs (not local file:// URIs)
      // Local URIs are saved to DB separately after Storage upload in pickProfilePhoto
      // Photos are saved to DB directly from pickProfilePhoto after Storage upload
      // Skip here to avoid overwriting public URLs with local file:// URIs
      if (patch.langs       !== undefined) dbPatch.langs         = patch.langs
      if (patch.interests   !== undefined) dbPatch.interests     = patch.interests
      if (patch.musicGenres !== undefined) dbPatch.music_genres  = patch.musicGenres
      if (patch.socialEnergy!== undefined) dbPatch.social_energy = patch.socialEnergy
      if (patch.drinksPref  !== undefined) dbPatch.drinks_pref   = patch.drinksPref
      if (patch.smokingPref !== undefined) dbPatch.smoking_pref  = patch.smokingPref
      if (patch.bio         !== undefined) dbPatch.bio           = patch.bio
      if (Object.keys(dbPatch).length > 0) {
        await supabase.from('profiles').update(dbPatch).eq('id', userData.dbId)
      }
    }
  }
  return <FeedScreen userData={userData} onUpdateUserData={handleUpdateUserData} onLogOut={handleLogOut} />
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1 },

  // Landing
  logoRow: { alignItems: 'center', paddingTop: 36, paddingBottom: 8 },
  logo: { width: 200, height: 64 },
  slideImgWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  slideImg: { width: W * 0.68, height: W * 0.68 },
  slideTextWrap: { paddingHorizontal: 28, marginBottom: 16, alignItems: 'center' },
  slideTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginBottom: 10, lineHeight: 40, textAlign: 'center' },
  slideSub: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  landingBtns: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },

  // Buttons
  btnPrimary: { height: 58, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#818CF8', shadowColor: '#6366F1', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  btnPrimaryText: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  btnSecondary: { height: 52, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '600' },

  // Auth
  authTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  authBackBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  authLogo: { width: 180, height: 56 },
  authContent: { flex: 1, paddingHorizontal: 26, paddingTop: 12, paddingBottom: 44 },
  authTitle: { fontSize: 30, fontWeight: '800', color: '#334155', letterSpacing: -0.5, marginBottom: 10 },
  authSub: { fontSize: 15, color: '#64748B', lineHeight: 22, textAlign: 'center' },
  tabToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  tabBtn: { flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabBtnOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabBtnTxt: { fontSize: 14, fontWeight: '500', color: '#94A3B8' },
  tabBtnTxtOn: { fontSize: 14, fontWeight: '600', color: '#334155' },
  glassInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 18, height: 58, marginBottom: 4 },
  glassInputText: { flex: 1, fontSize: 16, color: '#334155' },
  socialBtn: { flex: 1, height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  socialBtnFull: { height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.7)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  socialBtnTxt: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  googleG: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  iconSocialBtn: { flex: 1, height: 60, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },

  // Country picker
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  countryCode: { fontSize: 14, fontWeight: '600', color: '#334155' },
  countryDivider: { width: 1, height: 22, backgroundColor: 'rgba(100,116,139,0.2)', marginHorizontal: 10 },
  countryModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '70%' },
  countryModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  countryModalTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B', textAlign: 'center', paddingVertical: 14 },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  countryRowName: { flex: 1, fontSize: 15, color: '#334155', fontWeight: '500' },
  countryRowCode: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },

  // OTP
  otpCell: { width: 64, height: 72, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2.5, borderBottomColor: 'rgba(99,102,241,0.25)' },
  otpCellFilled: { borderBottomColor: '#6366F1' },
  otpInput: { width: 64, height: 72, fontSize: 32, fontWeight: '700', color: '#1E1B4B', textAlign: 'center', backgroundColor: 'transparent' },

  // Onboarding
  onbHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 20, borderRadius: 99, marginBottom: 6 },
  progressFill: { height: 4, backgroundColor: '#818CF8', borderRadius: 99 },
  stepScroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
  stepTitle: { fontSize: 28, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.4, marginBottom: 6 },
  stepSub: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#334155', marginBottom: 20 },
  bioInput: { height: 130, paddingTop: 14 },
  charCount: { fontSize: 12, color: '#94A3B8', textAlign: 'right', marginTop: -16, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
  chipOn: { backgroundColor: '#818CF8', borderColor: '#818CF8', shadowColor: '#818CF8', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8, boxShadow: '0 4px 16px rgba(129, 140, 248, 0.75)' } as any,
  chipTxt: { fontSize: 14, color: '#334155', fontWeight: '500' },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  photosRow: { flexDirection: 'row', gap: 10, height: 240, marginBottom: 8 },
  photoSlot: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(185,208,235,0.4)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)' },
  photoSlotMain: { flex: 1.4, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(99,102,241,0.45)' },
  photoImg: { width: '100%', height: '100%' },
  photoCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  photoCheckTxt: { fontSize: 11, color: '#818CF8', fontWeight: '600' },
  photoCropHint: { fontSize: 10, color: 'rgba(99,102,241,0.5)', textAlign: 'center', marginTop: 2 },
  photoMainTxt: { fontSize: 10, fontWeight: '700', color: '#6366F1', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 },
  photoRemoveBtn: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#22c55e', paddingVertical: 6, alignItems: 'center' },
  mainBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(99,102,241,0.88)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  bentoCard: { flex: 1, borderRadius: 22, borderWidth: 1.5, padding: 14 },
  bentoLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  bentoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366F1', marginTop: 6 },
  bentoFinishBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  bentoFinishBlur: { borderRadius: 20, overflow: 'hidden' },
  bentoFinishGrad: { paddingVertical: 18, alignItems: 'center', borderRadius: 20 },
  bentoSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '72%', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, elevation: 20 },

  // Join bottom sheet
  joinSheetWrap: { backgroundColor: '#0f0c1e', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 22, paddingTop: 14, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 32, elevation: 24 },
  joinSheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 18 },
  joinSheetTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 30, marginBottom: 18 },
  joinSheetCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  joinSheetCardOn: { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.5)' },
  joinSheetIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  joinSheetCardLabel: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  joinSheetCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  joinSheetNext: { marginTop: 20, borderRadius: 16, backgroundColor: '#6366F1', paddingVertical: 15, alignItems: 'center' },
  joinSheetNextTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  bentoSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  bentoSheetTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', marginBottom: 16, letterSpacing: -0.3 },
  bentoSheetItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 6, backgroundColor: '#F8FAFC' },
  bentoSheetItemOn: { backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.25)' },
  bentoSheetItemTxt: { fontSize: 15, color: '#334155', fontWeight: '500', flex: 1 },
  photoEditBtn: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  carRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, marginTop: 4 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(99,102,241,0.45)', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#818CF8', borderColor: '#818CF8' },
  carLabel: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 2 },
  carSub: { fontSize: 12, color: '#64748B' },
  bottomBar: { paddingHorizontal: 24, paddingTop: 8, gap: 10 },

  // Feed bottom nav
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12, paddingTop: 10, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  navCreateBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', marginTop: -24, alignItems: 'center', justifyContent: 'center', shadowColor: '#6366F1', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  navCreateGrad: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  createSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
  createTypeCard: { width: (W - 40 - 20) / 3, aspectRatio: 1, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  createTypeCardOn: { backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.35)' },
  createTypeLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', textAlign: 'center' },

  // Feed header
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, backgroundColor: '#F8F7FF' },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.08)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(99,102,241,0.18)' },
  cityBtnTxt: { fontSize: 13, fontWeight: '700', color: '#4338CA' },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.08)', alignItems: 'center', justifyContent: 'center' },
  filterScroll: { backgroundColor: '#F8F7FF', height: 52 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(226,232,240,0.8)' },
  filterTabOn: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  filterTabTxt: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTabTxtOn: { color: '#fff', fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionHeader: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', letterSpacing: -0.3 },
  featuredCard: { height: 240, borderRadius: 24, padding: 16, overflow: 'hidden' },
  officialBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  categoryCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  featuredTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 30 },
  infoPill: { backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  infoPillTxt: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  avatarDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarDotSm: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#fff' },
  joinBtn: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  compactCardShadow: { width: 152, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  compactCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff' },
  compactCardGrad: { height: 100, alignItems: 'center', justifyContent: 'center' },
  compactCardBody: { padding: 12 },
  compactCardTitle: { fontSize: 12, fontWeight: '700', color: '#1E1B4B', lineHeight: 17 },
  compactCardTime: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  listCardShadow: { borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  listCardLeft: { width: 72, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  listCardBody: { flex: 1, paddingVertical: 14, paddingLeft: 4 },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', letterSpacing: -0.2 },
  listCardTime: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Event cards
  officialCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  officialCardInner: { padding: 20, minHeight: 160 },
  officialCardCat: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  officialCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4, lineHeight: 26, marginBottom: 6 },
  officialCardTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  officialCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  communityCard: { width: (W - 44) / 2, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  communityCardTop: { height: 64, alignItems: 'center', justifyContent: 'center' },
  communityCardBody: { padding: 12 },
  communityCardTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', lineHeight: 19, marginBottom: 4 },
  communityCardTime: { fontSize: 11, color: '#64748B' },
  seekerDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  seekerDotSm: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#fff' },
  slotBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  slotBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  cityPickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  cityPickerTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginBottom: 16, textAlign: 'center' },
  cityPickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },

  // Event detail
  detailHeader: { padding: 20, paddingTop: 56, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-start' },
  detailBackBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  organizerBlock: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, marginBottom: 4, backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  organizerLogoWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.08)', alignItems: 'center', justifyContent: 'center' },
  orgVerifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  ticketBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#6366F1', borderRadius: 12, paddingVertical: 11, backgroundColor: 'rgba(99,102,241,0.05)' },

  // Seekers
  seekerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  seekerPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0' },
  formatBadge: { position: 'absolute', bottom: -2, right: -4, borderRadius: 99, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1.5, borderColor: '#fff' },
  passBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  vibeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(129,140,248,0.12)', alignItems: 'center', justifyContent: 'center' },

  // Match
  matchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  matchCard: { backgroundColor: '#fff', borderRadius: 28, padding: 28, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  matchAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },

  // Chat list
  chatCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  chatAvatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  chatAvatarOverlap: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#fff' },

  // Sub tabs
  subTabRow: { flexDirection: 'row', backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 14, padding: 4, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)' },
  subTab: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  subTabOn: { backgroundColor: '#fff', shadowColor: '#6366F1', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  subTabTxt: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  subTabTxtOn: { fontSize: 13, fontWeight: '700', color: '#4338CA' },

  // Chat screen
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, backgroundColor: '#fff', gap: 4 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginLeft: 8 },
  msgBubbleMe: { backgroundColor: '#6366F1', borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleThem: { backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, paddingBottom: 24, backgroundColor: 'rgba(255,255,255,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  chatInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#334155', maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  // Profile
  profileAvatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff', shadowColor: '#6366F1', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  profileSectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8 },
  profileChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)' },
  profileChipTxt: { fontSize: 13, color: '#4338CA', fontWeight: '600' },
  profileActionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
})
