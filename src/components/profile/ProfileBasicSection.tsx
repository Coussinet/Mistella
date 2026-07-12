// ============================================================
// Mistella - ProfileBasicSection（プロフィール編集: 基本情報）
// ニックネーム・自己紹介などロール共通の項目。
// ============================================================

import React from 'react';
import FormField from '@/components/common/FormField';
import FormSection from '@/components/profile/FormSection';
import type { ProfileFormState, SetProfileField } from '@/hooks/useProfileForm';

type ProfileBasicSectionProps = {
  state: ProfileFormState;
  setField: SetProfileField;
};

export default function ProfileBasicSection({ state, setField }: ProfileBasicSectionProps) {
  return (
    <FormSection title="基本情報">
      <FormField
        label="ニックネーム"
        required
        value={state.nickname}
        onChangeText={(v) => setField('nickname', v)}
        placeholder="ニックネームを入力"
        maxLength={30}
      />
      <FormField
        label="自己紹介"
        value={state.bio}
        onChangeText={(v) => setField('bio', v)}
        placeholder="自己紹介を入力（任意）"
        multiline
        maxLength={200}
      />
    </FormSection>
  );
}
