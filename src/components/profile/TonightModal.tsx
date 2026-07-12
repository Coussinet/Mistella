// ============================================================
// Mistella - TonightModal
// 「今夜行ける？」リクエスト送信モーダル（UserProfileScreen から分離）。
// ============================================================

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
import { useSendTonightRequest } from '@/hooks/queries/useUserProfile';
import { success } from '@/utils/haptics';

interface TonightModalProps {
  visible: boolean;
  castId: string;
  onClose: () => void;
}

export default function TonightModal({ visible, castId, onClose }: TonightModalProps) {
  const [message, setMessage] = useState('');
  const sendMutation = useSendTonightRequest();
  const sending = sendMutation.isPending;

  const handleSend = () => {
    if (sending) return;
    sendMutation.mutate(
      { castId, message: message.trim() || undefined },
      {
        onSuccess: () => {
          success();
          Alert.alert('送信完了', 'リクエストを送りました！');
          setMessage('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>今夜行ける？</Text>
          <Text style={styles.subtitle}>メッセージを添えてリクエストを送りましょう</Text>
          <TextInput
            style={styles.input}
            placeholder="メッセージ（任意）"
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.sendText}>送る</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  sendText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
