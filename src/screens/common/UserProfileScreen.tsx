// ============================================================
// Mistella - UserProfileScreen（他ユーザープロフィール）
// フルブリードのパララックスヒーロー + Card 風詳細セクション +
// 下部固定ガラスアクションバーで構成するモダンプロフィール画面。
// セクション実装は src/components/profile/ に分割。
// ============================================================

import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import ErrorView from '@/components/common/ErrorView';
import { Skeleton, SkeletonList } from '@/components/common/Skeleton';
import HeaderCircleButton from '@/components/profile/HeaderCircleButton';
import ProfileActionBar, { ACTION_BAR_HEIGHT } from '@/components/profile/ProfileActionBar';
import ProfileDetailSections from '@/components/profile/ProfileDetailSections';
import ProfileHero, { HERO_HEIGHT } from '@/components/profile/ProfileHero';
import {
  TimelineGridItem,
  TimelineSectionHeader,
} from '@/components/profile/ProfileTimelineGrid';
import ReportModal from '@/components/profile/ReportModal';
import TonightModal from '@/components/profile/TonightModal';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';
import { useMatches } from '@/hooks/queries/useMatches';
import {
  useBlockUser,
  useRecordFootprint,
  useSendLike,
  useToggleFavorite,
  useUserProfile,
} from '@/hooks/queries/useUserProfile';
import { useProfilePhotos } from '@/hooks/queries/useProfilePhotos';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList } from '@/types';
import { success } from '@/utils/haptics';

type RouteParams = { userId: string };

export default function UserProfileScreen() {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { userId } = route.params as RouteParams;
  const { user: currentUser, profile: currentProfile } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<CastStackParamList>>();

  const [tonightModalVisible, setTonightModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const { targetUser, castProfile, timelines, liked, favorited, isPending, isError, error, refetch } =
    useUserProfile(userId);

  // 追加のプロフィール写真（ヒーローの横スワイプギャラリー用）
  const { data: profilePhotos } = useProfilePhotos(userId);
  const photoUrls = (profilePhotos ?? []).map((p) => p.photo_url);

  // 足跡を残す（自分自身は除く）
  useRecordFootprint(userId);

  const likeMutation = useSendLike(userId);
  const favoriteMutation = useToggleFavorite(userId);
  const blockMutation = useBlockUser();
  const { data: matches } = useMatches();

  // パララックス用スクロールオフセット
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const isOwnProfile = currentUser?.id === userId;
  const match = (matches ?? []).find(
    (m) => m.cast_id === userId || m.customer_id === userId,
  );

  const handleLike = () => {
    if (!currentUser || likeMutation.isPending) return;
    likeMutation.mutate(undefined, {
      onSuccess: ({ matched }) => {
        if (matched) {
          success();
          Alert.alert('マッチング成立！', 'マッチングしました！チャットを始めましょう。');
        } else {
          Alert.alert('いいね！', 'いいねを送りました。');
        }
      },
    });
  };

  const handleFavorite = () => {
    if (!currentUser || favoriteMutation.isPending) return;
    favoriteMutation.mutate(!favorited);
  };

  const handleMessage = () => {
    if (!match || !targetUser) return;
    navigation.navigate('ChatRoom', { matchId: match.id, partnerUser: targetUser });
  };

  const { mutate: blockUserMutate } = blockMutation;

  const handleBlock = useCallback(() => {
    if (!currentUser) return;
    Alert.alert(
      'ブロックしますか？',
      'ブロックすると相手はあなたのプロフィールや投稿を閲覧できなくなります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ブロック',
          style: 'destructive',
          onPress: () => {
            blockUserMutate(userId, {
              onSuccess: () => {
                Alert.alert('ブロックしました', '', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              },
            });
          },
        },
      ],
    );
  }, [currentUser, userId, navigation, blockUserMutate]);

  // 透過ヘッダー（ヒーローを画面最上部まで届かせる）+ ブロック/通報/メモ導線
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerLeft: () => (
        <HeaderCircleButton
          icon="arrow-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="戻る"
        />
      ),
      headerRight: isOwnProfile
        ? undefined
        : () => (
            <HeaderCircleButton
              icon="more-vert"
              accessibilityLabel="メニュー"
              onPress={() =>
                Alert.alert('', '', [
                  {
                    text: 'メモ・会った記録',
                    onPress: () => navigation.navigate('PartnerNote', { partnerId: userId }),
                  },
                  { text: '通報する', onPress: () => setReportModalVisible(true) },
                  { text: 'ブロックする', style: 'destructive', onPress: handleBlock },
                  { text: 'キャンセル', style: 'cancel' },
                ])
              }
            />
          ),
    });
  }, [userId, isOwnProfile, navigation, handleBlock]);

  if (isPending) {
    return (
      <View style={styles.container}>
        <Skeleton width="100%" height={HERO_HEIGHT} borderRadius={0} />
        <SkeletonList count={4} />
      </View>
    );
  }

  if (isError) {
    return <ErrorView error={error} onRetry={refetch} />;
  }

  if (!targetUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>ユーザーが見つかりませんでした。</Text>
      </View>
    );
  }

  const isCustomer = currentProfile?.role === 'customer';
  const isCastTarget = targetUser.role === 'cast';

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={timelines}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => <TimelineGridItem item={item} />}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            <ProfileHero
              user={targetUser}
              castProfile={castProfile}
              scrollY={scrollY}
              photoUrls={photoUrls}
            />
            <View style={styles.body}>
              <ProfileDetailSections user={targetUser} castProfile={castProfile} />
              <TimelineSectionHeader count={timelines.length} />
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        style={styles.container}
      />

      {/* 下部固定ガラスアクションバー（自分以外） */}
      {!isOwnProfile && (
        <ProfileActionBar
          liked={liked}
          liking={likeMutation.isPending}
          favorited={favorited}
          favoriting={favoriteMutation.isPending}
          showTonight={isCustomer && isCastTarget}
          matched={!!match}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onTonight={() => setTonightModalVisible(true)}
          onMessage={handleMessage}
        />
      )}

      {isCastTarget && (
        <TonightModal
          visible={tonightModalVisible}
          castId={userId}
          onClose={() => setTonightModalVisible(false)}
        />
      )}
      <ReportModal
        visible={reportModalVisible}
        targetUserId={userId}
        onClose={() => setReportModalVisible(false)}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  body: {
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: ACTION_BAR_HEIGHT + SPACING.xl,
  },
});
