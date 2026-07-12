// -----------------------------------------------------------
// Mistella - プロフィール編集フォーム hook
// EditProfileScreen の入力状態を useReducer に集約する。
// サーバー上の既存プロフィール（cast/customer）の初期流し込みと、
// 保存ペイロード（SaveProfileInput）の組み立てもここで担う。
// -----------------------------------------------------------

import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  useMyCastProfile,
  useMyCustomerProfile,
  type SaveProfileInput,
} from '@/hooks/queries/useProfile';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

// ---- 状態 ----------------------------------------------------

export interface ProfileFormState {
  // 共通
  nickname: string;
  bio: string;
  avatarUri: string | null;
  avatarChanged: boolean;
  // キャスト専用
  shopName: string;
  shopAddress: string;
  priceInfo: string;
  castAge: string;
  castHeight: string;
  bloodType: string;
  castHobbies: string;
  personality: string;
  charmPoint: string;
  favoriteDrink: string;
  serviceStyle: string;
  favoriteTopics: string;
  activities: string;
  customerMessage: string;
  hometown: string;
  motto: string;
  // 顧客専用
  customerAge: string;
  occupation: string;
  annualIncome: string;
  hobbies: string;
  preferredArea: string;
  appealMessage: string;
}

export type ProfileFormKey = keyof ProfileFormState;

/** 単一フィールド更新関数（`setField(key, value)` パターン） */
export type SetProfileField = <K extends ProfileFormKey>(
  key: K,
  value: ProfileFormState[K],
) => void;

type Action =
  | { type: 'setField'; key: ProfileFormKey; value: ProfileFormState[ProfileFormKey] }
  | { type: 'setFields'; fields: Partial<ProfileFormState> };

function reducer(state: ProfileFormState, action: Action): ProfileFormState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.key]: action.value };
    case 'setFields':
      return { ...state, ...action.fields };
    default:
      return state;
  }
}

function createInitialState(profile: User | null): ProfileFormState {
  return {
    nickname: profile?.nickname ?? '',
    bio: profile?.bio ?? '',
    avatarUri: profile?.avatar_url ?? null,
    avatarChanged: false,
    shopName: '',
    shopAddress: '',
    priceInfo: '',
    castAge: '',
    castHeight: '',
    bloodType: '',
    castHobbies: '',
    personality: '',
    charmPoint: '',
    favoriteDrink: '',
    serviceStyle: '',
    favoriteTopics: '',
    activities: '',
    customerMessage: '',
    hometown: '',
    motto: '',
    customerAge: '',
    occupation: '',
    annualIncome: '',
    hobbies: '',
    preferredArea: '',
    appealMessage: '',
  };
}

// ---- hook ----------------------------------------------------

export function useProfileForm() {
  const profile = useAuthStore((s) => s.profile);
  const isCast = profile?.role === 'cast';

  const [state, dispatch] = useReducer(reducer, profile ?? null, createInitialState);

  const setField = useCallback<SetProfileField>((key, value) => {
    dispatch({ type: 'setField', key, value });
  }, []);

  /** アバター選択時の更新（URI 反映 + 変更フラグ） */
  const setAvatar = useCallback((uri: string) => {
    dispatch({ type: 'setFields', fields: { avatarUri: uri, avatarChanged: true } });
  }, []);

  // サーバー上の既存プロフィールを取得してフォームへ流し込む（初回のみ）
  const castProfileQuery = useMyCastProfile();
  const customerProfileQuery = useMyCustomerProfile();
  const castInitializedRef = useRef(false);
  const customerInitializedRef = useRef(false);

  useEffect(() => {
    const data = castProfileQuery.data;
    if (!isCast || !data || castInitializedRef.current) return;
    castInitializedRef.current = true;
    dispatch({
      type: 'setFields',
      fields: {
        shopName: data.shop_name ?? '',
        shopAddress: data.shop_address ?? '',
        priceInfo: data.price_info ?? '',
        castAge: data.age ? String(data.age) : '',
        castHeight: data.height ? String(data.height) : '',
        bloodType: data.blood_type ?? '',
        castHobbies: data.hobbies ?? '',
        personality: data.personality ?? '',
        charmPoint: data.charm_point ?? '',
        favoriteDrink: data.favorite_drink ?? '',
        serviceStyle: data.service_style ?? '',
        favoriteTopics: data.favorite_topics ?? '',
        activities: data.activities ?? '',
        customerMessage: data.customer_message ?? '',
        hometown: data.hometown ?? '',
        motto: data.motto ?? '',
      },
    });
  }, [isCast, castProfileQuery.data]);

  useEffect(() => {
    const data = customerProfileQuery.data;
    if (isCast || !data || customerInitializedRef.current) return;
    customerInitializedRef.current = true;
    dispatch({
      type: 'setFields',
      fields: {
        customerAge: data.age ? String(data.age) : '',
        occupation: data.occupation ?? '',
        annualIncome: data.annual_income ?? '',
        hobbies: data.hobbies ?? '',
        preferredArea: data.preferred_area ?? '',
        appealMessage: data.appeal_message ?? '',
      },
    });
  }, [isCast, customerProfileQuery.data]);

  /** useSaveMyProfile に渡す保存ペイロードを組み立てる */
  const buildSaveInput = useCallback((): SaveProfileInput => {
    return {
      nickname: state.nickname.trim(),
      bio: state.bio.trim() || null,
      newAvatarUri: state.avatarChanged && state.avatarUri ? state.avatarUri : null,
      castFields: isCast
        ? {
            shop_name: state.shopName.trim() || null,
            shop_address: state.shopAddress.trim() || null,
            price_info: state.priceInfo.trim() || null,
            age: state.castAge ? parseInt(state.castAge, 10) : null,
            height: state.castHeight ? parseInt(state.castHeight, 10) : null,
            blood_type: state.bloodType || null,
            hobbies: state.castHobbies.trim() || null,
            personality: state.personality.trim() || null,
            charm_point: state.charmPoint.trim() || null,
            favorite_drink: state.favoriteDrink.trim() || null,
            service_style: state.serviceStyle || null,
            favorite_topics: state.favoriteTopics.trim() || null,
            activities: state.activities || null,
            customer_message: state.customerMessage.trim() || null,
            hometown: state.hometown.trim() || null,
            motto: state.motto.trim() || null,
          }
        : undefined,
      customerFields: !isCast
        ? {
            age: state.customerAge ? parseInt(state.customerAge, 10) : null,
            occupation: state.occupation.trim() || null,
            annual_income: state.annualIncome || null,
            hobbies: state.hobbies.trim() || null,
            preferred_area: state.preferredArea.trim() || null,
            appeal_message: state.appealMessage.trim() || null,
          }
        : undefined,
    };
  }, [state, isCast]);

  return { state, setField, setAvatar, isCast, buildSaveInput };
}
