// ============================================================
// Mistella - 今夜出勤中キャストの横スクロールカルーセル（顧客ホーム用）
// 出勤中のキャストをアプリの1画面目で即座に見せる。
// ============================================================

import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import { useMapCasts } from '@/hooks/queries/useNearbyCasts';
import type { CastProfileWithUser } from '@/types';

interface WorkingCastsCarouselProps {
  onPressCast: (userId: string) => void;
}

export default function WorkingCastsCarousel({ onPressCast }: WorkingCastsCarouselProps) {
  const { data } = useMapCasts(true);
  const casts = (data ?? []).filter((c) => c.is_working);

  if (casts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.liveDot} />
        <Text style={styles.headerText}>今夜出勤中のキャスト</Text>
        <Text style={styles.countText}>{casts.length}人</Text>
      </View>
      <FlatList
        horizontal
        data={casts}
        keyExtractor={(item: CastProfileWithUser) => item.user_id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onPressCast(item.user_id)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarRing}>
              <Avatar
                uri={item.user?.avatar_url ?? null}
                size={60}
                nickname={item.user?.nickname}
              />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.user?.nickname ?? ''}
            </Text>
            {item.shop_name ? (
              <Text style={styles.shop} numberOfLines={1}>
                {item.shop_name}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  headerText: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  avatarRing: {
    padding: 3,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xxs,
    maxWidth: 72,
  },
  shop: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    maxWidth: 72,
  },
});
