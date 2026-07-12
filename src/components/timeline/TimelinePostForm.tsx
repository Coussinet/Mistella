// ============================================================
// Mistella - タイムライン投稿フォームコンポーネント
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface TimelinePostFormProps {
  onPost: (
    content: string,
    mediaUri?: string,
    mediaType?: 'image' | 'video',
  ) => Promise<void>;
  onCancel: () => void;
}

// 動画の最大秒数
const MAX_VIDEO_SECONDS = 3;

// -----------------------------------------------------------
// TimelinePostForm
// -----------------------------------------------------------

export default function TimelinePostForm({
  onPost,
  onCancel,
}: TimelinePostFormProps) {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const videoRef = useRef<Video>(null);

  const canPost = content.trim().length > 0 || mediaUri !== null;

  // -----------------------------------------------------------
  // メディア選択
  // -----------------------------------------------------------

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType('image');
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // duration は秒単位で返る場合と ms 単位の場合があるため両方対応
      const durationSec = asset.duration != null
        ? asset.duration > 1000
          ? asset.duration / 1000
          : asset.duration
        : 0;
      if (durationSec > MAX_VIDEO_SECONDS) {
        Alert.alert(
          '動画が長すぎます',
          `動画は${MAX_VIDEO_SECONDS}秒以内にしてください。`,
        );
        return;
      }
      setMediaUri(asset.uri);
      setMediaType('video');
    }
  };

  const removeMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };

  // -----------------------------------------------------------
  // 投稿
  // -----------------------------------------------------------

  const handlePost = async () => {
    if (!canPost || isPosting) return;
    setIsPosting(true);
    try {
      await onPost(
        content.trim(),
        mediaUri ?? undefined,
        mediaType ?? undefined,
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* テキスト入力 */}
      <TextInput
        style={styles.input}
        placeholder="今の気持ちをシェア"
        placeholderTextColor={COLORS.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={300}
        textAlignVertical="top"
        editable={!isPosting}
      />

      {/* メディアプレビュー */}
      {mediaUri ? (
        <View style={styles.previewWrapper}>
          {mediaType === 'image' ? (
            <Image
              source={{ uri: mediaUri }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: mediaUri }}
              style={styles.preview}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isLooping={false}
            />
          )}
          <TouchableOpacity
            style={styles.removeMedia}
            onPress={removeMedia}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons name="close" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ツールバー */}
      <View style={styles.toolbar}>
        <View style={styles.mediaButtons}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.mediaButton}
            disabled={isPosting}
          >
            <MaterialIcons name="image" size={24} color={COLORS.neonBlue} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickVideo}
            style={styles.mediaButton}
            disabled={isPosting}
          >
            <MaterialIcons
              name="videocam"
              size={24}
              color={COLORS.neonBlue}
            />
          </TouchableOpacity>
          <Text style={styles.videoHint}>動画は{MAX_VIDEO_SECONDS}秒まで</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={isPosting}
          >
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePost}
            style={[
              styles.postButton,
              (!canPost || isPosting) && styles.postButtonDisabled,
            ]}
            disabled={!canPost || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.postButtonText}>
                投稿する（24時間限定）
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  input: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
    minHeight: 100,
    maxHeight: 200,
  },
  previewWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.overlay,
    borderRadius: 16,
    padding: 4,
  },
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaButton: {
    padding: 6,
    borderRadius: 8,
  },
  videoHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  postButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 18,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  postButtonDisabled: {
    opacity: 0.45,
  },
  postButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
