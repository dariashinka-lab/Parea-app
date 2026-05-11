import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../supabase'
import { s } from '../feed-styles'

export function OTPScreen({ onBack, onVerify, method, credential }: {
  onBack: () => void
  onVerify: (userId: string) => void
  method: 'email' | 'phone'
  credential: string
}) {
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const shakeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const id = setInterval(() => setSeconds(sec => {
      if (sec <= 1) { clearInterval(id); setCanResend(true); return 0 }
      return sec - 1
    }), 1000)
    return () => clearInterval(id)
  }, [])

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const handleVerify = async () => {
    const token = code.trim()
    if (!token || isVerifying) return
    setIsVerifying(true)
    try {
      const { data, error: err } = method === 'email'
        ? await supabase.auth.verifyOtp({ email: credential, token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: credential, token, type: 'sms' })
      if (err) {
        setError('Wrong code. Please try again.')
        shake()
        setCode('')
      } else {
        onVerify(data.user!.id)
      }
    } catch (e: any) {
      setError('Verification failed. Try again.')
    }
    setIsVerifying(false)
  }

  const handleResend = async () => {
    setSeconds(59); setCanResend(false); setCode(''); setError('')
    if (method === 'email') await supabase.auth.signInWithOtp({ email: credential })
    else await supabase.auth.signInWithOtp({ phone: credential })
  }

  return (
    <LinearGradient colors={['#EDE9FE', '#E0E7FF', '#DBEAFE']} style={s.fill}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.fill}>
        <View style={s.authTopBar}>
          <TouchableOpacity onPress={onBack} style={s.authBackBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(51,65,85,0.7)" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <View style={[s.authContent, { alignItems: 'center' }]}>
          <Text style={[s.authTitle, { marginBottom: 12 }]}>Check your {method === 'email' ? 'email' : 'phone'}</Text>
          <Text style={[s.authSub, { marginBottom: 40 }]}>Enter the code sent to{'\n'}{credential}</Text>

          <Animated.View style={{ width: '100%', transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              style={[s.glassInput, { fontSize: 28, fontWeight: '800', letterSpacing: 6, textAlign: 'center', color: '#1E1B4B', borderWidth: error ? 1.5 : 0, borderColor: error ? '#EF4444' : 'transparent' }]}
              value={code}
              onChangeText={v => { setCode(v.replace(/\D/g, '')); setError('') }}
              keyboardType="number-pad"
              autoFocus
              placeholder="——————"
              placeholderTextColor="#CBD5E1"
              maxLength={10}
            />
          </Animated.View>

          {error ? (
            <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 10, fontWeight: '500' }}>{error}</Text>
          ) : <View style={{ height: 23 }} />}

          <View style={{ marginTop: 16 }}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ fontSize: 14, color: '#818CF8', fontWeight: '600' }}>Resend code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>Resend code in 00:{String(seconds).padStart(2, '0')}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[s.btnPrimary, { width: '100%', marginTop: 40, backgroundColor: code.length >= 4 && !isVerifying ? '#6366F1' : 'rgba(99,102,241,0.35)', shadowColor: '#6366F1', shadowOpacity: code.length >= 4 ? 0.45 : 0, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: code.length >= 4 ? 8 : 0 }]}
            onPress={handleVerify} disabled={code.length < 4 || isVerifying}>
            {isVerifying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[s.btnPrimaryText, { color: '#fff' }]}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}
