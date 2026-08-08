// ============================================================
// Mistella - PageHeader
// 画面の目的を明確にする、日本語UI向けの共通見出し。
// ============================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export default function PageHeader({
  title,
  description,
  action,
  compact = false,
}: PageHeaderProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.copy}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  compact: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  compactTitle: {
    ...TYPOGRAPHY.h2,
  },
  description: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  action: {
    flexShrink: 0,
  },
});
