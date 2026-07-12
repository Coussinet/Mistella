// ============================================================
// Mistella - 全キャスト投稿の説明パネル
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';
import SectionCard from './SectionCard';

export default function BroadcastInfoPanel() {
  return (
    <SectionCard>
      <View style={styles.row}>
        <MaterialIcons name="campaign" size={28} color={COLORS.gold} />
        <View style={styles.body}>
          <Text style={styles.title}>全キャストに投稿</Text>
          <Text style={styles.desc}>
            出勤中・未出勤を問わず全ての女性キャストに届きます。{'\n'}
            キャストはあなたの投稿を見て「興味あり」や{'\n'}
            メッセージで反応できます。
          </Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  body: {
    flex: 1,
    gap: SPACING.xxs,
  },
  title: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
