// ============================================================
// YoruConnect - ルートナビゲーター
// セッション状態に応じて認証フローまたはメインアプリを表示する。
// ============================================================

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import CastTabNavigator from './CastTabNavigator';
import CustomerTabNavigator from './CustomerTabNavigator';

// -----------------------------------------------------------
// ローディング画面
// -----------------------------------------------------------

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.gold} />
    </View>
  );
}

// -----------------------------------------------------------
// AppNavigator
// -----------------------------------------------------------

export default function AppNavigator() {
  const { session, profile, isLoading } = useAuthStore();

  // セッション確認中はローディング表示
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 未ログイン → 認証フロー
  if (!session) {
    return <AuthNavigator />;
  }

  // ログイン済み: ロールに応じてナビゲーターを切り替え
  // profile がまだ取得中の場合もローディングを表示
  if (!profile) {
    return <LoadingScreen />;
  }

  if (profile.role === 'cast') {
    return <CastTabNavigator />;
  }

  return <CustomerTabNavigator />;
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
