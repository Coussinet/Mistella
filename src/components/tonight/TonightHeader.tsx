// ============================================================
// Mistella - 今夜行ける！画面ヘッダー
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING, withAlpha } from '@/constants/theme';

export default function TonightHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <MaterialIcons name="local-fire-department" size={28} color={COLORS.gold} />
      </View>
      <Text style={styles.title}>今夜行ける！</Text>
      <Text style={styles.subtitle}>行きたい気持ちをキャストに伝えよう</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xs,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: withAlpha(COLORS.gold, 0.12),
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxs,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
