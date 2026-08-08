// ============================================================
// Mistella - MatchesScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { useMatches } from '@/hooks/queries/useMatches';
import { useAuthStore } from '@/store/authStore';
import type {
  CastStackParamList,
  CustomerStackParamList,
  Match,
  User,
} from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';

// -----------------------------------------------------------
// マッチアイテム
// -----------------------------------------------------------
type MatchItemProps = {
  match: Match;
  myUserId: string;
  onPress: (match: Match, partner: User) => void;
};

function MatchItem({ match, myUserId, onPress }: MatchItemProps) {
  // 相手ユーザーを特定する
  const partner: User | undefined =
    match.cast?.id !== myUserId ? match.cast : match.customer;

  if (!partner) return null;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(match, partner)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${partner.nickname}とのメッセージを開く`}
    >
      {partner.avatar_url ? (
        <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <MaterialIcons name="person" size={24} color={COLORS.textMuted} />
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.nickname}>{partner.nickname}</Text>
        <Text style={styles.matchTime}>
          マッチ: {formatRelativeTime(match.created_at)}
        </Text>
      </View>

      <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function MatchesScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<
    NativeStackNavigationProp<CastStackParamList & CustomerStackParamList>
  >();

  const { data: matches, isPending, isError, error, refetch, isRefetching } =
    useMatches();

  const handlePress = (match: Match, partner: User) => {
    navigation.navigate('ChatRoom', { matchId: match.id, partnerUser: partner });
  };

  if (isPending) return <SkeletonList />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchItem
            match={item}
            myUserId={user?.id ?? ''}
            onPress={handlePress}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="favorite-border"
            title="まだマッチがありません"
            description="気になるユーザーにいいねしてみましょう！"
          />
        }
        contentContainerStyle={
          matches.length === 0 ? styles.emptyList : styles.listContent
        }
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
  listContent: {
    padding: SPACING.sm,
    paddingBottom: 112,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.text, 0.1),
    marginBottom: SPACING.xs,
    ...SHADOWS.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: SPACING.xxs,
  },
  nickname: {
    color: COLORS.text,
    ...TYPOGRAPHY.bodyBold,
  },
  matchTime: {
    color: COLORS.textSecondary,
    ...TYPOGRAPHY.caption,
  },
});
