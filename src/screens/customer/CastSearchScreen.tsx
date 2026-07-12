// ============================================================
// Mistella - キャスト検索画面（顧客用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
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
import { withAlpha } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { addFootprint } from '@/services/customerService';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonCard } from '@/components/common/Skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { useCastSearch } from '@/hooks/queries/useCastSearch';
import type { CastProfileWithUser, CustomerStackParamList } from '@/types';

// -----------------------------------------------------------
// 定数
// -----------------------------------------------------------

const AREAS = ['東京', '大阪', '名古屋', '福岡', '札幌'];

// -----------------------------------------------------------
// スケルトングリッド
// -----------------------------------------------------------

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.skeletonItem}>
          <SkeletonCard />
        </View>
      ))}
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
    error,
    refetch,
  } = useCastSearch({
    keyword,
    workingOnly,
    area: selectedArea,
    shopName: shopKeyword || null,
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

  const renderEmpty = () => (
    <EmptyState icon="search-off" title="該当するキャストが見つかりません" />
  );

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

      {/* キャスト一覧 */}
      {isError ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonGrid />
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
  },
  skeletonItem: {
    width: '50%',
  },

  // フッターローダー
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // エリアモーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
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
    backgroundColor: withAlpha(COLORS.gold, 0.12),
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
