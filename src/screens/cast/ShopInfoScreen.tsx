// ============================================================
// Mistella - 店舗情報入力・編集画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import { COLORS } from '@/constants/colors';
import { useUpdateShopInfo } from '@/hooks/queries/useCastWork';
import { useMyCastProfile } from '@/hooks/queries/useProfile';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList } from '@/types';

type Props = NativeStackScreenProps<CastStackParamList, 'ShopInfo'>;

// -----------------------------------------------------------
// ShopInfoScreen
// -----------------------------------------------------------

export default function ShopInfoScreen({ navigation }: Props) {
  const { user, castProfile } = useAuthStore();

  const [shopName, setShopName] = useState(castProfile?.shop_name ?? '');
  const [shopAddress, setShopAddress] = useState(castProfile?.shop_address ?? '');
  const [priceInfo, setPriceInfo] = useState(castProfile?.price_info ?? '');
  const hasHydratedForm = useRef(false);

  // サーバー上の最新の店舗情報をフォームへ反映する
  const { data: castData } = useMyCastProfile();

  useEffect(() => {
    if (!castData || hasHydratedForm.current) return;
    const frame = requestAnimationFrame(() => {
      hasHydratedForm.current = true;
      setShopName(castData.shop_name ?? '');
      setShopAddress(castData.shop_address ?? '');
      setPriceInfo(castData.price_info ?? '');
    });
    return () => cancelAnimationFrame(frame);
  }, [castData]);

  // -----------------------------------------------------------
  // 保存処理
  // -----------------------------------------------------------

  const saveMutation = useUpdateShopInfo();
  const isSaving = saveMutation.isPending;

  const handleSave = () => {
    if (!user || isSaving) return;
    saveMutation.mutate(
      {
        shop_name: shopName.trim() || null,
        shop_address: shopAddress.trim() || null,
        price_info: priceInfo.trim() || null,
      },
      {
        onSuccess: () => {
          Alert.alert('保存完了', '店舗情報を保存しました。', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      },
    );
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>店舗情報</Text>
          <Text style={styles.screenDesc}>
            お客様に表示される店舗情報を入力してください。
          </Text>

          {/* 店舗名 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>店舗名</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="store"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="例: Club Aurora"
                placeholderTextColor={COLORS.textMuted}
                value={shopName}
                onChangeText={setShopName}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          {/* 住所 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>住所・エリア</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="location-on"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="例: 東京都新宿区歌舞伎町1-1-1"
                placeholderTextColor={COLORS.textMuted}
                value={shopAddress}
                onChangeText={setShopAddress}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          {/* 料金システム */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>料金システム・コース説明</Text>
            <TextInput
              style={[styles.input, styles.inputTextarea]}
              placeholder={
                '例: セット料金 ¥5,000〜\nシャンパンコール ¥30,000〜\n詳しくはお気軽にお問い合わせください。'
              }
              placeholderTextColor={COLORS.textMuted}
              value={priceInfo}
              onChangeText={setPriceInfo}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {/* 保存ボタン */}
          <Button
            title="保存する"
            onPress={handleSave}
            loading={isSaving}
            icon="save"
            style={styles.saveBtn}
          />

          <Button
            title="キャンセル"
            onPress={() => navigation.goBack()}
            variant="ghost"
            disabled={isSaving}
            style={styles.cancelBtn}
          />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  screenDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 28,
    lineHeight: 18,
  },

  // 入力グループ
  inputGroup: {
    marginBottom: 20,
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
  inputTextarea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    lineHeight: 21,
  },
  saveBtn: {
    marginTop: 8,
    marginBottom: 12,
  },
  cancelBtn: {
    // ghost スタイルで透明
  },
});
