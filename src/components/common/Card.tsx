// ============================================================
// Mistella - Card 共通コンポーネント
// surface 背景 + 角丸 + 控えめな影のコンテナ。
// ============================================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** ゴールド枠で強調（Sponsored 等） */
  highlighted?: boolean;
}

export default function Card({ children, style, highlighted = false }: CardProps) {
  return (
    <View style={[styles.card, highlighted && styles.highlighted, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  highlighted: {
    borderColor: COLORS.gold,
  },
});
