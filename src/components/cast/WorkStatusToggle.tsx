// ============================================================
// Mistella - 出勤ステータストグルコンポーネント
// ============================================================

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import type { WorkStatus } from '../../types';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface WorkStatusToggleProps {
  current: WorkStatus;
  onChange: (status: WorkStatus) => void;
  disabled?: boolean;
}

// -----------------------------------------------------------
// ステータス定義
// -----------------------------------------------------------

interface StatusOption {
  key: WorkStatus;
  label: string;
  activeColor: string;
  activeBg: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    key: 'working',
    label: '出勤中',
    activeColor: COLORS.success,
    activeBg: 'rgba(76, 255, 158, 0.15)',
  },
  {
    key: 'break',
    label: '休憩中',
    activeColor: '#FF9F4C',
    activeBg: 'rgba(255, 159, 76, 0.15)',
  },
  {
    key: 'off',
    label: '退勤',
    activeColor: COLORS.textSecondary,
    activeBg: 'rgba(142, 142, 153, 0.12)',
  },
];

// -----------------------------------------------------------
// WorkStatusToggle
// -----------------------------------------------------------

export default function WorkStatusToggle({
  current,
  onChange,
  disabled = false,
}: WorkStatusToggleProps) {
  return (
    <View style={styles.container}>
      {STATUS_OPTIONS.map((option) => {
        const isActive = current === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.button,
              isActive && {
                backgroundColor: option.activeBg,
                borderColor: option.activeColor,
              },
              !isActive && styles.buttonInactive,
              disabled && styles.buttonDisabled,
            ]}
            onPress={() => !disabled && onChange(option.key)}
            activeOpacity={0.75}
            disabled={disabled}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isActive
                    ? option.activeColor
                    : COLORS.textMuted,
                },
              ]}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? option.activeColor : COLORS.textMuted },
                isActive && styles.labelActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  buttonInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelActive: {
    fontWeight: '700',
  },
});
