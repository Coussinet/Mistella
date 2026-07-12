// -----------------------------------------------------------
// Mistella - デザイントークン
// スペーシング・角丸・タイポグラフィ・シャドウを一元管理する。
// 色は colors.ts の COLORS を参照すること。
// -----------------------------------------------------------

import type { TextStyle } from 'react-native';
import { COLORS } from './colors';

// ---- スペーシング（4px ベース） ------------------------------

export const SPACING = {
  /** 4 */
  xxs: 4,
  /** 8 */
  xs: 8,
  /** 12 */
  sm: 12,
  /** 16 */
  md: 16,
  /** 20 */
  lg: 20,
  /** 24 */
  xl: 24,
  /** 32 */
  xxl: 32,
  /** 48 */
  xxxl: 48,
} as const;

// ---- 角丸 ---------------------------------------------------

export const RADIUS = {
  /** 8: 小さめのチップ・バッジ */
  sm: 8,
  /** 12: 入力欄・小カード */
  md: 12,
  /** 16: カード */
  lg: 16,
  /** 20: シート・大カード */
  xl: 20,
  /** 28: フローティングタブバー・ピル型ボタン */
  pill: 28,
  /** 円形（アバター等は width/2 を優先） */
  full: 999,
} as const;

// ---- タイポグラフィ -----------------------------------------

type TypographyPreset = Pick<
  TextStyle,
  'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'
>;

export const TYPOGRAPHY = {
  /** 画面タイトル */
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: 0.5 },
  /** セクション見出し */
  h2: { fontSize: 20, fontWeight: '700', lineHeight: 28, letterSpacing: 0.5 },
  /** カードタイトル・小見出し */
  h3: { fontSize: 16, fontWeight: '600', lineHeight: 22, letterSpacing: 0.3 },
  /** 本文 */
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  /** 本文（強調） */
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  /** 補足・メタ情報 */
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  /** フォームラベル・タブラベル */
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0.2 },
} as const satisfies Record<string, TypographyPreset>;

// ---- シャドウ ------------------------------------------------

export const SHADOWS = {
  /** カード用の控えめな影 */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  /** フローティング要素（FAB・タブバー） */
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  /** ゴールドの発光（アクセント要素） */
  glow: {
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ---- ヘルパー ------------------------------------------------

/**
 * HEX カラーにアルファを適用して rgba() 文字列を返す。
 * 例: withAlpha(COLORS.gold, 0.15) => 'rgba(201, 168, 76, 0.15)'
 */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
