// ============================================================
// Mistella - FavoritesScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { COLORS } from '@/constants/colors';
import { withAlpha } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getFavorites, removeFavorite } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import type {
  CastProfile,
  CastStackParamList,
  Favorite,
} from '@/types';

// -----------------------------------------------------------
// 出勤バッジ（キャスト用）
// -----------------------------------------------------------
function WorkBadge({ isWorking }: { isWorking: boolean }) {
  return (
    <View style={[styles.workBadge, isWorking ? styles.workBadgeOn : styles.workBadgeOff]}>
      <Text style={[styles.workBadgeText, isWorking ? styles.workBadgeTextOn : styles.workBadgeTextOff]}>
        {isWorking ? '出勤中' : 'オフ'}
      </Text>
    </View>
  );
}

// -----------------------------------------------------------
// お気に入りアイテム（スワイプ削除対応）
// -----------------------------------------------------------
type FavoriteItemProps = {
  item: Favorite;
  castProfileMap: Record<string, CastProfile>;
  onDelete: (favoriteId: string, targetUserId: string) => void;
  onPress: (userId: string) => void;
};

function FavoriteItem({ item, castProfileMap, onDelete, onPress }: FavoriteItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const user = item.target_user;
  const castProfile = user ? castProfileMap[user.id] : undefined;

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(item.id, item.target_user_id);
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="delete" size={24} color={COLORS.text} />
          <Text style={styles.deleteActionText}>削除</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (!user) return null;

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} friction={2}>
      <TouchableOpacity style={styles.item} onPress={() => onPress(user.id)} activeOpacity={0.75}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <MaterialIcons name="person" size={24} color={COLORS.textMuted} />
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          {user.role === 'cast' && castProfile !== undefined && (
            <WorkBadge isWorking={castProfile.is_working} />
          )}
        </View>

        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Swipeable>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function FavoritesScreen() {
  const { user } = useAuthStore();
  // UserProfile は CastStackParamList に定義済み。顧客スタックからも navigate 可能。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [castProfileMap, setCastProfileMap] = useState<Record<string, CastProfile>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getFavorites(user.id);
      setFavorites(data);

      // キャストのプロフィールを一括取得
      const castIds = data
        .filter((f) => f.target_user?.role === 'cast')
        .map((f) => f.target_user_id);

      if (castIds.length > 0) {
        const { data: castData } = await supabase
          .from('cast_profiles')
          .select('*')
          .in('user_id', castIds);
        if (castData) {
          const map: Record<string, CastProfile> = {};
          for (const cp of castData as CastProfile[]) {
            map[cp.user_id] = cp;
          }
          setCastProfileMap(map);
        }
      }
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (favoriteId: string, targetUserId: string) => {
    if (!user) return;
    Alert.alert('お気に入り削除', 'お気に入りから削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFavorite(user.id, targetUserId);
            setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
          } catch (e: unknown) {
            Alert.alert('エラー', e instanceof Error ? e.message : '削除に失敗しました。');
          }
        },
      },
    ]);
  };

  const handlePress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteItem
            item={item}
            castProfileMap={castProfileMap}
            onDelete={handleDelete}
            onPress={handlePress}
          />
        )}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="star-border" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>お気に入りがありません</Text>
            <Text style={styles.emptySubtitle}>
              気になるユーザーをお気に入り登録しましょう
            </Text>
          </View>
        }
        contentContainerStyle={
          favorites.length === 0 ? styles.emptyList : styles.listContent
        }
      />
    </GestureHandlerRootView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  workBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  workBadgeOn: {
    borderColor: COLORS.success,
    backgroundColor: withAlpha(COLORS.success, 0.1),
  },
  workBadgeOff: {
    borderColor: COLORS.textMuted,
    backgroundColor: 'transparent',
  },
  workBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  workBadgeTextOn: {
    color: COLORS.success,
  },
  workBadgeTextOff: {
    color: COLORS.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 78,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    gap: 2,
  },
  deleteActionText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
  },
});
