// ============================================================
// Mistella - 一言メッセージ入力（最大100文字）
// ============================================================

import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';
import SectionCard from './SectionCard';

const MAX_LENGTH = 100;

interface MessageComposerProps {
  value: string;
  onChange: (text: string) => void;
}

export default function MessageComposer({ value, onChange }: MessageComposerProps) {
  return (
    <SectionCard>
      <Text style={styles.sectionLabel}>メッセージ（任意）</Text>
      <TextInput
        style={styles.input}
        placeholder="一言メッセージを添えましょう（例: 今夜21時頃お邪魔したいです！）"
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX_LENGTH))}
        multiline
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>
        {value.length}/{MAX_LENGTH}
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  input: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: SPACING.sm,
    minHeight: 90,
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
});
