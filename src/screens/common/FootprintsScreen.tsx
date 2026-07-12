// ============================================================
// Mistella - FootprintsScreen（共通）
// 自分のプロフィールを閲覧したユーザーの一覧。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { listItemEntering } from '@/utils/animations';
import { SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import UserListItem from '@/components/common/UserListItem';
import { useFootprints } from '@/hooks/queries/useFootprints';
import type { CastStackParamList } from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';

export default function FootprintsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CastStackParamList>>();

  const { data: footprints, isPending, isError, error, refetch, isRefetching } =
    useFootprints();

  if (isPending) return <SkeletonList />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={footprints}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) =>
          item.visitor ? (
            <Animated.View entering={listItemEntering(index)}>
              <UserListItem
                avatarUrl={item.visitor.avatar_url}
                nickname={item.visitor.nickname}
                meta={formatRelativeTime(item.created_at)}
                onPress={() =>
                  navigation.navigate('UserProfile', { userId: item.visitor!.id })
                }
                right={
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                }
              />
            </Animated.View>
          ) : null
        }
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          footprints.length > 0 ? (
            <View style={styles.headerBanner}>
              <MaterialIcons name="visibility" size={20} color={COLORS.neonBlue} />
              <Text style={styles.headerBannerText}>
                あなたのプロフィールを{footprints.length}人が閲覧しました
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="visibility"
            title="まだ足跡がありません"
            description="プロフィールを充実させて多くの人に見てもらいましょう"
          />
        }
        contentContainerStyle={footprints.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: withAlpha(COLORS.neonBlue, 0.1),
  },
  headerBannerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.neonBlue,
    flex: 1,
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
});
