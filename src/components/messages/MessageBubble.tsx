// ============================================================
// YoruConnect - メッセージバブルコンポーネント
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import type { Message } from '../../types';
import Avatar from '../common/Avatar';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderAvatar?: string | null;
  senderNickname?: string;
}

// -----------------------------------------------------------
// 時刻フォーマット（HH:MM）
// -----------------------------------------------------------

function formatTime(dateString: string): string {
  const d = new Date(dateString);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// -----------------------------------------------------------
// MessageBubble
// -----------------------------------------------------------

export default function MessageBubble({
  message,
  isOwn,
  senderAvatar,
  senderNickname,
}: MessageBubbleProps) {
  const [lightboxVisible, setLightboxVisible] = useState(false);

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {/* 相手側のアバター */}
      {!isOwn ? (
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={senderAvatar ?? null}
            size={32}
            nickname={senderNickname}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.bubbleWrapper,
          isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther,
        ]}
      >
        {/* 画像メッセージ */}
        {message.image_url ? (
          <>
            <TouchableOpacity
              onPress={() => setLightboxVisible(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: message.image_url }}
                style={[
                  styles.imageMessage,
                  isOwn ? styles.imageOwn : styles.imageOther,
                ]}
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
                  source={{ uri: message.image_url }}
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
        ) : null}

        {/* テキストバブル */}
        {message.content ? (
          <View
            style={[
              styles.bubble,
              isOwn ? styles.bubbleOwn : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isOwn ? styles.textOwn : styles.textOther,
              ]}
            >
              {message.content}
            </Text>
          </View>
        ) : null}

        {/* フッター: 時刻 + 既読 */}
        <View
          style={[
            styles.metaRow,
            isOwn ? styles.metaRowOwn : styles.metaRowOther,
          ]}
        >
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
          {isOwn ? (
            <MaterialIcons
              name={message.is_read ? 'done-all' : 'done'}
              size={12}
              color={message.is_read ? COLORS.neonBlue : COLORS.textMuted}
              style={styles.readIcon}
            />
          ) : null}
        </View>
      </View>

      {/* 自分側のスペーサー（アバターの代わり） */}
      {isOwn ? <View style={styles.ownSpacer} /> : null}
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    marginBottom: 4,
  },
  ownSpacer: {
    width: 32,
  },
  bubbleWrapper: {
    maxWidth: '72%',
    gap: 2,
  },
  bubbleWrapperOwn: {
    alignItems: 'flex-end',
  },
  bubbleWrapperOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  bubbleOwn: {
    backgroundColor: 'rgba(201,168,76,0.18)', // COLORS.gold 30% opacity
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textOwn: {
    color: COLORS.text,
  },
  textOther: {
    color: COLORS.text,
  },
  imageMessage: {
    width: 200,
    height: 160,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
  },
  imageOwn: {
    borderBottomRightRadius: 4,
  },
  imageOther: {
    borderBottomLeftRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  metaRowOwn: {
    justifyContent: 'flex-end',
  },
  metaRowOther: {
    justifyContent: 'flex-start',
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  readIcon: {
    marginLeft: 2,
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
