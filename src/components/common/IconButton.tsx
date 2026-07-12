// ============================================================
// Mistella - IconButton 共通コンポーネント
// 44pt のタッチターゲットを保証したアイコンボタン。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';

interface IconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function IconButton({
  icon,
  onPress,
  size = 24,
  color = COLORS.text,
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <MaterialIcons name={icon} size={size} color={disabled ? COLORS.textMuted : color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
