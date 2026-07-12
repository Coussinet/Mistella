// ============================================================
// Mistella - UserListItem 共通コンポーネント
// アバター + 名前 + サブテキスト + 右端要素のリスト行。
// お気に入り・足跡・マッチ・記録一覧などで共用する。
// ============================================================

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';
import Avatar from './Avatar';

interface UserListItemProps {
  avatarUrl: string | null;
  nickname: string;
  /** 名前の下に出す補足（時刻・メモ抜粋など） */
  subtitle?: string;
  /** 名前の右に出す小さなメタ情報 */
  meta?: string;
  /** 右端に置く要素（バッジ・ボタンなど） */
  right?: React.ReactNode;
  isWorking?: boolean;
  onPress?: () => void;
  avatarSize?: number;
}

export default function UserListItem({
  avatarUrl,
  nickname,
  subtitle,
  meta,
  right,
  isWorking = false,
  onPress,
  avatarSize = 50,
}: UserListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Avatar uri={avatarUrl} size={avatarSize} nickname={nickname} isWorking={isWorking} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.nickname} numberOfLines={1}>
            {nickname}
          </Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  nickname: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
    flexShrink: 1,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
