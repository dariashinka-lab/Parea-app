import { useRef, useState } from 'react'
import { Animated } from 'react-native'
import * as Haptics from 'expo-haptics'

export type Notif = {
  id: string
  type: string
  title: string
  body: string
  emoji: string
  color: string
  time: number
  read: boolean
  chatId?: number
  eventId?: number
}

// Notification "buckets" — which types are inbox vs chat-linked vs plans-linked.
// FeedScreen uses these for selective clears (e.g. opening a chat removes
// CHAT_TYPES for that chatId; opening Plans removes PLANS_TYPES).
export const BELL_TYPES = ['welcome', 'host_full', 'event_cancelled', 'reminder_24h', 'reminder_2h']
export const CHAT_TYPES = ['match', 'confirmed', 'group_chat', 'new_message', 'member_joined', 'crew_ready']
export const PLANS_TYPES = ['join_request', 'member_left', 'reminder_24h', 'reminder_2h']

export function useNotifs({ persistLoadedRef }: {
  persistLoadedRef: React.MutableRefObject<boolean>;
}) {
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const bellShake = useRef(new Animated.Value(0)).current
  const notifPanelY = useRef(new Animated.Value(-600)).current
  // Keys of notifications ever seen (persisted) — dedupe across app restarts
  // even after the user dismissed them. Otherwise polling keeps re-firing
  // "Host approved your request!" on every reload because in-memory dedupe
  // only inspects the currently-visible `notifications` array.
  const seenNotifKeysRef = useRef<Set<string>>(new Set())

  const unreadCount = notifications.filter(n => !n.read).length

  const notifKey = (n: { type: string; title: string; body?: string; chatId?: number }) =>
    `${n.type}|${n.title}|${n.body || ''}|${n.chatId || 0}`

  const addNotif = (n: Omit<Notif, 'id' | 'time' | 'read'>) => {
    // Skip until persist load completes — otherwise polling fires before
    // seen-keys is restored from storage, bypassing dedupe → dupe notifs.
    if (!persistLoadedRef.current) return
    const key = notifKey(n as any)
    // First check the persistent seen set — covers dismissed notifs too.
    if (seenNotifKeysRef.current.has(key)) return
    let isDup = false
    setNotifications(prev => {
      const dup = prev.find(p =>
        p.type === n.type
        && p.title === n.title
        && (p.body || '') === (n.body || '')
        && (p.chatId || 0) === ((n as any).chatId || 0)
      )
      if (dup) { isDup = true; return prev }
      const newN: Notif = { ...n, id: `${Date.now()}-${Math.random()}`, time: Date.now(), read: false }
      return [newN, ...prev].slice(0, 30)
    })
    if (isDup) return
    seenNotifKeysRef.current.add(key)
    // Keep most-recent 200 keys to avoid unbounded growth across months of use.
    if (seenNotifKeysRef.current.size > 200) {
      const trimmed = [...seenNotifKeysRef.current].slice(-200)
      seenNotifKeysRef.current = new Set(trimmed)
    }
    // Bell shake animation
    bellShake.setValue(0)
    Animated.sequence([
      Animated.timing(bellShake, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start()
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }

  const dismissNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  return {
    notifications, setNotifications,
    notifOpen, setNotifOpen,
    bellShake, notifPanelY,
    seenNotifKeysRef,
    unreadCount,
    addNotif,
    dismissNotif,
  }
}
