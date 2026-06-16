import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { ArrowFatUp, ArrowUp, Star, UsersThree, Shield, Sparkle, X } from '../phosphor-icons'

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
          transform: [{ translateY }],
          backgroundColor: '#0F0C1F',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingTop: 10,
          paddingBottom: Math.max(28, insets.bottom + 16),
          shadowColor: '#A78BFA', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: -8 },
        }}>
          {/* Drag handle */}
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' }} />

          {/* Close X */}
          <TouchableOpacity onPress={onClose} hitSlop={12}
            style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <X size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Hero: compact gradient rounded-square with arrow inside */}
          <View style={{ alignItems: 'center', paddingTop: 18 }}>
            <LinearGradient colors={['#A78BFA', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#A78BFA', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <ArrowFatUp size={42} color="#fff" weight="fill" />
            </LinearGradient>
          </View>

          {/* Title + subtitle */}
          <View style={{ paddingHorizontal: 28, marginTop: 14 }}>
            <Text style={{ fontSize: 24, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.5, textAlign: 'center' }}>
              Boost your plan
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
              Get more visibility in the Community feed for 48 hours.
            </Text>
          </View>

          {/* Benefits — compact with own icon */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
            {[
              { Icon: ArrowUp, title: 'Top of the feed for 48 hours', sub: 'Your plan appears above regular community plans.' },
              { Icon: Star, title: 'Featured badge', sub: 'A premium badge highlights your plan in the feed.' },
              { Icon: UsersThree, title: 'More people can discover it', sub: 'Your plan gets extra attention from people browsing nearby plans.' },
            ].map((b, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(167,139,250,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <b.Icon size={18} color="#C4B5FD" weight={b.Icon === Star ? 'fill' : 'bold'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 }}>{b.title}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 16 }}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price — same copy in both states ('€2.99' / 'One-time boost').
              In free state we add a small green pill ABOVE indicating the
              user gets this one free; the CTA color also differentiates. */}
          <View style={{ alignItems: 'center', paddingTop: 16, paddingHorizontal: 24 }}>
            {isFree && (
              <View style={{ paddingHorizontal: 11, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(67,233,123,0.15)', borderWidth: 1, borderColor: 'rgba(67,233,123,0.4)', flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Sparkle size={10} color="#43E97B" weight="fill" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#43E97B', letterSpacing: 0.4 }}>1 FREE BOOST ON US</Text>
              </View>
            )}
            <Text style={{ fontSize: 24, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.5 }}>
              €2.99
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              One-time boost
            </Text>
          </View>

          {/* CTA */}
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <TouchableOpacity activeOpacity={isFree ? 0.88 : 0.9}
              onPress={() => { Haptics.notificationAsync(isFree ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning); onConfirm() }}
              style={{ borderRadius: 99, overflow: 'hidden' }}>
              <LinearGradient
                colors={isFree ? ['#8B5CF6', '#EC4899'] : ['rgba(139,92,246,0.35)', 'rgba(236,72,153,0.35)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: isFree ? '#1A0E2E' : 'rgba(255,255,255,0.85)', letterSpacing: 0.2 }}>
                  Boost my plan
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer — shield + neutral note (no 'next release' marketing) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12, paddingHorizontal: 24 }}>
            <Shield size={12} color="rgba(255,255,255,0.4)" weight="bold" />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
              Boosts last 48 hours. One active boost per plan.
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

