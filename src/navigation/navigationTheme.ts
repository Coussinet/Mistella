// ============================================================
// Mistella - ナビゲーション共通テーマ
// スタックヘッダーと、安全領域に対応したボトムタブのスタイルを一元管理する。
// ============================================================

import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SHADOWS, RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';

/** ネイティブスタック共通のヘッダー設定 */
export const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.background },
  headerTintColor: COLORS.text,
  headerShadowVisible: false,
  headerTitleStyle: { color: COLORS.text, ...TYPOGRAPHY.h3 },
  contentStyle: { backgroundColor: COLORS.background },
};

export const tabBarStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderTopWidth: 0,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: withAlpha(COLORS.text, 0.09),
    paddingHorizontal: SPACING.xs,
    paddingTop: SPACING.xs,
    ...SHADOWS.floating,
  },
  tabBarLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  tabBarItem: {
    minHeight: 52,
  },
  badge: {
    backgroundColor: COLORS.error,
    color: COLORS.text,
    fontSize: 10,
  },
});
