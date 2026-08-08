// ============================================================
// Mistella - 共通ボタンコンポーネント
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** MaterialIcons のアイコン名 */
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}

// -----------------------------------------------------------
// Button
// -----------------------------------------------------------

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.background : COLORS.gold}
        />
      ) : (
        <>
          {icon && (
            <MaterialIcons
              name={icon}
              size={18}
              color={variant === 'primary' ? COLORS.background : variant === 'danger' ? COLORS.text : COLORS.gold}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, styles[`${variant}Label`]]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    ...TYPOGRAPHY.bodyBold,
    letterSpacing: 0.2,
  },

  // --- Variants ---

  primary: {
    backgroundColor: COLORS.gold,
    ...SHADOWS.glow,
  },
  primaryLabel: {
    color: COLORS.background,
  },

  secondary: {
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.65),
  },
  secondaryLabel: {
    color: COLORS.gold,
  },

  ghost: {
    backgroundColor: 'transparent',
  },
  ghostLabel: {
    color: COLORS.gold,
  },

  danger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.card,
  },
  dangerLabel: {
    color: COLORS.text,
  },

  disabled: {
    opacity: 0.45,
  },
});
