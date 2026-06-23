import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import * as WebBrowser from 'expo-web-browser'
import { CaretLeft, CheckCircle as PhCheckCircle } from '../phosphor-icons'
import { supabase } from '../supabase'
import { s } from '../feed-styles'

const { height: H } = Dimensions.get('window')

// Phone sign-up removed for v1 release — no Twilio configured, the path
// would dead-end. Email + Google + Apple OAuth cover the user base on
// Cyprus. Restore phone (state + tab toggle + country picker modal) when
// Twilio is set up; the OTPScreen still handles 'phone' as a method.
export function RegistrationScreen({ onBack, onSendOtp, onGoogleSignIn, onAppleSignIn }: {
  onBack: () => void
  onSendOtp: (method: 'email' | 'phone', credential: string) => void
  onGoogleSignIn?: () => void
  onAppleSignIn?: () => void
}) {
  const [email, setEmail] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showAgreementWarning, setShowAgreementWarning] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const isValid = isEmailValid && agreed

  const handleContinue = async () => {
    if (isChecking) return
    if (isEmailValid && !agreed) {
      setShowAgreementWarning(true)
      return
    }
    if (!isValid) return
    setIsChecking(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
      if (error) { Alert.alert('Error', error.message); setIsChecking(false); return }
      onSendOtp('email', email.trim())
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong')
      setIsChecking(false)
    }
  }

  const hFz = H < 700 ? 40 : 48
  const hLh = H < 700 ? 46 : 54

  return (
    <LinearGradient colors={['#F8F7FF', '#FFF7F5']} style={s.fill}>
      {/* Background blobs */}
      {/* Decorative bubbles — only in the four corners so they don't
          overlap the form / CTA in the middle. Previous mid-height
          bubbles bled into the Continue button and read as a smudge. */}
      <View style={{ position: 'absolute', top: -110, right: -110, width: 320, height: 320, borderRadius: 160, backgroundColor: '#C4B5FD', opacity: 0.18 }} />
      <View style={{ position: 'absolute', top: -60, left: -100, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FED7AA', opacity: 0.16 }} />
      <View style={{ position: 'absolute', bottom: -100, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: '#C4B5FD', opacity: 0.13 }} />
      <View style={{ position: 'absolute', bottom: -60, right: -90, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FED7AA', opacity: 0.14 }} />

      <StatusBar style="dark" />
      <SafeAreaView style={s.fill}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            {/* Back + Logo */}
            {/* Pure gradient 'Parea' wordmark matching the splash + Play
                Store feature graphic. No P icon — Daria wants the same
                brand mark everywhere, not 'icon + text'. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
              <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <CaretLeft size={18} color="#7C3AED" weight="bold" />
              </TouchableOpacity>
              {/* Brand wordmark from the official transparent PNG (matches
                  the Play Store feature graphic). Aspect ~4:1 so width
                  = height * 4 keeps proportions correct. */}
              <Image
                source={require('../../assets/images/parea-wordmark.png')}
                style={{ width: 128, height: 32 }}
                resizeMode="contain"
              />
            </View>

            {/* Hero */}
            {/* Matches the landing splash voice: Outfit-Bold + bumped size,
                accent word ('people') rendered with the same violet→pink→
                orange MaskedView gradient as the wordmark. lineHeight on
                the masked line is fontSize * 1.5 so descenders ('p' in
                'people') don't clip. */}
            <View style={{ paddingHorizontal: 24, paddingTop: 18, minHeight: 210, overflow: 'visible' }}>
              {(() => {
                const heroFz = Math.round(hFz * 1.15)
                const heroLh = Math.round(hLh * 1.1)
                const maskLh = Math.round(heroFz * 1.5)
                return (
                  <View>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: heroFz, color: '#111827', letterSpacing: -1.2, lineHeight: heroLh }}>Find your</Text>
                    <MaskedView
                      style={{ height: maskLh }}
                      maskElement={
                        <View style={{ height: maskLh, justifyContent: 'center' }}>
                          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: heroFz, letterSpacing: -1.2, lineHeight: maskLh, color: '#000' }}>people</Text>
                        </View>
                      }>
                      <LinearGradient
                        colors={['#A78BFA', '#EC4899', '#F97316']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ height: maskLh }}
                      />
                    </MaskedView>
                  </View>
                )
              })()}
              <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12 }}>
                {'Match into crews. Show up together.'}
              </Text>
            </View>

            {/* Form */}
            <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 44 }}>

              {/* Google */}
              {onGoogleSignIn && (
                <TouchableOpacity onPress={() => {
                  if (!agreed) { setShowAgreementWarning(true); return }
                  onGoogleSignIn()
                }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    height: 54, borderRadius: 16, backgroundColor: '#fff',
                    borderWidth: 1, borderColor: 'rgba(139,92,246,0.12)',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
                    marginBottom: 16 }}>
                  <Svg width={18} height={18} viewBox="0 0 48 48">
                    <Path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                    <Path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.6 0-14.2 4.1-17.7 10.2z" transform="translate(0,1)"/>
                    <Path fill="#FBBC05" d="M24 46c5.8 0 10.8-1.9 14.6-5.2l-6.7-5.5C29.9 37 27.1 38 24 38c-5.8 0-10.8-3.8-12.6-9.1l-6.9 5.3C8 39.9 15.4 46 24 46z" transform="translate(0,-1)"/>
                    <Path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.9-2.8 5.3-5.3 6.9l6.7 5.5C41.6 37.2 45 31 45 24c0-1.3-.2-2.7-.5-4z"/>
                  </Svg>
                  <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#111827' }}>Continue with Google</Text>
                </TouchableOpacity>
              )}

              {/* Apple (iOS only) */}
              {Platform.OS === 'ios' && onAppleSignIn && (
                <TouchableOpacity onPress={() => {
                  if (!agreed) { setShowAgreementWarning(true); return }
                  onAppleSignIn()
                }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    height: 54, borderRadius: 16, backgroundColor: '#111827', marginBottom: 16 }}>
                  <Svg width={16} height={16} viewBox="0 0 814 1000">
                    <Path fill="#fff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 74.1zm-56.4-173.7c24.3-29.4 41.5-70.5 41.5-111.5 0-5.8-.6-11.7-1.9-16.2-39.5 1.3-86.2 26.3-114.4 55.7-22.7 25.3-43.5 66.3-43.5 108 0 6.4 1.3 13 1.9 14.9 2.6.6 6.5 1.3 10.4 1.3 35.7 0 79.8-23.9 105.9-52.2z"/>
                  </Svg>
                  <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#fff' }}>Continue with Apple</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(139,92,246,0.12)' }} />
                <Text style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Outfit-Regular' }}>or sign up with email</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(139,92,246,0.12)' }} />
              </View>

              {/* Email input */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
                paddingHorizontal: 16, height: 56, marginBottom: 4,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                <Feather name="mail" size={17} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#111827', fontFamily: 'Outfit-Regular' }}
                  value={email} onChangeText={t => setEmail(t.replace(/\s/g, ''))}
                  placeholder="your@email.com" placeholderTextColor="#9CA3AF"
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                {isEmailValid && <PhCheckCircle size={20} color="#22c55e" weight="duotone" />}
              </View>

              {/* Continue — same brand 3-stop gradient as the Parea
                  wordmark and landing CTA. Disabled state stays at 0.45
                  opacity so the gradient still reads as the brand button
                  (just muted), not a dead grey rectangle. */}
              <TouchableOpacity onPress={handleContinue} disabled={isChecking} activeOpacity={0.88}
                style={{ marginTop: 18, borderRadius: 28, overflow: 'hidden', opacity: isValid ? 1 : 0.45 }}>
                <LinearGradient colors={['#A78BFA', '#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                  {isChecking
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ fontSize: 16, fontFamily: 'Outfit-Bold', color: '#fff', letterSpacing: 0.2 }}>Continue</Text>}
                </LinearGradient>
              </TouchableOpacity>

              {/* Checkbox */}
              <TouchableOpacity
                onPress={() => { setAgreed(v => !v); setShowAgreementWarning(false) }}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20 }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
                  borderColor: showAgreementWarning ? '#EF4444' : agreed ? '#8B5CF6' : '#D1D5DB',
                  backgroundColor: agreed ? '#8B5CF6' : 'transparent',
                  alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
                }}>
                  {agreed && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={{ flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18, fontFamily: 'Outfit-Regular' }}>
                  {'I have read and agree to the '}
                  <Text style={{ color: '#8B5CF6', fontFamily: 'Outfit-SemiBold' }}
                    onPress={() => WebBrowser.openBrowserAsync('https://joinparea.app/terms')}>
                    Terms of Service
                  </Text>
                  {' and '}
                  <Text style={{ color: '#8B5CF6', fontFamily: 'Outfit-SemiBold' }}
                    onPress={() => WebBrowser.openBrowserAsync('https://joinparea.app/privacy')}>
                    Privacy Policy
                  </Text>
                  {'. I\'m 18+.'}
                </Text>
              </TouchableOpacity>
              {showAgreementWarning && (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 30, fontFamily: 'Outfit-Regular' }}>
                  Please agree to the Terms of Service and Privacy Policy to continue
                </Text>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}
