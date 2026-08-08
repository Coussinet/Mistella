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
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { addFootprint } from '@/services/customerService';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonCard } from '@/components/common/Skeleton';
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
  const initial = cast.user.nickname?.trim().charAt(0) || '?';
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${cast.user.nickname}のプロフィールを開く`}
    >
      {/* カード全体に写真 */}
      {cast.user.avatar_url ? (
        <Image source={{ uri: cast.user.avatar_url }} style={styles.cardPhoto} resizeMode="cover" />
      ) : (
        <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
          <Text style={styles.placeholderInitial}>{initial}</Text>
        </View>
      )}

      {/* 出勤中バッジ（右上） */}
      {cast.is_working ? (
        <View style={styles.workingBadge}>
          <View style={styles.workingDot} />
          <Text style={styles.workingText}>出勤中</Text>
        </View>
      ) : null}

      {/* 下部グラデーション + 名前・店舗 */}
      <LinearGradient colors={GRADIENTS.photoOverlay} style={styles.cardOverlay} />
      <View style={styles.cardInfo}>
        <Text style={styles.nickname} numberOfLines={1}>
          {cast.user.nickname}
        </Text>
        {cast.shop_name ? (
          <Text style={styles.shopName} numberOfLines={1}>
            {cast.shop_name}
          </Text>
        ) : null}
      </View>
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
      <View style={styles.cardCell}>
        <CastCard cast={item} onPress={() => handleCastPress(item)} />
      </View>
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
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setKeyword('')}
            accessibilityRole="button"
            accessibilityLabel="検索語をクリア"
          >
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // フィルタ
  filterScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xxs,
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
    ...TYPOGRAPHY.caption,
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
    paddingHorizontal: SPACING.sm,
    paddingBottom: 112,
  },
  cardCell: {
    flex: 1,
  },
  row: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xxs,
    marginBottom: SPACING.sm,
  },

  // キャストカード
  card: {
    flex: 1,
    aspectRatio: 0.72,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(COLORS.text, 0.1),
    ...SHADOWS.card,
  },
  cardPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardPhotoPlaceholder: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    color: COLORS.goldLight,
    fontSize: 56,
    fontWeight: '700',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  workingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 10, 15, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  workingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  workingText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '700',
  },
  cardInfo: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
  },
  nickname: {
    color: COLORS.text,
    ...TYPOGRAPHY.h3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  shopName: {
    color: COLORS.text,
    ...TYPOGRAPHY.caption,
    opacity: 0.85,
  },

  // スケルトン
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
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
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
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
