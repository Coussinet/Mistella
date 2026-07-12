// ============================================================
// Mistella - 送信先モード切替
// 全キャスト / お気に入り / 特定のキャスト / 現在地周辺 を切り替える。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';
import { tapLight } from '@/utils/haptics';

// -----------------------------------------------------------
// 送信先モード
// -----------------------------------------------------------

export type SendMode = 'broadcast' | 'favorites' | 'specific' | 'nearby';

interface ModeItem {
  key: SendMode;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const MODE_ROWS: ModeItem[][] = [
  [
    { key: 'broadcast', icon: 'campaign', label: '全キャスト' },
    { key: 'favorites', icon: 'favorite', label: 'お気に入り' },
  ],
  [
    { key: 'specific', icon: 'person-search', label: '特定のキャスト' },
    { key: 'nearby', icon: 'near-me', label: '現在地周辺' },
  ],
];

interface SendModeSelectorProps {
  mode: SendMode;
  onChange: (mode: SendMode) => void;
}

export default function SendModeSelector({ mode, onChange }: SendModeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>送信先を選択</Text>
      {MODE_ROWS.map((row, rowIndex) => (
        <View
          key={row[0].key}
          style={[styles.row, rowIndex > 0 && styles.rowSpacing]}
        >
          {row.map((item) => {
            const active = mode === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.button, active && styles.buttonActive]}
                onPress={() => {
                  tapLight();
                  onChange(item.key);
                }}
              >
                <MaterialIcons
                  name={item.icon}
                  size={18}
                  color={active ? COLORS.background : COLORS.gold}
                />
                <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  rowSpacing: {
    marginTop: SPACING.xs,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 5,
  },
  buttonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  buttonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextActive: {
    color: COLORS.background,
  },
});
