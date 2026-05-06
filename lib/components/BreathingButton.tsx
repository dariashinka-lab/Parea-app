import React, { useEffect, useRef } from 'react'
import { Animated, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export function BreathingButton({ label, onPress, colors, icon }: { label: string; onPress: () => void; colors: [string, string]; icon?: React.ReactNode }) {
  const breath = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1.025, duration: 1100, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1,     duration: 1100, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Animated.View style={{ transform: [{ scale: breath }] }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ borderRadius: 18, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            shadowColor: colors[0], shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
          {icon}
          <Text style={{ fontFamily: 'ClashDisplay-Semibold', fontSize: 16, color: '#fff', letterSpacing: -0.2 }}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  )
}
