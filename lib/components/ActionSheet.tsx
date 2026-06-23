import React, { useEffect, useRef } from 'react'
import {
  Animated, Modal, Pressable, Text, TouchableOpacity, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

// Branded bottom-sheet action picker that replaces Alert.alert(title, '', [...])
// at multi-option call sites (photo: take selfie / choose / delete / cancel,
// etc.). Drag handle, dark backdrop, white rounded card sliding up from the
// bottom edge, each action a row with optional left icon and destructive
// styling. The Cancel row is visually separated and dismisses the sheet.
export type ActionSheetItem = {
  key: string
  label: string
  icon?: React.ReactNode
  destructive?: boolean
  onPress: () => void
}

export function ActionSheet({
  visible,
  title,
  body,
  actions,
  cancelLabel = 'Cancel',
  onClose,
}: {
  visible: boolean
  title?: string
  body?: string
  actions: ActionSheetItem[]
  cancelLabel?: string
  onClose: () => void
}) {
  const slide = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, tension: 80, friction: 14 }).start()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else {
      Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }).start()
    }
  }, [visible])

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [500, 0] })
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

  const handleAction = (item: ActionSheetItem) => {
    Haptics.selectionAsync()
    onClose()
    // Defer onPress so the close animation has a chance to start visually
    // before the parent kicks off whatever heavy work the action triggers.
    setTimeout(() => item.onPress(), 0)
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.55)', opacity }}>
        <Pressable onPress={onClose} style={{ flex: 1 }} />
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: '#fff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 10,
            paddingBottom: Math.max(16, insets.bottom + 8),
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -8 },
          }}>
          {/* Drag handle */}
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: '#E2E8F0', marginBottom: 14 }} />

          {/* Title + body */}
          {(title || body) && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 14 }}>
              {!!title && (
                <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', letterSpacing: -0.3, textAlign: 'center' }}>
                  {title}
                </Text>
              )}
              {!!body && (
                <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  {body}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={{ paddingHorizontal: 16 }}>
            {actions.map(item => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={() => handleAction(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 14,
                  marginBottom: 6,
                  backgroundColor: '#F8FAFC',
                }}>
                {item.icon && (
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.destructive ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </View>
                )}
                <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Outfit-SemiBold', color: item.destructive ? '#DC2626' : '#1E1B4B' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel — visually separated */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose}
              style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#475569' }}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}
