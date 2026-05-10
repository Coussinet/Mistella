// ============================================================
// YoruConnect - マップ画面（顧客用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import { addFootprint } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';
import type { CastProfileWithUser, CustomerStackParamList } from '../../types';

// -----------------------------------------------------------
// Google Maps ダークスタイル定義
// -----------------------------------------------------------

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0A0F' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A0F' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8E8E99' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#C9A84C' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4E4E5E' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0F1A14' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4E4E5E' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#16161E' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2A2A3A' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4E4E5E' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1E1E2A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2A2A3A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8E8E99' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#16161E' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4C9EFF' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060C14' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2A2A3A' }],
  },
];

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

  const [casts, setCasts] = useState<CastProfileWithUser[]>([]);
  const [selectedCast, setSelectedCast] = useState<CastProfileWithUser | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // -----------------------------------------------------------
  // キャスト取得（is_working=true かつ location_enabled=true）
  // -----------------------------------------------------------

  const fetchWorkingCasts = useCallback(async () => {
    const { data, error } = await supabase
      .from('cast_profiles')
      .select('*, user:users(*)')
      .eq('is_working', true)
      .eq('location_enabled', true)
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null);

    if (!error && data) {
      setCasts(data as CastProfileWithUser[]);
    }
  }, []);

  // -----------------------------------------------------------
  // Supabase Realtime 購読
  // -----------------------------------------------------------

  useEffect(() => {
    fetchWorkingCasts();

    const channel = supabase
      .channel('cast_profiles_map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cast_profiles' },
        () => {
          fetchWorkingCasts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWorkingCasts]);

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

  const handleViewProfile = (cast: CastProfileWithUser) => {
    if (profile?.id) {
      addFootprint(profile.id, cast.user_id).catch(() => null);
    }
    setSelectedCast(null);
    navigation.navigate('CastProfile', { userId: cast.user_id });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedCast(null)}
      >
        {casts.map((cast) =>
          cast.location_lat != null && cast.location_lng != null ? (
            <Marker
              key={cast.user_id}
              coordinate={{
                latitude: cast.location_lat,
                longitude: cast.location_lng,
              }}
              onPress={() => setSelectedCast(cast)}
            >
              <View style={styles.pin}>
                <View style={styles.pinInner}>
                  <MaterialIcons
                    name="person-pin"
                    size={28}
                    color={COLORS.gold}
                  />
                </View>
              </View>
            </Marker>
          ) : null,
        )}
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

      {/* キャストプレビューカード */}
      {selectedCast ? (
        <SafeAreaView style={styles.previewSafe} edges={['bottom']}>
          <View style={styles.previewCard}>
            {/* 閉じるボタン */}
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setSelectedCast(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.previewContent}>
              <Avatar
                uri={selectedCast.user.avatar_url}
                size={56}
                nickname={selectedCast.user.nickname}
                isWorking={selectedCast.is_working}
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewNickname}>
                  {selectedCast.user.nickname}
                </Text>
                {selectedCast.location_lat != null &&
                selectedCast.location_lng != null ? (
                  <Text style={styles.previewArea}>
                    {getAreaLabel(
                      selectedCast.location_lat,
                      selectedCast.location_lng,
                    )}
                  </Text>
                ) : null}
                <StatusBadge status={selectedCast.work_status} size="small" />
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => handleViewProfile(selectedCast)}
              activeOpacity={0.85}
            >
              <Text style={styles.profileButtonText}>プロフィールを見る</Text>
              <MaterialIcons
                name="arrow-forward"
                size={16}
                color={COLORS.background}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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

  // ピン
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 2,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },

  // プレビューカード
  previewSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  previewClose: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 4,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 28,
  },
  previewInfo: {
    flex: 1,
    gap: 5,
  },
  previewNickname: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  previewArea: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 6,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  profileButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
