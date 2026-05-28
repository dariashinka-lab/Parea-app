import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Sparkle } from '../phosphor-icons'
import { AnimatedInterestChip } from '../components/AnimatedInterestChip'
import { ProfilePreviewSheet } from '../components/ProfilePreviewSheet'
import {
  INTERESTS_BY_CATEGORY, INTEREST_CATEGORY_PALETTE, LANGUAGES_LIST,
  MUSIC_GENRES, DEALBREAKERS,
} from '../feed-constants'
import { INTEREST_ICON_MAP } from '../interest-icons'
import { SOCIAL_ENERGY } from '../social-energy'
import { uploadPhotoToStorage, isImageSafe } from '../photo-helpers'
import { supabase } from '../supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { registerPushToken } from '../push'

export const PUSH_PREF_KEY = 'parea_push_enabled'

const { width: W } = Dimensions.get('window')

export function ProfileTab({ userData, onUpdateUserData, onLogOut, city, setCityOpen, onUnblockUser }: { userData: any; onUpdateUserData?: (patch: any) => void; onLogOut?: () => void; city?: string; setCityOpen?: (v: boolean) => void; onUnblockUser?: (id: string) => void }) {
  const insets = useSafeAreaInsets()
  const nm = userData?.name || 'Your Profile'
  const ag = userData?.age || ''
  const userPhotos: string[] = (userData?.photos || []).filter(Boolean)
  const [vibeEditOpen, setVibeEditOpen] = useState(false)
  const [langEditOpen, setLangEditOpen] = useState(false)
  const [interestsEditOpen, setInterestsEditOpen] = useState(false)
  const [draftLangs, setDraftLangs] = useState<string[]>([])
  const [draftInterests, setDraftInterests] = useState<string[]>([])
  const [draft, setDraft] = useState<any>({})

  const [slotStatus, setSlotStatus] = useState<Record<number, 'checking' | 'rejected'>>({})

  const setSlot = (idx: number, status: 'checking' | 'rejected' | null) =>
    setSlotStatus(prev => { const n = { ...prev }; if (status === null) delete n[idx]; else n[idx] = status; return n })

  const pickProfilePhoto = async (replaceIdx?: number, source: 'gallery' | 'camera' = 'gallery') => {
    try {
      let result
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') { Alert.alert('Camera access needed', 'Enable camera in Settings to take a selfie.'); return }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, base64: true, exif: false, cameraType: ImagePicker.CameraType.front })
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos.'); return }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.4,
          base64: true,
          exif: false,
        })
      }
      if (result.canceled || !result.assets?.[0]) return
      const { uri, base64 } = result.assets[0]

      const targetIdx = replaceIdx !== undefined ? replaceIdx : userPhotos.length

      const photosBeforePick = [...userPhotos]
      const newPhotos = [...userPhotos]
      if (replaceIdx !== undefined) { newPhotos[replaceIdx] = uri } else { newPhotos.push(uri) }
      onUpdateUserData?.({ photos: newPhotos })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      if (base64) {
        setSlot(targetIdx, 'checking')
        try {
          const safe = await isImageSafe(base64)
          if (!safe) {
            setSlot(targetIdx, 'rejected')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            setTimeout(() => {
              onUpdateUserData?.({ photos: photosBeforePick })
              setSlot(targetIdx, null)
              Alert.alert('Photo removed 🚫', 'This photo doesn\'t meet our content guidelines. Please choose a different one.')
            }, 1200)
            return
          }
        } catch { /* keep photo on moderation error */ }
        setSlot(targetIdx, null)
      }

      const userId = userData?.authId || userData?.dbId
      if (userId && base64) {
        const publicUrl = await uploadPhotoToStorage(base64, userId, targetIdx)
        const uploadedPhotos = [...newPhotos]
        if (publicUrl) {
          uploadedPhotos[targetIdx] = publicUrl
          onUpdateUserData?.({ photos: uploadedPhotos })
        }
        // Await DB write so Preview right after add doesn't read stale row.
        if (userData?.dbId) {
          const { error } = await supabase.from('profiles').update({ photos: uploadedPhotos }).eq('id', userData.dbId)
          if (error) console.warn('Photo DB update error:', error.message)
        }
      }
    } catch { /* picker cancelled or error */ }
  }

  const deleteProfilePhoto = (idx: number) => {
    if (idx === 0 && userPhotos.length === 1) {
      Alert.alert('Main photo required', 'You need at least one photo. Replace it instead.')
      return
    }
    Alert.alert('Delete photo?', undefined, [
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = userPhotos.filter((_, i) => i !== idx)
        onUpdateUserData?.({ photos: updated })
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        // Await the DB write so any immediate follow-up (e.g. tapping Preview)
        // reads the post-delete row, not a stale pre-delete one.
        if (userData?.dbId) {
          const { error } = await supabase.from('profiles').update({ photos: updated }).eq('id', userData.dbId)
          if (error) console.warn('Photo delete DB update error:', error.message)
        }
      }},
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  // Reflect the saved push preference on mount.
  useEffect(() => {
    AsyncStorage.getItem(PUSH_PREF_KEY).then(v => { if (v === '0') setNotificationsEnabled(false) })
  }, [])
  // Toggle push: ON re-registers the device token; OFF clears it from the
  // profile so the send-push edge function skips this user entirely.
  const togglePush = async (val: boolean) => {
    setNotificationsEnabled(val)
    await AsyncStorage.setItem(PUSH_PREF_KEY, val ? '1' : '0')
    if (!userData?.dbId) return
    if (val) {
      await registerPushToken(userData.dbId)
    } else {
      await supabase.from('profiles').update({ expo_push_token: null }).eq('id', userData.dbId)
    }
  }
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; name: string; photo?: string }[]>([])
  const [faqOpen, setFaqOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<string | null>(null)

  // Re-fetch when the blocked-users section is opened so users freshly blocked
  // in chat appear in the list (the section is the only place they can unblock).
  useEffect(() => {
    if (!userData?.dbId) return
    if (settingsSection !== 'blocked' && blockedUsers.length === 0) return
    supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userData.dbId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setBlockedUsers([]); return }
        const ids = data.map((r: any) => r.blocked_id)
        const { data: profiles } = await supabase.from('profiles').select('id, name, photos').in('id', ids)
        if (profiles) setBlockedUsers(profiles.map((p: any) => ({ id: p.id, name: p.name, photo: p.photos?.[0] })))
      })
  }, [userData?.dbId, settingsSection])

  const unblockUser = async (userId: string) => {
    if (!userData?.dbId) return
    await supabase.from('blocked_users').delete().eq('blocker_id', userData.dbId).eq('blocked_id', userId)
    setBlockedUsers(prev => prev.filter(b => b.id !== userId))
    onUnblockUser?.(userId)
  }

  return (
    <View style={{ flex: 1 }}>

      {profilePreviewOpen && (
        <ProfilePreviewSheet
          profile={{
            id: userData?.dbId,
            name: nm,
            age: ag,
            bio: userData?.bio || '',
            photos: userPhotos,
            interests: userData?.interests || [],
            langs: userData?.langs || [],
            color: userData?.color || '#6366F1',
            emoji: '👤',
          }}
          onClose={() => setProfilePreviewOpen(false)}
        />
      )}

      <Modal visible={vibeEditOpen} transparent animationType="slide" onRequestClose={() => setVibeEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setVibeEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Edit vibe</Text>
            <TouchableOpacity onPress={() => setVibeEditOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Music taste</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {MUSIC_GENRES.map(g => {
                const on = (draft.musicGenres || []).includes(g.id)
                return (
                  <TouchableOpacity key={g.id} onPress={() => setDraft((v: any) => ({ ...v, musicGenres: on ? v.musicGenres.filter((x: string) => x !== g.id) : [...(v.musicGenres || []), g.id] }))}
                    style={{ width: (W - 40 - 20) / 3, borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={on ? g.colors : ['#F8FAFC', '#F1F5F9']}
                      style={{ paddingVertical: 10, alignItems: 'center', gap: 3, borderWidth: 1.5, borderRadius: 12, borderColor: on ? 'transparent' : '#E2E8F0' }}>
                      <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: on ? '#fff' : '#475569', textAlign: 'center' }}>{g.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Social energy</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
              {SOCIAL_ENERGY.map(e => {
                const on = draft.socialEnergy === e.id
                return (
                  <TouchableOpacity key={e.id} onPress={() => setDraft((v: any) => ({ ...v, socialEnergy: e.id }))}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#3730A3' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#3730A3' : '#E2E8F0' }}>
                    <e.Icon size={18} color={on ? '#fff' : '#94A3B8'} weight="duotone" />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: on ? '#fff' : '#94A3B8', textAlign: 'center', marginTop: 3 }}>{e.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {[
              { key: 'drinksPref', label: '🍷 Alcohol', opts: ['Social drinker', 'Rarely', "Don't drink"] },
              { key: 'smokingPref', label: '🚬 Smoking', opts: ['Non-smoker', 'Social', 'Smoker'] },
            ].map(row => (
              <View key={row.key} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{row.label}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {row.opts.map(opt => {
                    const on = draft[row.key] === opt
                    return (
                      <TouchableOpacity key={opt} onPress={() => setDraft((v: any) => ({ ...v, [row.key]: opt }))}
                        style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#3730A3' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#3730A3' : '#E2E8F0' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: on ? '#fff' : '#475569' }}>{opt}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            ))}

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>🐾 Pets</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { val: true, label: 'I have pets' },
                  { val: false, label: "I don't" },
                ].map(opt => {
                  const on = !!draft.hasPets === opt.val
                  return (
                    <TouchableOpacity key={String(opt.val)} onPress={() => setDraft((v: any) => ({ ...v, hasPets: opt.val }))}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#3730A3' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#3730A3' : '#E2E8F0' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: on ? '#fff' : '#475569' }}>{opt.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>🚫 Dealbreakers</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10, lineHeight: 17 }}>People with these traits will never be suggested to you.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DEALBREAKERS.map(db => {
                  const on = (draft.dealbreakers || []).includes(db.id)
                  return (
                    <TouchableOpacity key={db.id} onPress={() => setDraft((v: any) => ({ ...v, dealbreakers: on ? (v.dealbreakers || []).filter((x: string) => x !== db.id) : [...(v.dealbreakers || []), db.id] }))}
                      style={{ width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#FFF1F2' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#F43F5E' : '#E2E8F0' }}>
                      <Text style={{ fontSize: 18 }}>{db.emoji}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#BE123C' : '#334155', flex: 1 }} numberOfLines={1}>{db.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <TouchableOpacity onPress={() => { onUpdateUserData?.(draft); setVibeEditOpen(false) }}
              style={{ backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={langEditOpen} transparent animationType="slide" onRequestClose={() => setLangEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setLangEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Languages</Text>
            <TouchableOpacity onPress={() => setLangEditOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {LANGUAGES_LIST.map(l => {
                const on = draftLangs.includes(l.code)
                return (
                  <TouchableOpacity key={l.code} onPress={() => { setDraftLangs(prev => on ? prev.filter(x => x !== l.code) : [...prev, l.code]); Haptics.selectionAsync() }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? '#F3EEFF' : '#F8FAFC', borderWidth: 1.5, borderColor: on ? '#8B5CF6' : '#E2E8F0' }}>
                    <Text style={{ fontSize: 22 }}>{l.flag}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: on ? '#4338CA' : '#64748B' }}>{l.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity onPress={() => { onUpdateUserData?.({ langs: draftLangs }); setLangEditOpen(false) }}
              style={{ backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save{draftLangs.length > 0 ? ` (${draftLangs.length})` : ''}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={interestsEditOpen} transparent animationType="slide" onRequestClose={() => setInterestsEditOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setInterestsEditOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Your interests</Text>
            <TouchableOpacity onPress={() => setInterestsEditOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
            {INTERESTS_BY_CATEGORY.map(cat => {
              const palette = INTEREST_CATEGORY_PALETTE[cat.id as keyof typeof INTEREST_CATEGORY_PALETTE]
              return (
                <View key={cat.id} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'ClashDisplay-Semibold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10 }}>{cat.label}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {cat.items.map(item => (
                      <AnimatedInterestChip
                        key={item}
                        item={item}
                        isOn={draftInterests.includes(item)}
                        onPress={() => { setDraftInterests(prev => draftInterests.includes(item) ? prev.filter(x => x !== item) : [...prev, item]); Haptics.selectionAsync() }}
                        palette={palette}
                      />
                    ))}
                  </View>
                </View>
              )
            })}
            <TouchableOpacity onPress={() => { onUpdateUserData?.({ interests: draftInterests }); setInterestsEditOpen(false) }}
              style={{ backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save{draftInterests.length > 0 ? ` (${draftInterests.length})` : ''}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={editProfileOpen} transparent animationType="slide" onRequestClose={() => setEditProfileOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setEditProfileOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditProfileOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>City</Text>
              <TouchableOpacity onPress={() => { setEditProfileOpen(false); setTimeout(() => setCityOpen?.(true), 300) }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
            {city ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Feather name="map-pin" size={13} color="#6366F1" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#4338CA' }}>{city}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setEditProfileOpen(false); setTimeout(() => setCityOpen?.(true), 300) }}
                style={{ alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>Add your city</Text>
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>Interests</Text>
              <TouchableOpacity onPress={() => { setDraftInterests(userData?.interests || []); setEditProfileOpen(false); setTimeout(() => setInterestsEditOpen(true), 300) }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
            {(userData?.interests || []).length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(userData.interests as string[]).map((item: string) => {
                  const Icon = INTEREST_ICON_MAP[item] || Sparkle
                  const label = item.indexOf(' ') !== -1 ? item.slice(item.indexOf(' ') + 1) : item
                  return (
                    <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3EEFF', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 }}>
                      <Icon size={13} color="#8B5CF6" weight="duotone" />
                      <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#7C3AED' }}>{label}</Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setDraftInterests([]); setEditProfileOpen(false); setTimeout(() => setInterestsEditOpen(true), 300) }}
                style={{ alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>Add interests</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>Languages</Text>
              <TouchableOpacity onPress={() => { setDraftLangs(userData?.langs || []); setEditProfileOpen(false); setTimeout(() => setLangEditOpen(true), 300) }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
            {(userData?.langs || []).length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(userData.langs as string[]).map((code: string) => {
                  const l = LANGUAGES_LIST.find(x => x.code === code)
                  return l ? (
                    <View key={code} style={{ backgroundColor: '#F3EEFF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#7C3AED' }}>{l.label}</Text>
                    </View>
                  ) : null
                })}
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setDraftLangs([]); setEditProfileOpen(false); setTimeout(() => setLangEditOpen(true), 300) }}
                style={{ alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8' }}>Add languages</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>Vibe</Text>
              <TouchableOpacity onPress={() => { setDraft({ musicGenres: userData?.musicGenres || [], socialEnergy: userData?.socialEnergy, drinksPref: userData?.drinksPref, smokingPref: userData?.smokingPref, hasPets: !!userData?.hasPets, dealbreakers: userData?.dealbreakers || [] }); setEditProfileOpen(false); setTimeout(() => setVibeEditOpen(true), 300) }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Edit →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setDraft({ musicGenres: userData?.musicGenres || [], socialEnergy: userData?.socialEnergy, drinksPref: userData?.drinksPref, smokingPref: userData?.smokingPref, hasPets: !!userData?.hasPets, dealbreakers: userData?.dealbreakers || [] }); setEditProfileOpen(false); setTimeout(() => setVibeEditOpen(true), 300) }}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, gap: 10, marginBottom: 10 }}>
              <Sparkle size={20} color="#8B5CF6" weight="duotone" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', flex: 1 }}>Music, energy, drinks, smoking, pets, dealbreakers</Text>
              <Feather name="chevron-right" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <View style={{ flex: 1 }}>

        {/* Outer SafeAreaView already applies insets.top on both platforms,
            so only a small fixed gap here — adding insets.top again
            doubled the spacing on Xiaomi/large-notch Android devices. */}
        <View style={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <MaskedView maskElement={
              <Text style={{ fontSize: 44, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, lineHeight: 50, backgroundColor: 'transparent' }}>Profile</Text>
            }>
              <LinearGradient colors={['#8B5CF6', '#C4B5FD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={{ fontSize: 44, fontFamily: 'ClashDisplay-Bold', letterSpacing: -1, lineHeight: 50, opacity: 0 }}>Profile</Text>
              </LinearGradient>
            </MaskedView>
            <TouchableOpacity
              onPress={() => { setProfilePreviewOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#F3EEFF' }}>
              <Feather name="eye" size={14} color="#8B5CF6" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}>

        {(() => {
          const SZ = (W - 40 - 16) / 3
          return (
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 18 }}>
              {[0, 1, 2].map(i => {
                const uri = userPhotos[i]
                const isMain = i === 0
                const status = slotStatus[i] ?? null
                const isChecking = status === 'checking'
                const isRejected = status === 'rejected'
                if (uri) return (
                  <TouchableOpacity key={`${i}_${uri}`} activeOpacity={0.85}
                    onPress={() => {
                      if (isChecking || isRejected) return
                      const acts: any[] = [
                        { text: '🤳  Take a selfie', onPress: () => pickProfilePhoto(i, 'camera') },
                        { text: '🖼️  Choose from gallery', onPress: () => pickProfilePhoto(i, 'gallery') },
                      ]
                      if (!isMain) acts.push({ text: '🗑️  Delete', style: 'destructive', onPress: () => deleteProfilePhoto(i) })
                      acts.push({ text: 'Cancel', style: 'cancel' })
                      Alert.alert(isMain ? 'Main photo' : `Photo ${i + 1}`, undefined, acts)
                    }}
                    style={{ width: SZ, height: SZ * 1.3, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E2E8F0' }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {isChecking && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(99,102,241,0.7)', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fff" size="small" /></View>}
                    {isRejected && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(239,68,68,0.75)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>🚫</Text></View>}
                    {isMain && !isChecking && !isRejected && <View style={{ position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.5)' }}><Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>Main ★</Text></View>}
                    {!isChecking && !isRejected && <View style={{ position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}><Feather name="edit-2" size={10} color="#fff" /></View>}
                  </TouchableOpacity>
                )
                if (i <= userPhotos.length) return (
                  <TouchableOpacity key={i} onPress={() => Alert.alert('Add a photo', undefined, [
                    { text: '🤳  Take a selfie', onPress: () => pickProfilePhoto(undefined, 'camera') },
                    { text: '🖼️  Choose from gallery', onPress: () => pickProfilePhoto(undefined, 'gallery') },
                    { text: 'Cancel', style: 'cancel' },
                  ])}
                    style={{ width: SZ, height: SZ * 1.3, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Feather name="plus" size={20} color="#94A3B8" />
                    <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                )
                return <View key={i} style={{ width: SZ, height: SZ * 1.3, borderRadius: 16, backgroundColor: '#F1F5F9', opacity: 0.3 }} />
              })}
            </View>
          )
        })()}

        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3, textAlign: 'center' }}>{nm}{ag ? `, ${ag}` : ''}</Text>
          {userData?.bio ? (
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 19, textAlign: 'center' }} numberOfLines={2}>{userData.bio}</Text>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => { setEditProfileOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F3EEFF', borderRadius: 16, paddingVertical: 14 }}>
            <Feather name="edit-2" size={16} color="#8B5CF6" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#8B5CF6' }}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setSettingsOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', borderRadius: 16, paddingVertical: 14 }}>
            <Feather name="settings" size={16} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Settings</Text>
          </TouchableOpacity>
        </View>

        {(() => {
          const photos = userPhotos
          const bio = (userData?.bio || '').trim()
          const interests = userData?.interests || []
          const langs = userData?.langs || []
          const socialEnergy = userData?.socialEnergy
          const musicGenres = userData?.musicGenres || []
          const drinksPref = userData?.drinksPref
          const transport = userData?.transport

          let strength = 0
          const tips: string[] = []
          if (photos.length >= 1) strength += 20; else tips.push('Add a main photo')
          if (photos.length >= 3) strength += 15; else if (photos.length < 3) tips.push(`Add ${3 - photos.length} more photo${3 - photos.length === 1 ? '' : 's'}`)
          if (bio) strength += 15; else tips.push('Add a one-line bio')
          if (interests.length >= 3) strength += 15; else tips.push(`Pick ${3 - interests.length} more interest${3 - interests.length === 1 ? '' : 's'}`)
          if (langs.length >= 1) strength += 10; else tips.push('Add at least 1 language')
          if (socialEnergy) strength += 10; else tips.push('Set your social energy')
          if (musicGenres.length >= 1) strength += 10; else tips.push('Pick a music vibe')
          if (drinksPref) strength += 5
          strength = Math.min(100, strength)

          const energyLabel = SOCIAL_ENERGY.find(e => e.id === socialEnergy)?.label
          const transportLabel = transport === 'car' ? 'Has a car' : transport === 'lift' ? 'Open to carpool' : transport === 'meet' ? 'Meet there' : null
          const langLabels = langs.slice(0, 3).map((c: string) => LANGUAGES_LIST.find(l => l.code === c)?.label || c)
          const vibeParts = [energyLabel, transportLabel, langLabels.join(' / ')].filter(Boolean)

          return (
            <View style={{ paddingHorizontal: 20, gap: 14, marginBottom: 32 }}>
              {strength < 100 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#1E1B4B', letterSpacing: -0.1 }}>Profile strength</Text>
                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: strength >= 70 ? '#10B981' : strength >= 50 ? '#6366F1' : '#F97316' }}>{strength}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#EEF2FF', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                    <LinearGradient colors={strength >= 70 ? ['#34D399', '#10B981'] : strength >= 50 ? ['#818CF8', '#6366F1'] : ['#FBBF24', '#F97316']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ width: `${strength}%` as any, height: '100%' }} />
                  </View>
                  {tips[0] && (
                    <TouchableOpacity onPress={() => setEditProfileOpen(true)} activeOpacity={0.8}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontFamily: 'Outfit-Medium' }}>💡 {tips[0]} <Text style={{ color: '#8B5CF6', fontFamily: 'Outfit-SemiBold' }}>→</Text></Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {vibeParts.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Your vibe</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: '#1E1B4B', lineHeight: 21 }}>{vibeParts.join(' · ')}</Text>
                </View>
              )}

              {interests.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366F1', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' }}>Interests</Text>
                    <TouchableOpacity onPress={() => { setDraftInterests(interests); setInterestsEditOpen(true) }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#8B5CF6' }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {interests.slice(0, 6).map((it: string) => {
                      const Icon = INTEREST_ICON_MAP[it] || Sparkle
                      const label = it.indexOf(' ') !== -1 ? it.slice(it.indexOf(' ') + 1) : it
                      return (
                        <View key={it} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#E9E5FF' }}>
                          <Icon size={12} color="#6366F1" weight="duotone" />
                          <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#4338CA' }}>{label}</Text>
                        </View>
                      )
                    })}
                    {interests.length > 6 && (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: '#EEF2FF' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#6366F1' }}>+{interests.length - 6}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )
        })()}

        <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
          <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F0F9FF']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                <TouchableOpacity onPress={() => setSettingsOpen(false)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                  <Feather name="x" size={18} color="#475569" />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 22, color: '#1E1B4B', marginLeft: 14 }}>Settings</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Preferences</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="bell" size={17} color="#F59E0B" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Push Notifications</Text>
                      <Switch value={notificationsEnabled} onValueChange={togglePush} trackColor={{ false: '#E2E8F0', true: '#8B5CF6' }} thumbColor="#fff" />
                    </View>
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Privacy & Safety</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                      onPress={() => setSettingsSection('blocked')}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="slash" size={17} color="#EF4444" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Blocked Users</Text>
                      {blockedUsers.length > 0 && <Text style={{ fontSize: 13, color: '#94A3B8', marginRight: 6 }}>{blockedUsers.length}</Text>}
                      <Feather name="chevron-right" size={15} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Support & Legal</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    {[
                      { icon: 'help-circle', label: 'Help & FAQ',           iconColor: '#6366F1', bg: '#EEF2FF', action: 'faq' },
                      { icon: 'mail',        label: 'Contact Support',      iconColor: '#06B6D4', bg: '#E0F2FE', action: 'support' },
                      { icon: 'alert-octagon', label: 'Report a problem',   iconColor: '#F97316', bg: '#FFEDD5', action: 'report' },
                      { icon: 'users',       label: 'Community Guidelines', iconColor: '#10B981', bg: '#D1FAE5', action: 'guidelines' },
                      { icon: 'shield',      label: 'Privacy Policy',       iconColor: '#3B82F6', bg: '#EFF6FF', action: 'privacy' },
                      { icon: 'file-text',   label: 'Terms of Service',     iconColor: '#F59E0B', bg: '#FFFBEB', action: 'terms' },
                    ].map((item, idx, arr) => (
                      <React.Fragment key={item.label}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                          onPress={() => {
                            if (item.action === 'faq') setSettingsSection('faq')
                            if (item.action === 'support') Linking.openURL('mailto:support@joinparea.app?subject=Support Request')
                            if (item.action === 'report') {
                              Alert.alert(
                                'Report a problem',
                                'What kind of problem do you want to report?',
                                [
                                  { text: 'A bug or glitch', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Bug%20report&body=What%20happened%3A%0A%0ASteps%20to%20reproduce%3A%0A%0ADevice%2FOS%3A%0A') },
                                  { text: 'A problem with an event', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Event%20issue&body=Event%20name%3A%0A%0AWhat%20happened%3A%0A') },
                                  { text: 'An unsafe profile or chat', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Safety%20report&body=User%20name%3A%0A%0AWhat%20happened%3A%0A') },
                                  { text: 'Something else', onPress: () => Linking.openURL('mailto:support@joinparea.app?subject=Report%20a%20problem&body=Describe%20the%20problem%3A%0A') },
                                  { text: 'Cancel', style: 'cancel' },
                                ]
                              )
                            }
                            if (item.action === 'guidelines') setSettingsSection('guidelines')
                            if (item.action === 'privacy') Linking.openURL('https://joinparea.app/privacy')
                            if (item.action === 'terms') Linking.openURL('https://joinparea.app/terms')
                          }}>
                          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Feather name={item.icon as any} size={17} color={item.iconColor} />
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>{item.label}</Text>
                          <Feather name="chevron-right" size={15} color="#CBD5E1" />
                        </TouchableOpacity>
                        {idx < arr.length - 1 && <View style={{ height: 1, backgroundColor: '#F8FAFC', marginLeft: 66 }} />}
                      </React.Fragment>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Account</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                      onPress={() => Alert.alert('Log out?', 'You can sign back in anytime.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Log out', style: 'destructive', onPress: () => { setSettingsOpen(false); setTimeout(() => onLogOut?.(), 300) } },
                      ])}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="log-out" size={17} color="#EF4444" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Log Out</Text>
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: '#F8FAFC', marginLeft: 66 }} />
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                      onPress={() => Alert.alert('Delete Account', 'This will permanently delete your profile and all your data. This cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => {
                          try {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (!session?.access_token) throw new Error('Not logged in')
                            const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json', 'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! },
                            })
                            const json = await resp.json()
                            if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`)
                          } catch (e: any) { Alert.alert('Error', String(e?.message || e)); return }
                          await supabase.auth.signOut(); onLogOut?.()
                        }},
                      ])}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Feather name="trash-2" size={17} color="#EF4444" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Delete Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center', marginTop: 16, marginBottom: 8 }}>Parea v1.0.0</Text>

              </ScrollView>

              {settingsSection === 'blocked' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F3FF' }}>
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                      <TouchableOpacity onPress={() => setSettingsSection(null)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="chevron-left" size={20} color="#475569" />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 20, color: '#1E1B4B', marginLeft: 14 }}>Blocked Users</Text>
                    </View>
                    {blockedUsers.length === 0 ? (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <Feather name="slash" size={40} color="#CBD5E1" />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#94A3B8' }}>No blocked users</Text>
                        <Text style={{ fontSize: 13, color: '#CBD5E1' }}>Block someone from their profile</Text>
                      </View>
                    ) : (
                      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                        {blockedUsers.map(u => (
                          <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12 }}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                              {u.photo ? <Image source={{ uri: u.photo }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : <Feather name="user" size={20} color="#6366F1" />}
                            </View>
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>{u.name}</Text>
                            <TouchableOpacity onPress={() => unblockUser(u.id)}
                              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#FEF2F2' }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Unblock</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </SafeAreaView>
                </View>
              )}

              {settingsSection === 'faq' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F3FF' }}>
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                      <TouchableOpacity onPress={() => setSettingsSection(null)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="chevron-left" size={20} color="#475569" />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 20, color: '#1E1B4B', marginLeft: 14 }}>Help & FAQ</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 40 }}>
                      {[
                        { q: 'How does VibeCheck work?', a: 'VibeCheck uses AI to match you with people who share your interests, lifestyle, and tonight\'s energy. Swipe right to invite someone to your event, left to pass. When both of you match — you\'re connected.' },
                        { q: 'What is Tonight\'s Vibe?', a: 'It\'s your mood for the evening — from Homebody to Party Animal. Setting your vibe helps us sort relevant events to the top of your feed and improves your VibeCheck matches.' },
                        { q: 'How do I join an event?', a: 'Tap any event card, then press "I\'m Going" (official events) or "Request to Join" (community events). For community events, the host approves your request.' },
                        { q: 'How do I create an event?', a: 'Tap the + button at the bottom of the screen. Choose the format (duo, squad, party), type, date/time, and location. You can also add a cover photo.' },
                        { q: 'Can I share an event with a friend?', a: 'Yes — open any event and tap the share button in the top right corner. Your friend will get a link that opens the event directly if they have Parea installed.' },
                        { q: 'How does the crew chat work?', a: 'Once you and your match both confirm attendance at the same event, a crew chat is automatically created. You\'ll find it in the Messages tab.' },
                        { q: 'How do I block someone?', a: 'Open their profile and scroll to the bottom — you\'ll find a "Block" option. Blocked users won\'t appear in your VibeCheck and can\'t see your profile.' },
                        { q: 'Is Parea free?', a: 'Yes, Parea is free to use. We may introduce premium features in the future, but the core experience will always be free.' },
                      ].map((item, idx) => (
                        <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
                          <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#1E1B4B', marginBottom: 8 }}>{item.q}</Text>
                          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#64748B', lineHeight: 20 }}>{item.a}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </SafeAreaView>
                </View>
              )}

              {settingsSection === 'guidelines' && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F3FF' }}>
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                      <TouchableOpacity onPress={() => setSettingsSection(null)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="chevron-left" size={20} color="#475569" />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'ClashDisplay-Bold', fontSize: 20, color: '#1E1B4B', marginLeft: 14 }}>Community Guidelines</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 40 }}>
                      <View style={{ backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderRadius: 16, padding: 16 }}>
                        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#475569', lineHeight: 20 }}>
                          Parea is for meeting real people in real life. Keep it kind, safe, and honest — these rules apply to chats, profiles, and offline meetups.
                        </Text>
                      </View>
                      {[
                        { emoji: '🤝', title: 'Be respectful', body: 'Treat everyone the way you\'d want to be treated. No harassment, hate speech, or discrimination based on age, gender, race, religion, or orientation.' },
                        { emoji: '🪞', title: 'Be real', body: 'Use your real photos, real name, real age (18+). Misleading profiles are removed without warning.' },
                        { emoji: '💬', title: 'No spam or sales', body: 'Don\'t use chats or profiles to promote services, sell things, or invite people off-platform for non-event reasons.' },
                        { emoji: '🚫', title: 'No nudity or explicit content', body: 'Photos must be safe-for-work. Sexual content, nudity, or violence is not allowed anywhere on Parea.' },
                        { emoji: '🌃', title: 'Show up safely', body: 'Meet in public places first. Tell a friend where you\'re going. If something feels off — leave and report the user.' },
                        { emoji: '🔒', title: 'Respect privacy', body: 'Don\'t share other users\' photos, contacts, or personal info outside Parea without permission.' },
                        { emoji: '📅', title: 'Honor your plans', body: 'If you can\'t make it to an event you joined — open the chat and let your crew know. Last-minute drops without notice may affect future invites.' },
                        { emoji: '🚨', title: 'Report abuse', body: 'Use the Report and Block buttons on any profile if someone breaks the rules. We review reports quickly.' },
                      ].map((item, idx) => (
                        <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#1E1B4B' }}>{item.title}</Text>
                          </View>
                          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#64748B', lineHeight: 20 }}>{item.body}</Text>
                        </View>
                      ))}
                      <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
                        Violating these rules may result in warnings, account suspension, or permanent ban.
                      </Text>
                    </ScrollView>
                  </SafeAreaView>
                </View>
              )}

            </SafeAreaView>
          </LinearGradient>
        </Modal>

        </ScrollView>
      </View>
    </View>
  )
}
