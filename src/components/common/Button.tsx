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
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // --- Variants ---

  primary: {
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryLabel: {
    color: COLORS.background,
  },

  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
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
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dangerLabel: {
    color: COLORS.text,
  },

  disabled: {
    opacity: 0.45,
  },
});
