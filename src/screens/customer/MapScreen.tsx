// ============================================================
// Mistella - マップ画面（顧客用）
// 出勤中マーカーのパルス演出 + 下部スナップ式カードカルーセル。
// カルーセルとマーカーは双方向同期する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { DARK_MAP_STYLE } from '@/constants/mapStyle';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import Avatar from '@/components/common/Avatar';
import StatusBadge from '@/components/common/StatusBadge';
import { useMapCasts } from '@/hooks/queries/useNearbyCasts';
import { addFootprint } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import type { CastProfileWithUser, CustomerStackParamList } from '@/types';

// -----------------------------------------------------------
// エリア名ぼかし変換（0.01 度 ≈ 約 1km の概算エリアラベル）
// -----------------------------------------------------------

function getAreaLabel(lat: number, lng: number): string {
  // 東京: 35.6±, 大阪: 34.6±, 名古屋: 35.1±, 福岡: 33.5±, 札幌: 43.0±
  if (lat > 42.0) return '札幌エリア周辺';
  if (lat > 35.3 && lng > 136.5) return '名古屋エリア周辺';
  if (lat > 35.0 && lng > 138.5) return '東京エリア周辺';
  if (lat > 33.0 && lng < 131.5) return '福岡エリア周辺';
  if (lat > 34.0 && lng < 136.0) return '大阪エリア周辺';
  return 'このエリア周辺';
}

// -----------------------------------------------------------
// マーカーのパルスリング（出勤中キャスト用）
// iOS のみアニメーション（tracksViewChanges=true が必要なため）。
// Android は tracksViewChanges=false のまま静的なゴールドグローリングを出す。
// -----------------------------------------------------------

/** パルスをアニメーションさせるか（Android は Marker の再描画コストが高いため静的表示） */
const ANIMATE_PULSE = Platform.OS === 'ios';

function PulseRing() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.8 }],
    opacity: 0.65 * (1 - progress.value),
  }));

  return <Animated.View pointerEvents="none" style={[styles.pulseRing, animatedStyle]} />;
}

// -----------------------------------------------------------
// キャストマーカー
// -----------------------------------------------------------

interface CastMarkerViewProps {
  cast: CastProfileWithUser;
}

