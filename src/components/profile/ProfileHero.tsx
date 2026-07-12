// ============================================================
// Mistella - ProfileHero
// プロフィール画面のフルブリードヒーロー写真。
// - 画面幅いっぱい・高さ HERO_HEIGHT の写真（なければ頭文字プレースホルダー）
// - 下部に GRADIENTS.photoOverlay を重ねて名前・出勤バッジ・店舗情報を表示
// - スクロールに 0.5 倍速で追従するパララックス + 引っ張り下げで拡大
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import type { CastProfile, User, WorkStatus } from '@/types';

/** ヒーロー写真の高さ */
export const HERO_HEIGHT = 420;

// -----------------------------------------------------------
// 出勤ステータスバッジ
// -----------------------------------------------------------

const WORK_STATUS_CONFIG: Record<WorkStatus, { label: string; color: string }> = {
  working: { label: '出勤中', color: COLORS.success },
  break: { label: '休憩中', color: COLORS.gold },
  off: { label: 'オフ', color: COLORS.textMuted },
};

export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const { label, color } = WORK_STATUS_CONFIG[status];
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

// -----------------------------------------------------------
// ヒーロー本体
// -----------------------------------------------------------

interface ProfileHeroProps {
  user: User;
  castProfile: CastProfile | null;
  /** 親の Animated.FlatList のスクロールオフセット */
  scrollY: SharedValue<number>;
}

export default function ProfileHero({ user, castProfile, scrollY }: ProfileHeroProps) {
  // パララックス: 上スクロール時は 0.5 倍速で追従、
  // 引っ張り下げ時はギャップを埋めるように拡大する。
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.5],
        ),
      },
      {
        scale: interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [2, 1, 1]),
      },
    ],
  }));

  const isCast = user.role === 'cast';
  const initial = user.nickname?.trim().charAt(0) || '?';

  return (
    <Animated.View style={[styles.hero, parallaxStyle]}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.photo} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[withAlpha(COLORS.gold, 0.45), COLORS.surfaceLight, COLORS.background]}
          style={[styles.photo, styles.placeholder]}
        >
          <Text style={styles.placeholderInitial}>{initial}</Text>
        </LinearGradient>
      )}

      {/* 写真下部の読みやすさ確保用オーバーレイ */}
      <LinearGradient colors={GRADIENTS.photoOverlay} style={styles.overlay} />

      {/* 名前・出勤バッジ・店舗情報 */}
      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname} numberOfLines={1}>
            {user.nickname}
          </Text>
          {isCast && castProfile && <WorkStatusBadge status={castProfile.work_status} />}
        </View>
        {isCast && castProfile?.shop_name ? (
          <View style={styles.shopRow}>
            <MaterialIcons name="store" size={13} color={COLORS.goldLight} />
            <Text style={styles.shopName} numberOfLines={1}>
              {castProfile.shop_name}
            </Text>
          </View>
        ) : null}
        {isCast && castProfile?.shop_address ? (
          <View style={styles.shopRow}>
            <MaterialIcons name="place" size={13} color={COLORS.textSecondary} />
            <Text style={styles.shopAddress} numberOfLines={1}>
              {castProfile.shop_address}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: COLORS.surface,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    color: COLORS.goldLight,
    fontSize: 120,
    fontWeight: '700',
    letterSpacing: 2,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  meta: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
    gap: SPACING.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nickname: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    flexShrink: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    gap: 4,
    backgroundColor: 'rgba(10, 10, 15, 0.45)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  shopName: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    flexShrink: 1,
  },
  shopAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
});
