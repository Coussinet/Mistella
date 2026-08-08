// ============================================================
// Mistella - ナビゲーション共通テーマ
// スタックヘッダーとガラス風フローティングタブバーのスタイルを一元管理する。
// ============================================================

import { Platform, StyleSheet } from 'react-native';
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

/** ガラス風タブバーの背景（iOS はブラー併用前提で薄め） */
const GLASS_BG = Platform.OS === 'ios' ? COLORS.glassBg : COLORS.glassBgSolid;

export const tabBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: GLASS_BG,
    borderTopWidth: 0,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.xl,
    height: 72,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.text, 0.1),
    ...SHADOWS.floating,
  },
  tabBarLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  tabBarItem: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxs,
  },
  badge: {
    backgroundColor: COLORS.error,
    color: COLORS.text,
    fontSize: 10,
  },
});
