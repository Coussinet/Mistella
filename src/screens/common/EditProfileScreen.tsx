// ============================================================
// Mistella - EditProfileScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { getCastProfile, updateProfile, upsertCastProfile } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { CastProfile } from '../../types';
import { uploadImage } from '../../utils/imageUtils';

// -----------------------------------------------------------
// ラベル付き入力コンポーネント
// -----------------------------------------------------------
type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
};

function LabeledInput({
  label, value, onChangeText, placeholder, multiline, maxLength,
}: LabeledInputProps) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multilineInput: { minHeight: 90 },
});

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, profile, castProfile, setProfile, setCastProfile } = useAuthStore();

  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  // キャスト専用フィールド
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [localCastProfile, setLocalCastProfile] = useState<CastProfile | null>(castProfile);

  const [saving, setSaving] = useState(false);

  const isCast = profile?.role === 'cast';

  useEffect(() => {
    if (!isCast || !user) return;
    const fetchCast = async () => {
      try {
        const data = await getCastProfile(user.id);
        setLocalCastProfile(data);
        setShopName(data.shop_name ?? '');
        setShopAddress(data.shop_address ?? '');
        setPriceInfo(data.price_info ?? '');
      } catch {
        // プロフィール未作成の場合は無視
      }
    };
    fetchCast();
  }, [isCast, user]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!nickname.trim()) {
      Alert.alert('エラー', 'ニックネームを入力してください。');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;

      // アバター変更時はアップロード
      if (avatarChanged && avatarUri) {
        avatarUrl = await uploadImage(
          avatarUri,
          'avatars',
          `${user.id}/avatar.jpg`,
        );
      }

      const updatedProfile = await updateProfile(user.id, {
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      setProfile(updatedProfile);

      // キャストプロフィール保存
      if (isCast) {
        const updatedCast = await upsertCastProfile(user.id, {
          shop_name: shopName.trim() || null,
          shop_address: shopAddress.trim() || null,
          price_info: priceInfo.trim() || null,
        });
        setCastProfile(updatedCast);
      }

      Alert.alert('完了', 'プロフィールを更新しました。', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* アバター */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <MaterialIcons name="person" size={40} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <MaterialIcons name="camera-alt" size={14} color={COLORS.background} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>タップして変更</Text>
        </View>

        {/* 基本情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <LabeledInput
            label="ニックネーム *"
            value={nickname}
            onChangeText={setNickname}
            placeholder="ニックネームを入力"
            maxLength={30}
          />
          <LabeledInput
            label="自己紹介"
            value={bio}
            onChangeText={setBio}
            placeholder="自己紹介を入力（任意）"
            multiline
            maxLength={200}
          />
        </View>

        {/* キャスト専用セクション */}
        {isCast && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>店舗情報</Text>
            <LabeledInput
              label="店舗名"
              value={shopName}
              onChangeText={setShopName}
              placeholder="勤務店舗名を入力"
              maxLength={50}
            />
            <LabeledInput
              label="住所・エリア"
              value={shopAddress}
              onChangeText={setShopAddress}
              placeholder="エリア・住所を入力"
              maxLength={100}
            />
            <LabeledInput
              label="料金システム"
              value={priceInfo}
              onChangeText={setPriceInfo}
              placeholder="料金システムを入力"
              multiline
              maxLength={200}
            />
          </View>
        )}

        {/* 保存ボタン */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <>
              <MaterialIcons name="check" size={18} color={COLORS.background} />
              <Text style={styles.saveButtonText}>保存する</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
