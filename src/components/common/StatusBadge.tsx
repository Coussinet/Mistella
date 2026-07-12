// ============================================================
// Mistella - ステータスバッジコンポーネント
// ============================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { withAlpha } from '@/constants/theme';
import type { WorkStatus } from '@/types';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface StatusBadgeProps {
  status: WorkStatus | 'matched' | 'pending';
  size?: 'small' | 'medium';
}

// -----------------------------------------------------------
// ステータス設定マップ
// -----------------------------------------------------------

const STATUS_CONFIG: Record<
  WorkStatus | 'matched' | 'pending',
  { label: string; color: string; bg: string }
> = {
  working: {
    label: '出勤中',
    color: COLORS.success,
    bg: withAlpha(COLORS.success, 0.15),
  },
  break: {
    label: '休憩中',
    color: COLORS.accentWarm,
    bg: withAlpha(COLORS.accentWarm, 0.15),
  },
  off: {
    label: '退勤',
    color: COLORS.textSecondary,
    bg: withAlpha(COLORS.textSecondary, 0.15),
  },
  matched: {
    label: 'マッチ済み',
    color: COLORS.gold,
    bg: withAlpha(COLORS.gold, 0.15),
  },
  pending: {
    label: '未確認',
    color: COLORS.neonBlue,
    bg: withAlpha(COLORS.neonBlue, 0.15),
  },
};

// -----------------------------------------------------------
// StatusBadge
// -----------------------------------------------------------

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.color + '55' },
        isSmall && styles.badgeSmall,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: config.color },
          isSmall && styles.dotSmall,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSmall && styles.labelSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    gap: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 10,
  },
});
