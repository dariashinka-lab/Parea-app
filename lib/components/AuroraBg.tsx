import React, { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export function AuroraBg({ width, height }: { width: number; height: number }) {
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
