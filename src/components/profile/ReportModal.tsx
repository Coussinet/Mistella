// ============================================================
// Mistella - ReportModal
// ユーザー通報モーダル（UserProfileScreen から分離）。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { useReportUser } from '@/hooks/queries/useUserProfile';
import type { ReportReason } from '@/types';

interface ReportModalProps {
  visible: boolean;
  targetUserId: string;
  onClose: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam',                  label: 'スパム' },
  { value: 'inappropriate_content', label: '不適切なコンテンツ' },
  { value: 'harassment',            label: '嫌がらせ' },
  { value: 'other',                 label: 'その他' },
];

export default function ReportModal({ visible, targetUserId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const reportMutation = useReportUser();
  const sending = reportMutation.isPending;

  const handleSend = () => {
    if (!reason || sending) return;
    reportMutation.mutate(
      { targetUserId, reason, detail: detail.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert('通報完了', '通報を受け付けました。ご協力ありがとうございます。');
          setReason(null);
          setDetail('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>通報する</Text>
          <Text style={styles.subtitle}>理由を選択してください</Text>
          {REPORT_REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={styles.reasonRow}
              onPress={() => setReason(r.value)}
            >
              <MaterialIcons
                name={reason === r.value ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={reason === r.value ? COLORS.gold : COLORS.textMuted}
              />
              <Text style={[styles.reasonText, reason === r.value && { color: COLORS.gold }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.input}
            placeholder="補足（任意・200文字以内）"
            placeholderTextColor={COLORS.textMuted}
            value={detail}
            onChangeText={setDetail}
            multiline
            maxLength={200}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setReason(null);
                setDetail('');
                onClose();
              }}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, (!reason || sending) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!reason || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.sendText}>通報する</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet:    { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, width: '100%' },
  title:    { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 16 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  reasonText: { color: COLORS.text, fontSize: 14 },
  input: {
    backgroundColor: COLORS.surfaceLight, color: COLORS.text, borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 64, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border, marginTop: 12, marginBottom: 16,
  },
  actions:      { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText:   { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  sendButton:   { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: COLORS.error, alignItems: 'center' },
  sendText:     { color: COLORS.text, fontSize: 14, fontWeight: '700' },
});
