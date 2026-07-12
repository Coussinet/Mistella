// ============================================================
// Mistella - 今夜行ける！送信フッターボタン
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';

interface SendFooterProps {
  isSending: boolean;
  onPress: () => void;
}

export default function SendFooter({ isSending, onPress }: SendFooterProps) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
        onPress={onPress}
        disabled={isSending}
        activeOpacity={0.85}
      >
        {isSending ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <MaterialIcons
              name="local-fire-department"
              size={20}
              color={COLORS.background}
            />
            <Text style={styles.sendButtonText}>今夜行ける！を送信</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.lg,
    paddingVertical: 17,
    gap: SPACING.xs,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
