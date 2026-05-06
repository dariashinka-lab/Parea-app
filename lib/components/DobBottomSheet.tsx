import React, { useEffect, useRef, useState } from 'react'
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WheelColumn } from './WheelColumn'

export function DobBottomSheet({ initialDay, initialMonth, initialYear, onClose, onConfirm }: {
  initialDay: number
  initialMonth: number
  initialYear: number
  onClose: () => void
  onConfirm: (day: number, month: number, year: number) => void
}) {
  const sheetInsets = useSafeAreaInsets()
  const [day, setDay] = useState(initialDay)
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const slide = useRef(new Animated.Value(0)).current
  const backdrop = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide,    { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
  }, [])

  const closeWithAnim = () => {
    Animated.parallel([
      Animated.timing(slide,    { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const YEARS  = Array.from({ length: 2008 - 1940 + 1 }, (_, i) => 1940 + i)
  const daysInMonth = new Date(year, month, 0).getDate()
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth)
  }, [daysInMonth])

  const today = new Date()
  let calcAge = today.getFullYear() - year
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) calcAge--
  const isAdult = calcAge >= 18

  return (
    <Modal visible transparent animationType="none" onRequestClose={closeWithAnim} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', opacity: backdrop, justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} onPress={closeWithAnim} style={{ flex: 1 }} />
        <Animated.View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 12,
          paddingBottom: Math.max(sheetInsets.bottom + 16, 32),
          paddingHorizontal: 20,
          shadowColor: '#0F172A',
          shadowOpacity: 0.18,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: -6 },
          elevation: 16,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', textAlign: 'center', marginBottom: 4 }}>Date of birth</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Outfit-Regular', color: '#94A3B8', textAlign: 'center', marginBottom: 18 }}>Pick day, month and year</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <WheelColumn data={DAYS.map(d => ({ label: String(d), value: d }))} value={day} onChange={setDay} width={66} />
            <WheelColumn data={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))} value={month} onChange={setMonth} width={86} />
            <WheelColumn data={YEARS.map(y => ({ label: String(y), value: y }))} value={year} onChange={setYear} width={86} />
          </View>

          {!isAdult && (
            <Text style={{ fontSize: 13, fontFamily: 'Outfit-Medium', color: '#EF4444', textAlign: 'center', marginTop: 14 }}>
              You must be 18 or older to use Parea
            </Text>
          )}

          <TouchableOpacity
            onPress={() => { if (isAdult) { onConfirm(day, month, year); closeWithAnim() } }}
            disabled={!isAdult}
            activeOpacity={0.85}
            style={{ marginTop: 18, opacity: isAdult ? 1 : 0.5, borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontFamily: 'Outfit-SemiBold', color: '#fff', letterSpacing: 0.2 }}>Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}
