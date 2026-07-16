// ============================================================
// Mistella - CastDetailSection（プロフィール編集: キャスト専用）
// 店舗情報・プロフィール情報・お客様へのアピールの各セクション。
// ============================================================

import React from 'react';
import { ChipSelector, MultiChipSelector } from '@/components/common/ChipSelector';
import FormField from '@/components/common/FormField';
import FormSection from '@/components/profile/FormSection';
import type { ProfileFormState, SetProfileField } from '@/hooks/useProfileForm';

const BLOOD_TYPE_OPTIONS = ['A', 'B', 'O', 'AB', '不明'];
const SERVICE_STYLE_OPTIONS = ['聞き役派', '会話リード派', '一緒に騒ぐ派', 'バランス型'];
const ACTIVITIES_OPTIONS = ['カラオケ', 'ダーツ', 'ゲーム', '飲み比べ', 'まったりトーク', 'お料理の話', '恋バナ'];
const DRINK_STRENGTH_OPTIONS = ['酒豪', '高め', '普通', '弱い', '飲めない'];
const BODY_STYLE_OPTIONS = ['スリム', 'やや細身', '普通', 'グラマー', 'ぽっちゃり'];

type CastDetailSectionProps = {
  state: ProfileFormState;
  setField: SetProfileField;
};

export default function CastDetailSection({ state, setField }: CastDetailSectionProps) {
  return (
    <>
      <FormSection title="店舗情報">
        <FormField label="店舗名" value={state.shopName} onChangeText={(v) => setField('shopName', v)} placeholder="勤務店舗名を入力" maxLength={50} />
        <FormField label="住所・エリア" value={state.shopAddress} onChangeText={(v) => setField('shopAddress', v)} placeholder="エリア・住所を入力" maxLength={100} />
        <FormField label="料金システム" value={state.priceInfo} onChangeText={(v) => setField('priceInfo', v)} placeholder="料金システムを入力" multiline maxLength={200} />
      </FormSection>
      <FormSection title="プロフィール情報">
        <FormField label="年齢" value={state.castAge} onChangeText={(v) => setField('castAge', v)} placeholder="例: 23" keyboardType="number-pad" maxLength={2} />
        <FormField label="身長 (cm)" value={state.castHeight} onChangeText={(v) => setField('castHeight', v)} placeholder="例: 163" keyboardType="number-pad" maxLength={3} />
        <ChipSelector label="血液型" options={BLOOD_TYPE_OPTIONS} value={state.bloodType} onChange={(v) => setField('bloodType', v)} />
        <ChipSelector label="スタイル" options={BODY_STYLE_OPTIONS} value={state.bodyStyle} onChange={(v) => setField('bodyStyle', v)} />
        <FormField label="出身地" value={state.hometown} onChangeText={(v) => setField('hometown', v)} placeholder="例: 大阪・北海道・東京" maxLength={50} />
        <FormField label="趣味・特技" value={state.castHobbies} onChangeText={(v) => setField('castHobbies', v)} placeholder="例: カフェ巡り・ダンス・料理" maxLength={100} />
        <FormField label="性格" value={state.personality} onChangeText={(v) => setField('personality', v)} placeholder="例: 明るくて人見知りしない" maxLength={100} />
        <FormField label="チャームポイント" value={state.charmPoint} onChangeText={(v) => setField('charmPoint', v)} placeholder="例: 笑顔と聞き上手なところ" maxLength={100} />
      </FormSection>
      <FormSection title="アピールポイント">
        <FormField label="好きなお酒" value={state.favoriteDrink} onChangeText={(v) => setField('favoriteDrink', v)} placeholder="例: シャンパン・ビール・何でも飲めます！" maxLength={100} />
        <ChipSelector label="飲みべ" options={DRINK_STRENGTH_OPTIONS} value={state.drinkStrength} onChange={(v) => setField('drinkStrength', v)} />
        <FormField label="好きな歌" value={state.favoriteSong} onChangeText={(v) => setField('favoriteSong', v)} placeholder="例: 定番のあの曲・最近ハマってる曲" maxLength={100} />
        <ChipSelector label="接客スタイル" options={SERVICE_STYLE_OPTIONS} value={state.serviceStyle} onChange={(v) => setField('serviceStyle', v)} />
        <FormField label="得意な話題" value={state.favoriteTopics} onChangeText={(v) => setField('favoriteTopics', v)} placeholder="例: 仕事の話・旅行・スポーツ・恋愛" multiline maxLength={150} />
        <MultiChipSelector label="一緒にやりたいこと" options={ACTIVITIES_OPTIONS} value={state.activities} onChange={(v) => setField('activities', v)} />
        <FormField label="座右の銘・好きな言葉" value={state.motto} onChangeText={(v) => setField('motto', v)} placeholder="例: 笑顔は最高の武器！" maxLength={80} />
        <FormField label="お客様への一言" value={state.customerMessage} onChangeText={(v) => setField('customerMessage', v)} placeholder="来てくれたお客様へのメッセージ" multiline maxLength={200} />
      </FormSection>
    </>
  );
}
