import React, { useEffect, useRef, useState } from 'react'
import { FlatList, Text, View } from 'react-native'

export function WheelColumn({ data, value, onChange, width }: {
  data: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
  width: number
}) {
  const ITEM_HEIGHT = 44
  const VISIBLE = 5
  const HEIGHT = ITEM_HEIGHT * VISIBLE
  const listRef = useRef<FlatList<{ label: string; value: number }>>(null)
  const initialIdx = Math.max(0, data.findIndex(d => d.value === value))
  const [activeIdx, setActiveIdx] = useState(initialIdx)

  useEffect(() => {
    const idx = Math.max(0, data.findIndex(d => d.value === value))
    setActiveIdx(idx)
    const t = setTimeout(() => listRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false }), 30)
    return () => clearTimeout(t)
  }, [data.length])

  return (
    <View style={{ width, height: HEIGHT, position: 'relative' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT, backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 12, zIndex: 0 }} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        scrollEventThrottle={16}
        onScroll={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
          if (idx !== activeIdx && idx >= 0 && idx < data.length) setActiveIdx(idx)
        }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
          const clamped = Math.max(0, Math.min(data.length - 1, idx))
          setActiveIdx(clamped)
          onChange(data[clamped].value)
        }}
        renderItem={({ item, index }) => {
          const active = index === activeIdx
          return (
            <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: active ? 20 : 16, fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular', color: active ? '#1E1B4B' : '#94A3B8', opacity: active ? 1 : 0.5 }}>{item.label}</Text>
            </View>
          )
        }}
      />
    </View>
  )
}
