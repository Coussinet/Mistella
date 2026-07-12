// ============================================================
// Mistella - お気に入りキャスト選択（複数選択）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { COLORS } from '@/constants/colors';
import { SPACING, withAlpha } from '@/constants/theme';
import type { Favorite } from '@/types';
import SectionCard from './SectionCard';

interface FavoriteCastPickerProps {
  favorites: Favorite[];
  selectedIds: Set<string>;
  onToggle: (userId: string) => void;
}

export default function FavoriteCastPicker({
  favorites,
  selectedIds,
  onToggle,
}: FavoriteCastPickerProps) {
  return (
    <SectionCard>
      {favorites.length === 0 ? (
        <Text style={styles.emptyText}>お気に入りのキャストがいません</Text>
      ) : (
        favorites.map((fav) => {
          const user = fav.target_user;
          if (!user) return null;
          const selected = selectedIds.has(user.id);
          return (
            <TouchableOpacity
              key={fav.id}
              style={[styles.castRow, selected && styles.castRowSelected]}
              onPress={() => onToggle(user.id)}
            >
              <Avatar uri={user.avatar_url} size={40} nickname={user.nickname} />
              <Text style={styles.castName}>{user.nickname}</Text>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected ? (
                  <MaterialIcons name="check" size={14} color={COLORS.background} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: SPACING.sm,
  },
  castRowSelected: {
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  castName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
