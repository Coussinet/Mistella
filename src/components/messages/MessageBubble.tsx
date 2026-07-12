// ============================================================
// Mistella - メッセージバブルコンポーネント
// - グルーピング（同一送信者・5分以内）に応じた連結角丸
// - optimistic 送信中（id が temp- 始まり）の視覚化
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
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, withAlpha } from '@/constants/theme';
import type { Message } from '@/types';
import Avatar from '@/components/common/Avatar';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

/** 連続メッセージ内での位置（角丸・アバター・時刻表示の制御に使用） */
export type BubbleGroupPosition = 'single' | 'first' | 'middle' | 'last';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderAvatar?: string | null;
  senderNickname?: string;
  /** グループ内位置（省略時は単独メッセージ扱い） */
  groupPosition?: BubbleGroupPosition;
}

const AVATAR_SIZE = 32;
/** グループ内で連結する側の角丸 */
const LINKED_RADIUS = 4;

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
  groupPosition = 'single',
}: MessageBubbleProps) {
  const [lightboxVisible, setLightboxVisible] = useState(false);

  // optimistic 送信中（useSendMessage が temp- で始まる仮 id を振る）
  const isSending = message.id.startsWith('temp-');

  // グループ末尾（または単独）でのみアバター・時刻を表示する
  const isGroupEnd = groupPosition === 'single' || groupPosition === 'last';
  const showAvatar = !isOwn && isGroupEnd;
  const showMeta = isGroupEnd || isSending;
  // 直前が同一グループなら詰めて表示する
  const isLinkedToPrev = groupPosition === 'middle' || groupPosition === 'last';

  // 連結形状: グループ内で隣接する側の角丸を小さくする
  // （末尾のしっぽは既存デザインを踏襲して常に小さいまま）
  const linkedCornerStyle = isLinkedToPrev
    ? isOwn
      ? styles.linkedTopRight
      : styles.linkedTopLeft
    : null;

  return (
    <View
      style={[
        styles.row,
        isOwn ? styles.rowOwn : styles.rowOther,
        isLinkedToPrev ? styles.rowLinked : null,
      ]}
    >
      {/* 相手側のアバター（グループ末尾のみ表示、それ以外は位置合わせ用スペーサー） */}
      {!isOwn ? (
        showAvatar ? (
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={senderAvatar ?? null}
              size={AVATAR_SIZE}
              nickname={senderNickname}
            />
          </View>
        ) : (
          <View style={styles.avatarSpacer} />
        )
      ) : null}

      <View
        style={[
          styles.bubbleWrapper,
          isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther,
          isSending ? styles.bubbleWrapperSending : null,
        ]}
      >
        {/* 画像メッセージ */}
        {message.image_url ? (
          <>
            <TouchableOpacity
              onPress={() => setLightboxVisible(true)}
              activeOpacity={0.9}
              disabled={isSending}
            >
              <Image
                source={{ uri: message.image_url }}
                style={[
                  styles.imageMessage,
                  isOwn ? styles.imageOwn : styles.imageOther,
                  linkedCornerStyle,
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
              linkedCornerStyle,
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

        {/* フッター: 送信中 or 時刻 + 既読 */}
        {showMeta ? (
          <View
            style={[
              styles.metaRow,
              isOwn ? styles.metaRowOwn : styles.metaRowOther,
            ]}
          >
            {isSending ? (
              <>
                <MaterialIcons
                  name="schedule"
                  size={11}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.sendingText}>送信中</Text>
              </>
            ) : (
              <>
                <Text style={styles.time}>{formatTime(message.created_at)}</Text>
                {isOwn ? (
                  <MaterialIcons
                    name={message.is_read ? 'done-all' : 'done'}
                    size={12}
                    color={message.is_read ? COLORS.neonBlue : COLORS.textMuted}
                    style={styles.readIcon}
                  />
                ) : null}
              </>
            )}
          </View>
        ) : null}
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
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  rowLinked: {
    // 同一グループ内は詰めて連結感を出す
    marginTop: 2,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    marginBottom: SPACING.xxs,
  },
  avatarSpacer: {
    width: AVATAR_SIZE,
  },
  ownSpacer: {
    width: AVATAR_SIZE,
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
  bubbleWrapperSending: {
    opacity: 0.55,
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  bubbleOwn: {
    backgroundColor: withAlpha(COLORS.gold, 0.18),
    borderBottomRightRadius: LINKED_RADIUS,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.35),
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: LINKED_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkedTopRight: {
    borderTopRightRadius: LINKED_RADIUS,
  },
  linkedTopLeft: {
    borderTopLeftRadius: LINKED_RADIUS,
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
    borderBottomRightRadius: LINKED_RADIUS,
  },
  imageOther: {
    borderBottomLeftRadius: LINKED_RADIUS,
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
  sendingText: {
    color: COLORS.textSecondary,
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
    borderRadius: RADIUS.xl,
    padding: 6,
  },
});
