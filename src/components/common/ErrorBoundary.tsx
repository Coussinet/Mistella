// ============================================================
// Mistella - ErrorBoundary
// 予期しないレンダーエラーで本番アプリが強制終了しないための最終防壁。
// エラー時は復帰ボタン付きの画面を表示し、state をリセットして再描画する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // 将来 Sentry 等を導入したらここで送信する
    if (__DEV__) console.error('ErrorBoundary caught:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="nights-stay" size={40} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>問題が発生しました</Text>
          <Text style={styles.description}>
            ご不便をおかけしています。{'\n'}下のボタンから元の画面に戻れます。
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.85}>
            <MaterialIcons name="refresh" size={18} color={COLORS.background} />
            <Text style={styles.buttonText}>アプリに戻る</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.25),
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.background,
  },
});
