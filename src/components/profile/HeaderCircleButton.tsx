// ============================================================
// Mistella - HeaderCircleButton
// 透過ナビゲーションヘッダー用の円形スクリム付きアイコンボタン。
// ヒーロー写真の上でも視認できるよう半透明の円形背景を敷く。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/colors';

interface HeaderCircleButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}

export default function HeaderCircleButton({
  icon,
  onPress,
  accessibilityLabel,
}: HeaderCircleButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <MaterialIcons name={icon} size={22} color={COLORS.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 10, 15, 0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
