import React, { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import * as SystemUI from 'expo-system-ui'
import MaskedView from '@react-native-masked-view/masked-view'
import { MaskHappy, MicrophoneStage, CheckCircle as PhCheckCircle, ForkKnife } from '../phosphor-icons'
import { AuroraBg } from '../components/AuroraBg'

// Wordmark rendered as a gradient-filled "Parea" so the splash matches
// the Play Store feature graphic. MaskedView clips a violet→pink→orange
// LinearGradient to the shape of the text. Width is generous (size * 4.2)
// to make sure none of the letters get clipped — Daria reported only the
// 'P' was visible at size * 3.6 because ClashDisplay-Bold is wider than
// the typical 0.6-of-em average.
export function PareaWordmark({ size = 44 }: { size?: number }) {
  const width = Math.round(size * 4.4)
  const height = Math.round(size * 1.3)
  return (
    <MaskedView
      style={{ width, height }}
      maskElement={
        <View style={{ width, height, justifyContent: 'center' }}>
          {/* Outfit-Bold for the rounder/geometric letterforms that better
              match the AI-rendered wordmark on the Play Store feature
              graphic. ClashDisplay-Bold was more angular and read as a
              different brand. */}
          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: size, letterSpacing: -1.5, color: '#000' }}>
            Parea
          </Text>
        </View>
      }>
      <LinearGradient
        colors={['#A78BFA', '#EC4899', '#F97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width, height }}
      />
    </MaskedView>
  )
}

const { width: W, height: H } = Dimensions.get('window')

// CTA labels normalised to similar length so the button text renders at
// the same font size across all three slides — earlier 'Show me what's on'
// auto-shrank while 'Find my people' (shorter) stayed at full size and
// the two read as visually inconsistent when swiping back and forth.
const LANDING_SLIDES = [
  {
    img: require('../../assets/images/characters_dark.png.png'),
    line1: "What's",
    line2: 'happening',
    line3: 'tonight?',
    sub: 'Find events and people going out in your city.',
    btnLabel: 'Show me events',
    imgScale: 0.85,
    tags: ['Wine bar', 'Live music', 'Theatre'],
  },
  {
    img: require('../../assets/images/characters_scene2.png.png'),
    line1: 'No plans?',
    line2: 'we got you.',
    line3: '',
    sub: 'Browse events, join spontaneously, meet your crew.',
    btnLabel: 'Find a plan tonight',
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

export function LandingScreen({ onCreateAccount, onLogin, onGoogleSignIn, onAppleSignIn }: {
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
    // Warm all slide images so swiping between them doesn't decode on-demand
    // (the on-demand decode is what reads as "slow loading" between slides).
    // resolveAssetSource is native-only — it throws on web, so guard it off.
    if (Platform.OS !== 'web') {
      LANDING_SLIDES.forEach(s => {
        const src = Image.resolveAssetSource(s.img)
        if (src?.uri) Image.prefetch(src.uri).catch(() => {})
      })
    }
    Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start()
    // Paint the window background dark so on Android edge-to-edge devices
    // the 3-button nav bar area doesn't show as a white system strip
    // (Xiaomi MIUI 11i etc). Reset is invoked explicitly in CTA handlers
    // below (not on unmount) so the new screen doesn't briefly inherit dark.
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync('#080B16').catch(() => {})
    }
  }, [])

  // Reset system bg before navigating away so RegistrationScreen on Android
  // edge-to-edge devices doesn't inherit our dark nav bar.
  const resetNavBar = () => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync('#FFFFFF').catch(() => {})
    }
  }
  const handleCreateAccount = () => { resetNavBar(); onCreateAccount() }
  const handleLogin = () => { resetNavBar(); onLogin() }
  const handleAppleSignIn = onAppleSignIn ? () => { resetNavBar(); onAppleSignIn() } : undefined

  useEffect(() => { runEntrance() }, [slide])

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= LANDING_SLIDES.length) return
    setSlide(idx)
  }

  const cur    = LANDING_SLIDES[slide]
  const isLast = slide === LANDING_SLIDES.length - 1
  const insets = useSafeAreaInsets()

  const heroH    = H < 720 ? 220 : H < 820 ? 260 : 300
  const heroMT   = H < 720 ? 6   : H < 820 ? 12  : 18
  const imgW     = H < 720 ? 210 : H < 820 ? 255 : 295
  const imgHt    = H < 720 ? 200 : H < 820 ? 245 : 280
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
        {/* Pure gradient wordmark to match the Play Store feature graphic.
            No icon — Daria wants the splash to read as the same brand mark
            as the store listing, not 'icon + text'. */}
        <Animated.View style={[ls.logoRow, { opacity: logoOpacity }]}>
          <PareaWordmark size={36} />
        </Animated.View>

        {/* ── Hero block ── */}
        <View style={[ls.hero, { height: heroH, marginTop: heroMT, justifyContent: slide === 1 ? 'flex-end' : 'center' }]}>
          <View style={{ position: 'relative' }}>
            <Animated.Image
              source={cur.img}
              style={{ width: imgW, height: imgHt, transform: [{ scale: charsScale }] }}
              resizeMode="contain"
              fadeDuration={0}
            />
          </View>

          {/* Slide 2 only: floating event cards */}
          {slide === 1 && (
            <>
              <View style={[ls.s2card, { top: 10, left: 16, transform: [{ rotate: '-6deg' }] }]}>
                <View style={ls.s2icon}>
                  <MaskHappy size={14} color="#fff" weight="duotone" />
                </View>
                <Text style={ls.s2title}>Theatre</Text>
                <Text style={ls.s2sub}>Friday · 7:30 PM</Text>
              </View>

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
        {/* On Android edge-to-edge devices with 3-button nav (Xiaomi MIUI 11i),
            insets.bottom can report 0 even though the nav bar overlays content.
            Floor at 24px on Android so the "Log in" link isn't hidden. */}
        <Animated.View style={[ls.bottom, { opacity: btnOpacity, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 0) + 8 }]}>

          <View style={ls.dotsRow}>
            {LANDING_SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={i === slide ? ls.dotActive : ls.dot} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={isLast ? handleCreateAccount : () => goTo(slide + 1)}
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

          {isLast && Platform.OS === 'ios' && handleAppleSignIn && (
            <>
              <View style={ls.dividerRow}>
                <View style={ls.dividerLine} />
                <Text style={ls.dividerText}>or continue with</Text>
                <View style={ls.dividerLine} />
              </View>
              <View style={ls.socialRow}>
                <TouchableOpacity style={ls.socialBtn} onPress={handleAppleSignIn}>
                  <Svg width={16} height={16} viewBox="0 0 814 1000">
                    <Path fill="#fff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 74.1zm-56.4-173.7c24.3-29.4 41.5-70.5 41.5-111.5 0-5.8-.6-11.7-1.9-16.2-39.5 1.3-86.2 26.3-114.4 55.7-22.7 25.3-43.5 66.3-43.5 108 0 6.4 1.3 13 1.9 14.9 2.6.6 6.5 1.3 10.4 1.3 35.7 0 79.8-23.9 105.9-52.2z"/>
                  </Svg>
                  <Text style={ls.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={ls.loginRow} onPress={handleLogin}>
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
  logoMark: {
    width: 32,
    height: 32,
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
  },
  headlineAccent: {
    fontFamily: 'ClashDisplay-Bold',
    color: '#FB923C',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontFamily: 'Outfit-Regular',
    color: 'rgba(255,255,255,0.55)',
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
