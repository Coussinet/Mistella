import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// -----------------------------------------------------------
// 環境変数
// -----------------------------------------------------------

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase の環境変数が設定されていません。' +
      '.env に EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください。',
  );
}

// -----------------------------------------------------------
// ExpoSecureStore を使ったストレージアダプター
// SecureStore は 1 エントリあたり 2048 バイトの上限があるため、
// 長いトークンは複数チャンクに分割して保存する。
// -----------------------------------------------------------

const CHUNK_SIZE = 1800; // 安全マージンを取った実質チャンクサイズ

function chunkKey(key: string, index: number): string {
  return `${key}.chunk.${index}`;
}

const ExpoSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    // チャンク 0 を試みる。存在しなければ通常の単一エントリとして取得。
    const firstChunk = await SecureStore.getItemAsync(chunkKey(key, 0));
    if (firstChunk === null) {
      // 旧形式（分割なし）のフォールバック
      return SecureStore.getItemAsync(key);
    }

    // チャンクを結合する
    const chunks: string[] = [firstChunk];
    let index = 1;
    while (true) {
      const chunk = await SecureStore.getItemAsync(chunkKey(key, index));
      if (chunk === null) break;
      chunks.push(chunk);
      index++;
    }
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      // 短い値はそのまま保存（チャンクキーも使わず旧形式と共存させない）
      await SecureStore.setItemAsync(key, value);
      return;
    }

    // 長い値はチャンク分割して保存
    const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(chunkKey(key, i), chunk);
    }
  },

  async removeItem(key: string): Promise<void> {
    // 通常エントリとチャンクエントリの両方を削除する
    await SecureStore.deleteItemAsync(key);
    let index = 0;
    while (true) {
      const k = chunkKey(key, index);
      const exists = await SecureStore.getItemAsync(k);
      if (exists === null) break;
      await SecureStore.deleteItemAsync(k);
      index++;
    }
  },
};

// -----------------------------------------------------------
// Supabase クライアント
// -----------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// -----------------------------------------------------------
// 型付きテーブルアクセスのヘルパー（将来的な型生成の拡張用）
// -----------------------------------------------------------

/** Supabase Storage のパブリック URL を取得する */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
