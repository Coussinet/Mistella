// ============================================================
// Mistella - CRM（顧客管理）画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/common/Avatar';
import { COLORS } from '../../constants/colors';
import * as castService from '../../services/castService';
import { useAuthStore } from '../../store/authStore';
import type { CastStackParamList, CustomerNote } from '../../types';
import {
  formatDate,
  getDaysUntil,
  isBirthdayApproaching,
  isToday,
} from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CastStackParamList, 'CRM'>;

// -----------------------------------------------------------
// ノートアイテムコンポーネント
// -----------------------------------------------------------

interface NoteItemProps {
  note: CustomerNote;
  onPress: () => void;
}

function NoteItem({ note, onPress }: NoteItemProps) {
  const customer = note.customer;
  const hasUpcomingVisit =
    note.next_visit_date != null && getDaysUntil(note.next_visit_date) <= 3 && getDaysUntil(note.next_visit_date) >= 0;
  const isVisitToday =
    note.next_visit_date != null && isToday(note.next_visit_date);
  const hasBirthday =
    note.birthday != null && isBirthdayApproaching(note.birthday, 7);
  const isBirthdayToday =
    note.birthday != null && isToday(note.birthday);

  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.noteRow}>
        <Avatar
          uri={customer?.avatar_url ?? null}
          size={52}
          nickname={note.nickname_called ?? customer?.nickname}
        />
        <View style={styles.noteInfo}>
          <View style={styles.noteNameRow}>
            <Text style={styles.noteName} numberOfLines={1}>
              {note.nickname_called
                ? `${note.nickname_called}ちゃん`
                : customer?.nickname ?? '不明'}
            </Text>
            {isBirthdayToday && (
              <Text style={styles.birthdayToday}>🎂 誕生日！</Text>
            )}
            {!isBirthdayToday && hasBirthday && note.birthday && (
              <View style={styles.birthdayBadge}>
                <Text style={styles.birthdayBadgeText}>
                  🎂 {getDaysUntil(note.birthday)}日後
                </Text>
              </View>
            )}
          </View>

          {note.note_text && (
            <Text style={styles.notePreview} numberOfLines={2}>
              {note.note_text}
            </Text>
          )}

          <View style={styles.noteMeta}>
            {note.next_visit_date && (
              <View
                style={[
                  styles.visitBadge,
                  (hasUpcomingVisit || isVisitToday) && styles.visitBadgeUrgent,
                ]}
              >
                <MaterialIcons
                  name="event"
                  size={12}
                  color={
                    isVisitToday
                      ? COLORS.error
                      : hasUpcomingVisit
                        ? COLORS.gold
                        : COLORS.textMuted
                  }
                />
                <Text
                  style={[
                    styles.visitText,
                    isVisitToday && { color: COLORS.error },
                    !isVisitToday && hasUpcomingVisit && { color: COLORS.gold },
                  ]}
                >
                  {isVisitToday
                    ? '来店予定: 今日！'
                    : `来店予定: ${formatDate(note.next_visit_date, 'MM/DD')}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// リマインダーバナー
// -----------------------------------------------------------

interface ReminderBannerProps {
  reminders: CustomerNote[];
  onPress: (note: CustomerNote) => void;
}

function ReminderBanner({ reminders, onPress }: ReminderBannerProps) {
  if (reminders.length === 0) return null;

  return (
    <View style={styles.reminderSection}>
      <View style={styles.reminderHeader}>
        <MaterialIcons name="notifications-active" size={16} color={COLORS.gold} />
        <Text style={styles.reminderHeaderText}>リマインダー</Text>
      </View>
      {reminders.map((note) => {
        const isVisitToday = note.next_visit_date && isToday(note.next_visit_date);
        const isBirthdayToday = note.birthday && isToday(note.birthday);
        const visitDays = note.next_visit_date ? getDaysUntil(note.next_visit_date) : null;

        return (
          <TouchableOpacity
            key={note.id}
            style={styles.reminderItem}
            onPress={() => onPress(note)}
            activeOpacity={0.8}
          >
            <Avatar
              uri={note.customer?.avatar_url ?? null}
              size={36}
              nickname={note.nickname_called ?? note.customer?.nickname}
            />
            <View style={styles.reminderItemInfo}>
              <Text style={styles.reminderName}>
                {note.nickname_called ?? note.customer?.nickname ?? '不明'}
              </Text>
              <View style={styles.reminderBadgesRow}>
                {isVisitToday && (
                  <View style={[styles.reminderBadge, { backgroundColor: 'rgba(255, 76, 106, 0.15)', borderColor: COLORS.error + '55' }]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.error }]}>
                      来店: 今日！
                    </Text>
                  </View>
                )}
                {!isVisitToday && visitDays !== null && visitDays >= 0 && (
                  <View style={[styles.reminderBadge, { backgroundColor: 'rgba(201, 168, 76, 0.15)', borderColor: COLORS.gold + '55' }]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.gold }]}>
                      来店: {visitDays}日後
                    </Text>
                  </View>
                )}
                {isBirthdayToday && (
                  <View style={[styles.reminderBadge, { backgroundColor: 'rgba(76, 255, 158, 0.15)', borderColor: COLORS.success + '55' }]}>
                    <Text style={[styles.reminderBadgeText, { color: COLORS.success }]}>
                      誕生日: 今日！
                    </Text>
                  </View>
                )}
                {!isBirthdayToday && note.birthday && isBirthdayApproaching(note.birthday) && (
                  <View style={[styles.reminderBadge, { backgroundColor: 'rgba(76, 158, 255, 0.15)', borderColor: COLORS.neonBlue + '55' }]}>
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
// CRMScreen
// -----------------------------------------------------------

export default function CRMScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [reminders, setReminders] = useState<CustomerNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------------
  // データ取得
  // -----------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [allNotes, reminderNotes] = await Promise.all([
        castService.getCustomerNotes(user.id),
        castService.getReminderCustomers(user.id),
      ]);
      setNotes(allNotes);
      setReminders(reminderNotes);
    } catch {
      Alert.alert('エラー', '顧客情報の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------
  // 検索フィルタ
  // -----------------------------------------------------------

  const filteredNotes = searchQuery.trim()
    ? notes.filter((note) => {
        const query = searchQuery.trim().toLowerCase();
        return (
          note.customer?.nickname?.toLowerCase().includes(query) ||
          note.nickname_called?.toLowerCase().includes(query)
        );
      })
    : notes;

  // -----------------------------------------------------------
  // 画面遷移
  // -----------------------------------------------------------

  const handleNotePress = (note: CustomerNote) => {
    navigation.navigate('CustomerNote', {
      customerId: note.customer_id,
    });
  };

  const handleNewNote = () => {
    navigation.navigate('CustomerNote', { customerId: undefined });
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteItem note={item} onPress={() => handleNotePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={styles.screenTitle}>顧客管理</Text>

            {/* 検索バー */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="顧客名で検索..."
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

            {/* リマインダーバナー（検索中は非表示） */}
            {!searchQuery && (
              <ReminderBanner
                reminders={reminders}
                onPress={handleNotePress}
              />
            )}

            {filteredNotes.length > 0 && (
              <Text style={styles.listHeader}>
                {searchQuery ? `${filteredNotes.length}件の検索結果` : `全${notes.length}名`}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? '検索結果がありません' : '顧客メモがありません'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptyDesc}>
                右下のボタンから新しいメモを追加してください。
              </Text>
            )}
          </View>
        }
      />

      {/* FAB: 新規メモ追加 */}
      <TouchableOpacity style={styles.fab} onPress={handleNewNote} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
    flexGrow: 1,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: 0.5,
  },

  // 検索バー
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },

  // リマインダー
  reminderSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '44',
    marginBottom: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reminderHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 0.3,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reminderItemInfo: {
    flex: 1,
  },
  reminderName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  reminderBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  reminderBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // リストヘッダー
  listHeader: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  // ノートカード
  noteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteInfo: {
    flex: 1,
    gap: 4,
  },
  noteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  noteName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  birthdayToday: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '700',
  },
  birthdayBadge: {
    backgroundColor: 'rgba(76, 158, 255, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  birthdayBadgeText: {
    fontSize: 11,
    color: COLORS.neonBlue,
    fontWeight: '600',
  },
  notePreview: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  noteMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  visitBadgeUrgent: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
  },
  visitText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // 空状態
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
