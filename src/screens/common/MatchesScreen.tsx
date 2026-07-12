// ============================================================
// Mistella - MatchesScreen（共通）
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
import { getMatches } from '@/services/matchService';
import { useAuthStore } from '@/store/authStore';
import type {
  CastStackParamList,
  CustomerStackParamList,
  Match,
  User,
} from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';

// -----------------------------------------------------------
// マッチアイテム
// -----------------------------------------------------------
type MatchItemProps = {
  match: Match;
  myUserId: string;
  onPress: (match: Match, partner: User) => void;
};

function MatchItem({ match, myUserId, onPress }: MatchItemProps) {
  // 相手ユーザーを特定する
  const partner: User | undefined =
    match.cast?.id !== myUserId ? match.cast : match.customer;

  if (!partner) return null;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(match, partner)}
      activeOpacity={0.75}
    >
      {partner.avatar_url ? (
        <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <MaterialIcons name="person" size={24} color={COLORS.textMuted} />
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.nickname}>{partner.nickname}</Text>
        <Text style={styles.matchTime}>
          マッチ: {formatRelativeTime(match.created_at)}
        </Text>
      </View>

      <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function MatchesScreen() {
  const { user, profile } = useAuthStore();
  const navigation = useNavigation<
    NativeStackNavigationProp<CastStackParamList & CustomerStackParamList>
  >();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const data = await getMatches(user.id, profile.role);
      setMatches(data);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handlePress = (match: Match, partner: User) => {
    navigation.navigate('ChatRoom', { matchId: match.id, partnerUser: partner });
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
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchItem
            match={item}
            myUserId={user?.id ?? ''}
            onPress={handlePress}
          />
        )}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="favorite-border" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>まだマッチがありません</Text>
            <Text style={styles.emptySubtitle}>
              気になるユーザーにいいねしてみましょう！
            </Text>
          </View>
        }
        contentContainerStyle={
          matches.length === 0 ? styles.emptyList : styles.listContent
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
  listContent: {
    paddingVertical: 8,
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
  matchTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
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
