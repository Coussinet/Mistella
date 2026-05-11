// ============================================================
// Mistella - ProfileScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { getProfile } from '../../services/authService';
import { getFavorites, getFootprints } from '../../services/customerService';
import { getMyTimelines } from '../../services/timelineService';
import { useAuthStore } from '../../store/authStore';
import type {
  CastProfile,
  CastStackParamList,
  CustomerStackParamList,
  Timeline,
} from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

// -----------------------------------------------------------
// 出勤ステータスバッジ
// -----------------------------------------------------------
type WorkStatus = 'working' | 'break' | 'off';

function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const config: Record<WorkStatus, { label: string; color: string }> = {
    working: { label: '出勤中', color: COLORS.success },
    break: { label: '休憩中', color: COLORS.gold },
    off: { label: 'オフ', color: COLORS.textMuted },
  };
  const { label, color } = config[status];
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

// -----------------------------------------------------------
// グリッドアイテム
// -----------------------------------------------------------
function GridItem({ item }: { item: Timeline }) {
  return (
    <View style={styles.gridItem}>
      {item.media_url && item.media_type === 'image' ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} resizeMode="cover" />
      ) : item.media_url && item.media_type === 'video' ? (
        <View style={[styles.gridImage, styles.gridVideoPlaceholder]}>
          <MaterialIcons name="play-circle-outline" size={28} color={COLORS.gold} />
        </View>
      ) : (
        <View style={[styles.gridImage, styles.gridTextPlaceholder]}>
          <Text style={styles.gridTextPreview} numberOfLines={3}>
            {item.content ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function ProfileScreen() {
  const { user, profile, castProfile, signOut, setProfile } = useAuthStore();
  const navigation = useNavigation<
    NativeStackNavigationProp<CastStackParamList & CustomerStackParamList>
  >();

  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [footprintCount, setFootprintCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [castData, setCastData] = useState<CastProfile | null>(castProfile);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [timelineData, footprints, favorites, freshProfile] = await Promise.all([
        getMyTimelines(user.id),
        getFootprints(user.id),
        getFavorites(user.id),
        getProfile(user.id),
      ]);
      setTimelines(timelineData);
      setFootprintCount(footprints.length);
      setFavoriteCount(favorites.length);
      setProfile(freshProfile);

      if (freshProfile.role === 'cast') {
        const { data } = await supabase
          .from('cast_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setCastData(data as CastProfile | null);
      }
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [user, setProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSignOut = async () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e: unknown) {
            Alert.alert('エラー', e instanceof Error ? e.message : 'ログアウトに失敗しました。');
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    if (profile?.role === 'cast') {
      navigation.navigate('CastProfileEdit');
    } else {
      navigation.navigate('CustomerProfileEdit');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <FlatList
      data={timelines}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => <GridItem item={item} />}
      ListHeaderComponent={
        <View>
          {/* プロフィールヘッダー */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarSection}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <MaterialIcons name="person" size={40} color={COLORS.textMuted} />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile?.nickname ?? ''}</Text>
              {profile?.role === 'cast' && castData && (
                <WorkStatusBadge status={castData.work_status} />
              )}
              {profile?.role === 'cast' && castData?.shop_name ? (
                <Text style={styles.shopName}>
                  <MaterialIcons name="store" size={12} color={COLORS.textSecondary} />{' '}
                  {castData.shop_name}
                </Text>
              ) : null}
            </View>
          </View>

          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          {/* 統計 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="visibility" size={20} color={COLORS.neonBlue} />
              <Text style={styles.statNumber}>{footprintCount}</Text>
              <Text style={styles.statLabel}>足跡</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={20} color={COLORS.gold} />
              <Text style={styles.statNumber}>{favoriteCount}</Text>
              <Text style={styles.statLabel}>お気に入り</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="dynamic-feed" size={20} color={COLORS.textSecondary} />
              <Text style={styles.statNumber}>{timelines.length}</Text>
              <Text style={styles.statLabel}>投稿</Text>
            </View>
          </View>

          {/* 編集ボタン */}
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={16} color={COLORS.gold} />
            <Text style={styles.editButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>

          {/* 通知設定リンク */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('NotificationSettings' as never)}
          >
            <MaterialIcons name="notifications" size={22} color={COLORS.gold} />
            <Text style={styles.menuItemText}>通知設定</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* グリッドセクション見出し */}
          {timelines.length > 0 && (
            <View style={styles.gridHeader}>
              <MaterialIcons name="grid-on" size={18} color={COLORS.textSecondary} />
              <Text style={styles.gridHeaderText}>投稿</Text>
            </View>
          )}

          {timelines.length === 0 && (
            <View style={styles.emptyTimeline}>
              <MaterialIcons name="dynamic-feed" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>まだ投稿がありません</Text>
            </View>
          )}
        </View>
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={18} color={COLORS.error} />
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      }
      contentContainerStyle={styles.listContent}
      style={styles.container}
    />
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
  listContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  avatarSection: {},
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopName: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 20,
  },
  editButtonText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 14,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  gridHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 0.5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridVideoPlaceholder: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextPlaceholder: {
    backgroundColor: COLORS.surface,
    padding: 6,
    justifyContent: 'center',
  },
  gridTextPreview: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
  },
  signOutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
