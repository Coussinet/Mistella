// ============================================================
// Mistella - タイムラインアイテムコンポーネント
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { formatRelativeTime } from '../../utils/dateUtils';
import type { Timeline } from '../../types';
import Avatar from '../common/Avatar';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface TimelineItemProps {
  timeline: Timeline;
  onDelete?: () => void;
  isOwn?: boolean;
}

// -----------------------------------------------------------
// カウントダウン計算ヘルパー
// -----------------------------------------------------------

function getRemainingLabel(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return '期限切れ';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}時間${minutes > 0 ? `${minutes}分` : ''}後に消えます`;
  }
  if (minutes > 0) {
    return `${minutes}分後に消えます`;
  }
  return 'まもなく消えます';
}

// -----------------------------------------------------------
// TimelineItem
// -----------------------------------------------------------

export default function TimelineItem({
  timeline,
  onDelete,
  isOwn = false,
}: TimelineItemProps) {
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    getRemainingLabel(timeline.expires_at),
  );
  const videoRef = useRef<Video>(null);

  // カウントダウンを 1 分ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingLabel(timeline.expires_at));
    }, 60_000);
    return () => clearInterval(timer);
  }, [timeline.expires_at]);

  const handleDelete = () => {
    Alert.alert(
      '投稿を削除',
      'この投稿を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: onDelete,
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Avatar
          uri={timeline.user?.avatar_url ?? null}
          size={44}
          nickname={timeline.user?.nickname}
          isWorking={false}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.nickname}>
            {timeline.user?.nickname ?? '不明なユーザー'}
          </Text>
          <Text style={styles.time}>
            {formatRelativeTime(timeline.created_at)}
          </Text>
        </View>
        {isOwn && onDelete ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="delete-outline"
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* テキスト */}
      {timeline.content ? (
        <Text style={styles.content}>{timeline.content}</Text>
      ) : null}

      {/* メディア */}
      {timeline.media_url ? (
        <View style={styles.mediaWrapper}>
          {timeline.media_type === 'image' ? (
            <>
              <TouchableOpacity
                onPress={() => setLightboxVisible(true)}
                activeOpacity={0.92}
              >
                <Image
                  source={{ uri: timeline.media_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* 全画面ライトボックス */}
              <Modal
                visible={lightboxVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLightboxVisible(false)}
              >
                <TouchableOpacity
                  style={styles.lightbox}
                  onPress={() => setLightboxVisible(false)}
                  activeOpacity={1}
                >
                  <Image
                    source={{ uri: timeline.media_url }}
                    style={styles.lightboxImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.lightboxClose}
                    onPress={() => setLightboxVisible(false)}
                  >
                    <MaterialIcons name="close" size={28} color={COLORS.text} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            </>
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: timeline.media_url }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isLooping={false}
            />
          )}
        </View>
      ) : null}

      {/* カウントダウン */}
      <View style={styles.footer}>
        <MaterialIcons
          name="schedule"
          size={12}
          color={COLORS.textMuted}
          style={styles.footerIcon}
        />
        <Text style={styles.countdown}>{remaining}</Text>
      </View>
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  mediaWrapper: {
    marginBottom: 0,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.surfaceLight,
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerIcon: {
    marginRight: 4,
  },
  countdown: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  // ライトボックス
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '80%',
  },
  lightboxClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
});