function CastMarkerView({ cast }: CastMarkerViewProps) {
  const isWorking = cast.is_working;
  return (
    <View style={styles.markerWrap}>
      {isWorking && ANIMATE_PULSE ? <PulseRing /> : null}
      {isWorking && !ANIMATE_PULSE ? (
        <View pointerEvents="none" style={styles.staticGlowRing} />
      ) : null}
      <View style={styles.pin}>
        {cast.user.avatar_url ? (
          <Image source={{ uri: cast.user.avatar_url }} style={styles.pinAvatar} />
        ) : (
          <View style={[styles.pinAvatar, styles.pinAvatarFallback]}>
            <Text style={styles.pinInitial}>{cast.user.nickname?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={styles.pinTail} />
      </View>
    </View>
  );
}

// -----------------------------------------------------------
// 下部カルーセルの寸法
// -----------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - SPACING.xxl * 2;
const CARD_SPACING = SPACING.sm;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;
const CAROUSEL_SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// -----------------------------------------------------------
// MapScreen
// -----------------------------------------------------------

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const INITIAL_REGION: Region = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapScreen() {
  const navigation = useNavigation<NavProp>();
  const { profile } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<FlatList<CastProfileWithUser>>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [workingOnly, setWorkingOnly] = useState(false);

  // -----------------------------------------------------------
  // キャスト取得（location_enabled=true、workingOnlyの場合はis_working=trueも条件）
  // cast_profiles の変更はフック内の Realtime 購読で反映される
  // -----------------------------------------------------------

  const { data } = useMapCasts(workingOnly);

  /** 座標を持つキャストのみ（マーカーとカルーセルでインデックスを揃える） */
  const mapCasts = useMemo(
    () =>
      (data ?? []).filter(
        (cast) => cast.location_lat != null && cast.location_lng != null,
      ),
    [data],
  );

  // フィルタ切替などで件数が減った場合にインデックスを戻す
  useEffect(() => {
    if (mapCasts.length > 0 && activeIndex >= mapCasts.length) {
      const frame = requestAnimationFrame(() => {
        setActiveIndex(0);
        carouselRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [mapCasts.length, activeIndex]);

  // -----------------------------------------------------------
  // 地図をキャスト位置へ移動
  // -----------------------------------------------------------

  const focusCast = useCallback((cast: CastProfileWithUser) => {
    if (cast.location_lat == null || cast.location_lng == null) return;
    mapRef.current?.animateToRegion(
      {
        latitude: cast.location_lat,
        longitude: cast.location_lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      450,
    );
  }, []);

  /** マーカータップ → 該当カードへスクロール + 地図移動 */
  const handleMarkerPress = useCallback(
    (index: number) => {
      const cast = mapCasts[index];
      if (!cast) return;
      setActiveIndex(index);
      carouselRef.current?.scrollToIndex({ index, animated: true });
      focusCast(cast);
    },
    [mapCasts, focusCast],
  );

  /** カルーセルのスワイプ確定 → 地図移動 */
  const handleCarouselMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const rawIndex = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
      const index = Math.max(0, Math.min(rawIndex, mapCasts.length - 1));
      if (index !== activeIndex) {
        setActiveIndex(index);
        const cast = mapCasts[index];
        if (cast) focusCast(cast);
      }
    },
    [mapCasts, activeIndex, focusCast],
  );

  // -----------------------------------------------------------
  // 現在地へ移動
  // -----------------------------------------------------------

  const goToMyLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        600,
      );
    } finally {
      setIsLocating(false);
    }
  };

  // -----------------------------------------------------------
  // プロフィール画面へ遷移
  // -----------------------------------------------------------

  const handleViewProfile = useCallback(
    (cast: CastProfileWithUser) => {
      if (profile?.id) {
        addFootprint(profile.id, cast.user_id).catch(() => null);
      }
      navigation.navigate('UserProfile', { userId: cast.user_id });
    },
    [navigation, profile],
  );

  // -----------------------------------------------------------
  // カルーセルカード
  // -----------------------------------------------------------

  const renderCastCard = useCallback(
    ({ item, index }: { item: CastProfileWithUser; index: number }) => {
      const isActive = index === activeIndex;
      return (
        <View style={[styles.card, isActive && styles.cardActive]}>
          <View style={styles.cardContent}>
            <Avatar
              uri={item.user.avatar_url}
              size={52}
              nickname={item.user.nickname}
              isWorking={item.is_working}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardNickname} numberOfLines={1}>
                {item.user.nickname}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.shop_name ??
                  (item.location_lat != null && item.location_lng != null
                    ? getAreaLabel(item.location_lat, item.location_lng)
                    : '')}
              </Text>
            </View>
            <StatusBadge status={item.work_status} size="small" />
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => handleViewProfile(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.profileButtonText}>プロフィールを見る</Text>
            <MaterialIcons name="arrow-forward" size={16} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      );
    },
    [activeIndex, handleViewProfile],
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {mapCasts.map((cast, index) => (
          <Marker
            key={cast.user_id}
            coordinate={{
              latitude: cast.location_lat!,
              longitude: cast.location_lng!,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            // Android はビュー追跡による性能劣化が大きいので無効化（静的グローで代替）。
            // iOS は出勤中のみパルスを描画するために追跡を有効化する。
            tracksViewChanges={ANIMATE_PULSE && cast.is_working}
            onPress={() => handleMarkerPress(index)}
          >
            <CastMarkerView cast={cast} />
          </Marker>
        ))}
      </MapView>

      {/* 現在地ボタン */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={goToMyLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color={COLORS.gold} />
        ) : (
          <MaterialIcons name="my-location" size={22} color={COLORS.gold} />
        )}
      </TouchableOpacity>

      {/* 出勤中フィルターボタン */}
      <TouchableOpacity
        style={[styles.workingFilterButton, workingOnly && styles.workingFilterButtonActive]}
        onPress={() => setWorkingOnly((prev) => !prev)}
        activeOpacity={0.85}
      >
        <View style={[styles.workingDot, workingOnly && styles.workingDotActive]} />
        <Text style={[styles.workingFilterText, workingOnly && styles.workingFilterTextActive]}>
          出勤中
        </Text>
      </TouchableOpacity>

      {/* キャストカードカルーセル（マーカーと双方向同期） */}
      {mapCasts.length > 0 ? (
        <FlatList
          ref={carouselRef}
          data={mapCasts}
          keyExtractor={(item) => item.user_id}
          renderItem={renderCastCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={handleCarouselMomentumEnd}
          getItemLayout={(_, index) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
          })}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        />
      ) : null}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // 現在地ボタン
  locationButton: {
    position: 'absolute',
    right: 16,
    top: 56,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  // 出勤中フィルターボタン
  workingFilterButton: {
    position: 'absolute',
    right: 16,
    top: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  workingFilterButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  workingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  workingDotActive: {
    backgroundColor: COLORS.background,
  },
  workingFilterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  workingFilterTextActive: {
    color: COLORS.background,
  },

  // マーカー（パルスの拡大分を収める余白付きコンテナ）
  markerWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: withAlpha(COLORS.gold, 0.18),
  },
  staticGlowRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: withAlpha(COLORS.gold, 0.55),
    backgroundColor: withAlpha(COLORS.gold, 0.12),
  },

  // ピン
  pin: {
    alignItems: 'center',
  },
  pinAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  pinAvatarFallback: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInitial: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.gold,
    marginTop: -1,
  },

  // カルーセル
  carousel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.sm,
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: CAROUSEL_SIDE_PADDING,
    gap: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  cardActive: {
    borderColor: withAlpha(COLORS.gold, 0.6),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardNickname: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.md + 2,
    paddingVertical: SPACING.sm,
    gap: 6,
    ...SHADOWS.glow,
    shadowOpacity: 0.3,
  },
  profileButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
