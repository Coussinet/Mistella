// ============================================================
// Mistella - MeetingRecordEditScreen（会った記録の作成・編集）
// 日時・場所・内容・メモ・金額・次回の約束を記録する。
// 保存時、約束があればローカル通知をスケジュール（hooks 側で処理）。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
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
import Button from '@/components/common/Button';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import {
  useCreateMeetingRecord,
  useDeleteMeetingRecord,
  useMeetingRecord,
  useUpdateMeetingRecord,
} from '@/hooks/queries/useMeetings';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList } from '@/types';
import { formatDate } from '@/utils/dateUtils';

type Props = NativeStackScreenProps<CastStackParamList, 'MeetingRecordEdit'>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

// -----------------------------------------------------------
// 日付 + 時刻入力フィールド
// -----------------------------------------------------------

interface DateTimeFieldProps {
  label: string;
  date: string;
  time: string;
  onChangeDate: (v: string) => void;
  onChangeTime: (v: string) => void;
  disabled?: boolean;
  optional?: boolean;
  onClear?: () => void;
}

function DateTimeField({
  label,
  date,
  time,
  onChangeDate,
  onChangeTime,
  disabled,
  optional,
  onClear,
}: DateTimeFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && date.length > 0 && onClear && (
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.clearLabel}>クリア</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.dateTimeRow}>
        <View style={[styles.inputWrapper, styles.dateInput]}>
          <MaterialIcons name="event" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={date}
            onChangeText={onChangeDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            editable={!disabled}
          />
        </View>
        <View style={[styles.inputWrapper, styles.timeInput]}>
          <MaterialIcons name="schedule" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.textMuted}
            value={time}
            onChangeText={onChangeTime}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            editable={!disabled}
          />
        </View>
      </View>
      {date.length > 0 && DATE_PATTERN.test(date) && (
        <Text style={styles.datePreview}>
          {formatDate(date)}
          {time && TIME_PATTERN.test(time) ? ` ${time}` : ''}
        </Text>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// ISO 文字列 ⇔ 日付/時刻文字列の変換
// -----------------------------------------------------------

function isoToDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function dateTimeToIso(date: string, time: string): string | null {
  if (!DATE_PATTERN.test(date)) return null;
  const timeStr = TIME_PATTERN.test(time) ? time : '20:00';
  const d = new Date(`${date}T${timeStr}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// -----------------------------------------------------------
// MeetingRecordEditScreen
// -----------------------------------------------------------

export default function MeetingRecordEditScreen({ route, navigation }: Props) {
  const { partnerId, recordId } = route.params;
  const isEdit = !!recordId;
  const profile = useAuthStore((s) => s.profile);
  const isCastRole = profile?.role === 'cast';

  const recordQuery = useMeetingRecord(recordId);
  const createMutation = useCreateMeetingRecord(partnerId);
  const updateMutation = useUpdateMeetingRecord();
  const deleteMutation = useDeleteMeetingRecord();

  // フォーム state
  const now = isoToDateTime(new Date().toISOString());
  const [metDate, setMetDate] = useState(now.date);
  const [metTime, setMetTime] = useState(now.time);
  const [place, setPlace] = useState('');
  const [activities, setActivities] = useState('');
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [promiseTime, setPromiseTime] = useState('');
  const [promiseNote, setPromiseNote] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !recordQuery.data) return;
    initialized.current = true;
    const r = recordQuery.data;
    const met = isoToDateTime(r.met_at);
    setMetDate(met.date);
    setMetTime(met.time);
    setPlace(r.place ?? '');
    setActivities(r.activities ?? '');
    setMemo(r.memo ?? '');
    setAmount(r.amount_spent != null ? String(r.amount_spent) : '');
    const promise = isoToDateTime(r.next_promise_at);
    setPromiseDate(promise.date);
    setPromiseTime(promise.time);
    setPromiseNote(r.next_promise_note ?? '');
  }, [recordQuery.data]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // -----------------------------------------------------------
  // 保存・削除
  // -----------------------------------------------------------

  const handleSave = () => {
    const metAt = dateTimeToIso(metDate, metTime);
    if (!metAt) {
      Alert.alert('入力エラー', '会った日時の形式が正しくありません（YYYY-MM-DD / HH:MM）。');
      return;
    }
    let promiseAt: string | null = null;
    if (promiseDate) {
      promiseAt = dateTimeToIso(promiseDate, promiseTime);
      if (!promiseAt) {
        Alert.alert('入力エラー', '次回の約束の形式が正しくありません（YYYY-MM-DD / HH:MM）。');
        return;
      }
    }
    const amountValue = amount.trim() ? Number(amount.replace(/[,、]/g, '')) : null;
    if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) {
      Alert.alert('入力エラー', '金額は0以上の数字で入力してください。');
      return;
    }

    const input = {
      met_at: metAt,
      place: place.trim() || null,
      activities: activities.trim() || null,
      memo: memo.trim() || null,
      amount_spent: amountValue,
      next_promise_at: promiseAt,
      next_promise_note: promiseAt ? promiseNote.trim() || null : null,
    };

    const onSuccess = () => navigation.goBack();
    if (isEdit && recordId) {
      updateMutation.mutate({ recordId, record: input }, { onSuccess });
    } else {
      createMutation.mutate(input, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!recordId) return;
    Alert.alert('記録を削除', 'この記録を削除しますか？この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () =>
          deleteMutation.mutate(recordId, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  if (isEdit && recordQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe}>
        <SkeletonList count={5} />
      </SafeAreaView>
    );
  }
  if (isEdit && recordQuery.isError) {
    return <ErrorView error={recordQuery.error} onRetry={recordQuery.refetch} />;
  }

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
          <DateTimeField
            label="会った日時"
            date={metDate}
            time={metTime}
            onChangeDate={setMetDate}
            onChangeTime={setMetTime}
            disabled={isSaving}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>場所・店</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="place" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isCastRole ? '例: 自店、アフター先など' : '例: Club MISTELLA、〇〇バー'}
                placeholderTextColor={COLORS.textMuted}
                value={place}
                onChangeText={setPlace}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>一緒にしたこと</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="local-activity" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="例: 食事、カラオケ、同伴など"
                placeholderTextColor={COLORS.textMuted}
                value={activities}
                onChangeText={setActivities}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="話した内容や気づいたことなど..."
              placeholderTextColor={COLORS.textMuted}
              value={memo}
              onChangeText={setMemo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{isCastRole ? '売上メモ（円）' : '使った金額（円）'}</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="payments" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="例: 30000"
                placeholderTextColor={COLORS.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          <View style={styles.promiseSection}>
            <View style={styles.promiseHeader}>
              <MaterialIcons name="favorite" size={16} color={COLORS.gold} />
              <Text style={styles.promiseHeaderText}>次回の約束</Text>
            </View>
            <DateTimeField
              label="約束の日時（任意）"
              date={promiseDate}
              time={promiseTime}
              onChangeDate={setPromiseDate}
              onChangeTime={setPromiseTime}
              disabled={isSaving}
              optional
              onClear={() => {
                setPromiseDate('');
                setPromiseTime('');
                setPromiseNote('');
              }}
            />
            {promiseDate.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>約束の内容</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="edit-note" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="例: 同伴で食事、誕生日のお祝い"
                    placeholderTextColor={COLORS.textMuted}
                    value={promiseNote}
                    onChangeText={setPromiseNote}
                    editable={!isSaving}
                  />
                </View>
                <Text style={styles.promiseHint}>
                  前日19時と当日朝9時にリマインダー通知が届きます
                </Text>
              </View>
            )}
          </View>

          <Button
            title={isEdit ? '記録を更新' : '記録を保存'}
            onPress={handleSave}
            loading={isSaving}
            icon="save"
            style={styles.saveBtn}
          />

          {isEdit && (
            <Button
              title="この記録を削除"
              onPress={handleDelete}
              variant="danger"
              icon="delete"
              disabled={isSaving}
              loading={deleteMutation.isPending}
            />
          )}
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
    paddingTop: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  clearLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
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
    minHeight: 100,
    lineHeight: 21,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  dateInput: {
    flex: 3,
  },
  timeInput: {
    flex: 2,
  },
  datePreview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
    marginTop: SPACING.xxs,
    paddingLeft: 2,
  },

  // 約束セクション
  promiseSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    marginBottom: SPACING.sm,
  },
  promiseHeaderText: {
    ...TYPOGRAPHY.label,
    color: COLORS.gold,
  },
  promiseHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xxs,
  },
  saveBtn: {
    marginBottom: SPACING.xs,
  },
});
