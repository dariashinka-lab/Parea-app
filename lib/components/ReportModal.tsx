import React, { useState } from 'react'
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { REPORT_REASONS } from '../feed-constants'

export function ReportModal({ profile, onClose, onSubmit }: { profile: any; onClose: () => void; onSubmit: (reason: string, details: string) => void }) {
  const [selected, setSelected] = useState('')
  const [details, setDetails] = useState('')
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.72)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }}>
        <Text style={{ fontSize: 18, fontFamily: 'ClashDisplay-Bold', color: '#1E1B4B', marginBottom: 4 }}>Report {profile?.name}</Text>
        <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18 }}>Select a reason. We review all reports.</Text>
        {REPORT_REASONS.map(r => (
          <TouchableOpacity key={r} onPress={() => setSelected(r)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected === r ? '#6366F1' : '#CBD5E1', backgroundColor: selected === r ? '#6366F1' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {selected === r && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#1E1B4B' }}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          placeholder="Describe what happened (optional)"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={details}
          onChangeText={setDetails}
          style={{ marginTop: 16, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 14, color: '#1E1B4B', minHeight: 72, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' }}
        />
        <TouchableOpacity onPress={() => { if (selected) { onSubmit(selected, details); onClose() } }}
          style={{ marginTop: 16, backgroundColor: selected ? '#6366F1' : '#E2E8F0', borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontFamily: 'ClashDisplay-Semibold', color: selected ? '#fff' : '#94A3B8' }}>Submit Report</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}
