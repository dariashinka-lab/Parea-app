import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Sparkle } from '../phosphor-icons'
import { INTEREST_ICON_MAP } from '../interest-icons'
import { FLAG_MAP, INTERESTS_BY_CATEGORY, INTEREST_CATEGORY_PALETTE, LANGUAGES_LIST } from '../feed-constants'
import { SOCIAL_ENERGY } from '../social-energy'
import { supabase } from '../supabase'

export function ProfilePreviewSheet({ profile: profileProp, onClose, onBlock, onReport, inline = false, skipHydrate = false }: { profile: any; onClose: () => void; onBlock?: (profile: any) => void; onReport?: (profile: any) => void; inline?: boolean; skipHydrate?: boolean }) {
  const insets = useSafeAreaInsets()
  const screenH = Dimensions.get('window').height
  const sheetMaxH = screenH - insets.top - 16
  const [photoIdx, setPhotoIdx] = useState(0)
  const slideAnim = useRef(new Animated.Value(300)).current
  // Hydrate sparse profile (e.g. from chat memberProfiles) with full row from DB so
  // interests/transport/langs etc. always show even when caller passed a stub.
  const [hydrated, setHydrated] = useState<any>(null)
  const profile = hydrated || profileProp
  useEffect(() => {
    if (skipHydrate) return
    let cancelled = false
    const id = profileProp?.id
    if (!id || typeof id !== 'string') return // skip mock profiles with non-uuid ids
    // Always re-fetch from DB on open — different callers pass different subsets
    // of the profile, and silently rendering the partial version misses interests
    // / langs / transport. One extra GET is cheap.
    // SELECT * keeps the query resilient to schema drift (e.g. an optional column
    // like `gender` that may not exist on every deployment).
    supabase.from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data: full }) => {
        if (cancelled || !full) return
        // Always use language codes from DB so the rendering layer can render them
        // consistently (label list in body + single flag next to age).
        const langCodes: string[] = full.langs || []
        setHydrated({
          ...profileProp,
          name: full.name || profileProp.name,
          age: full.age || profileProp.age,
          gender: full.gender ?? profileProp.gender,
          city: full.city ?? profileProp.city,
          bio: full.bio || profileProp.bio,
          photos: full.photos || profileProp.photos,
          photo: full.photos?.[0] || profileProp.photo,
          color: full.color || profileProp.color,
          colors: profileProp.colors || [full.color || profileProp.color, '#1E1B4B'],
          interests: full.interests || profileProp.interests || [],
          transport: full.transport ?? profileProp.transport,
          drinksPref: full.drinks_pref ?? profileProp.drinksPref,
          smokingPref: full.smoking_pref ?? profileProp.smokingPref,
          socialEnergy: full.social_energy ?? profileProp.socialEnergy,
          musicGenres: full.music_genres || profileProp.musicGenres || [],
          format: full.format ?? profileProp.format,
          langs: langCodes,
          flag: FLAG_MAP[langCodes[0]] || profileProp.flag || '🌍',
        })
      })
    return () => { cancelled = true }
  }, [profileProp?.id])

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start()
  }, [])

  const close = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(onClose)
  }

  // Support both photos array and single photo fallback
  const allPhotos: string[] = profile.photos?.filter(Boolean).length > 0
    ? profile.photos.filter(Boolean)
    : profile.photo ? [profile.photo] : []
  const c0 = (profile.colors?.[0]) || profile.color || '#6366F1'
  const c1 = (profile.colors?.[1]) || profile.color || '#818CF8'
  const totalSlots = Math.max(allPhotos.length, 1)

  // When `inline=true` we render as an absolute-positioned overlay (no Modal),
  // so the sheet works when called from inside another Modal on iOS (Modal-over-
  // Modal isn't supported). Outer caller is responsible for parent Modal.
  const Wrapper: any = inline ? View : Modal
  const wrapperProps: any = inline
    ? { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, elevation: 200 } }
    : { transparent: true, statusBarTranslucent: true, animationType: 'none', onRequestClose: close }
  return (
    <Wrapper {...wrapperProps}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)' }} activeOpacity={1} onPress={close} />
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: sheetMaxH,
        backgroundColor: '#100D20', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        overflow: 'hidden', transform: [{ translateY: slideAnim }],
      }}>
        {/* Photo carousel */}
        <View style={{ height: 320, position: 'relative', backgroundColor: '#0A0812' }}>
          {allPhotos[photoIdx] ? (
            <Image source={{ uri: allPhotos[photoIdx] }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <LinearGradient colors={[c0, c1]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 72 }}>{profile.emoji || '👤'}</Text>
            </LinearGradient>
          )}
          {/* Gradient overlay bottom */}
          <LinearGradient colors={['transparent', '#100D20']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }} />
          {/* Dot indicators */}
          {totalSlots > 1 && (
            <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {Array.from({ length: totalSlots }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                  <View style={{ width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Swipe areas */}
          <TouchableOpacity style={{ position: 'absolute', left: 0, top: 0, width: '45%', height: '100%', justifyContent: 'center', paddingLeft: 14, opacity: photoIdx > 0 ? 1 : 0 }}
            onPress={() => setPhotoIdx(i => Math.max(0, i - 1))}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="chevron-left" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 14, opacity: photoIdx < totalSlots - 1 ? 1 : 0 }}
            onPress={() => setPhotoIdx(i => Math.min(totalSlots - 1, i + 1))}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="chevron-right" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          {/* Close — push below the status bar / camera notch on Android tall devices */}
          <TouchableOpacity onPress={close} style={{
            position: 'absolute', top: Math.max(insets.top + 8, 16), right: 16, width: 32, height: 32, borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
          }}>
            <Feather name="x" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom + 16, 40) }}>
          {/* Name + age */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>{profile.name}</Text>
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{profile.age}</Text>
          </View>

          {/* Looking for event companions */}
          <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: 'rgba(167,139,250,0.85)', marginBottom: 14 }}>Looking for event companions</Text>

          {/* Bio */}
          {profile.bio ? (
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 21, marginBottom: 18, fontFamily: 'Outfit-Regular' }}>{profile.bio}</Text>
          ) : null}

          {/* AI Match badge — moved up: most interesting + personalized info */}
          {profile.aiScore != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: profile.aiScore >= 75 ? 'rgba(67,233,123,0.10)' : 'rgba(129,140,248,0.12)', borderWidth: 1, borderColor: profile.aiScore >= 75 ? 'rgba(67,233,123,0.28)' : 'rgba(129,140,248,0.25)' }}>
              <Sparkle size={20} color={profile.aiScore >= 75 ? '#43E97B' : '#818CF8'} weight="fill" />
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: profile.aiScore >= 75 ? '#43E97B' : '#818CF8' }}>
                  {profile.aiScore}% vibe match
                </Text>
                {profile.aiReason && (
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 17 }}>{profile.aiReason}</Text>
                )}
              </View>
            </View>
          )}

          {/* Interests — moved up: visual + colorful, gives instant personality */}
          {(profile.interests || []).length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <Text style={{ fontSize: 10, fontFamily: 'ClashDisplay-Semibold', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, marginBottom: 12 }}>INTERESTS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(profile.interests || []).slice(0, 8).map((tag: string, i: number) => {
                  const Icon = INTEREST_ICON_MAP[tag] || Sparkle
                  const label = tag.indexOf(' ') !== -1 ? tag.slice(tag.indexOf(' ') + 1) : tag
                  const cat = INTERESTS_BY_CATEGORY.find(c => c.items.includes(tag))
                  const palette = cat ? INTEREST_CATEGORY_PALETTE[cat.id as keyof typeof INTEREST_CATEGORY_PALETTE] : null
                  const chipColor = palette?.iconColor || '#A78BFA'
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: `${chipColor}22`, borderWidth: 1, borderColor: `${chipColor}55` }}>
                      <Icon size={14} color={chipColor} weight="duotone" />
                      <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: chipColor }}>{label}</Text>
                    </View>
                  )
                })}
                {(profile.interests || []).length > 8 && (
                  <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: 'rgba(255,255,255,0.55)' }}>+{(profile.interests || []).length - 8} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* About — compact text rows (no "Usually goes for" — that just duplicated interests) */}
          {(() => {
            // Normalize langs: callers pass either codes ('en','ru') or pre-mapped flag emojis.
            const flagToCode: Record<string, string> = Object.fromEntries(Object.entries(FLAG_MAP).map(([k, v]) => [v, k]))
            const langs = (profile.langs || []).map((l: string) => flagToCode[l] || l)
            const langText = langs.map((c: string) => LANGUAGES_LIST.find(l => l.code === c)?.label || c).join(' · ')
            const transportText = profile.transport === 'car' ? 'Driving (open to giving a lift)' : profile.transport === 'lift' ? 'Open to carpooling' : 'Meeting there'
            const genderRaw = (profile.gender || '').toLowerCase()
            const genderText = genderRaw === 'female' ? 'Female' : genderRaw === 'male' ? 'Male' : genderRaw ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1) : ''
            const energyLabel = SOCIAL_ENERGY.find(e => e.id === profile.socialEnergy)?.label
            const rows = [
              profile.city && { label: 'Lives in', value: profile.city },
              genderText && { label: 'Gender', value: genderText },
              energyLabel && { label: 'Vibe', value: energyLabel },
              langText && { label: 'Languages', value: langText },
              { label: 'Getting there', value: transportText },
            ].filter(Boolean) as { label: string; value: string }[]
            return (
              <View style={{ marginBottom: 6, gap: 8 }}>
                {rows.map(r => (
                  <Text key={r.label} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit-Medium' }}>{r.label}: </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit-SemiBold' }}>{r.value}</Text>
                  </Text>
                ))}
              </View>
            )
          })()}

          {/* Block / Report */}
          {(onBlock || onReport) && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              {onReport && (
                <TouchableOpacity onPress={() => { onReport(profile); close() }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}>
                  <Feather name="flag" size={15} color="#F59E0B" />
                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#F59E0B' }}>Report</Text>
                </TouchableOpacity>
              )}
              {onBlock && (
                <TouchableOpacity onPress={() => { onBlock(profile); close() }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }}>
                  <Feather name="slash" size={15} color="#EF4444" />
                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#EF4444' }}>Block</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Wrapper>
  )
}
