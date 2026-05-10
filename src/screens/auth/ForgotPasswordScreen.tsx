// ============================================================
// YoruConnect - パスワードリセット画面
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

// -----------------------------------------------------------
// エラーメッセージの日本語化
// -----------------------------------------------------------

function translateError(message: string): string {
  if (message.includes('Network request failed') || message.includes('fetch')) {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  }
  if (message.includes('rate limit') || message.includes('Too many requests')) {
    return 'しばらく時間をおいてから再度お試しください。';
  }
  return 'エラーが発生しました。しばらくしてから再度お試しください。';
}

// -----------------------------------------------------------
// ForgotPasswordScreen
// -----------------------------------------------------------

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('有効なメールアドレスを入力してください。');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          // リダイレクト先（アプリのディープリンクに合わせて変更してください）
          redirectTo: 'yoruconnect://reset-password',
        },
      );

      if (resetError) {
        setError(translateError(resetError.message));
        return;
      }

      setIsSent(true);
    } catch (e) {
      setError('予期せぬエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              disabled={isLoading}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.appName}>YoruConnect</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <View style={styles.form}>
            {!isSent ? (
              // ---- 送信前フォーム ----
              <>
                <View style={styles.iconSection}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="lock-reset" size={36} color={COLORS.gold} />
                  </View>
                </View>

                <Text style={styles.formTitle}>パスワードのリセット</Text>
                <Text style={styles.formDescription}>
                  登録済みのメールアドレスを入力してください。{'\n'}
                  パスワード再設定用のメールをお送りします。
                </Text>

                {/* エラーメッセージ */}
                {error && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* メールアドレス入力 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>メールアドレス</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="email"
                      size={20}
                      color={COLORS.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="登録済みのメールアドレス"
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="send"
                      onSubmitEditing={handleSend}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* 送信ボタン */}
                <TouchableOpacity
                  style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <Text style={styles.sendButtonText}>リセットメールを送信</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // ---- 送信完了メッセージ ----
              <>
                <View style={styles.iconSection}>
                  <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                    <MaterialIcons name="mark-email-read" size={36} color={COLORS.success} />
                  </View>
                </View>

                <Text style={styles.formTitle}>メールを送信しました</Text>
                <Text style={styles.formDescription}>
                  <Text style={styles.emailHighlight}>{email}</Text>
                  {' '}宛にパスワード再設定メールを送信しました。{'\n\n'}
                  メールに記載のリンクからパスワードを再設定してください。{'\n\n'}
                  メールが届かない場合は迷惑メールフォルダもご確認ください。
                </Text>

                {/* 再送信ボタン */}
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => setIsSent(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resendButtonText}>メールを再送信する</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ログイン画面へ戻る */}
            <TouchableOpacity
              style={styles.backToLoginRow}
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back-ios" size={14} color={COLORS.gold} />
              <Text style={styles.backToLoginText}>ログイン画面へ戻る</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1,
  },

  // フォーム
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // アイコン
  iconSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: {
    borderColor: COLORS.success,
  },

  // テキスト
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  formDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emailHighlight: {
    color: COLORS.gold,
    fontWeight: '600',
  },

  // エラー
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 106, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 106, 0.3)',
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // 入力欄
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.text,
  },

  // 送信ボタン
  sendButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },

  // 再送信ボタン
  resendButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ログインへ戻る
  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backToLoginText: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: '600',
  },
});
