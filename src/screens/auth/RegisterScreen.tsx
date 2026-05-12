// ============================================================
// Mistella - 新規登録画面
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
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList, UserRole } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// -----------------------------------------------------------
// エラーメッセージの日本語化
// -----------------------------------------------------------

function translateError(message: string): string {
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return 'このメールアドレスはすでに登録されています。';
  }
  if (message.includes('Password should be at least')) {
    return 'パスワードは6文字以上で入力してください。';
  }
  if (message.includes('Invalid email')) {
    return '有効なメールアドレスを入力してください。';
  }
  if (message.includes('Network request failed') || message.includes('fetch')) {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return '短時間に何度も試行されました。しばらく時間をおいてから再度お試しください。';
  }
  return 'エラーが発生しました。しばらくしてから再度お試しください。';
}

// -----------------------------------------------------------
// RegisterScreen
// -----------------------------------------------------------

export default function RegisterScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession, setUser, setProfile } = useAuthStore();

  const validate = (): string | null => {
    if (!nickname.trim()) return 'ニックネームを入力してください。';
    if (nickname.trim().length < 2) return 'ニックネームは2文字以上で入力してください。';
    if (!email.trim()) return 'メールアドレスを入力してください。';
    if (!/\S+@\S+\.\S+/.test(email.trim())) return '有効なメールアドレスを入力してください。';
    if (!password) return 'パスワードを入力してください。';
    if (password.length < 6) return 'パスワードは6文字以上で入力してください。';
    if (password !== passwordConfirm) return 'パスワードが一致しません。';
    if (!role) return 'ご利用区分を選択してください。';
    if (!agreedToTerms) return '利用規約に同意してください。';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. Supabase Auth でユーザー作成（role・nickname をメタデータとして渡す）
      //    DBトリガー on_auth_user_created が users / cast_profiles を自動作成する
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            nickname: nickname.trim(),
          },
        },
      });

      if (authError) {
        setError(translateError(authError.message));
        return;
      }

      if (!authData.user) {
        setError('アカウントの作成に失敗しました。');
        return;
      }

      // 2. セッション設定（メール確認不要なら即座にログイン）
      if (authData.session) {
        setSession(authData.session);
        setUser(authData.user);
        setProfile({
          id: authData.user.id,
          role: role!,
          nickname: nickname.trim(),
          avatar_url: null,
          bio: null,
          is_premium: false,
          created_at: new Date().toISOString(),
        });
      } else {
        // メール確認が必要な場合はログイン画面へ
        navigation.navigate('Login');
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
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              disabled={isLoading}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.appName}>Mistella</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>新規登録</Text>
            <Text style={styles.formSubTitle}>アカウントを作成してください</Text>

            {/* エラーメッセージ */}
            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ご利用区分 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ご利用区分</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'cast' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('cast')}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="face"
                    size={24}
                    color={role === 'cast' ? COLORS.gold : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'cast' && styles.roleButtonTextActive,
                    ]}
                  >
                    キャスト
                  </Text>
                  <Text
                    style={[
                      styles.roleButtonSub,
                      role === 'cast' && styles.roleButtonSubActive,
                    ]}
                  >
                    女性
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'customer' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('customer')}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={role === 'customer' ? COLORS.gold : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'customer' && styles.roleButtonTextActive,
                    ]}
                  >
                    お客様
                  </Text>
                  <Text
                    style={[
                      styles.roleButtonSub,
                      role === 'customer' && styles.roleButtonSubActive,
                    ]}
                  >
                    男性
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ニックネーム */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ニックネーム</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="badge"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="表示名を入力（2〜20文字）"
                  placeholderTextColor={COLORS.textMuted}
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={20}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

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
                  placeholder="6文字以上"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  returnKeyType="next"
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

            {/* パスワード確認 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード（確認）</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputWithToggle]}
                  placeholder="パスワードを再入力"
                  placeholderTextColor={COLORS.textMuted}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  secureTextEntry={!isPasswordConfirmVisible}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordConfirmVisible(!isPasswordConfirmVisible)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name={isPasswordConfirmVisible ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 利用規約同意チェックボックス */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                {agreedToTerms && (
                  <MaterialIcons name="check" size={14} color={COLORS.background} />
                )}
              </View>
              <Text style={styles.termsText}>
                <Text style={styles.termsLink}>利用規約</Text>
                {'・'}
                <Text style={styles.termsLink}>プライバシーポリシー</Text>
                {'に同意します'}
              </Text>
            </TouchableOpacity>

            {/* 登録ボタン */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.registerButtonText}>アカウント登録</Text>
              )}
            </TouchableOpacity>

            {/* ログインリンク */}
            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkLabel}>すでにアカウントをお持ちの方は</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>ログイン</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 48,
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
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  formSubTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
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

  // ロール選択
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    gap: 4,
  },
  roleButtonActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleButtonTextActive: {
    color: COLORS.gold,
  },
  roleButtonSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  roleButtonSubActive: {
    color: 'rgba(201, 168, 76, 0.7)',
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

  // 利用規約
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  termsLink: {
    color: COLORS.gold,
    textDecorationLine: 'underline',
  },

  // 登録ボタン
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },

  // ログインリンク
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  loginLinkLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
