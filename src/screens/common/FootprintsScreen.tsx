// ============================================================
// Mistella - FootprintsScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { getFootprints } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import type {
  Footprint,
} from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';

// -----------------------------------------------------------
// 足跡アイテム
// -----------------------------------------------------------
type FootprintItemProps = {
  item: Footprint;
  onPress: (userId: string) => void;
};

function FootprintItem({ item, onPress }: FootprintItemProps) {
  const visitor = item.visitor;
  if (!visitor) return null;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(visitor.id)}
      activeOpacity={0.75}
    >
      {visitor.avatar_url ? (
        <Image source={{ uri: visitor.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <MaterialIcons name="person" size={24} color={COLORS.textMuted} />
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.nickname}>{visitor.nickname}</Text>
        <Text style={styles.visitTime}>{formatRelativeTime(item.created_at)} に訪問</Text>
      </View>

      <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function FootprintsScreen() {
  const { user } = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFootprints = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getFootprints(user.id);
      setFootprints(data);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFootprints();
  }, [loadFootprints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFootprints();
    setRefreshing(false);
  };

  const handlePress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={footprints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FootprintItem item={item} onPress={handlePress} />
        )}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListHeaderComponent={
          <View style={styles.headerBanner}>
            <MaterialIcons name="visibility" size={20} color={COLORS.neonBlue} />
            <Text style={styles.headerBannerText}>
              あなたのプロフィールを{footprints.length}人が閲覧しました
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="directions-walk" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>まだ足跡がありません</Text>
            <Text style={styles.emptySubtitle}>
              プロフィールを充実させて多くの人に見てもらいましょう
            </Text>
          </View>
        }
        contentContainerStyle={
          footprints.length === 0 ? styles.emptyList : styles.listContent
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  headerBannerText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  visitTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 78,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
  },
});
