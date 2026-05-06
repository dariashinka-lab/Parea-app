import React, { useRef } from 'react'
import { Animated, Text, TouchableOpacity } from 'react-native'
import { Sparkle } from '../phosphor-icons'
import { INTEREST_ICON_MAP } from '../interest-icons'
import { INTEREST_CATEGORY_PALETTE } from '../feed-constants'

export function AnimatedInterestChip({ item, isOn, onPress, palette }: {
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
