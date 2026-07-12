// ============================================================
// Mistella - ErrorView 共通コンポーネント
// クエリ失敗時の表示 + 再試行ボタン。React Query の refetch と直結する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import { toErrorMessage } from '@/utils/showError';

interface ErrorViewProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorView({ error, message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
      <Text style={styles.message}>
        {message ?? toErrorMessage(error, '読み込みに失敗しました。')}
      </Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retry} onPress={onRetry} activeOpacity={0.8}>
          <MaterialIcons name="refresh" size={18} color={COLORS.gold} />
          <Text style={styles.retryText}>再試行</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 24,
    backgroundColor: withAlpha(COLORS.gold, 0.12),
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  retryText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gold,
  },
});
