import React, { useRef, useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { CITY_CENTERS } from '../feed-constants'

// Web build can't import react-native-maps (native-only). This stub keeps the
// same props/contract but drops the visual map — search-based picking only,
// which is enough for testing flows in a browser. Native still uses the full
// map version in LocationPicker.tsx.
export function LocationPicker({ apiKey, initialCity, initialLocation, initialCoords, insets, onClose, onConfirm }: {
  apiKey: string; initialCity?: string | null; initialLocation: string;
  initialCoords: { lat: number; lng: number } | null; insets: any;
  onClose: () => void; onConfirm: (desc: string, lat: number, lng: number) => void
}) {
  const startCenter = initialCoords || (initialCity && CITY_CENTERS[initialCity]) || CITY_CENTERS.Limassol
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>(startCenter)
  const [pinAddress, setPinAddress] = useState<string>(initialLocation || '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}&language=en`
        const res = await fetch(url)
        const json = await res.json()
        if (json.status === 'OK') setResults(json.predictions); else setResults([])
      } catch { setResults([]) }
    }, 350)
  }

  const pickSuggestion = async (place: any) => {
    setQuery(place.description)
    setResults([])
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${apiKey}&fields=geometry,formatted_address,name`
      const res = await fetch(url)
      const json = await res.json()
      const loc = json.result?.geometry?.location
      const name = json.result?.name
      const addr = json.result?.formatted_address
      let full = addr || place.description
      if (name && full && !full.toLowerCase().startsWith(name.toLowerCase())) full = `${name}, ${full}`
      else if (name && !full) full = name
      if (loc) { setPinCoords({ lat: loc.lat, lng: loc.lng }); setPinAddress(full) }
    } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
          <Feather name="x" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B' }}>Pick a location</Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 10, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.18)' }}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={search}
            placeholder="Search a place or address..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, fontSize: 14, fontFamily: 'Outfit-Medium', color: '#1E1B4B' }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]) }}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        {results.length > 0 && (
          <View style={{ marginTop: 6, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', maxHeight: 320 }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.slice(0, 8).map((r: any) => (
                <TouchableOpacity key={r.place_id} onPress={() => pickSuggestion(r)} activeOpacity={0.7}
                  style={{ paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B' }} numberOfLines={1}>{r.structured_formatting?.main_text || r.description}</Text>
                  {!!r.structured_formatting?.secondary_text && (
                    <Text style={{ fontSize: 11, fontFamily: 'Outfit-Regular', color: '#94A3B8', marginTop: 2 }} numberOfLines={1}>{r.structured_formatting.secondary_text}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Outfit-Medium', color: '#94A3B8', marginBottom: 4 }}>Selected location</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', marginBottom: 12, minHeight: 20 }} numberOfLines={2}>
          {pinAddress || 'Search above to pick a place'}
        </Text>
        <TouchableOpacity
          disabled={!pinAddress}
          onPress={() => onConfirm(pinAddress, pinCoords.lat, pinCoords.lng)}
          style={{ backgroundColor: pinAddress ? '#6366F1' : '#CBD5E1', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'ClashDisplay-Semibold' }}>Use this location</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
