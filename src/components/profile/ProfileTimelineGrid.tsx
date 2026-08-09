// ============================================================
// Mistella - ProfileTimelineGrid
// プロフィール画面の投稿グリッド（3列）関連パーツ。
// グリッドアイテム・セクションヘッダー・空状態を提供する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';
import type { Timeline } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** 3列グリッドの1アイテムのサイズ */
export const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

// -----------------------------------------------------------
// グリッドアイテム
// -----------------------------------------------------------

export function TimelineGridItem({ item }: { item: Timeline }) {
  const hasMedia = !!item.media_url;
  return (
    <View style={styles.gridItem}>
      {item.media_url && item.media_type === 'image' ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} resizeMode="cover" />
      ) : item.media_url && item.media_type === 'video' ? (
        <View style={[styles.gridImage, styles.gridVideo]}>
          <MaterialIcons name="play-circle-outline" size={28} color={COLORS.gold} />
        </View>
      ) : (
        <View style={[styles.gridImage, styles.gridText]}>
          <Text style={styles.gridTextPreview} numberOfLines={3}>
            {item.content ?? ''}
          </Text>
        </View>
      )}
      {hasMedia && item.content ? (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.86)']}
          style={styles.messageOverlay}
          pointerEvents="none"
        >
          <Text style={styles.mediaMessage} numberOfLines={2}>{item.content}</Text>
        </LinearGradient>
      ) : null}
    </View>
  );
}

// -----------------------------------------------------------
// セクションヘッダー / 空状態
// -----------------------------------------------------------

export function TimelineSectionHeader({ count }: { count: number }) {
  if (count === 0) {
    return (
      <View style={styles.emptyTimeline}>
        <MaterialIcons name="dynamic-feed" size={40} color={COLORS.textMuted} />
        <Text style={styles.emptyTimelineText}>まだ投稿がありません</Text>
      </View>
    );
  }
  return (
    <View style={styles.gridHeader}>
      <MaterialIcons name="grid-on" size={18} color={COLORS.textSecondary} />
      <Text style={styles.gridHeaderText}>投稿</Text>
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 0.5,
    backgroundColor: COLORS.background,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  messageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 54,
    justifyContent: 'flex-end',
    padding: 7,
  },
  mediaMessage: {
    color: COLORS.text,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
  },
  gridVideo: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridText: {
    backgroundColor: COLORS.surface,
    padding: 6,
    justifyContent: 'center',
  },
  gridTextPreview: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  gridHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  emptyTimelineText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
