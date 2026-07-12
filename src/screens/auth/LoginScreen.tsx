// ============================================================
// Mistella - ログイン画面
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { COLORS } from '@/constants/colors';
import { withAlpha } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { AuthStackParamList, User } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// -----------------------------------------------------------
// エラーメッセージの日本語化
// -----------------------------------------------------------

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (message.includes('Email not confirmed')) {
    return 'メールアドレスの確認が完了していません。確認メールをご確認ください。';
  }
  if (message.includes('Too many requests')) {
    return 'しばらく時間をおいてから再度お試しください。';
  }
  if (message.includes('Network request failed') || message.includes('fetch')) {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  }
  return 'エラーが発生しました。しばらくしてから再度お試しください。';
}

// -----------------------------------------------------------
// LoginScreen
// -----------------------------------------------------------

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession, setUser, setProfile } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(translateError(authError.message));
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);

        // プロフィール取得
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData as unknown as User);
        }
      }
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
          {/* ロゴ・アプリ名 */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="nights-stay" size={40} color={COLORS.gold} />
            </View>
            <Text style={styles.appName}>Mistella</Text>
            <Text style={styles.tagline}>夜の出会いをもっと特別に</Text>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>ログイン</Text>

            {/* エラーメッセージ */}
            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* メールアドレス */}
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
                  placeholder="例: user@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* パスワード */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputWithToggle]}
                  placeholder="パスワードを入力"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* パスワードを忘れた方 */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordLink}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>パスワードをお忘れの方</Text>
            </TouchableOpacity>

            {/* ログインボタン */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.loginButtonText}>ログイン</Text>
              )}
            </TouchableOpacity>

            {/* 区切り線 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 新規登録 */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>新規アカウント登録</Text>
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

  // ロゴセクション
  logoSection: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  // フォーム
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },

  // エラー
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(COLORS.error, 0.1),
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.error, 0.3),
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
    marginBottom: 16,
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
  inputWithToggle: {
    paddingRight: 0,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  // パスワード忘れリンク
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: COLORS.gold,
    textDecorationLine: 'underline',
  },

  // ログインボタン
  loginButton: {
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
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },

  // 区切り線
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // 登録ボタン
  registerButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    backgroundColor: 'transparent',
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 0.3,
  },
});
