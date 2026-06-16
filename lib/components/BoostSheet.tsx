import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Sparkle, CheckCircle as PhCheckCircle, X } from '../phosphor-icons'
import { BoostIcon } from './BoostIcon'

// Boost paywall sheet — shown when a community-event host taps "Boost".
// Visual feel: dark premium glass with a violet→pink gradient header
// (distinctly different from Tinder/Bumble's orange-flame palette and from
// our own POPULAR sticker — so the FEATURED upgrade stays its own visual
// lane). "Free during launch" is the hint-don't-enforce signal — UI is in
// place, real IAP wires up later when Apple/Google developer accounts ready.
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
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)', opacity }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          transform: [{ translateY }],
          backgroundColor: '#0F0C1F',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: Math.max(28, insets.bottom + 20),
          shadowColor: '#A78BFA', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: -8 },
        }}>
          {/* Drag handle */}
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 10 }} />

          {/* Header — violet→pink gradient with rocket */}
          <View style={{ alignItems: 'center', paddingTop: 18, paddingHorizontal: 24 }}>
            <LinearGradient
              colors={['#8B5CF6', '#A78BFA', '#EC4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#A78BFA', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <BoostIcon size={40} color="#fff" />
            </LinearGradient>

            <Text style={{ fontSize: 24, fontFamily: 'ClashDisplay-Bold', color: '#fff', letterSpacing: -0.5, marginTop: 18 }}>
              Boost your event
            </Text>
            {event?.title && (
              <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.55)', marginTop: 4, maxWidth: 280 }}>
                {event.title}
              </Text>
            )}
          </View>

          {/* Benefits */}
          <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 12 }}>
            {[
              { title: 'Top of the feed for 48 hours', sub: 'Featured spot above all other community events' },
              { title: 'Glowing FEATURED badge', sub: 'Premium sparkle on your card — stands out at a glance' },
              { title: '3-5× more discovery', sub: 'Get seen by people who would never scroll that far' },
            ].map((b, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(167,139,250,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PhCheckCircle size={16} color="#A78BFA" weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 }}>{b.title}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 }}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price + CTA */}
          <View style={{ paddingHorizontal: 24, paddingTop: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
              {isFree ? (
                <>
                  <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' }}>
                    €2.99
                  </Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(67,233,123,0.15)', borderWidth: 1, borderColor: 'rgba(67,233,123,0.35)', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Sparkle size={10} color="#43E97B" weight="fill" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#43E97B', letterSpacing: 0.3 }}>1 FREE BOOST ON US</Text>
                  </View>
                </>
              ) : (
                <Text style={{ fontSize: 24, fontFamily: 'ClashDisplay-Bold', color: '#fff' }}>€2.99</Text>
              )}
            </View>

            <TouchableOpacity activeOpacity={isFree ? 0.88 : 1} onPress={() => { Haptics.notificationAsync(isFree ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning); onConfirm() }}
              style={{ borderRadius: 99, overflow: 'hidden', opacity: isFree ? 1 : 0.7 }}>
              <LinearGradient
                colors={isFree ? ['#8B5CF6', '#EC4899'] : ['rgba(167,139,250,0.3)', 'rgba(236,72,153,0.3)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <BoostIcon size={18} color="#fff" />
                <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: '#fff', letterSpacing: 0.2 }}>
                  {isFree ? 'Boost — free' : 'Coming soon'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
              {isFree
                ? 'One free Boost per account — try it on this event, see the lift.\n48 hours of featured placement. No subscription, no auto-renewal.'
                : "You've used your free Boost.\nPaid boosts go live in the next release — we'll let you know."}
            </Text>
          </View>

          {/* Close X */}
          <TouchableOpacity onPress={onClose} hitSlop={12}
            style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}
