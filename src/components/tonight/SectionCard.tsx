// ============================================================
// Mistella - 今夜行ける！画面のセクションカード
// 各ピッカー・入力欄を包む共通のカード見た目。
// ============================================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';

interface SectionCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function SectionCard({ style, children }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
});
