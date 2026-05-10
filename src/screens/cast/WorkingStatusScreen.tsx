// ============================================================
// YoruConnect - 出勤ステータス管理画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkStatusToggle from '../../components/cast/WorkStatusToggle';
import { COLORS } from '../../constants/colors';
import * as castService from '../../services/castService';
import { useAuthStore } from '../../store/authStore';
import type { CastStackParamList, WorkStatus } from '../../types';

type Props = NativeStackScreenProps<CastStackParamList, 'WorkingStatus'>;

// -----------------------------------------------------------
// WorkingStatusScreen
// -----------------------------------------------------------

export default function WorkingStatusScreen({ navigation }: Props) {
  const { user, castProfile, setCastProfile } = useAuthStore();

  const [workStatus, setWorkStatus] = useState<WorkStatus>(
    castProfile?.work_status ?? 'off',
  );
  const [locationEnabled, setLocationEnabled] = useState(
    castProfile?.location_enabled ?? false,
  );
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // ストアの castProfile が変わったら同期
  useEffect(() => {
    if (castProfile) {
      setWorkStatus(castProfile.work_status);
      setLocationEnabled(castProfile.location_enabled);
    }
  }, [castProfile]);

  // -----------------------------------------------------------
  // 出勤ステータス変更
  // -----------------------------------------------------------

  const handleStatusChange = async (status: WorkStatus) => {
    if (!user || isStatusLoading) return;
    const prev = workStatus;
    setWorkStatus(status);
    setIsStatusLoading(true);
    try {
      await castService.updateWorkStatus(user.id, status);
      if (castProfile) {
        setCastProfile({
          ...castProfile,
          work_status: status,
          is_working: status !== 'off',
        });
      }
    } catch {
      setWorkStatus(prev);
      Alert.alert('エラー', 'ステータスの更新に失敗しました。');
    } finally {
      setIsStatusLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 位置情報トグル
  // -----------------------------------------------------------

  const handleLocationToggle = async (value: boolean) => {
    if (!user || isLocationLoading) return;
    setIsLocationLoading(true);
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            '位置情報の許可が必要です',
            '設定アプリから位置情報へのアクセスを許可してください。',
          );
          return;
        }
        const coords = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await castService.updateLocation(
          user.id,
          coords.coords.latitude,
          coords.coords.longitude,
          true,
        );
      } else {
        await castService.updateLocation(user.id, 0, 0, false);
      }
      setLocationEnabled(value);
      if (castProfile) {
        setCastProfile({ ...castProfile, location_enabled: value });
      }
    } catch {
      Alert.alert('エラー', '位置情報の更新に失敗しました。');
    } finally {
      setIsLocationLoading(false);
    }
  };

  // -----------------------------------------------------------
  // ステータス表示用カラー
  // -----------------------------------------------------------

  const statusColor =
    workStatus === 'working'
      ? COLORS.success
      : workStatus === 'break'
        ? '#FF9F4C'
        : COLORS.textMuted;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <Text style={styles.screenTitle}>出勤管理</Text>

        {/* 現在のステータス表示 */}
        <View style={styles.currentStatusCard}>
          <Text style={styles.currentStatusLabel}>現在のステータス</Text>
          <View style={styles.currentStatusRow}>
            <View style={[styles.currentDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.currentStatusText, { color: statusColor }]}>
              {workStatus === 'working'
                ? '出勤中'
                : workStatus === 'break'
                  ? '休憩中'
                  : '退勤'}
            </Text>
            {isStatusLoading && (
              <ActivityIndicator
                size="small"
                color={statusColor}
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </View>

        {/* ステータス切り替えトグル */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ステータスを変更</Text>
          <WorkStatusToggle
            current={workStatus}
            onChange={handleStatusChange}
            disabled={isStatusLoading}
          />
        </View>

        {/* 位置情報共有 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>位置情報共有</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={22} color={COLORS.gold} />
              <View style={styles.locationTextBlock}>
                <Text style={styles.locationTitle}>現在地を共有する</Text>
                <Text style={styles.locationDesc}>
                  現在地周辺のお客様に表示されます
                </Text>
              </View>
            </View>
            <View style={styles.locationRight}>
              {isLocationLoading ? (
                <ActivityIndicator size="small" color={COLORS.gold} />
              ) : (
                <Switch
                  value={locationEnabled}
                  onValueChange={handleLocationToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.gold + '88' }}
                  thumbColor={locationEnabled ? COLORS.gold : COLORS.textMuted}
                />
              )}
            </View>
          </View>
          {locationEnabled && (
            <View style={styles.locationNote}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.locationNoteText}>
                プライバシー保護のため、位置情報は約1kmの範囲でぼかして表示されます。
              </Text>
            </View>
          )}
        </View>

        {/* クイックアクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>クイックアクション</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('TonightRequests')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="nights-stay" size={26} color={COLORS.gold} />
              <Text style={styles.quickActionLabel}>今夜行ける？</Text>
              <Text style={styles.quickActionSub}>リクエスト一覧</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={COLORS.textMuted}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('ShopInfo')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="store" size={26} color={COLORS.neonBlue} />
              <Text style={styles.quickActionLabel}>店舗情報</Text>
              <Text style={styles.quickActionSub}>確認・編集</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={COLORS.textMuted}
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  // 現在のステータスカード
  currentStatusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  currentStatusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  currentStatusText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingIndicator: {
    marginLeft: 8,
  },

  // セクション
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // 位置情報カード
  locationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationTextBlock: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  locationDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  locationRight: {
    marginLeft: 12,
  },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  locationNoteText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    flex: 1,
  },

  // クイックアクション
  quickActions: {
    gap: 10,
  },
  quickActionBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  quickActionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  chevron: {
    marginLeft: 4,
  },
});
