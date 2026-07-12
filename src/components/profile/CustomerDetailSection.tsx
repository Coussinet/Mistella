// ============================================================
// Mistella - CustomerDetailSection（プロフィール編集: 顧客専用）
// 年齢・職業・年収など顧客（男性）向けの項目。
// ============================================================

import React from 'react';
import { ChipSelector } from '@/components/common/ChipSelector';
import FormField from '@/components/common/FormField';
import FormSection from '@/components/profile/FormSection';
import type { ProfileFormState, SetProfileField } from '@/hooks/useProfileForm';

const INCOME_OPTIONS = ['〜300万円', '300〜500万円', '500〜800万円', '800〜1,000万円', '1,000万円以上', '非公開'];

type CustomerDetailSectionProps = {
  state: ProfileFormState;
  setField: SetProfileField;
};

export default function CustomerDetailSection({ state, setField }: CustomerDetailSectionProps) {
  return (
    <FormSection title="プロフィール情報">
      <FormField label="年齢" value={state.customerAge} onChangeText={(v) => setField('customerAge', v)} placeholder="例: 32" keyboardType="number-pad" maxLength={2} />
      <FormField label="職業" value={state.occupation} onChangeText={(v) => setField('occupation', v)} placeholder="例: IT企業・自営業・会社員" maxLength={50} />
      <ChipSelector label="年収" options={INCOME_OPTIONS} value={state.annualIncome} onChange={(v) => setField('annualIncome', v)} />
      <FormField label="趣味・好み" value={state.hobbies} onChangeText={(v) => setField('hobbies', v)} placeholder="例: ゴルフ・グルメ・旅行" maxLength={100} />
      <FormField label="よく行くエリア" value={state.preferredArea} onChangeText={(v) => setField('preferredArea', v)} placeholder="例: 銀座・新宿・六本木" maxLength={50} />
      <FormField label="女の子へのメッセージ" value={state.appealMessage} onChangeText={(v) => setField('appealMessage', v)} placeholder="自己アピールや一言メッセージ" multiline maxLength={200} />
    </FormSection>
  );
}
