// ============================================================
// Mistella - EditProfileScreen（共通）
// フォーム状態は useProfileForm、各セクションは components/profile 配下に分割。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import CastDetailSection from '@/components/profile/CastDetailSection';
import CustomerDetailSection from '@/components/profile/CustomerDetailSection';
import PhotoEditor from '@/components/profile/PhotoEditor';
import ProfileBasicSection from '@/components/profile/ProfileBasicSection';
import { COLORS } from '@/constants/colors';
import { useSaveMyProfile } from '@/hooks/queries/useProfile';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useAuthStore } from '@/store/authStore';
import { success } from '@/utils/haptics';
import { showError } from '@/utils/showError';
import { validateProfileForm } from '@/utils/validators';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);

  const { state, setField, setAvatar, isCast, buildSaveInput } = useProfileForm();

  const saveMutation = useSaveMyProfile();
  const saving = saveMutation.isPending;

  const handleSave = () => {
    if (!user || saving) return;
    const validationError = validateProfileForm({ nickname: state.nickname });
    if (validationError) {
      showError(validationError);
      return;
    }

    saveMutation.mutate(buildSaveInput(), {
      onSuccess: () => {
        success();
        Alert.alert('完了', 'プロフィールを更新しました。', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      },
    });
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
        <PhotoEditor avatarUri={state.avatarUri} onChange={setAvatar} />

        {/* 基本情報 */}
        <ProfileBasicSection state={state} setField={setField} />

        {/* ロール別セクション */}
        {isCast ? (
          <CastDetailSection state={state} setField={setField} />
        ) : (
          <CustomerDetailSection state={state} setField={setField} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
