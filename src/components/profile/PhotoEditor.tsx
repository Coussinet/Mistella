// ============================================================
// Mistella - PhotoEditor（プロフィール編集用アバター選択）
// タップで画像ピッカーを開き、選択画像をプレビュー表示する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';

type PhotoEditorProps = {
  avatarUri: string | null;
  /** 新しい画像が選択されたときに URI を通知する */
  onChange: (uri: string) => void;
};

export default function PhotoEditor({ avatarUri, onChange }: PhotoEditorProps) {
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', '設定アプリから写真ライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <MaterialIcons name="person" size={40} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          <MaterialIcons name="camera-alt" size={14} color={COLORS.background} />
        </View>
      </TouchableOpacity>
      <Text style={styles.avatarHint}>タップして変更</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
});
