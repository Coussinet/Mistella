// ============================================================
// Mistella - 特定キャスト検索・選択
// 選択済みならカード表示、未選択なら検索バー + 結果リストを表示する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, withAlpha } from '@/constants/theme';
import type { CastProfileWithUser } from '@/types';
import SectionCard from './SectionCard';

interface CastSearchPickerProps {
  selectedCast: CastProfileWithUser | null;
  searchText: string;
  results: CastProfileWithUser[];
  onSearchTextChange: (text: string) => void;
  onSelect: (cast: CastProfileWithUser) => void;
  onClear: () => void;
}

export default function CastSearchPicker({
  selectedCast,
  searchText,
  results,
  onSearchTextChange,
  onSelect,
  onClear,
}: CastSearchPickerProps) {
  return (
    <SectionCard>
      {selectedCast ? (
        <View style={styles.selectedCastCard}>
          <Avatar
            uri={selectedCast.user.avatar_url}
            size={48}
            nickname={selectedCast.user.nickname}
          />
          <View style={styles.selectedCastInfo}>
            <Text style={styles.selectedCastName}>{selectedCast.user.nickname}</Text>
            {selectedCast.shop_name ? (
              <Text style={styles.selectedCastShop}>{selectedCast.shop_name}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="キャスト名・店舗名で検索"
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={onSearchTextChange}
            />
          </View>
          {results.map((cast) => (
            <TouchableOpacity
              key={cast.user_id}
              style={styles.castRow}
              onPress={() => onSelect(cast)}
            >
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
            </TouchableOpacity>
          ))}
        </>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  selectedCastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.3),
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  selectedCastInfo: {
    flex: 1,
    gap: 2,
  },
  selectedCastName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedCastShop: {
    color: COLORS.textMuted,
    fontSize: 12,
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
