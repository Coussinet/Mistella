// ============================================================
// Mistella - ProfileScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { useFavorites } from '@/hooks/queries/useFavorites';
import { useFootprints } from '@/hooks/queries/useFootprints';
import { useMyCastProfile, useMyProfile } from '@/hooks/queries/useProfile';
import {
  useDeleteTimeline,
  useUpdateTimeline,
  useUserTimelines,
} from '@/hooks/queries/useTimelines';
import { useAuthStore } from '@/store/authStore';
import type {
  CastStackParamList,
  CustomerStackParamList,
  Timeline,
} from '@/types';
import { showError } from '@/utils/showError';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

// -----------------------------------------------------------
// 出勤ステータスバッジ
// -----------------------------------------------------------
type WorkStatus = 'working' | 'break' | 'off';

function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const config: Record<WorkStatus, { label: string; color: string }> = {
    working: { label: '出勤中', color: COLORS.success },
    break: { label: '休憩中', color: COLORS.gold },
    off: { label: 'オフ', color: COLORS.textMuted },
  };
  const { label, color } = config[status];
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

// -----------------------------------------------------------
// グリッドアイテム
// -----------------------------------------------------------
function GridItem({
  item,
  onEdit,
  onDelete,
}: {
  item: Timeline;
  onEdit: (item: Timeline) => void;
  onDelete: (item: Timeline) => void;
}) {
  // 長押しで編集・削除メニューを表示（自分の投稿）
  const handleLongPress = () => {
    Alert.alert('投稿の操作', undefined, [
      { text: '編集', onPress: () => onEdit(item) },
      { text: '削除', style: 'destructive', onPress: () => onDelete(item) },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onLongPress={handleLongPress}
      delayLongPress={300}
      activeOpacity={0.8}
    >
      {item.media_url && item.media_type === 'image' ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} resizeMode="cover" />
      ) : item.media_url && item.media_type === 'video' ? (
        <View style={[styles.gridImage, styles.gridVideoPlaceholder]}>
          <MaterialIcons name="play-circle-outline" size={28} color={COLORS.gold} />
        </View>
      ) : (
        <View style={[styles.gridImage, styles.gridTextPlaceholder]}>
          <Text style={styles.gridTextPreview} numberOfLines={3}>
            {item.content ?? ''}
          </Text>
        </View>
      )}
      {item.media_url && item.content ? (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.gridMessageOverlay}
          pointerEvents="none"
        >
          <Text style={styles.gridMediaMessage} numberOfLines={2}>{item.content}</Text>
        </LinearGradient>
      ) : null}
      <TouchableOpacity
        style={styles.postMenuButton}
        onPress={handleLongPress}
        accessibilityRole="button"
        accessibilityLabel="投稿の操作メニュー"
      >
        <MaterialIcons name="more-horiz" size={18} color={COLORS.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const navigation = useNavigation<
    NativeStackNavigationProp<CastStackParamList & CustomerStackParamList>
  >();

  // プロフィール（取得成功時に authStore と同期される）
  const profileQuery = useMyProfile();
  const castQuery = useMyCastProfile();
  const timelinesQuery = useUserTimelines(user?.id);
  const footprintsQuery = useFootprints();
  const favoritesQuery = useFavorites();

  const timelines = timelinesQuery.data ?? [];
  const footprintCount = footprintsQuery.data?.length ?? 0;
  const favoriteCount = favoritesQuery.data?.favorites.length ?? 0;
  const castData = castQuery.data ?? null;

  const isPending =
    profileQuery.isPending ||
    timelinesQuery.isPending ||
    footprintsQuery.isPending ||
    favoritesQuery.isPending ||
    (profile?.role === 'cast' && castQuery.isPending);

  const isError =
    profileQuery.isError ||
    timelinesQuery.isError ||
    footprintsQuery.isError ||
    favoritesQuery.isError ||
    castQuery.isError;

  const handleRetry = () => {
    if (profileQuery.isError) profileQuery.refetch();
    if (timelinesQuery.isError) timelinesQuery.refetch();
    if (footprintsQuery.isError) footprintsQuery.refetch();
    if (favoritesQuery.isError) favoritesQuery.refetch();
    if (castQuery.isError) castQuery.refetch();
  };

  const handleSignOut = async () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e: unknown) {
            showError(e, 'ログアウトに失敗しました。');
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // 投稿の編集・削除
  const deleteTimelineMutation = useDeleteTimeline();
  const updateTimelineMutation = useUpdateTimeline();
  const [editingPost, setEditingPost] = useState<Timeline | null>(null);
  const [editText, setEditText] = useState('');

  const handleEditPost = (item: Timeline) => {
    setEditingPost(item);
    setEditText(item.content ?? '');
  };

  const handleDeletePost = (item: Timeline) => {
    Alert.alert('投稿を削除', 'この投稿を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => deleteTimelineMutation.mutate(item.id),
      },
    ]);
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    updateTimelineMutation.mutate(
      { id: editingPost.id, content: editText.trim() || null },
      { onSuccess: () => setEditingPost(null) },
    );
  };

  if (isPending) {
    return (
      <View style={styles.container}>
        <SkeletonList />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorView
        error={
          profileQuery.error ??
          timelinesQuery.error ??
          footprintsQuery.error ??
          favoritesQuery.error ??
          castQuery.error
        }
        onRetry={handleRetry}
      />
    );
  }

  return (
    <>
    <FlatList
      data={timelines}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <GridItem item={item} onEdit={handleEditPost} onDelete={handleDeletePost} />
      )}
      ListHeaderComponent={
        <View>
          {/* プロフィールヘッダー */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarSection}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <MaterialIcons name="person" size={40} color={COLORS.textMuted} />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile?.nickname ?? ''}</Text>
              {profile?.role === 'cast' && castData && (
                <WorkStatusBadge status={castData.work_status} />
              )}
              {profile?.role === 'cast' && castData?.shop_name ? (
                <Text style={styles.shopName}>
                  <MaterialIcons name="store" size={12} color={COLORS.textSecondary} />{' '}
                  {castData.shop_name}
                </Text>
              ) : null}
            </View>
          </View>

          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          {/* 統計（タップで各一覧へ） */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Footprints')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="visibility" size={20} color={COLORS.neonBlue} />
              <Text style={styles.statNumber}>{footprintCount}</Text>
              <Text style={styles.statLabel}>足跡</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Favorites')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="star" size={20} color={COLORS.gold} />
              <Text style={styles.statNumber}>{favoriteCount}</Text>
              <Text style={styles.statLabel}>お気に入り</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="dynamic-feed" size={20} color={COLORS.textSecondary} />
              <Text style={styles.statNumber}>{timelines.length}</Text>
              <Text style={styles.statLabel}>投稿</Text>
            </View>
          </View>

          {/* 編集ボタン */}
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={16} color={COLORS.gold} />
            <Text style={styles.editButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>

          {/* 会った記録リンク（客側。キャストは記録タブから） */}
          {profile?.role === 'customer' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Contacts')}
            >
              <MaterialIcons name="menu-book" size={22} color={COLORS.gold} />
              <Text style={styles.menuItemText}>会った記録</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          {/* 通知設定リンク */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <MaterialIcons name="notifications" size={22} color={COLORS.gold} />
            <Text style={styles.menuItemText}>通知設定</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* グリッドセクション見出し */}
          {timelines.length > 0 && (
            <View style={styles.gridHeader}>
              <MaterialIcons name="grid-on" size={18} color={COLORS.textSecondary} />
              <Text style={styles.gridHeaderText}>投稿</Text>
            </View>
          )}

          {timelines.length === 0 && (
            <View style={styles.emptyTimeline}>
              <MaterialIcons name="dynamic-feed" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>まだ投稿がありません</Text>
            </View>
          )}
        </View>
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={18} color={COLORS.error} />
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      }
      contentContainerStyle={styles.listContent}
      style={styles.container}
    />

    {/* 投稿編集モーダル */}
    <Modal
      visible={editingPost !== null}
      animationType="fade"
      transparent
      onRequestClose={() => setEditingPost(null)}
    >
      <View style={styles.editOverlay}>
        <View style={styles.editSheet}>
          <Text style={styles.editTitle}>投稿を編集</Text>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            maxLength={300}
            placeholder="投稿内容"
            placeholderTextColor={COLORS.textMuted}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.editCancel}
              onPress={() => setEditingPost(null)}
            >
              <Text style={styles.editCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editSave}
              onPress={handleSaveEdit}
              disabled={updateTimelineMutation.isPending}
            >
              <Text style={styles.editSaveText}>
                {updateTimelineMutation.isPending ? '保存中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  editOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  editSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  editInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    padding: SPACING.sm,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  editCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  editCancelText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
  },
  editSave: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.gold,
  },
  editSaveText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  avatarSection: {},
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopName: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 20,
  },
  editButtonText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 14,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  gridHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 0.5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridMessageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 54,
    justifyContent: 'flex-end',
    padding: 7,
  },
  gridMediaMessage: {
    color: COLORS.text,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
  },
  postMenuButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  gridVideoPlaceholder: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextPlaceholder: {
    backgroundColor: COLORS.surface,
    padding: 6,
    justifyContent: 'center',
  },
  gridTextPreview: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
  },
  signOutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
