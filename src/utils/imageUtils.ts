import * as ImageManipulator from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { supabase } from '@/lib/supabase';

// -----------------------------------------------------------
// 定数
// -----------------------------------------------------------

/** 圧縮後の最大辺長（px） */
const MAX_DIMENSION = 600;

/** JPEG 圧縮品質（0.0 〜 1.0） */
const JPEG_QUALITY = 0.7;

// -----------------------------------------------------------
// 画像圧縮
// -----------------------------------------------------------

/**
 * 指定した URI の画像を 600×600 以内にリサイズし、
 * 品質 0.7 の JPEG に変換して新しい URI を返す。
 *
 * @param uri - 元画像のローカル URI
 * @returns 圧縮済み画像のローカル URI
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
        },
      },
    ],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
}

// -----------------------------------------------------------
// 画像アップロード
// -----------------------------------------------------------

/**
 * 画像を圧縮してから Supabase Storage にアップロードし、
 * パブリック URL を返す。
 *
 * @param uri    - アップロードする画像のローカル URI
 * @param bucket - 対象の Supabase Storage バケット名
 * @param path   - バケット内の保存パス（例: `avatars/user-id.jpg`）
 * @returns アップロード済み画像のパブリック URL
 * @throws アップロードに失敗した場合
 */
export async function uploadImage(
  uri: string,
  bucket: string,
  path: string,
): Promise<string> {
  // 1. クライアント側で圧縮
  const compressedUri = await compressImage(uri);

  // 2. URI を Blob / ArrayBuffer に変換
  const response = await fetch(compressedUri);
  const arrayBuffer = await response.arrayBuffer();

  // 3. Supabase Storage へアップロード
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`画像のアップロードに失敗しました: ${uploadError.message}`);
  }

  // 4. パブリック URL を取得して返す
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// -----------------------------------------------------------
// 動画バリデーション
// -----------------------------------------------------------

/**
 * 動画ファイルの長さが指定秒数以内かどうか検証する。
 * expo-av の Audio.Sound を使ってメタデータを取得する。
 *
 * @param uri               - バリデーション対象の動画 URI
 * @param maxDurationSeconds - 許容する最大秒数
 * @returns 動画の長さが maxDurationSeconds 以内であれば true
 */
export async function validateVideoFile(
  uri: string,
  maxDurationSeconds: number,
): Promise<boolean> {
  let sound: Audio.Sound | null = null;

  try {
    // Audio.Sound でメディアをロードしてデュレーションを取得する
    // (react-native では Video より Sound の方が純粋なメタ取得に向いている)
    sound = new Audio.Sound();
    await sound.loadAsync({ uri }, { shouldPlay: false });

    const status = await sound.getStatusAsync();

    if (!status.isLoaded) {
      // ロードできない場合は安全のため false を返す
      return false;
    }

    const durationMs = status.durationMillis ?? 0;
    const durationSeconds = durationMs / 1000;

    return durationSeconds <= maxDurationSeconds;
  } catch {
    // メタデータ取得に失敗した場合は安全のため false を返す
    return false;
  } finally {
    if (sound !== null) {
      await sound.unloadAsync();
    }
  }
}
