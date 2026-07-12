// ============================================================
// Mistella - ナビゲーション共通テーマ
// スタックヘッダーとガラス風フローティングタブバーのスタイルを一元管理する。
// ============================================================

import { Platform, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SHADOWS, RADIUS } from '@/constants/theme';

/** ネイティブスタック共通のヘッダー設定 */
export const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
  headerTitleStyle: { color: COLORS.text, fontWeight: '600' as const },
  contentStyle: { backgroundColor: COLORS.background },
};

/** ガラス風タブバーの背景（iOS はブラー併用前提で薄め） */
const GLASS_BG = Platform.OS === 'ios' ? COLORS.glassBg : COLORS.glassBgSolid;

export const tabBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: GLASS_BG,
    borderTopWidth: 0,
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: RADIUS.pill,
    height: 76,
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.floating,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  tabBarItem: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  badge: {
    backgroundColor: COLORS.error,
    color: COLORS.text,
    fontSize: 10,
  },
});
