// ============================================================
// Mistella - Skeleton 共通コンポーネント
// reanimated によるパルスアニメーション付きプレースホルダー。
// 一覧のローディングはスピナーではなくこれを使う。
// ============================================================

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: COLORS.surfaceLight },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** アバター + 2行テキストのリスト行スケルトン */
export function SkeletonListItem() {
  return (
    <View style={styles.row}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.rowBody}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
    </View>
  );
}

/** リスト画面用スケルトン（N行） */
export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

/** カードグリッド用スケルトン */
export function SkeletonCard({ height = 180 }: { height?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={height} borderRadius={RADIUS.lg} />
      <Skeleton width="60%" height={13} style={{ marginTop: SPACING.xs }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  rowBody: {
    flex: 1,
    gap: SPACING.xs,
  },
  card: {
    flex: 1,
    margin: SPACING.xs,
  },
});
