// ============================================================
// Mistella - EmptyState 共通コンポーネント
// 一覧の空状態表示（アイコン + タイトル + 説明 + 任意のCTA）。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  /** CTA ボタン（省略可） */
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon} size={40} color={COLORS.gold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.2),
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 24,
    backgroundColor: withAlpha(COLORS.gold, 0.15),
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  actionText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gold,
  },
});
