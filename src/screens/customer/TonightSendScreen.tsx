// ============================================================
// Mistella - 今夜行ける！送信画面
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import {
  sendTonightRequest,
  getFavorites,
} from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type {
  CastProfileWithUser,
  CustomerStackParamList,
  Favorite,
} from '../../types';

// -----------------------------------------------------------
// 送信先モード
// -----------------------------------------------------------

type SendMode = 'favorites' | 'specific' | 'nearby';

// -----------------------------------------------------------
// TonightSendScreen
// -----------------------------------------------------------

type Props = NativeStackScreenProps<CustomerStackParamList, 'SendTonightRequest'>;

export default function TonightSendScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const { profile } = useAuthStore();

  const presetCastId = route.params?.targetCastId ?? null;

  const [mode, setMode] = useState<SendMode>(
    presetCastId ? 'specific' : 'favorites',
  );
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // お気に入り
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedFavIds, setSelectedFavIds] = useState<Set<string>>(new Set());

  // 特定キャスト
  const [castSearch, setCastSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CastProfileWithUser[]>([]);
  const [selectedSpecificCast, setSelectedSpecificCast] =
    useState<CastProfileWithUser | null>(null);

  // 近くのキャスト
  const [nearbyCasts, setNearbyCasts] = useState<CastProfileWithUser[]>([]);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);

  // 完了アニメーション
  const checkScale = useRef(new Animated.Value(0)).current;

  // -----------------------------------------------------------
  // お気に入り取得
  // -----------------------------------------------------------

  useEffect(() => {
    if (!profile?.id) return;
    getFavorites(profile.id).then(setFavorites).catch(() => null);
  }, [profile]);

  // -----------------------------------------------------------
  // プリセットキャストを special モードで設定
  // -----------------------------------------------------------

  useEffect(() => {
    if (!presetCastId) return;
    supabase
      .from('cast_profiles')
      .select('*, user:users(*)')
      .eq('user_id', presetCastId)
      .single()
      .then(({ data }) => {
        if (data) setSelectedSpecificCast(data as CastProfileWithUser);
      });
  }, [presetCastId]);

  // -----------------------------------------------------------
  // キャスト検索
  // -----------------------------------------------------------

  const searchCasts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from('cast_profiles')
      .select('*, user:users(*)')
      .ilike('shop_name', `%${q}%`)
      .limit(10);
    setSearchResults((data ?? []) as CastProfileWithUser[]);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchCasts(castSearch), 300);
    return () => clearTimeout(timeout);
  }, [castSearch, searchCasts]);

  // -----------------------------------------------------------
  // 近くのキャスト取得
  // -----------------------------------------------------------

  const fetchNearbyCasts = useCallback(async () => {
    setIsFetchingNearby(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報', '位置情報の許可が必要です。');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = loc.coords;
      const RADIUS = 0.05; // 約 5km

      const { data } = await supabase
        .from('cast_profiles')
        .select('*, user:users(*)')
        .eq('is_working', true)
        .eq('location_enabled', true)
        .gte('location_lat', lat - RADIUS)
        .lte('location_lat', lat + RADIUS)
        .gte('location_lng', lng - RADIUS)
        .lte('location_lng', lng + RADIUS);

      setNearbyCasts((data ?? []) as CastProfileWithUser[]);
    } finally {
      setIsFetchingNearby(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'nearby') {
      fetchNearbyCasts();
    }
  }, [mode, fetchNearbyCasts]);

  // -----------------------------------------------------------
  // 送信
  // -----------------------------------------------------------

  const handleSend = async () => {
    if (!profile?.id || isSending) return;

    let targets: string[] = [];

    if (mode === 'favorites') {
      targets = Array.from(selectedFavIds);
      if (targets.length === 0) {
        Alert.alert('送信先を選択してください');
        return;
      }
    } else if (mode === 'specific') {
      if (!selectedSpecificCast) {
        Alert.alert('キャストを選択してください');
        return;
      }
      targets = [selectedSpecificCast.user_id];
    } else {
      targets = nearbyCasts.map((c) => c.user_id);
      if (targets.length === 0) {
        Alert.alert('周辺に出勤中のキャストがいません');
        return;
      }
    }

    setIsSending(true);
    try {
      await Promise.all(
        targets.map((castId) =>
          sendTonightRequest(profile.id, castId, message || undefined),
        ),
      );

      // 完了アニメーション
      setIsDone(true);
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 6,
      }).start();

      setTimeout(() => {
        navigation.goBack();
      }, 1600);
    } catch {
      Alert.alert('送信に失敗しました', '時間をおいて再度お試しください。');
    } finally {
      setIsSending(false);
    }
  };

  // -----------------------------------------------------------
  // 完了画面
  // -----------------------------------------------------------

  if (isDone) {
    return (
      <View style={styles.doneContainer}>
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale: checkScale }] },
          ]}
        >
          <MaterialIcons name="check" size={52} color={COLORS.background} />
        </Animated.View>
        <Text style={styles.doneText}>送信しました！</Text>
        <Text style={styles.doneSubText}>キャストからの返信をお待ちください</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="local-fire-department" size={28} color={COLORS.gold} />
            </View>
            <Text style={styles.title}>今夜行ける！</Text>
            <Text style={styles.subtitle}>
              行きたい気持ちをキャストに伝えよう
            </Text>
          </View>

          {/* モード選択 */}
          <View style={styles.modeSection}>
            <Text style={styles.sectionLabel}>送信先を選択</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'favorites' && styles.modeButtonActive,
                ]}
                onPress={() => setMode('favorites')}
              >
                <MaterialIcons
                  name="favorite"
                  size={18}
                  color={mode === 'favorites' ? COLORS.background : COLORS.gold}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'favorites' && styles.modeButtonTextActive,
                  ]}
                >
                  お気に入り
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'specific' && styles.modeButtonActive,
                ]}
                onPress={() => setMode('specific')}
              >
                <MaterialIcons
                  name="person-search"
                  size={18}
                  color={mode === 'specific' ? COLORS.background : COLORS.gold}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'specific' && styles.modeButtonTextActive,
                  ]}
                >
                  特定のキャスト
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'nearby' && styles.modeButtonActive,
                ]}
                onPress={() => setMode('nearby')}
              >
                <MaterialIcons
                  name="near-me"
                  size={18}
                  color={mode === 'nearby' ? COLORS.background : COLORS.gold}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'nearby' && styles.modeButtonTextActive,
                  ]}
                >
                  現在地周辺
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- お気に入りリスト --- */}
          {mode === 'favorites' ? (
            <View style={styles.section}>
              {favorites.length === 0 ? (
                <Text style={styles.emptyText}>
                  お気に入りのキャストがいません
                </Text>
              ) : (
                favorites.map((fav) => {
                  const user = fav.target_user;
                  if (!user) return null;
                  const selected = selectedFavIds.has(user.id);
                  return (
                    <TouchableOpacity
                      key={fav.id}
                      style={[
                        styles.castRow,
                        selected && styles.castRowSelected,
                      ]}
                      onPress={() => {
                        const next = new Set(selectedFavIds);
                        if (selected) {
                          next.delete(user.id);
                        } else {
                          next.add(user.id);
                        }
                        setSelectedFavIds(next);
                      }}
                    >
                      <Avatar
                        uri={user.avatar_url}
                        size={40}
                        nickname={user.nickname}
                      />
                      <Text style={styles.castName}>{user.nickname}</Text>
                      <View
                        style={[
                          styles.checkbox,
                          selected && styles.checkboxSelected,
                        ]}
                      >
                        {selected ? (
                          <MaterialIcons
                            name="check"
                            size={14}
                            color={COLORS.background}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : null}

          {/* --- 特定のキャスト検索 --- */}
          {mode === 'specific' ? (
            <View style={styles.section}>
              {selectedSpecificCast ? (
                <View style={styles.selectedCastCard}>
                  <Avatar
                    uri={selectedSpecificCast.user.avatar_url}
                    size={48}
                    nickname={selectedSpecificCast.user.nickname}
                  />
                  <View style={styles.selectedCastInfo}>
                    <Text style={styles.selectedCastName}>
                      {selectedSpecificCast.user.nickname}
                    </Text>
                    {selectedSpecificCast.shop_name ? (
                      <Text style={styles.selectedCastShop}>
                        {selectedSpecificCast.shop_name}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedSpecificCast(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.searchBar}>
                    <MaterialIcons
                      name="search"
                      size={18}
                      color={COLORS.textMuted}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="キャスト名・店舗名で検索"
                      placeholderTextColor={COLORS.textMuted}
                      value={castSearch}
                      onChangeText={setCastSearch}
                    />
                  </View>
                  {searchResults.map((cast) => (
                    <TouchableOpacity
                      key={cast.user_id}
                      style={styles.castRow}
                      onPress={() => {
                        setSelectedSpecificCast(cast);
                        setCastSearch('');
                        setSearchResults([]);
                      }}
                    >
                      <Avatar
                        uri={cast.user.avatar_url}
                        size={40}
                        nickname={cast.user.nickname}
                      />
                      <View style={styles.castInfo}>
                        <Text style={styles.castName}>{cast.user.nickname}</Text>
                        {cast.shop_name ? (
                          <Text style={styles.castShop}>{cast.shop_name}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          ) : null}

          {/* --- 近くのキャスト --- */}
          {mode === 'nearby' ? (
            <View style={styles.section}>
              {isFetchingNearby ? (
                <LoadingSpinner />
              ) : nearbyCasts.length === 0 ? (
                <View style={styles.emptyNearby}>
                  <MaterialIcons
                    name="location-off"
                    size={36}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    現在地周辺に出勤中のキャストがいません
                  </Text>
                  <TouchableOpacity onPress={fetchNearbyCasts}>
                    <Text style={styles.retryText}>再検索</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.nearbyCount}>
                    {nearbyCasts.length}人のキャストに送信します
                  </Text>
                  {nearbyCasts.map((cast) => (
                    <View key={cast.user_id} style={styles.castRow}>
                      <Avatar
                        uri={cast.user.avatar_url}
                        size={40}
                        nickname={cast.user.nickname}
                      />
                      <View style={styles.castInfo}>
                        <Text style={styles.castName}>{cast.user.nickname}</Text>
                        {cast.shop_name ? (
                          <Text style={styles.castShop}>{cast.shop_name}</Text>
                        ) : null}
                      </View>
                      <MaterialIcons
                        name="near-me"
                        size={16}
                        color={COLORS.neonBlue}
                      />
                    </View>
                  ))}
                </>
              )}
            </View>
          ) : null}

          {/* メッセージ入力 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メッセージ（任意）</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="一言メッセージを添えましょう（例: 今夜21時頃お邪魔したいです！）"
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, 100))}
              multiline
              maxLength={100}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length}/100</Text>
          </View>
        </ScrollView>

        {/* 送信ボタン */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isSending}
            activeOpacity={0.85}
          >
            {isSending ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <MaterialIcons
                  name="local-fire-department"
                  size={20}
                  color={COLORS.background}
                />
                <Text style={styles.sendButtonText}>今夜行ける！を送信</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ヘッダー
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 8,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },

  // モード選択
  modeSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 5,
  },
  modeButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  modeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: COLORS.background,
  },

  // セクション
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },

  // キャスト行
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  castRowSelected: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  castInfo: {
    flex: 1,
    gap: 2,
  },
  castName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  castShop: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  // 特定キャスト
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  selectedCastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    padding: 12,
    gap: 12,
  },
  selectedCastInfo: {
    flex: 1,
    gap: 2,
  },
  selectedCastName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedCastShop: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // 近く
  nearbyCount: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyNearby: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // メッセージ入力
  messageInput: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },

  // フッター・送信ボタン
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 17,
    gap: 8,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // 完了画面
  doneContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  doneText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  doneSubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
