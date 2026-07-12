// ============================================================
// Mistella - ChipSelector 共通コンポーネント
// 選択式チップ（単一選択 / 複数選択）。フォーム画面で共用する。
// 複数選択はカンマ区切り文字列として値を保持する（既存データ互換）。
// ============================================================

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { withAlpha } from '@/constants/theme';

type ChipSelectorProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
};

/** 単一選択チップ（血液型・年収など） */
export function ChipSelector({ label, options, value, onChange }: ChipSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** 複数選択チップ（カンマ区切り文字列で保持） */
export function MultiChipSelector({ label, options, value, onChange }: ChipSelectorProps) {
  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next.join(', '));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}（複数選択可）</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, selected.includes(opt) && styles.chipActive]}
            onPress={() => toggle(opt)}
          >
            <Text style={[styles.chipText, selected.includes(opt) && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
  },
  chipActive: {
    borderColor: COLORS.gold,
    backgroundColor: withAlpha(COLORS.gold, 0.15),
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13 },
  chipTextActive: { color: COLORS.gold, fontWeight: '600' },
});
