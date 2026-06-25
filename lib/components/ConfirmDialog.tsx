import React, { useEffect, useRef } from 'react'
import {
  Animated, Modal, Pressable, Text, TouchableOpacity, View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'

// Branded confirmation dialog used in place of native Alert.alert when we
// want premium look-and-feel: blurred dark backdrop, white rounded card,
// title + body + two CTAs (destructive optionally rendered as a coral
// gradient). Driven by visible/onClose/onConfirm props so callers keep
// state externally — they own when to open and what happens on confirm.
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmText,
  cancelText = 'Keep',
  destructive = false,
  onConfirm,
  onClose,
}: {
  visible: boolean
  title: string
  body?: string
  confirmText: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const scale = useRef(new Animated.Value(0.92)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 90, friction: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else {
      scale.setValue(0.92)
      opacity.setValue(0)
    }
  }, [visible])

  const handleConfirm = () => {
    Haptics.notificationAsync(
      destructive ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    )
    onConfirm()
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.6)', opacity, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', inset: 0 } as any} />
        <Animated.View style={{ width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 24, padding: 24, transform: [{ scale }], shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12 }}>
          <Text style={{ fontSize: 20, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: 0, textAlign: 'center', lineHeight: 28 }}>
            {/* Render any double-quote chars (curly or straight) at a smaller
                size so they don't overpower the wrapped name. ClashDisplay-Bold
                glyphs read tall — quotes at full title size visually merged
                with the surrounding word. */}
            {title.split(/(["“”])/).map((part, i) =>
              /["“”]/.test(part)
                ? <Text key={i} style={{ fontSize: 14 }}>{part}</Text>
                : part
            )}
          </Text>
          {!!body && (
            <Text style={{ fontSize: 14, fontFamily: 'Outfit-Regular', color: '#64748B', textAlign: 'center', lineHeight: 20, marginTop: 10 }}>
              {body}
            </Text>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#475569' }}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm} activeOpacity={0.88} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient
                colors={destructive ? ['#F87171', '#EF4444'] : ['#A78BFA', '#6366F1']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{confirmText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}
