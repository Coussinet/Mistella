// ============================================================
// Mistella - PartnerNoteScreen（記録詳細・両ロール共通）
// 相手メモの編集 + 会った記録タイムライン。
// キャストのみボトル履歴・次回来店予定日を表示する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import { useMatches } from '@/hooks/queries/useMatches';
import {
  useMeetingRecords,
  usePartnerNote,
  useSavePartnerNote,
} from '@/hooks/queries/useMeetings';
import { queryKeys } from '@/lib/queryKeys';
import { getProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList, MeetingRecord } from '@/types';
import { formatDate } from '@/utils/dateUtils';
import { showError } from '@/utils/showError';

type Props = NativeStackScreenProps<CastStackParamList, 'PartnerNote'>;

// -----------------------------------------------------------
// 日付入力フィールド（TextInput で代用）
// -----------------------------------------------------------

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function DateField({ label, value, onChange, placeholder, disabled }: DateFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialIcons name="event" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? 'YYYY-MM-DD 例: 2026-12-31'}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          editable={!disabled}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} style={styles.clearBtn}>
            <MaterialIcons name="close" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {value.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(value) && (
        <Text style={styles.datePreview}>{formatDate(value)}</Text>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// 会った記録カード
// -----------------------------------------------------------

function RecordCard({
  record,
  isCastRole,
  onPress,
}: {
  record: MeetingRecord;
  isCastRole: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.recordCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.recordDateColumn}>
        <Text style={styles.recordDate}>
          {formatDate(record.met_at.slice(0, 10), 'MM/DD')}
        </Text>
        <Text style={styles.recordYear}>{record.met_at.slice(0, 4)}</Text>
      </View>
      <View style={styles.recordBody}>
        {record.place ? <Text style={styles.recordPlace}>{record.place}</Text> : null}
        {record.activities ? (
          <Text style={styles.recordActivities} numberOfLines={2}>
            {record.activities}
          </Text>
        ) : null}
        {record.memo ? (
          <Text style={styles.recordMemo} numberOfLines={2}>
            {record.memo}
          </Text>
        ) : null}
        <View style={styles.recordMetaRow}>
          {record.amount_spent != null && (
            <View style={styles.recordBadge}>
              <MaterialIcons name="payments" size={12} color={COLORS.gold} />
              <Text style={styles.recordBadgeText}>
                ¥{record.amount_spent.toLocaleString()}
              </Text>
            </View>
          )}
          {record.next_promise_at && (
            <View style={styles.recordBadge}>
              <MaterialIcons name="event" size={12} color={COLORS.neonBlue} />
              <Text style={[styles.recordBadgeText, { color: COLORS.neonBlue }]}>
                次回: {formatDate(record.next_promise_at.slice(0, 10), 'MM/DD')}
              </Text>
            </View>
          )}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// PartnerNoteScreen
// -----------------------------------------------------------

export default function PartnerNoteScreen({ route, navigation }: Props) {
  const { partnerId } = route.params;
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isCastRole = profile?.role === 'cast';

  // 相手プロフィール
  const partnerQuery = useQuery({
    queryKey: queryKeys.profile(partnerId ?? ''),
    enabled: !!partnerId,
    queryFn: () => getProfile(partnerId!),
  });

  // メモ・記録
  const noteQuery = usePartnerNote(partnerId);
  const recordsQuery = useMeetingRecords(partnerId);
  const saveMutation = useSavePartnerNote(partnerId ?? '');
  const { data: matches } = useMatches();

  // フォーム state（メモ取得後に一度だけ反映）
  const [nicknameCalled, setNicknameCalled] = useState('');
  const [noteText, setNoteText] = useState('');
  const [preferences, setPreferences] = useState('');
  const [bottleHistory, setBottleHistory] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [birthday, setBirthday] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || noteQuery.data === undefined) return;
    initialized.current = true;
    const note = noteQuery.data;
    if (note) {
      setNicknameCalled(note.nickname_called ?? '');
      setNoteText(note.note_text ?? '');
      setPreferences(note.preferences ?? '');
      setBottleHistory(note.bottle_history ?? '');
      setNextVisitDate(note.next_visit_date ?? '');
      setBirthday(note.birthday ?? '');
    }
  }, [noteQuery.data]);

  const records = recordsQuery.data ?? [];
  const totalSpent = records.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);

  // -----------------------------------------------------------
  // 保存
  // -----------------------------------------------------------

  const handleSave = () => {
    if (!user || !partnerId) {
      showError(undefined, '相手の情報が必要です。');
      return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (nextVisitDate && !datePattern.test(nextVisitDate)) {
      Alert.alert('入力エラー', '次回来店予定日の形式が正しくありません（YYYY-MM-DD）。');
      return;
    }
    if (birthday && !datePattern.test(birthday)) {
      Alert.alert('入力エラー', '誕生日の形式が正しくありません（YYYY-MM-DD）。');
      return;
    }

    saveMutation.mutate(
      {
        nickname_called: nicknameCalled.trim() || null,
        note_text: noteText.trim() || null,
        preferences: preferences.trim() || null,
        bottle_history: isCastRole ? bottleHistory.trim() || null : null,
        next_visit_date: isCastRole ? nextVisitDate || null : null,
        birthday: birthday || null,
      },
      {
        onSuccess: () => {
          Alert.alert('保存完了', 'メモを保存しました。');
        },
      },
    );
  };

  // -----------------------------------------------------------
  // チャットへ（実マッチを引いて遷移する）
  // -----------------------------------------------------------

  const handleOpenChat = () => {
    const partner = partnerQuery.data;
    if (!partner) return;
    const match = (matches ?? []).find((m) =>
      isCastRole ? m.customer_id === partner.id : m.cast_id === partner.id,
    );
    if (!match) {
      Alert.alert('チャット', 'この相手とはまだマッチしていません。');
      return;
    }
    navigation.navigate('ChatRoom', { matchId: match.id, partnerUser: partner });
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  if (!partnerId) {
    return (
      <ErrorView
        message="相手が指定されていません。一覧から相手を選択してください。"
        onRetry={() => navigation.goBack()}
      />
    );
  }

  if (noteQuery.isPending || partnerQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe}>
        <SkeletonList count={5} />
      </SafeAreaView>
    );
  }
  if (noteQuery.isError) {
    return <ErrorView error={noteQuery.error} onRetry={noteQuery.refetch} />;
  }

  const partner = partnerQuery.data ?? noteQuery.data?.partner ?? null;
  const isSaving = saveMutation.isPending;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 相手プロフィール */}
          {partner && (
            <View style={styles.partnerProfile}>
              <Avatar uri={partner.avatar_url} size={64} nickname={partner.nickname} />
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerNickname}>{partner.nickname}</Text>
                {partner.bio && (
                  <Text style={styles.partnerBio} numberOfLines={2}>
                    {partner.bio}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.chatIconBtn}
                onPress={handleOpenChat}
                activeOpacity={0.8}
                accessibilityLabel="チャットを開く"
              >
                <MaterialIcons name="chat-bubble" size={22} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          )}

          {/* 累計サマリー（客側のみ金額を強調表示） */}
          {records.length > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{records.length}</Text>
                <Text style={styles.summaryLabel}>会った回数</Text>
              </View>
              {!isCastRole && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>¥{totalSpent.toLocaleString()}</Text>
                  <Text style={styles.summaryLabel}>累計金額</Text>
                </View>
              )}
              {isCastRole && totalSpent > 0 && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>¥{totalSpent.toLocaleString()}</Text>
                  <Text style={styles.summaryLabel}>売上メモ累計</Text>
                </View>
              )}
            </View>
          )}

          {/* 会った記録 */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>会った記録</Text>
            <TouchableOpacity
              style={styles.addRecordBtn}
              onPress={() => navigation.navigate('MeetingRecordEdit', { partnerId })}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={16} color={COLORS.gold} />
              <Text style={styles.addRecordText}>記録を追加</Text>
            </TouchableOpacity>
          </View>

          {records.length === 0 ? (
            <View style={styles.noRecords}>
              <Text style={styles.noRecordsText}>
                まだ記録がありません。会った日時や場所を残しておきましょう。
              </Text>
            </View>
          ) : (
            records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                isCastRole={isCastRole}
                onPress={() =>
                  navigation.navigate('MeetingRecordEdit', {
                    partnerId,
                    recordId: record.id,
                  })
                }
              />
            ))
          )}

          {/* メモフォーム */}
          <Text style={[styles.sectionTitle, styles.memoSectionTitle]}>相手メモ</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>呼び名</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="face" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isCastRole ? '例: みゆきちゃん' : '例: あやさん'}
                placeholderTextColor={COLORS.textMuted}
                value={nicknameCalled}
                onChangeText={setNicknameCalled}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>自由メモ</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="話した内容、印象、気をつけることなど..."
              placeholderTextColor={COLORS.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>好み・特徴</Text>
            <TextInput
              style={[styles.input, styles.textarea, styles.textareaShort]}
              placeholder="好きなお酒・話題、苦手なこと、NG など..."
              placeholderTextColor={COLORS.textMuted}
              value={preferences}
              onChangeText={setPreferences}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {isCastRole && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ボトル履歴</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="local-bar" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="例: ヘネシーVSOP ×2本"
                  placeholderTextColor={COLORS.textMuted}
                  value={bottleHistory}
                  onChangeText={setBottleHistory}
                  returnKeyType="next"
                  editable={!isSaving}
                />
              </View>
            </View>
          )}

          {isCastRole && (
            <DateField
              label="次回来店予定日"
              value={nextVisitDate}
              onChange={setNextVisitDate}
              placeholder="例: 2026-08-15"
              disabled={isSaving}
            />
          )}

          <DateField
            label="誕生日"
            value={birthday}
            onChange={setBirthday}
            placeholder="例: 1995-08-20"
            disabled={isSaving}
          />

          <Button
            title="メモを保存"
            onPress={handleSave}
            loading={isSaving}
            icon="save"
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.xs,
  },

  // 相手プロフィール
  partnerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  partnerInfo: {
    flex: 1,
    gap: SPACING.xxs,
  },
  partnerNickname: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: COLORS.text,
  },
  partnerBio: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  chatIconBtn: {
    padding: SPACING.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // サマリー
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: withAlpha(COLORS.gold, 0.08),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: withAlpha(COLORS.gold, 0.2),
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  summaryValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.gold,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // セクション
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  memoSectionTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  addRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: withAlpha(COLORS.gold, 0.1),
  },
  addRecordText: {
    ...TYPOGRAPHY.label,
    color: COLORS.gold,
  },

  // 記録カード
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  recordDateColumn: {
    alignItems: 'center',
    minWidth: 48,
  },
  recordDate: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gold,
  },
  recordYear: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  recordBody: {
    flex: 1,
    gap: 2,
  },
  recordPlace: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  recordActivities: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  recordMemo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  recordMetaRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
  },
  recordBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
    fontWeight: '600',
  },
  noRecords: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  noRecordsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // 入力
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    paddingLeft: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  textarea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    lineHeight: 21,
  },
  textareaShort: {
    minHeight: 80,
  },
  clearBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 13,
  },
  datePreview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
    marginTop: SPACING.xxs,
    paddingLeft: 2,
  },
  saveBtn: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
});
