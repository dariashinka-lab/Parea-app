import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, Animated, Dimensions, Image, KeyboardAvoidingView, LayoutAnimation,
  Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarBlank, Camera as PhCamera, ImageSquare as PhImage, Trash as PhTrash } from '../phosphor-icons'
import { ActionSheet, ActionSheetItem } from '../components/ActionSheet'
import { AnimatedInterestChip } from '../components/AnimatedInterestChip'
import { DobBottomSheet } from '../components/DobBottomSheet'
import {
  INTERESTS_BY_CATEGORY, INTEREST_CATEGORY_PALETTE, LANGUAGES_LIST,
  BENTO_SONGS, BENTO_FLAGS, BENTO_MOODS, MAGIC_BIOS,
  MUSIC_GENRES, PRIMARY_GENRE_COUNT, DEALBREAKERS, CITIES,
} from '../feed-constants'
import { s } from '../feed-styles'
import { uploadPhotoToStorage, isImageSafe } from '../photo-helpers'
import { SOCIAL_ENERGY } from '../social-energy'

const { width: W } = Dimensions.get('window')

export function OnboardingScreen({ onBack, onFinish, userId }: { onBack: () => void; onFinish: (data: any) => void; userId?: string }) {
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
  const [homeCity, setHomeCity] = useState<string | null>(null)
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
    if (step === 1) return name.trim().length >= 2 && dobValid && !!gender && !!homeCity
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
      // Navigate while the welcome overlay still covers the screen. Fading it
      // out first re-exposed the vibe step for a frame ("vibe → main" flash)
      // before onFinish unmounted the screen — keep it covered and let the
      // parent's navigation tear it down.
      setTimeout(() => {
        onFinish({ name, age: String(dobAgeNum || ageNum), gender, city: homeCity, photos, bio, interests, langs, musicGenres, drinksPref, smokingPref, petsPref, socialEnergy, dealbreakers })
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

  // Returns 'verified' | 'blocked' | 'error' based on test heuristics + moderation API
  const verifyPhoto = (imageUri: string, base64: string): Promise<'verified' | 'blocked' | 'error'> =>
    new Promise(resolve =>
      setTimeout(async () => {
        const isTestFail = imageUri.toLowerCase().includes('test_fail')
        if (isTestFail) { resolve('error'); return }
        const safe = await isImageSafe(base64)
        resolve(!safe ? 'blocked' : 'verified')
      }, 2500)
    )

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

  // Branded ActionSheet replaces the OS Alert.alert for photo picking.
  // photoSheet tracks which slot opened it; null = closed.
  const [photoSheet, setPhotoSheet] = useState<{ idx: number; hasPhoto: boolean } | null>(null)
  const onPhotoPress = (idx: number) => {
    // On web Alert.alert with action buttons doesn't fire callbacks, so the
    // selfie/gallery sheet is a dead end — go straight to the file picker.
    if (Platform.OS === 'web') { pickPhoto(idx, 'gallery'); return }
    if (photos[idx]) {
      setPhotoSheet({ idx, hasPhoto: true })
    } else if (!photoLoading[idx]) {
      setPhotoSheet({ idx, hasPhoto: false })
    }
  }

  const handleBioChange = (text: string) => {
    setBio(text.slice(0, 150))
    counterBounceAnim.setValue(1.18)
    Animated.spring(counterBounceAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start()
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
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: vibeFlashAnim, zIndex: 99 }} />
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
          {/* style={{ flex: 1 }} forces the ScrollView itself to fill the
              available KeyboardAvoidingView height so the bottomBar that
              follows sticks to the bottom of the screen even when step
              content is short (step 1 'Tell us about you' barely fills
              half the viewport — Daria saw Continue floating at ~70%). */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

              {step === 1 && (
                <View>
                  {/* Tighter spacing throughout step 1: title margin trimmed,
                      field gaps unified at 18px, and Gender now gets explicit
                      bottom margin so it doesn't run into the city pills.
                      Title image was 150×150 — shrunk to 120×120 to claw back
                      vertical room so Continue stops getting eaten by the
                      Android gesture-pill at the bottom. */}
                  <View style={{ marginBottom: 18, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 26, fontWeight: '800', color: '#1E1B4B', letterSpacing: -0.5, lineHeight: 32 }}>
                        Tell us{'\n'}about you ✨
                      </Text>
                      <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 18 }}>
                        Your profile · visible to others
                      </Text>
                    </View>
                    <Image
                      source={require('../../assets/images/step1_bubble.png')}
                      style={{ width: 120, height: 120, marginLeft: 4, marginRight: -8 }}
                      resizeMode="contain"
                      fadeDuration={0}
                    />
                  </View>

                  <View style={{ marginBottom: 18 }}>
                    <Text style={s.label}>Name</Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 18, paddingVertical: 4, boxShadow: '0 2px 12px rgba(129,140,248,0.08)' } as any}>
                      <TextInput
                        style={{ fontSize: 17, color: '#1E1B4B', fontWeight: '600', paddingVertical: 12 }}
                        value={name}
                        onChangeText={t => setName(t.replace(/[^a-zA-ZА-Яа-яЁёÀ-ÿ\s\-']/g, ''))}
                        placeholder="Your name"
                        placeholderTextColor="#CBD5E1"
                        maxLength={30}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 18 }}>
                    <Text style={s.label}>Date of birth</Text>
                    <TouchableOpacity
                      onPress={() => setDobPickerOpen(true)}
                      activeOpacity={0.85}
                      style={{
                        paddingVertical: 12,
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
                      <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#EF4444', marginTop: 6 }}>
                        You must be 18 or older
                      </Text>
                    )}
                  </View>

                  <View style={{ marginBottom: 18 }}>
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

                  <View>
                    <Text style={s.label}>Where do you live?</Text>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {CITIES.map(c => {
                        const active = homeCity === c
                        return (
                          <TouchableOpacity
                            key={c}
                            onPress={() => { setHomeCity(c); Haptics.selectionAsync() }}
                            activeOpacity={0.8}
                            style={{
                              paddingVertical: 9,
                              paddingHorizontal: 18,
                              borderRadius: 99,
                              backgroundColor: active ? '#818CF8' : 'rgba(255,255,255,0.7)',
                              borderWidth: 1.5,
                              borderColor: active ? '#818CF8' : '#E2E8F0',
                            }}>
                            <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: active ? '#fff' : '#475569' }}>{c}</Text>
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
                    <View style={{ marginBottom: 28 }}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.8, lineHeight: 38 }}>
                        Your photos ✦
                      </Text>
                      <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>First photo is required · auto-verified</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                      {renderSlot(0, mainW, mainH)}
                      <View style={{ flex: 1, gap: 8 }}>
                        {renderSlot(1, '100%', smallH)}
                        {renderSlot(2, '100%', smallH)}
                      </View>
                    </View>

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
                    <View style={{ marginBottom: 28 }}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.8, lineHeight: 38 }}>
                        Your{'\n'}interests ✦
                      </Text>
                      <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>
                        Helps us tailor your matches
                      </Text>
                    </View>

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
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.8, lineHeight: 34 }}>
                      Your vibe ✦
                    </Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 18 }}>
                      Choose what helps us match you better. You can change this later.
                    </Text>
                  </View>

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

                  {vibeTab === 'vibe' && (
                    <View>
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

        {/* Android edge-to-edge: always add a clear gap ABOVE the inset (not
            just floor at it) — Xiaomi 14 Pro gesture-nav reports ~30 already,
            so a plain Math.max(insets, 30) gave zero extra breathing room and
            the Continue still glued to the gesture pill. */}
        {/* Android gesture-pill devices (Xiaomi etc.) report a small insets.bottom
            already, so +16 wasn't enough — the Continue button stayed flush
            against the pill on every step. Bump to +36 on Android so even
            taller buttons (the step-5 'Complete profile' bento button with
            18px vertical padding inside) clear the system pill. */}
        <View style={[s.bottomBar, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 36 : insets.bottom > 0 ? insets.bottom + 12 : 16 }]}>
          {step === TOTAL ? (
            <TouchableOpacity style={[s.bentoFinishBtn, !canNext() && { opacity: 0.5 }, canNext() && { shadowOpacity: 0.55, shadowRadius: 28, elevation: 14 }]} onPress={next} disabled={!canNext() || showWelcome} activeOpacity={0.88}>
              <BlurView intensity={40} tint="light" style={s.bentoFinishBlur}>
                <LinearGradient colors={['#a78bfa', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.bentoFinishGrad}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>Complete profile</Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
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
            <Text style={{ fontSize: 30, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.6, marginBottom: 6 }}>Welcome to Parea ✨</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.2 }}>Let's find your crew</Text>
          </Animated.View>
        </Animated.View>
      )}
      {/* Branded photo picker sheet — replaces Alert.alert('Add a photo'). */}
      <ActionSheet
        visible={!!photoSheet}
        title={photoSheet?.hasPhoto ? 'Photo options' : 'Add a photo'}
        actions={(photoSheet ? ([
          {
            key: 'camera',
            label: 'Take a selfie',
            icon: <PhCamera size={20} color="#6366F1" weight="bold" />,
            onPress: () => { if (photoSheet) pickPhoto(photoSheet.idx, 'camera') },
          },
          {
            key: 'gallery',
            label: 'Choose from gallery',
            icon: <PhImage size={20} color="#6366F1" weight="bold" />,
            onPress: () => { if (photoSheet) pickPhoto(photoSheet.idx, 'gallery') },
          },
          ...(photoSheet.hasPhoto ? [{
            key: 'delete',
            label: 'Delete photo',
            destructive: true as const,
            icon: <PhTrash size={20} color="#DC2626" weight="bold" />,
            onPress: () => { if (photoSheet) removePhoto(photoSheet.idx) },
          }] : []),
        ] as ActionSheetItem[]) : [])}
        onClose={() => setPhotoSheet(null)}
      />
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
