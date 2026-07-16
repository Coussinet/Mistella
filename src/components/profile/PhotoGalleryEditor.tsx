// ============================================================
// Mistella - PhotoGalleryEditor（プロフィール複数写真の編集）
// 追加・削除に対応。男女どちらのプロフィール編集でも使う。
// アップロード/削除は即時に profile_photos へ反映される。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import {
  useAddProfilePhoto,
  useDeleteProfilePhoto,
  useProfilePhotos,
} from '@/hooks/queries/useProfilePhotos';
import { useAuthStore } from '@/store/authStore';

const MAX_PHOTOS = 9;
const THUMB = 96;

export default function PhotoGalleryEditor() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: photos = [], isPending } = useProfilePhotos(userId);
  const addMutation = useAddProfilePhoto();
  const deleteMutation = useDeleteProfilePhoto();

  const uploading = addMutation.isPending;

  const pickAndAdd = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('上限', `写真は最大${MAX_PHOTOS}枚まで登録できます。`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', '設定アプリから写真ライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addMutation.mutate({ localUri: result.assets[0].uri, sortOrder: photos.length });
    }
  };

  const confirmDelete = (photoId: string) => {
    Alert.alert('写真を削除', 'この写真を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteMutation.mutate(photoId) },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>写真（複数登録できます）</Text>
      <Text style={styles.hint}>
        最初の写真がメインになります。最大{MAX_PHOTOS}枚まで登録できます。
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {photos.map((photo) => (
          <View key={photo.id} style={styles.thumbWrapper}>
            <Image source={{ uri: photo.photo_url }} style={styles.thumb} />
            <TouchableOpacity
              style={styles.deleteBadge}
              onPress={() => confirmDelete(photo.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialIcons name="close" size={14} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={styles.addTile}
            onPress={pickAndAdd}
            disabled={uploading || isPending}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={uploading ? 'hourglass-empty' : 'add-a-photo'}
              size={24}
              color={COLORS.gold}
            />
            <Text style={styles.addLabel}>{uploading ? '追加中...' : '追加'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxs,
  },
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  row: {
    gap: SPACING.xs,
    paddingRight: SPACING.md,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  addTile: {
    width: THUMB,
    height: THUMB,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderStyle: 'dashed',
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
  },
});
