// ============================================================
// Mistella - 現在地周辺の出勤中キャスト一覧
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '@/components/common/Avatar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';
import type { CastProfileWithUser } from '@/types';
import SectionCard from './SectionCard';

interface NearbyCastPickerProps {
  casts: CastProfileWithUser[];
  isFetching: boolean;
  onRetry: () => void;
}

export default function NearbyCastPicker({
  casts,
  isFetching,
  onRetry,
}: NearbyCastPickerProps) {
  return (
    <SectionCard>
      {isFetching ? (
        <LoadingSpinner />
      ) : casts.length === 0 ? (
        <View style={styles.emptyNearby}>
          <MaterialIcons name="location-off" size={36} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            現在地周辺に出勤中のキャストがいません
          </Text>
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.retryText}>再検索</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.nearbyCount}>
            {casts.length}人のキャストに送信します
          </Text>
          {casts.map((cast) => (
            <View key={cast.user_id} style={styles.castRow}>
              <Avatar
                uri={cast.user.avatar_url}
                size={40}
                nickname={cast.user.nickname}
              />
              <View style={styles.castInfo}>
                <Text style={styles.castName}>{cast.user.nickname}</Text>
                {cast.shop_name ? (
                  <Text style={styles.castShop}>{cast.shop_name}</Text>
                ) : null}
              </View>
              <MaterialIcons name="near-me" size={16} color={COLORS.neonBlue} />
            </View>
          ))}
        </>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  nearbyCount: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyNearby: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: SPACING.sm,
  },
  castInfo: {
    flex: 1,
    gap: 2,
  },
  castName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  castShop: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
