import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { ArrowUp, Star, UsersThree, Shield, Sparkle, X } from '../phosphor-icons'

// Boost paywall sheet — matches Daria's mockup exactly:
// - Hero: filled violet→pink arrow with glow (no 3D pedestal — flat with shadow)
// - Wording uses "plan" throughout (not "event")
// - Each benefit has its own small icon in a circle (arrow / star / users)
// - €2.99 + "One-time boost" subtitle, no strikethrough in paid state
// - CTA "Boost my plan" with dark text on violet→pink gradient
// - Footer with shield icon: "Boosts last 48 hours. One active boost per plan."
//
// Free-trial state preserves "first one free" — small badge above price,
// CTA stays gradient and active.
export function BoostSheet({ visible, event, freeBoostsLeft = 0, onClose, onConfirm }: {
  visible: boolean
  event: any | null
  freeBoostsLeft?: number
  onClose: () => void
  onConfirm: () => void
}) {
  const isFree = freeBoostsLeft > 0
  const insets = useSafeAreaInsets()
  const slide = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, tension: 80, friction: 14 }).start()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else {
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start()
    }
  }, [visible])

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] })
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.78)', opacity }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          maxHeight: '92%',
          transform: [{ translateY }],
          backgroundColor: '#0F0C1F',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingTop: 10,
          paddingBottom: Math.max(36, insets.bottom + 24),
          shadowColor: '#A78BFA', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: -8 },
        }}>
          {/* Drag handle */}
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' }} />

          {/* Close X */}
          <TouchableOpacity onPress={onClose} hitSlop={12}
            style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <X size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
          {/* Hero: big gradient arrow with soft pedestal-glow underneath */}
          <View style={{ alignItems: 'center', paddingTop: 22 }}>
            <View style={{ width: 140, height: 130, alignItems: 'center', justifyContent: 'flex-end' }}>
              {/* Soft glow pad behind the arrow — gives the 'rising from pedestal'
                  feel without needing a 3D illustration. Two stacked ellipses. */}
              <View style={{ position: 'absolute', bottom: 8, width: 100, height: 16, borderRadius: 50, backgroundColor: 'rgba(167,139,250,0.16)' }} />
              <View style={{ position: 'absolute', bottom: 18, width: 76, height: 12, borderRadius: 50, backgroundColor: 'rgba(167,139,250,0.30)' }} />
              <BoostArrowSvg size={94} />
            </View>
          </View>

          {/* Title + subtitle */}
          <View style={{ paddingHorizontal: 28, marginTop: 14 }}>
            <Text style={{ fontSize: 28, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.5, textAlign: 'center' }}>
              Boost your plan
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              Get more visibility in the Community feed for 48 hours.
            </Text>
          </View>

          {/* Benefits — each with its own contextual icon */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 12 }}>
            {[
              { Icon: ArrowUp, title: 'Top of the feed for 48 hours', sub: 'Your plan appears above regular community plans.' },
              { Icon: Star, title: 'Featured badge', sub: 'A premium badge highlights your plan in the feed.' },
              { Icon: UsersThree, title: 'More people can discover it', sub: 'Your plan gets extra attention from people browsing nearby plans.' },
            ].map((b, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)' }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(167,139,250,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <b.Icon size={20} color="#C4B5FD" weight={b.Icon === Star ? 'fill' : 'bold'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 }}>{b.title}</Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18 }}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price */}
          <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 24 }}>
            {isFree && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(67,233,123,0.15)', borderWidth: 1, borderColor: 'rgba(67,233,123,0.4)', flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <Sparkle size={11} color="#43E97B" weight="fill" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#43E97B', letterSpacing: 0.4 }}>1 FREE BOOST ON US</Text>
              </View>
            )}
            <Text style={{ fontSize: 28, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.5 }}>
              {isFree ? 'Free' : '€2.99'}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {isFree ? 'on your first plan boost' : 'One-time boost'}
            </Text>
          </View>

          {/* CTA */}
          <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
            <TouchableOpacity activeOpacity={isFree ? 0.88 : 0.9}
              onPress={() => { Haptics.notificationAsync(isFree ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning); onConfirm() }}
              style={{ borderRadius: 99, overflow: 'hidden' }}>
              <LinearGradient
                colors={isFree ? ['#8B5CF6', '#EC4899'] : ['rgba(139,92,246,0.35)', 'rgba(236,72,153,0.35)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Semibold', color: isFree ? '#1A0E2E' : 'rgba(255,255,255,0.85)', letterSpacing: 0.2 }}>
                  Boost my plan
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer with shield icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 18, paddingHorizontal: 24 }}>
            <Shield size={12} color="rgba(255,255,255,0.4)" weight="bold" />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
              {isFree
                ? 'Boosts last 48 hours. One active boost per plan.'
                : "You've used your free boost. Paid boosts go live in the next release."}
            </Text>
          </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Custom fat arrow SVG — wide shoulders, vertical body, rounded corners,
// violet→pink gradient fill. Closer to Daria's 3D mockup than any of the
// Phosphor/Lucide stock arrows, and uses real LinearGradient inside the
// SVG (not just a tinted fill) so it pops on dark.
function BoostArrowSvg({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="boostArrowGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C4B5FD" />
          <Stop offset="0.5" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#EC4899" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M32 8 C 30.4 8 28.8 8.6 27.7 9.8 L 12.6 24.9 C 11.6 25.9 11 27.3 11 28.7 C 11 31.6 13.4 34 16.3 34 L 22 34 L 22 52 C 22 54.8 24.2 57 27 57 L 37 57 C 39.8 57 42 54.8 42 52 L 42 34 L 47.7 34 C 50.6 34 53 31.6 53 28.7 C 53 27.3 52.4 25.9 51.4 24.9 L 36.3 9.8 C 35.2 8.6 33.6 8 32 8 Z"
        fill="url(#boostArrowGrad)"
      />
    </Svg>
  )
}
