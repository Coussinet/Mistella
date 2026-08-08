// ============================================================
// Mistella - 顧客ホーム画面（タイムライン）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TimelineItem from '@/components/timeline/TimelineItem';
import TimelinePostForm from '@/components/timeline/TimelinePostForm';
import WorkingCastsCarousel from '@/components/cast/WorkingCastsCarousel';
import PageHeader from '@/components/common/PageHeader';
import {
  useCreateTimeline,
  useDeleteTimeline,
  useTimelines,
  useTimelinesRealtime,
} from '@/hooks/queries/useTimelines';
import { useAuthStore } from '@/store/authStore';
import type { CustomerStackParamList, Timeline } from '@/types';
import { showError } from '@/utils/showError';

// -----------------------------------------------------------
// CustomerHomeScreen
// -----------------------------------------------------------

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function CustomerHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { profile } = useAuthStore();

  const [postFormVisible, setPostFormVisible] = useState(false);

  // -----------------------------------------------------------
  // タイムライン取得（無限スクロール）
  // -----------------------------------------------------------

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
    isRefetching,
    refetch,
  } = useTimelines();
  // 新着投稿をリアルタイムで先頭に反映（キャスト側ホームと同挙動）
  useTimelinesRealtime();

  const timelines = useMemo(
    () => data?.pages.flat() ?? [],
    [data],
  );

  // -----------------------------------------------------------
  // 投稿
  // -----------------------------------------------------------

  const postMutation = useCreateTimeline();

  const handlePost = useCallback(
    async (
      content: string,
      mediaUri?: string,
      mediaType?: 'image' | 'video',
    ) => {
      try {
        await postMutation.mutateAsync({
          content: content || null,
          mediaUri,
          mediaType,
        });
        setPostFormVisible(false);
      } catch (e: unknown) {
        showError(e, '投稿に失敗しました。');
      }
    },
    [postMutation],
  );

  // -----------------------------------------------------------
  // 削除
  // -----------------------------------------------------------

  const deleteMutation = useDeleteTimeline();

  // -----------------------------------------------------------
  // レンダー
  // -----------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: Timeline }) => (
      <TimelineItem
        timeline={item}
        isOwn={item.user_id === profile?.id}
        onDelete={
          item.user_id === profile?.id
            ? () => deleteMutation.mutate(item.id)
            : undefined
        }
        onAvatarPress={
          item.user_id
            ? () => navigation.navigate('UserProfile', { userId: item.user_id })
            : undefined
        }
      />
    ),
    [profile, deleteMutation, navigation],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return <LoadingSpinner />;
  };

  const renderEmpty = () => (
    <EmptyState
      icon="dynamic-feed"
      title="まだ投稿がありません"
      description="キャストの投稿がここに表示されます"
    />
  );

  if (isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <SkeletonList />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorView error={error} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PageHeader
        title="ホーム"
        description="今夜のきっかけを、気軽に見つけよう"
        action={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.postAction}
              onPress={() => setPostFormVisible(true)}
              activeOpacity={0.8}
              accessibilityLabel="タイムラインに投稿する"
            >
              <MaterialIcons name="edit" size={16} color={COLORS.gold} />
              <Text style={styles.postActionText}>投稿</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tonightFAB}
              onPress={() => navigation.navigate('SendTonightRequest', {})}
              activeOpacity={0.85}
              accessibilityLabel="今夜行けるキャストを探す"
            >
              <MaterialIcons name="local-fire-department" size={17} color={COLORS.background} />
              <Text style={styles.tonightFABText}>今夜</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* タイムラインリスト */}
      <FlatList
        data={timelines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <WorkingCastsCarousel
            onPressCast={(userId) => navigation.navigate('UserProfile', { userId })}
          />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          timelines.length === 0 ? styles.emptyList : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
      />

      {/* 投稿フォームモーダル */}
      <Modal
        visible={postFormVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPostFormVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.postFormSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>タイムラインに投稿</Text>
            <TimelinePostForm
              onPost={handlePost}
              onCancel={() => setPostFormVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xxs,
    borderRadius: RADIUS.pill,
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.5),
  },
  postActionText: {
    ...TYPOGRAPHY.label,
    color: COLORS.gold,
  },

  // 今夜行ける？FABボタン
  tonightFAB: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    minHeight: 38,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xxs,
    ...SHADOWS.glow,
  },
  tonightFABText: {
    color: COLORS.background,
    ...TYPOGRAPHY.label,
    fontWeight: '700',
  },

  // リスト
  listContent: {
    paddingTop: SPACING.xs,
    paddingBottom: 112,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // 投稿モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  postFormSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
});
