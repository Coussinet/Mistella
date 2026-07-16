// ============================================================
// Mistella - FavoritesScreen（共通）
// お気に入り一覧。スワイプで削除できる。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import UserListItem from '@/components/common/UserListItem';
import { useFavorites, useRemoveFavorite } from '@/hooks/queries/useFavorites';
import type { CastProfile, CastStackParamList, Favorite } from '@/types';

// -----------------------------------------------------------
// お気に入りアイテム（スワイプ削除対応）
// -----------------------------------------------------------
type FavoriteItemProps = {
  item: Favorite;
  castProfile?: CastProfile;
  onDelete: (favoriteId: string, targetUserId: string) => void;
  onPress: (userId: string) => void;
};

function FavoriteItem({ item, castProfile, onDelete, onPress }: FavoriteItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const user = item.target_user;

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

  const isCast = user.role === 'cast' && castProfile !== undefined;

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} friction={2}>
      <UserListItem
        avatarUrl={user.avatar_url}
        nickname={user.nickname}
        subtitle={isCast ? castProfile?.shop_name ?? undefined : undefined}
        isWorking={isCast && !!castProfile?.is_working}
        onPress={() => onPress(user.id)}
        right={
          <View style={styles.rightRow}>
            {isCast ? (
              <View
                style={[
                  styles.workBadge,
                  castProfile?.is_working ? styles.workBadgeOn : styles.workBadgeOff,
                ]}
              >
                <Text
                  style={[
                    styles.workBadgeText,
                    castProfile?.is_working
                      ? styles.workBadgeTextOn
                      : styles.workBadgeTextOff,
                  ]}
                >
                  {castProfile?.is_working ? '出勤中' : 'オフ'}
                </Text>
              </View>
            ) : null}
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </View>
        }
      />
    </Swipeable>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function FavoritesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CastStackParamList>>();

  const { data, isPending, isError, error, refetch, isRefetching } = useFavorites();
  const removeMutation = useRemoveFavorite();

  const handleDelete = (favoriteId: string, targetUserId: string) => {
    Alert.alert('お気に入り解除', 'お気に入りから削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => removeMutation.mutate(targetUserId),
      },
    ]);
  };

  if (isPending) return <SkeletonList />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  const { favorites, castProfileMap } = data;

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteItem
            item={item}
            castProfile={
              item.target_user ? castProfileMap[item.target_user.id] : undefined
            }
            onDelete={handleDelete}
            onPress={(userId) => navigation.navigate('UserProfile', { userId })}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="favorite-border"
            title="まだお気に入りがありません"
            description="気になる相手をお気に入りに追加してみましょう"
          />
        }
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : undefined}
      />
    </View>
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 78,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  workBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  workBadgeOn: {
    backgroundColor: withAlpha(COLORS.success, 0.15),
  },
  workBadgeOff: {
    backgroundColor: withAlpha(COLORS.textSecondary, 0.12),
  },
  workBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  workBadgeTextOn: {
    color: COLORS.success,
  },
  workBadgeTextOff: {
    color: COLORS.textSecondary,
  },
  deleteAction: {
    width: 80,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginTop: 2,
  },
});
