// ============================================================
// Mistella - キャスト検索画面（顧客用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { addFootprint } from '@/services/customerService';
import Avatar from '@/components/common/Avatar';
import StatusBadge from '@/components/common/StatusBadge';
import type { CastProfileWithUser, CustomerStackParamList } from '@/types';

// -----------------------------------------------------------
// 定数
// -----------------------------------------------------------

const PAGE_SIZE = 20;

const AREAS = ['東京', '大阪', '名古屋', '福岡', '札幌'];

// -----------------------------------------------------------
// Supabase クエリ
// -----------------------------------------------------------

interface FetchParams {
  pageParam: number;
  keyword: string;
  workingOnly: boolean;
  area: string | null;
  shopName: string | null;
}

async function fetchCasts({
  pageParam,
  keyword,
  workingOnly,
  area,
  shopName,
}: FetchParams): Promise<CastProfileWithUser[]> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('cast_profiles')
    .select('*, user:users(*)')
    .range(from, to)
    .order('is_sponsored', { ascending: false })
    .order('user_id', { ascending: false });

  if (workingOnly) {
    query = query.eq('is_working', true);
  }
  if (shopName) {
    query = query.ilike('shop_name', `%${shopName}%`);
  }
  if (area) {
    query = query.ilike('shop_address', `%${area}%`);
  }
  if (keyword) {
    // nicknameはJOINテーブルのため、先にuser_idを取得してOR条件に含める
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('id')
      .ilike('nickname', `%${keyword}%`);
    const matchedIds = (matchedUsers ?? []).map((u) => u.id);

    const orParts = [
      `shop_name.ilike.%${keyword}%`,
      `shop_address.ilike.%${keyword}%`,
      `hobbies.ilike.%${keyword}%`,
      `personality.ilike.%${keyword}%`,
      `charm_point.ilike.%${keyword}%`,
      `customer_message.ilike.%${keyword}%`,
      `favorite_topics.ilike.%${keyword}%`,
      `activities.ilike.%${keyword}%`,
    ];
    if (matchedIds.length > 0) {
      orParts.push(`user_id.in.(${matchedIds.join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CastProfileWithUser[];
}

// -----------------------------------------------------------
// スケルトンカード
// -----------------------------------------------------------

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
    </View>
  );
}

// -----------------------------------------------------------
// キャストカード
// -----------------------------------------------------------

interface CastCardProps {
  cast: CastProfileWithUser;
  onPress: () => void;
}

function CastCard({ cast, onPress }: CastCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        cast.is_sponsored && styles.cardSponsored,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {cast.is_sponsored ? (
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredText}>Sponsored</Text>
        </View>
      ) : null}

      <Avatar
        uri={cast.user.avatar_url}
        size={72}
        nickname={cast.user.nickname}
        isWorking={cast.is_working}
        style={styles.avatar}
      />

      <Text style={styles.nickname} numberOfLines={1}>
        {cast.user.nickname}
      </Text>

      <StatusBadge status={cast.work_status} size="small" />

      {cast.shop_name ? (
        <Text style={styles.shopName} numberOfLines={1}>
          {cast.shop_name}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// CastSearchScreen
// -----------------------------------------------------------

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function CastSearchScreen() {
  const navigation = useNavigation<NavProp>();
  const { profile } = useAuthStore();

  // フィルタ状態
  const [keyword, setKeyword] = useState('');
  const [workingOnly, setWorkingOnly] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [shopKeyword, setShopKeyword] = useState('');
  const [areaModalVisible, setAreaModalVisible] = useState(false);

  // -----------------------------------------------------------
  // TanStack Query 無限スクロール
  // -----------------------------------------------------------

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['casts', keyword, workingOnly, selectedArea, shopKeyword],
    queryFn: ({ pageParam }) =>
      fetchCasts({
        pageParam: pageParam as number,
        keyword,
        workingOnly,
        area: selectedArea,
        shopName: shopKeyword || null,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });

  const casts = useMemo(
    () => data?.pages.flat() ?? [],
    [data],
  );

  // -----------------------------------------------------------
  // キャストタップ
  // -----------------------------------------------------------

  const handleCastPress = useCallback(
    async (cast: CastProfileWithUser) => {
      if (profile?.id) {
        // 足跡を非同期で記録（エラーは無視）
        addFootprint(profile.id, cast.user_id).catch(() => null);
      }
      navigation.navigate('UserProfile', { userId: cast.user_id });
    },
    [navigation, profile],
  );

  // -----------------------------------------------------------
  // レンダー
  // -----------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: CastProfileWithUser }) => (
      <CastCard cast={item} onPress={() => handleCastPress(item)} />
    ),
    [handleCastPress],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.gold} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="search-off" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>該当するキャストが見つかりません</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* 検索バー */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="キーワードで検索"
          placeholderTextColor={COLORS.textMuted}
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {keyword.length > 0 ? (
          <TouchableOpacity onPress={() => setKeyword('')}>
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* フィルタチップ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {/* 出勤中のみ */}
        <TouchableOpacity
          style={[styles.chip, workingOnly && styles.chipActive]}
          onPress={() => setWorkingOnly(!workingOnly)}
        >
          <View
            style={[styles.chipDot, workingOnly && styles.chipDotActive]}
          />
          <Text style={[styles.chipText, workingOnly && styles.chipTextActive]}>
            出勤中のみ
          </Text>
        </TouchableOpacity>

        {/* エリア指定 */}
        <TouchableOpacity
          style={[styles.chip, selectedArea !== null && styles.chipActive]}
          onPress={() => setAreaModalVisible(true)}
        >
          <MaterialIcons
            name="place"
            size={14}
            color={selectedArea !== null ? COLORS.background : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              selectedArea !== null && styles.chipTextActive,
            ]}
          >
            {selectedArea ?? 'エリア指定'}
          </Text>
          {selectedArea !== null ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedArea(null);
              }}
            >
              <MaterialIcons
                name="close"
                size={12}
                color={COLORS.background}
              />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* 店舗名 */}
        <View style={[styles.chip, styles.chipInput, shopKeyword.length > 0 && styles.chipActive]}>
          <MaterialIcons
            name="store"
            size={14}
            color={shopKeyword.length > 0 ? COLORS.background : COLORS.textSecondary}
          />
          <TextInput
            style={[
              styles.chipTextInput,
              shopKeyword.length > 0 && styles.chipTextInputActive,
            ]}
            placeholder="店舗名"
            placeholderTextColor={COLORS.textMuted}
            value={shopKeyword}
            onChangeText={setShopKeyword}
            returnKeyType="search"
          />
          {shopKeyword.length > 0 ? (
            <TouchableOpacity onPress={() => setShopKeyword('')}>
              <MaterialIcons name="close" size={12} color={COLORS.background} />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* エラー */}
      {isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>読み込みに失敗しました</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>再試行</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* キャスト一覧 */}
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={casts}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* エリア選択モーダル */}
      <Modal
        visible={areaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAreaModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setAreaModalVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.areaSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>エリアを選択</Text>
            {AREAS.map((area) => (
              <TouchableOpacity
                key={area}
                style={[
                  styles.areaItem,
                  selectedArea === area && styles.areaItemActive,
                ]}
                onPress={() => {
                  setSelectedArea(area === selectedArea ? null : area);
                  setAreaModalVisible(false);
                }}
              >
                <MaterialIcons
                  name="place"
                  size={18}
                  color={
                    selectedArea === area ? COLORS.gold : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.areaText,
                    selectedArea === area && styles.areaTextActive,
                  ]}
                >
                  {area}
                </Text>
                {selectedArea === area ? (
                  <MaterialIcons
                    name="check"
                    size={18}
                    color={COLORS.gold}
                    style={styles.areaCheck}
                  />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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

  // 検索バー
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 12,
  },

  // フィルタ
  filterScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 5,
  },
  chipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.textMuted,
  },
  chipDotActive: {
    backgroundColor: COLORS.background,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.background,
  },
  chipInput: {
    minWidth: 100,
  },
  chipTextInput: {
    color: COLORS.text,
    fontSize: 12,
    minWidth: 60,
    padding: 0,
    height: 20,
  },
  chipTextInputActive: {
    color: COLORS.background,
  },

  // リスト
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
  },

  // キャストカード
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  cardSponsored: {
    borderColor: COLORS.gold,
    borderWidth: 1.5,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.gold,
    paddingVertical: 3,
    alignItems: 'center',
  },
  sponsoredText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatar: {
    marginTop: 16,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  shopName: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },

  // スケルトン
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonCard: {
    flex: 1,
    minWidth: '44%',
    maxWidth: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceLight,
  },
  skeletonLine: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceLight,
  },
  skeletonLineShort: {
    width: '55%',
  },

  // フッターローダー
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // 空状態
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },

  // エラー
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  retryText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // エリアモーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  areaSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  areaItemActive: {
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  areaText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    flex: 1,
  },
  areaTextActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  areaCheck: {
    marginLeft: 'auto',
  },
});
