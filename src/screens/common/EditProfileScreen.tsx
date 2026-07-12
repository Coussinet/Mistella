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
import { COLORS } from '@/constants/colors';
import { withAlpha } from '@/constants/theme';
import {
  getCastProfile,
  getCustomerProfile,
  updateProfile,
  upsertCastProfile,
  upsertCustomerProfile,
} from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { CastProfile, CustomerProfile } from '@/types';
import { uploadImage } from '@/utils/imageUtils';

// -----------------------------------------------------------
// ラベル付き入力
// -----------------------------------------------------------
type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'number-pad';
};

function LabeledInput({ label, value, onChangeText, placeholder, multiline, maxLength, keyboardType }: LabeledInputProps) {
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
        keyboardType={keyboardType ?? 'default'}
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
// 選択式ボタン（年収・血液型など）
// -----------------------------------------------------------
function ChipSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={chipStyles.wrapper}>
      <Text style={chipStyles.label}>{label}</Text>
      <View style={chipStyles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[chipStyles.chip, value === opt && chipStyles.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[chipStyles.chipText, value === opt && chipStyles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MultiChipSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next.join(', '));
  };

  return (
    <View style={chipStyles.wrapper}>
      <Text style={chipStyles.label}>{label}（複数選択可）</Text>
      <View style={chipStyles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[chipStyles.chip, selected.includes(opt) && chipStyles.chipActive]}
            onPress={() => toggle(opt)}
          >
            <Text style={[chipStyles.chipText, selected.includes(opt) && chipStyles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
  },
  chipActive: {
    borderColor: COLORS.gold,
    backgroundColor: withAlpha(COLORS.gold, 0.15),
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13 },
  chipTextActive: { color: COLORS.gold, fontWeight: '600' },
});

const INCOME_OPTIONS = ['〜300万円', '300〜500万円', '500〜800万円', '800〜1,000万円', '1,000万円以上', '非公開'];
const BLOOD_TYPE_OPTIONS = ['A', 'B', 'O', 'AB', '不明'];
const SERVICE_STYLE_OPTIONS = ['聞き役派', '会話リード派', '一緒に騒ぐ派', 'バランス型'];
const ACTIVITIES_OPTIONS = ['カラオケ', 'ダーツ', 'ゲーム', '飲み比べ', 'まったりトーク', 'お料理の話', '恋バナ'];

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
  const [castAge, setCastAge] = useState('');
  const [castHeight, setCastHeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [castHobbies, setCastHobbies] = useState('');
  const [personality, setPersonality] = useState('');
  const [charmPoint, setCharmPoint] = useState('');
  const [favoriteDrink, setFavoriteDrink] = useState('');
  const [serviceStyle, setServiceStyle] = useState('');
  const [favoriteTopics, setFavoriteTopics] = useState('');
  const [activities, setActivities] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');
  const [hometown, setHometown] = useState('');
  const [motto, setMotto] = useState('');
  const [localCastProfile, setLocalCastProfile] = useState<CastProfile | null>(castProfile);

  // 顧客専用フィールド
  const [customerAge, setCustomerAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [preferredArea, setPreferredArea] = useState('');
  const [appealMessage, setAppealMessage] = useState('');

  const [saving, setSaving] = useState(false);

  const isCast = profile?.role === 'cast';

  useEffect(() => {
    if (!user) return;

    if (isCast) {
      getCastProfile(user.id).then((data) => {
        setLocalCastProfile(data);
        setShopName(data.shop_name ?? '');
        setShopAddress(data.shop_address ?? '');
        setPriceInfo(data.price_info ?? '');
        setCastAge(data.age ? String(data.age) : '');
        setCastHeight(data.height ? String(data.height) : '');
        setBloodType(data.blood_type ?? '');
        setCastHobbies(data.hobbies ?? '');
        setPersonality(data.personality ?? '');
        setCharmPoint(data.charm_point ?? '');
        setFavoriteDrink(data.favorite_drink ?? '');
        setServiceStyle(data.service_style ?? '');
        setFavoriteTopics(data.favorite_topics ?? '');
        setActivities(data.activities ?? '');
        setCustomerMessage(data.customer_message ?? '');
        setHometown(data.hometown ?? '');
        setMotto(data.motto ?? '');
      }).catch(() => {});
    } else {
      getCustomerProfile(user.id).then((data) => {
        if (!data) return;
        setCustomerAge(data.age ? String(data.age) : '');
        setOccupation(data.occupation ?? '');
        setAnnualIncome(data.annual_income ?? '');
        setHobbies(data.hobbies ?? '');
        setPreferredArea(data.preferred_area ?? '');
        setAppealMessage(data.appeal_message ?? '');
      }).catch(() => {});
    }
  }, [isCast, user]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', '設定アプリから写真ライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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

      if (avatarChanged && avatarUri) {
        avatarUrl = await uploadImage(avatarUri, 'avatars', `${user.id}/avatar.jpg`);
      }

      const updatedProfile = await updateProfile(user.id, {
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      setProfile(updatedProfile);

      if (isCast) {
        const updatedCast = await upsertCastProfile(user.id, {
          shop_name: shopName.trim() || null,
          shop_address: shopAddress.trim() || null,
          price_info: priceInfo.trim() || null,
          age: castAge ? parseInt(castAge, 10) : null,
          height: castHeight ? parseInt(castHeight, 10) : null,
          blood_type: bloodType || null,
          hobbies: castHobbies.trim() || null,
          personality: personality.trim() || null,
          charm_point: charmPoint.trim() || null,
          favorite_drink: favoriteDrink.trim() || null,
          service_style: serviceStyle || null,
          favorite_topics: favoriteTopics.trim() || null,
          activities: activities || null,
          customer_message: customerMessage.trim() || null,
          hometown: hometown.trim() || null,
          motto: motto.trim() || null,
        });
        setCastProfile(updatedCast);
      } else {
        await upsertCustomerProfile(user.id, {
          age: customerAge ? parseInt(customerAge, 10) : null,
          occupation: occupation.trim() || null,
          annual_income: annualIncome || null,
          hobbies: hobbies.trim() || null,
          preferred_area: preferredArea.trim() || null,
          appeal_message: appealMessage.trim() || null,
        });
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
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>店舗情報</Text>
              <LabeledInput label="店舗名" value={shopName} onChangeText={setShopName} placeholder="勤務店舗名を入力" maxLength={50} />
              <LabeledInput label="住所・エリア" value={shopAddress} onChangeText={setShopAddress} placeholder="エリア・住所を入力" maxLength={100} />
              <LabeledInput label="料金システム" value={priceInfo} onChangeText={setPriceInfo} placeholder="料金システムを入力" multiline maxLength={200} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>プロフィール情報</Text>
              <LabeledInput label="年齢" value={castAge} onChangeText={setCastAge} placeholder="例: 23" keyboardType="number-pad" maxLength={2} />
              <LabeledInput label="身長 (cm)" value={castHeight} onChangeText={setCastHeight} placeholder="例: 163" keyboardType="number-pad" maxLength={3} />
              <ChipSelector label="血液型" options={BLOOD_TYPE_OPTIONS} value={bloodType} onChange={setBloodType} />
              <LabeledInput label="出身地" value={hometown} onChangeText={setHometown} placeholder="例: 大阪・北海道・東京" maxLength={50} />
              <LabeledInput label="趣味・特技" value={castHobbies} onChangeText={setCastHobbies} placeholder="例: カフェ巡り・ダンス・料理" maxLength={100} />
              <LabeledInput label="性格" value={personality} onChangeText={setPersonality} placeholder="例: 明るくて人見知りしない" maxLength={100} />
              <LabeledInput label="チャームポイント" value={charmPoint} onChangeText={setCharmPoint} placeholder="例: 笑顔と聞き上手なところ" maxLength={100} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>お客様へのアピール</Text>
              <LabeledInput label="得意なお酒・飲み方" value={favoriteDrink} onChangeText={setFavoriteDrink} placeholder="例: シャンパン・ビール・何でも飲めます！" maxLength={100} />
              <ChipSelector label="接客スタイル" options={SERVICE_STYLE_OPTIONS} value={serviceStyle} onChange={setServiceStyle} />
              <LabeledInput label="得意な話題" value={favoriteTopics} onChangeText={setFavoriteTopics} placeholder="例: 仕事の話・旅行・スポーツ・恋愛" multiline maxLength={150} />
              <MultiChipSelector label="一緒にやりたいこと" options={ACTIVITIES_OPTIONS} value={activities} onChange={setActivities} />
              <LabeledInput label="座右の銘・好きな言葉" value={motto} onChangeText={setMotto} placeholder="例: 笑顔は最高の武器！" maxLength={80} />
              <LabeledInput label="お客様への一言" value={customerMessage} onChangeText={setCustomerMessage} placeholder="来てくれたお客様へのメッセージ" multiline maxLength={200} />
            </View>
          </>
        )}

        {/* 顧客（男性）専用セクション */}
        {!isCast && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プロフィール情報</Text>
            <LabeledInput label="年齢" value={customerAge} onChangeText={setCustomerAge} placeholder="例: 32" keyboardType="number-pad" maxLength={2} />
            <LabeledInput label="職業" value={occupation} onChangeText={setOccupation} placeholder="例: IT企業・自営業・会社員" maxLength={50} />
            <ChipSelector label="年収" options={INCOME_OPTIONS} value={annualIncome} onChange={setAnnualIncome} />
            <LabeledInput label="趣味・好み" value={hobbies} onChangeText={setHobbies} placeholder="例: ゴルフ・グルメ・旅行" maxLength={100} />
            <LabeledInput label="よく行くエリア" value={preferredArea} onChangeText={setPreferredArea} placeholder="例: 銀座・新宿・六本木" maxLength={50} />
            <LabeledInput label="女の子へのメッセージ" value={appealMessage} onChangeText={setAppealMessage} placeholder="自己アピールや一言メッセージ" multiline maxLength={200} />
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
