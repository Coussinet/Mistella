// ============================================================
// Mistella - ContactsScreen（記録・両ロール共通）
// 会った相手の一覧。メモ + 会った記録のサマリー + リマインダーを表示する。
// キャスト: 顧客管理 / 客: 会った記録 として使う（文言はロールで分岐）。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import UserListItem from '@/components/common/UserListItem';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import { useMatches } from '@/hooks/queries/useMatches';
import {
  useMeetingRecords,
  useMeetingReminders,
  usePartnerNotes,
} from '@/hooks/queries/useMeetings';
import { summarizeByPartner } from '@/services/meetingService';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList, MeetingRecord, PartnerNote, User } from '@/types';
import {
  formatDate,
  getDaysUntil,
  isBirthdayApproaching,
  isToday,
} from '@/utils/dateUtils';

type NavProp = NativeStackNavigationProp<CastStackParamList>;

// -----------------------------------------------------------
// 表示名（キャストは「〜ちゃん」呼び）
// -----------------------------------------------------------

function displayName(
  note: PartnerNote,
  isCastRole: boolean,
): string {
  if (note.nickname_called) {
    return isCastRole ? `${note.nickname_called}ちゃん` : note.nickname_called;
  }
  return note.partner?.nickname ?? '不明';
}

// -----------------------------------------------------------
// リマインダーバナー
// -----------------------------------------------------------

interface ReminderBannerProps {
  notes: PartnerNote[];
  promises: MeetingRecord[];
  isCastRole: boolean;
  onPressPartner: (partnerId: string) => void;
}

function ReminderBanner({ notes, promises, isCastRole, onPressPartner }: ReminderBannerProps) {
  if (notes.length === 0 && promises.length === 0) return null;

  return (
    <View style={styles.reminderSection}>
      <View style={styles.reminderHeader}>
        <MaterialIcons name="notifications-active" size={16} color={COLORS.gold} />
        <Text style={styles.reminderHeaderText}>リマインダー</Text>
      </View>

      {/* 次回の約束 */}
      {promises.map((record) => {
        const isPromiseToday =
          record.next_promise_at != null && isToday(record.next_promise_at.slice(0, 10));
        const days = record.next_promise_at
          ? getDaysUntil(record.next_promise_at.slice(0, 10))
          : null;
        return (
          <TouchableOpacity
            key={`promise-${record.id}`}
            style={styles.reminderItem}
            onPress={() => onPressPartner(record.partner_id)}
            activeOpacity={0.8}
          >
            <Avatar
              uri={record.partner?.avatar_url ?? null}
              size={36}
              nickname={record.partner?.nickname}
            />
            <View style={styles.reminderItemInfo}>
              <Text style={styles.reminderName}>
                {record.partner?.nickname ?? '不明'}
              </Text>
              <View style={styles.reminderBadgesRow}>
                <View
                  style={[
                    styles.reminderBadge,
                    isPromiseToday ? styles.badgeError : styles.badgeGold,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderBadgeText,
                      { color: isPromiseToday ? COLORS.error : COLORS.gold },
                    ]}
                  >
                    {isPromiseToday ? '約束: 今日！' : `約束: ${days}日後`}
                    {record.next_promise_note ? ` ${record.next_promise_note}` : ''}
                  </Text>
                </View>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        );
      })}

      {/* 来店予定・誕生日 */}
      {notes.map((note) => {
        const isVisitToday = note.next_visit_date && isToday(note.next_visit_date);
        const isBirthdayToday = note.birthday && isToday(note.birthday);
        const visitDays = note.next_visit_date ? getDaysUntil(note.next_visit_date) : null;

        return (
          <TouchableOpacity
            key={note.id}
            style={styles.reminderItem}
            onPress={() => onPressPartner(note.partner_id)}
            activeOpacity={0.8}
          >
            <Avatar
              uri={note.partner?.avatar_url ?? null}
              size={36}
              nickname={note.nickname_called ?? note.partner?.nickname}
            />
            <View style={styles.reminderItemInfo}>
              <Text style={styles.reminderName}>{displayName(note, isCastRole)}</Text>
              <View style={styles.reminderBadgesRow}>
                {isVisitToday && (
                  <View style={[styles.reminderBadge, styles.badgeError]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.error }]}>
                      来店: 今日！
                    </Text>
                  </View>
                )}
                {!isVisitToday && visitDays !== null && visitDays >= 0 && (
                  <View style={[styles.reminderBadge, styles.badgeGold]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.gold }]}>
                      来店: {visitDays}日後
                    </Text>
                  </View>
                )}
                {isBirthdayToday && (
                  <View style={[styles.reminderBadge, styles.badgeSuccess]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.success }]}>
                      誕生日: 今日！
                    </Text>
                  </View>
                )}
                {!isBirthdayToday && note.birthday && isBirthdayApproaching(note.birthday) && (
                  <View style={[styles.reminderBadge, styles.badgeBlue]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.neonBlue }]}>
                      誕生日: {getDaysUntil(note.birthday)}日後
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// -----------------------------------------------------------
// 相手選択モーダル（マッチ済み相手から選ぶ）
// -----------------------------------------------------------

