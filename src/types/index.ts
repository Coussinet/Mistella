// ============================================================
// YoruConnect - Core TypeScript Type Definitions
// ============================================================

// -----------------------------------------------------------
// Enums / Union Types
// -----------------------------------------------------------

export type UserRole = 'cast' | 'customer';

export type WorkStatus = 'working' | 'break' | 'off';

export type MatchStatus = 'pending' | 'matched' | 'unmatched';

export type TonightRequestStatus = 'sent' | 'read' | 'accepted' | 'declined';

export type MediaType = 'image' | 'video';

// -----------------------------------------------------------
// Core Entities
// -----------------------------------------------------------

export interface User {
  id: string;
  role: UserRole;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface CastProfile {
  user_id: string;
  shop_name: string | null;
  shop_address: string | null;
  price_info: string | null;
  is_sponsored: boolean;
  is_working: boolean;
  work_status: WorkStatus;
  location_lat: number | null;
  location_lng: number | null;
  location_enabled: boolean;
}

/** キャストプロフィールにユーザー情報を結合した拡張型 */
export interface CastProfileWithUser extends CastProfile {
  user: User;
}

export interface Timeline {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: MediaType | null;
  expires_at: string;
  created_at: string;
  /** JOIN済みのユーザー情報（オプション） */
  user?: User;
}

export interface Match {
  id: string;
  customer_id: string;
  cast_id: string;
  status: MatchStatus;
  created_at: string;
  /** JOIN済みのキャスト情報（オプション） */
  cast?: User;
  /** JOIN済みの顧客情報（オプション） */
  customer?: User;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  /** JOIN済みの送信者情報（オプション） */
  sender?: User;
}

export interface TonightRequest {
  id: string;
  customer_id: string;
  target_cast_id: string | null;
  status: TonightRequestStatus;
  message: string | null;
  expires_at: string;
  created_at: string;
  /** JOIN済みの顧客情報（オプション） */
  customer?: User;
}

export interface CustomerNote {
  id: string;
  cast_id: string;
  customer_id: string;
  note_text: string | null;
  next_visit_date: string | null;
  birthday: string | null;
  nickname_called: string | null;
  bottle_history: string | null;
  created_at: string;
  updated_at: string;
  /** JOIN済みの顧客情報（オプション） */
  customer?: User;
}

export interface Favorite {
  id: string;
  user_id: string;
  target_user_id: string;
  created_at: string;
  /** JOIN済みのターゲットユーザー情報（オプション） */
  target_user?: User;
}

export interface Footprint {
  id: string;
  visitor_id: string;
  visited_user_id: string;
  created_at: string;
  /** JOIN済みの訪問者情報（オプション） */
  visitor?: User;
}

export interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

// -----------------------------------------------------------
// API / Query Helper Types
// -----------------------------------------------------------

/** ページネーション用カーソル */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** Supabase RPC / クエリ共通レスポンス */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// -----------------------------------------------------------
// React Navigation Types
// -----------------------------------------------------------

/** 認証前のスタックナビゲーター */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  RoleSelect: undefined;
  ProfileSetup: { role: UserRole };
};

/** タブナビゲーター（キャスト用） */
export type CastTabParamList = {
  Timeline: undefined;
  Search: undefined;
  Matches: undefined;
  Messages: undefined;
  Profile: undefined;
};

/** タブナビゲーター（顧客用） */
export type CustomerTabParamList = {
  Timeline: undefined;
  CastSearch: undefined;
  Map: undefined;
  Matches: undefined;
  Messages: undefined;
  Profile: undefined;
};

/** キャスト用スタックナビゲーター（タブを内包） */
export type CastStackParamList = {
  CastTabs: undefined;
  CastProfileEdit: undefined;
  /** 出勤ステータス管理画面 */
  WorkingStatus: undefined;
  /** 店舗情報入力・編集画面 */
  ShopInfo: undefined;
  /** 今夜行ける？リクエスト一覧画面 */
  TonightRequests: undefined;
  /** CRM（顧客管理）画面 */
  CRM: undefined;
  /** 顧客ノート詳細・編集画面（新規作成時は customerId のみ、編集時は noteId も渡す） */
  CustomerNote: { customerId: string | undefined; noteId?: string };
  CustomerNoteDetail: { noteId: string; customerId: string };
  ChatRoom: { matchId: string; partnerUser: User };
  UserProfile: { userId: string };
};

/** 顧客用スタックナビゲーター（タブを内包） */
export type CustomerStackParamList = {
  CustomerTabs: undefined;
  CustomerProfileEdit: undefined;
  CastProfile: { userId: string };
  ChatRoom: { matchId: string; partnerUser: User };
  SendTonightRequest: { targetCastId?: string };
};

/** ルートナビゲーター */
export type RootStackParamList = {
  Auth: undefined;
  CastApp: undefined;
  CustomerApp: undefined;
};
