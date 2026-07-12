// ============================================================
// Mistella - FormField 共通コンポーネント
// ラベル + TextInput + エラーメッセージ。フォーム画面で共用する。
// ============================================================

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** 必須マークを表示 */
  required?: boolean;
}

export default function FormField({
  label,
  error,
  required = false,
  style,
  ...inputProps
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          styles.input,
          inputProps.multiline && styles.multiline,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={COLORS.textMuted}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xxs,
  },
});
