// ============================================================
// Mistella - DiscoverScreen（さがす・顧客用）
// キャスト検索とマップを1画面に統合し、上部セグメントで
// リスト⇄マップを切り替える（Airbnb 型の探索画面）。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import PageHeader from '@/components/common/PageHeader';
import CastSearchScreen from '@/screens/customer/CastSearchScreen';
import MapScreen from '@/screens/customer/MapScreen';

type DiscoverMode = 'list' | 'map';

const MODES: { key: DiscoverMode; label: string; icon: 'view-agenda' | 'map' }[] = [
  { key: 'list', label: 'リスト', icon: 'view-agenda' },
  { key: 'map', label: 'マップ', icon: 'map' },
];

export default function DiscoverScreen() {
  const [mode, setMode] = useState<DiscoverMode>('list');
  // マップは初回切替時にマウント（位置情報許可を求めるタイミングを遅らせる）
  const [mapMounted, setMapMounted] = useState(false);

  const handleModeChange = (next: DiscoverMode) => {
    if (next === 'map') setMapMounted(true);
    setMode(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PageHeader
        title="さがす"
        description="気になる人とお店を、今いる場所から"
        compact
        action={
          <View style={styles.segment}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => handleModeChange(m.key)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <MaterialIcons
                  name={m.icon}
                  size={16}
                  color={active ? COLORS.background : COLORS.textSecondary}
                />
                <Text
                  style={[styles.segmentLabel, active && styles.segmentLabelActive]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        }
      />

      {/* 本体: 両ビューをマウントしたまま表示切替（状態・地図位置を保持） */}
      <View style={[styles.body, mode !== 'list' && styles.hidden]}>
        <CastSearchScreen />
      </View>
      {mapMounted && (
        <View style={[styles.body, mode !== 'map' && styles.hidden]}>
          <MapScreen />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  segmentItemActive: {
    backgroundColor: COLORS.gold,
  },
  segmentLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  segmentLabelActive: {
    color: COLORS.background,
  },
  body: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});
