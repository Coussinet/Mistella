// ============================================================
// Mistella - Screen 共通ラッパー
// SafeArea + 背景色 + フローティングタブバー分の下部余白を一元管理する。
// タブ直下の画面では tabBarSpacing を有効にすること。
// ============================================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

/** フローティングタブバー（高さ76 + 下マージン10）と重ならないための余白 */
export const TAB_BAR_SPACE = 96;

interface ScreenProps {
  children: React.ReactNode;
  /** SafeArea を適用する辺（デフォルト: top のみ。ヘッダーあり画面では [] を渡す） */
  edges?: Edge[];
  /** フローティングタブバー分の下部パディングを確保するか */
  tabBarSpacing?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Screen({
  children,
  edges = ['top'],
  tabBarSpacing = false,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
      {tabBarSpacing ? <View style={{ height: 0 }} /> : null}
    </SafeAreaView>
  );
}

/** FlatList / ScrollView の contentContainerStyle に足す下部余白 */
export const tabBarContentInset = { paddingBottom: TAB_BAR_SPACE } as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
