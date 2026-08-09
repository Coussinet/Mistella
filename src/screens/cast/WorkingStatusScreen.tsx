// ============================================================
// Mistella - 出勤ステータス管理画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkStatusToggle from '@/components/cast/WorkStatusToggle';
import { COLORS } from '@/constants/colors';
import { useUpdateLocationSharing, useUpdateWorkStatus } from '@/hooks/queries/useCastWork';
import { useMyCastProfile } from '@/hooks/queries/useProfile';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList, WorkStatus } from '@/types';

type Props = NativeStackScreenProps<CastStackParamList, 'WorkingStatus'>;

export default function WorkingStatusScreen({ navigation }: Props) {
  const { user, castProfile } = useAuthStore();
  const [workStatus, setWorkStatus] = useState<WorkStatus>(castProfile?.work_status ?? 'off');
  const [locationEnabled, setLocationEnabled] = useState(castProfile?.location_enabled ?? false);
  const [shiftStartsAt, setShiftStartsAt] = useState<string | null>(castProfile?.shift_starts_at ?? null);
  const [shiftEndsAt, setShiftEndsAt] = useState<string | null>(castProfile?.shift_ends_at ?? null);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const hasHydratedStatus = useRef(false);

  const { data: castData } = useMyCastProfile();
  useEffect(() => {
    if (!castData || hasHydratedStatus.current) return;
    const frame = requestAnimationFrame(() => {
      hasHydratedStatus.current = true;
      setWorkStatus(castData.work_status);
      setLocationEnabled(castData.location_enabled);
      setShiftStartsAt(castData.shift_starts_at);
      setShiftEndsAt(castData.shift_ends_at);
    });
    return () => cancelAnimationFrame(frame);
  }, [castData]);

  const statusMutation = useUpdateWorkStatus();
  const locationMutation = useUpdateLocationSharing();
  const isStatusLoading = statusMutation.isPending;

  const handleStatusChange = (status: WorkStatus) => {
    if (!user || isStatusLoading) return;
    if (status === 'working') {
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      setStartTime(formatTimeInput(shiftStartsAt ? new Date(shiftStartsAt) : now));
      setEndTime(formatTimeInput(shiftEndsAt ? new Date(shiftEndsAt) : defaultEnd));
      setShiftModalVisible(true);
      return;
    }

    const previous = workStatus;
    setWorkStatus(status);
    statusMutation.mutate({ status }, { onError: () => setWorkStatus(previous) });
  };

  const handleStartShift = () => {
    const range = makeShiftRange(startTime, endTime);
    if (!range) {
      Alert.alert('時間を確認してください', '開始・終了時間を24時間表記（例 19:00）で入力してください。');
      return;
    }

    const previous = workStatus;
    setWorkStatus('working');
    statusMutation.mutate(
      { status: 'working', schedule: range },
      {
        onSuccess: () => {
          setShiftStartsAt(range.startsAt);
          setShiftEndsAt(range.endsAt);
          setShiftModalVisible(false);
        },
        onError: () => setWorkStatus(previous),
      },
    );
  };

  const handleLocationToggle = async (value: boolean) => {
    if (!user || locationMutation.isPending) return;
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報の許可が必要です', '設定アプリから位置情報へのアクセスを許可してください。');
        return;
      }
    }
    locationMutation.mutate(value, { onSuccess: () => setLocationEnabled(value) });
  };

  const statusColor = workStatus === 'working'
    ? COLORS.success
    : workStatus === 'break'
      ? COLORS.accentWarm
      : COLORS.textMuted;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>出勤管理</Text>

        <View style={styles.currentStatusCard}>
          <Text style={styles.currentStatusLabel}>現在のステータス</Text>
          <View style={styles.currentStatusRow}>
            <View style={[styles.currentDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.currentStatusText, { color: statusColor }]}>
              {workStatus === 'working' ? '出勤中' : workStatus === 'break' ? '休憩中' : '退勤'}
            </Text>
            {isStatusLoading ? <ActivityIndicator size="small" color={statusColor} /> : null}
          </View>
          {(workStatus === 'working' || workStatus === 'break') && shiftStartsAt && shiftEndsAt ? (
            <View style={styles.shiftSummary}>
              <MaterialIcons name="schedule" size={16} color={COLORS.gold} />
              <Text style={styles.shiftSummaryText}>{formatShiftSummary(shiftStartsAt, shiftEndsAt)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ステータスを変更</Text>
          <WorkStatusToggle current={workStatus} onChange={handleStatusChange} disabled={isStatusLoading} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>位置情報共有</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={22} color={COLORS.gold} />
              <View style={styles.locationTextBlock}>
                <Text style={styles.locationTitle}>現在地を共有する</Text>
                <Text style={styles.locationDesc}>現在地周辺のお客様に表示されます</Text>
              </View>
            </View>
            {locationMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <Switch
                value={locationEnabled}
                onValueChange={handleLocationToggle}
                trackColor={{ false: COLORS.border, true: `${COLORS.gold}88` }}
                thumbColor={locationEnabled ? COLORS.gold : COLORS.textMuted}
              />
            )}
          </View>
          {locationEnabled ? (
            <View style={styles.locationNote}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.locationNoteText}>プライバシー保護のため、位置情報は約1kmの範囲でぼかして表示されます。</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>クイックアクション</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="nights-stay" color={COLORS.gold} title="今夜行ける？" subtitle="リクエスト一覧" onPress={() => navigation.navigate('TonightRequests')} />
            <QuickAction icon="store" color={COLORS.neonBlue} title="店舗情報" subtitle="確認・編集" onPress={() => navigation.navigate('ShopInfo')} />
          </View>
        </View>
      </ScrollView>

      <Modal visible={shiftModalVisible} transparent animationType="fade" onRequestClose={() => setShiftModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.shiftSheet}>
            <View style={styles.shiftSheetIcon}><MaterialIcons name="schedule" size={24} color={COLORS.gold} /></View>
            <Text style={styles.shiftSheetTitle}>今日の出勤時間</Text>
            <Text style={styles.shiftSheetDescription}>お客様が予定を立てやすいよう、開始と終了予定を入力してください。</Text>
            <View style={styles.timeRow}>
              <TimeInput label="出勤" value={startTime} onChange={setStartTime} />
              <MaterialIcons name="arrow-forward" size={20} color={COLORS.textMuted} />
              <TimeInput label="退勤予定" value={endTime} onChange={setEndTime} />
            </View>
            <Text style={styles.overnightNote}>終了が開始以前の場合は、翌日の時刻として登録します。</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShiftModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleStartShift} disabled={isStatusLoading}>
                {isStatusLoading ? <ActivityIndicator size="small" color={COLORS.background} /> : <Text style={styles.modalConfirmText}>この時間で出勤</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function QuickAction({ icon, color, title, subtitle, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionBtn} onPress={onPress} activeOpacity={0.8}>
      <MaterialIcons name={icon} size={26} color={color} />
      <Text style={styles.quickActionLabel}>{title}</Text>
      <Text style={styles.quickActionSub}>{subtitle}</Text>
      <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="19:00"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={styles.timeInput}
      />
    </View>
  );
}

function formatTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function makeShiftRange(start: string, end: string) {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const startMatch = pattern.exec(start.trim());
  const endMatch = pattern.exec(end.trim());
  if (!startMatch || !endMatch || start.trim() === end.trim()) return null;
  const starts = new Date();
  starts.setSeconds(0, 0);
  starts.setHours(Number(startMatch[1]), Number(startMatch[2]));
  const ends = new Date(starts);
  ends.setHours(Number(endMatch[1]), Number(endMatch[2]));
  if (ends <= starts) ends.setDate(ends.getDate() + 1);
  return { startsAt: starts.toISOString(), endsAt: ends.toISOString() };
}

function formatShiftSummary(startsAt: string, endsAt: string) {
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  const nextDay = starts.toDateString() !== ends.toDateString() ? '（翌日）' : '';
  return `${formatTimeInput(starts)} 〜 ${formatTimeInput(ends)}${nextDay}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 20, letterSpacing: 0.5 },
  currentStatusCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  currentStatusLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  currentStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currentDot: { width: 14, height: 14, borderRadius: 7 },
  currentStatusText: { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  shiftSummary: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  shiftSummaryText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 12 },
  locationCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  locationTextBlock: { flex: 1 },
  locationTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  locationDesc: { fontSize: 12, color: COLORS.textMuted },
  locationNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, paddingHorizontal: 4 },
  locationNoteText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16, flex: 1 },
  quickActions: { gap: 10 },
  quickActionBtn: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
  quickActionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  quickActionSub: { fontSize: 12, color: COLORS.textMuted },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(3, 5, 10, 0.78)' },
  shiftSheet: { backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 22 },
  shiftSheetIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.gold}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  shiftSheetTitle: { color: COLORS.text, fontSize: 21, fontWeight: '800' },
  shiftSheetDescription: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 22 },
  timeField: { flex: 1 },
  timeLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  timeInput: { color: COLORS.text, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 13, textAlign: 'center', fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  overnightNote: { color: COLORS.textMuted, fontSize: 10, lineHeight: 15, marginTop: 9 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  modalCancel: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: COLORS.surfaceLight },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  modalConfirm: { flex: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: COLORS.gold },
  modalConfirmText: { color: COLORS.background, fontWeight: '800' },
});
