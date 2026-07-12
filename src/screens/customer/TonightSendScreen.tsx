// ============================================================
// Mistella - 今夜行ける！送信画面
// 選択UI・入力・完了演出は src/components/tonight/ に分割済み。
// この画面は状態管理と送信ロジックの結線に専念する。
// ============================================================

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';
import { useFavorites } from '@/hooks/queries/useFavorites';
import {
  useCastShopSearch,
  useNearbyTonightCasts,
  usePresetCast,
  useSendTonight,
} from '@/hooks/queries/useTonightSend';
import { useAuthStore } from '@/store/authStore';
import { tapMedium } from '@/utils/haptics';
import BroadcastInfoPanel from '@/components/tonight/BroadcastInfoPanel';
import CastSearchPicker from '@/components/tonight/CastSearchPicker';
import FavoriteCastPicker from '@/components/tonight/FavoriteCastPicker';
import MessageComposer from '@/components/tonight/MessageComposer';
import NearbyCastPicker from '@/components/tonight/NearbyCastPicker';
import SendDoneOverlay from '@/components/tonight/SendDoneOverlay';
import SendFooter from '@/components/tonight/SendFooter';
import SendModeSelector, { type SendMode } from '@/components/tonight/SendModeSelector';
import TonightHeader from '@/components/tonight/TonightHeader';
import type { CastProfileWithUser, CustomerStackParamList } from '@/types';

// -----------------------------------------------------------
// TonightSendScreen
// -----------------------------------------------------------

type Props = NativeStackScreenProps<CustomerStackParamList, 'SendTonightRequest'>;

export default function TonightSendScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const { profile } = useAuthStore();

  const presetCastId = route.params?.targetCastId ?? null;

  const [mode, setMode] = useState<SendMode>(
    presetCastId ? 'specific' : 'broadcast',
  );
  const [message, setMessage] = useState('');
  const [isDone, setIsDone] = useState(false);

  // お気に入り（既存クエリフックを再利用）
  const { data: favoritesData } = useFavorites();
  const favorites = favoritesData?.favorites ?? [];
  const [selectedFavIds, setSelectedFavIds] = useState<Set<string>>(new Set());

  // 特定キャスト
  const [castSearch, setCastSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSpecificCast, setSelectedSpecificCast] =
    useState<CastProfileWithUser | null>(null);

  // 送信 mutation
  const sendMutation = useSendTonight();
  const isSending = sendMutation.isPending;

  // プリセットキャストを specific モードで設定（初回のみ反映）
  const presetCastQuery = usePresetCast(presetCastId);
  const presetApplied = useRef(false);

  useEffect(() => {
    if (presetCastQuery.data && !presetApplied.current) {
      presetApplied.current = true;
      setSelectedSpecificCast(presetCastQuery.data);
    }
  }, [presetCastQuery.data]);

  // キャスト検索（300ms デバウンス）
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(castSearch), 300);
    return () => clearTimeout(timeout);
  }, [castSearch]);

  const searchQuery = useCastShopSearch(debouncedSearch);
  const searchResults = debouncedSearch.trim() ? (searchQuery.data ?? []) : [];

  // 近くのキャスト取得（モードが nearby の間だけ有効）
  const nearbyQuery = useNearbyTonightCasts(mode === 'nearby');
  const nearbyCasts = nearbyQuery.data ?? [];

  // -----------------------------------------------------------
  // 送信
  // -----------------------------------------------------------

  const handleSend = () => {
    if (!profile?.id || isSending) return;
    tapMedium();

    let targets: string[] = [];

    if (mode !== 'broadcast') {
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
    }

    sendMutation.mutate(
      mode === 'broadcast'
        ? { mode: 'broadcast', message: message || undefined }
        : { mode: 'targets', targetCastIds: targets, message: message || undefined },
      {
        onSuccess: () => {
          setIsDone(true);
          setTimeout(() => {
            navigation.goBack();
          }, 1600);
        },
      },
    );
  };

  // 完了演出（オーバーレイに置き換え）
  if (isDone) {
    return <SendDoneOverlay />;
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
          <TonightHeader />

          {/* モード選択 */}
          <SendModeSelector mode={mode} onChange={setMode} />

          {/* モード別の選択UI */}
          {mode === 'broadcast' ? <BroadcastInfoPanel /> : null}
          {mode === 'favorites' ? (
            <FavoriteCastPicker
              favorites={favorites}
              selectedIds={selectedFavIds}
              onToggle={(userId) => {
                setSelectedFavIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(userId)) {
                    next.delete(userId);
                  } else {
                    next.add(userId);
                  }
                  return next;
                });
              }}
            />
          ) : null}
          {mode === 'specific' ? (
            <CastSearchPicker
              selectedCast={selectedSpecificCast}
              searchText={castSearch}
              results={searchResults}
              onSearchTextChange={setCastSearch}
              onSelect={(cast) => {
                setSelectedSpecificCast(cast);
                setCastSearch('');
                setDebouncedSearch('');
              }}
              onClear={() => setSelectedSpecificCast(null)}
            />
          ) : null}
          {mode === 'nearby' ? (
            <NearbyCastPicker
              casts={nearbyCasts}
              isFetching={nearbyQuery.isFetching}
              onRetry={() => nearbyQuery.refetch()}
            />
          ) : null}

          {/* メッセージ入力 */}
          <MessageComposer value={message} onChange={setMessage} />
        </ScrollView>

        {/* 送信ボタン */}
        <SendFooter isSending={isSending} onPress={handleSend} />
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
    paddingBottom: SPACING.lg,
  },
});
