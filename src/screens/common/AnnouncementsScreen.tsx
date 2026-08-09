// ============================================================
// Mistella - お知らせ一覧
// 運営から配信された対象者向けのお知らせを確認する画面。
// 画面を開いた時点で表示済みのものを既読にする。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import {
  useAnnouncements,
  useMarkAnnouncementsRead,
} from '@/hooks/queries/useAnnouncements';
import type { AnnouncementItem } from '@/services/announcementService';
import { formatRelativeTime } from '@/utils/dateUtils';

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const deliveredAt = item.sent_at ?? item.created_at;

  return (
    <View style={[styles.card, !item.isRead && styles.cardUnread]}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="campaign" size={19} color={COLORS.gold} />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {deliveredAt ? (
            <Text style={styles.date}>{formatRelativeTime(deliveredAt)}</Text>
          ) : null}
        </View>
        {!item.isRead ? <View style={styles.unreadDot} /> : null}
      </View>
      <Text style={styles.body}>{item.body}</Text>
      {!item.isRead ? <Text style={styles.newLabel}>NEW</Text> : null}
    </View>
  );
}

export default function AnnouncementsScreen() {
  const { data: announcements = [], isPending, isError, error, refetch, isRefetching } =
    useAnnouncements();
  const markRead = useMarkAnnouncementsRead();

  useEffect(() => {
    const unreadIds = announcements
      .filter((announcement) => !announcement.isRead)
      .map((announcement) => announcement.id);

    if (unreadIds.length > 0 && !markRead.isPending) {
      markRead.mutate(unreadIds);
    }
  }, [announcements, markRead]);

  if (isPending) return <SkeletonList count={4} />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AnnouncementCard item={item} />}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={announcements.length === 0 ? styles.emptyContent : styles.content}
        ListHeaderComponent={
          announcements.length > 0 ? (
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="notifications-active" size={20} color={COLORS.gold} />
              </View>
              <View style={styles.headerTextArea}>
                <Text style={styles.headerTitle}>運営からのお知らせ</Text>
                <Text style={styles.headerSubtitle}>サービスに関する大切なご案内です</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="campaign"
            title="お知らせはまだありません"
            description="運営からのご案内が届くと、ここに表示されます"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: withAlpha(COLORS.gold, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.25),
    marginBottom: SPACING.xs,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(COLORS.gold, 0.14),
  },
  headerTextArea: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardUnread: {
    borderColor: withAlpha(COLORS.gold, 0.55),
    backgroundColor: COLORS.surfaceLight,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(COLORS.gold, 0.12),
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  date: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    marginLeft: SPACING.sm,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  newLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: SPACING.sm,
  },
});
