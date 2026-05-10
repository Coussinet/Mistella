// ============================================================
// YoruConnect - キャストカードコンポーネント
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import type { CastProfile, User } from '../../types';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface CastCardProps {
  cast: CastProfile & { user: User };
  onPress: () => void;
  onLike?: () => void;
  onTonightRequest?: () => void;
  isLiked?: boolean;
}

// -----------------------------------------------------------
// CastCard
// -----------------------------------------------------------

export default function CastCard({
  cast,
  onPress,
  onLike,
  onTonightRequest,
  isLiked = false,
}: CastCardProps) {
  const { user } = cast;

  return (
    <TouchableOpacity
      style={[styles.card, cast.is_sponsored && styles.cardSponsored]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* スポンサーバッジ */}
      {cast.is_sponsored && (
        <View style={styles.sponsoredBadge}>
          <MaterialIcons name="star" size={10} color={COLORS.background} />
          <Text style={styles.sponsoredText}>Sponsored</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* アバター */}
        <Avatar
          uri={user.avatar_url}
          size={72}
          nickname={user.nickname}
          isWorking={cast.is_working}
        />

        {/* 情報エリア */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname} numberOfLines={1}>
              {user.nickname}
            </Text>
            <StatusBadge status={cast.work_status} size="small" />
          </View>

          {cast.shop_name && (
            <View style={styles.shopRow}>
              <MaterialIcons name="store" size={13} color={COLORS.textMuted} />
              <Text style={styles.shopName} numberOfLines={1}>
                {cast.shop_name}
              </Text>
            </View>
          )}

          {user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
        </View>
      </View>

      {/* アクションボタン */}
      <View style={styles.actions}>
        {onLike && (
          <TouchableOpacity
            style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
            onPress={onLike}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons
              name={isLiked ? 'favorite' : 'favorite-border'}
              size={22}
              color={isLiked ? COLORS.error : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
        {onTonightRequest && (
          <TouchableOpacity
            style={styles.tonightBtn}
            onPress={onTonightRequest}
            activeOpacity={0.8}
          >
            <MaterialIcons name="nights-stay" size={16} color={COLORS.background} />
            <Text style={styles.tonightBtnText}>今夜行ける？</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardSponsored: {
    borderColor: COLORS.gold,
    borderWidth: 1.5,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 3,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.3,
  },
  content: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  info: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopName: {
    fontSize: 12,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  bio: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    padding: 6,
  },
  actionBtnLiked: {
    // アクティブ状態はアイコン色で表現
  },
  tonightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 5,
  },
  tonightBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.background,
  },
});