interface PartnerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (partnerId: string) => void;
  excludeIds: Set<string>;
}

function PartnerPickerModal({ visible, onClose, onSelect, excludeIds }: PartnerPickerProps) {
  const profile = useAuthStore((s) => s.profile);
  const { data: matches, isPending } = useMatches();

  const candidates = useMemo(() => {
    const list: User[] = [];
    for (const match of matches ?? []) {
      const partner = profile?.role === 'cast' ? match.customer : match.cast;
      if (partner && !excludeIds.has(partner.id)) {
        list.push(partner);
      }
    }
    return list;
  }, [matches, profile, excludeIds]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>相手を選択</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {isPending ? (
            <SkeletonList count={4} />
          ) : (
            <FlatList
              data={candidates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserListItem
                  avatarUrl={item.avatar_url}
                  nickname={item.nickname}
                  onPress={() => onSelect(item.id)}
                  right={
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                  }
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="people-outline"
                  title="選択できる相手がいません"
                  description="マッチした相手の記録を作成できます"
                />
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// -----------------------------------------------------------
// ContactsScreen
// -----------------------------------------------------------

export default function ContactsScreen() {
  const navigation = useNavigation<NavProp>();
  const profile = useAuthStore((s) => s.profile);
  const isCastRole = profile?.role === 'cast';

  const [searchQuery, setSearchQuery] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const notesQuery = usePartnerNotes();
  const remindersQuery = useMeetingReminders();
  const recordsQuery = useMeetingRecords();

  const summaries = useMemo(
    () => summarizeByPartner(recordsQuery.data ?? []),
    [recordsQuery.data],
  );

  // メモがある相手 + 記録だけある相手を統合した一覧
  const entries = useMemo(() => {
    const notes = notesQuery.data ?? [];
    const noteByPartner = new Map(notes.map((n) => [n.partner_id, n]));
    const list: { partnerId: string; note: PartnerNote | null; partner: User | undefined }[] =
      notes.map((n) => ({ partnerId: n.partner_id, note: n, partner: n.partner }));

    // 記録だけあってメモ未作成の相手も一覧に出す
    for (const record of recordsQuery.data ?? []) {
      if (!noteByPartner.has(record.partner_id) && !list.some((e) => e.partnerId === record.partner_id)) {
        list.push({ partnerId: record.partner_id, note: null, partner: record.partner });
      }
    }
    return list;
  }, [notesQuery.data, recordsQuery.data]);

  const filteredEntries = searchQuery.trim()
    ? entries.filter((e) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          e.partner?.nickname?.toLowerCase().includes(q) ||
          e.note?.nickname_called?.toLowerCase().includes(q)
        );
      })
    : entries;

  const handlePartnerPress = (partnerId: string) => {
    navigation.navigate('PartnerNote', { partnerId });
  };

  if (notesQuery.isPending || recordsQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe}>
        <SkeletonList />
      </SafeAreaView>
    );
  }
  if (notesQuery.isError) {
    return <ErrorView error={notesQuery.error} onRetry={notesQuery.refetch} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.partnerId}
        renderItem={({ item }) => {
          const summary = summaries[item.partnerId];
          const metaParts: string[] = [];
          if (summary?.lastMetAt) {
            metaParts.push(`最終: ${formatDate(summary.lastMetAt.slice(0, 10), 'MM/DD')}`);
          }
          if (summary?.recordCount) {
            metaParts.push(`記録${summary.recordCount}件`);
          }
          return (
            <View style={styles.entryCard}>
              <UserListItem
                avatarUrl={item.partner?.avatar_url ?? null}
                nickname={
                  item.note
                    ? displayName(item.note, isCastRole)
                    : item.partner?.nickname ?? '不明'
                }
                subtitle={item.note?.note_text ?? undefined}
                meta={metaParts.join(' / ') || undefined}
                onPress={() => handlePartnerPress(item.partnerId)}
                right={
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                }
              />
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={() => {
          notesQuery.refetch();
          remindersQuery.refetch();
          recordsQuery.refetch();
        }}
        refreshing={notesQuery.isRefetching}
        ListHeaderComponent={
          <>
            {/* 検索バー */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={isCastRole ? '顧客名で検索...' : '名前で検索...'}
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* リマインダー（検索中は非表示） */}
            {!searchQuery && remindersQuery.data && (
              <ReminderBanner
                notes={remindersQuery.data.notes}
                promises={remindersQuery.data.promises}
                isCastRole={isCastRole}
                onPressPartner={handlePartnerPress}
              />
            )}

            {filteredEntries.length > 0 && (
              <Text style={styles.listHeader}>
                {searchQuery
                  ? `${filteredEntries.length}件の検索結果`
                  : `全${entries.length}名`}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="menu-book"
            title={searchQuery ? '検索結果がありません' : 'まだ記録がありません'}
            description={
              searchQuery
                ? undefined
                : '会った相手のメモや記録を残して、次に活かしましょう'
            }
            actionLabel={searchQuery ? undefined : '記録をはじめる'}
            onAction={searchQuery ? undefined : () => setPickerVisible(true)}
          />
        }
      />

      {/* FAB: 新規追加 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.85}
        accessibilityLabel="記録を追加"
      >
        <MaterialIcons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>

      <PartnerPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(partnerId) => {
          setPickerVisible(false);
          navigation.navigate('PartnerNote', { partnerId });
        }}
        excludeIds={new Set()}
      />
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
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
    paddingTop: SPACING.xs,
    flexGrow: 1,
  },

  // 検索バー
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },

  // リマインダー
  reminderSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.27),
    marginBottom: SPACING.md,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    marginBottom: SPACING.sm,
  },
  reminderHeaderText: {
    ...TYPOGRAPHY.label,
    color: COLORS.gold,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reminderItemInfo: {
    flex: 1,
  },
  reminderName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  reminderBadgesRow: {
    flexDirection: 'row',
    gap: SPACING.xxs,
    flexWrap: 'wrap',
  },
  reminderBadge: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: 10,
    borderWidth: 1,
  },
  reminderBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  badgeGold: {
    backgroundColor: withAlpha(COLORS.gold, 0.15),
    borderColor: withAlpha(COLORS.gold, 0.33),
  },
  badgeError: {
    backgroundColor: withAlpha(COLORS.error, 0.15),
    borderColor: withAlpha(COLORS.error, 0.33),
  },
  badgeSuccess: {
    backgroundColor: withAlpha(COLORS.success, 0.15),
    borderColor: withAlpha(COLORS.success, 0.33),
  },
  badgeBlue: {
    backgroundColor: withAlpha(COLORS.neonBlue, 0.15),
    borderColor: withAlpha(COLORS.neonBlue, 0.33),
  },

  // 一覧
  listHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  entryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 108,
    right: SPACING.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },

  // 相手選択モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
});
