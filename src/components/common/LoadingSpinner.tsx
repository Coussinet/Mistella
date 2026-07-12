// ============================================================
// Mistella - LoadingSpinner 共通コンポーネント
// ============================================================

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface LoadingSpinnerProps {
  /** true のとき全画面オーバーレイ表示。false のときインライン表示。 */
  fullScreen?: boolean;
  /** 全画面表示時のメッセージ（省略可） */
  message?: string;
  /** スピナーのサイズ（インライン用） */
  size?: 'small' | 'large';
}

// -----------------------------------------------------------
// LoadingSpinner
// -----------------------------------------------------------

export default function LoadingSpinner({
  fullScreen = false,
  message,
  size = 'large',
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={COLORS.gold} />
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
