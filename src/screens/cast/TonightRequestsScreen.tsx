// ============================================================
// Mistella - 今夜行ける？リクエスト一覧画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/common/Avatar';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import * as castService from '../../services/castService';
import { useAuthStore } from '../../store/authStore';
import type { CastStackParamList, TonightRequest, TonightRequestStatus } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CastStackParamList, 'TonightRequests'>;

// -----------------------------------------------------------
// ステータスバッジ設定
// -----------------------------------------------------------

const REQUEST_STATUS_CONFIG: Record<
  TonightRequestStatus,
  { label: string; color: string; bg: string }
> = {
  sent: {
    label: '未読',
    color: COLORS.neonBlue,
    bg: 'rgba(76, 158, 255, 0.15)',
  },
  read: {
    label: '確認済み',
    color: COLORS.textSecondary,
    bg: 'rgba(142, 142, 153, 0.12)',
  },
  accepted: {
    label: '承諾',
    color: COLORS.success,
    bg: 'rgba(76, 255, 158, 0.15)',
  },
  declined: {
    label: '辞退',
    color: COLORS.error,
    bg: 'rgba(255, 76, 106, 0.12)',
  },
};

// -----------------------------------------------------------
// リクエストアイテム
// -----------------------------------------------------------

interface RequestItemProps {
  item: TonightRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onOpenChat: (request: TonightRequest) => void;
  isProcessing: boolean;
}

function RequestItem({
  item,
  onAccept,
  onDecline,
  onOpenChat,
  isProcessing,
}: RequestItemProps) {
  const statusConfig = REQUEST_STATUS_CONFIG[item.status];
  const isAccepted = item.status === 'accepted';
  const isDeclined = item.status === 'declined';
  const isPending = item.status === 'sent' || item.status === 'read';

  return (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => isAccepted && onOpenChat(item)}
      activeOpacity={isAccepted ? 0.8 : 1}
    >
      {/* ヘッダー行: アバター・名前・ステータス・時刻 */}
      <View style={styles.requestHeader}>
        <Avatar
          uri={item.customer?.avatar_url ?? null}
          size={48}
          nickname={item.customer?.nickname}
          style={styles.avatar}
        />
        <View style={styles.requestHeaderInfo}>
          <View style={styles.requestNameRow}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer?.nickname ?? '不明なお客様'}
            </Text>
            {/* ステータスバッジ */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '55' },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.requestTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
      </View>

      {/* メッセージ */}
      {item.message && (
        <View style={styles.messageBox}>
          <MaterialIcons name="chat" size={14} color={COLORS.textMuted} />
          <Text style={styles.messageText} numberOfLines={3}>
            {item.message}
          </Text>
        </View>
      )}

      {/* アクションボタン */}
      {isPending && (
        <View style={styles.actionRow}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => onDecline(item.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={16} color={COLORS.error} />
                <Text style={styles.declineBtnText}>辞退</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => onAccept(item.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check" size={16} color={COLORS.background} />
                <Text style={styles.acceptBtnText}>承諾</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* 承諾済み: チャットへ誘導 */}
      {isAccepted && (
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => onOpenChat(item)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="chat-bubble" size={16} color={COLORS.background} />
          <Text style={styles.chatBtnText}>チャットを開く</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// TonightRequestsScreen
// -----------------------------------------------------------

export default function TonightRequestsScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<TonightRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // -----------------------------------------------------------
  // データ取得
  // -----------------------------------------------------------

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    try {
      const data = await castService.getTonightRequests(user.id);
      setRequests(data);
    } catch {
      Alert.alert('エラー', 'リクエストの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // -----------------------------------------------------------
  // Supabase Realtime 購読
  // -----------------------------------------------------------

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tonight_requests_cast')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tonight_requests',
          filter: `target_cast_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  // -----------------------------------------------------------
  // ステータス更新: 承諾
  // -----------------------------------------------------------

  const handleAccept = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await castService.updateTonightRequestStatus(requestId, 'accepted');
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r)),
      );
    } catch {
      Alert.alert('エラー', '承諾処理に失敗しました。');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // -----------------------------------------------------------
  // ステータス更新: 辞退
  // -----------------------------------------------------------

  const handleDecline = (requestId: string) => {
    Alert.alert('辞退の確認', 'このリクエストを辞退しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '辞退する',
        style: 'destructive',
        onPress: async () => {
          setProcessingIds((prev) => new Set(prev).add(requestId));
          try {
            await castService.updateTonightRequestStatus(requestId, 'declined');
            setRequests((prev) =>
              prev.map((r) => (r.id === requestId ? { ...r, status: 'declined' } : r)),
            );
          } catch {
            Alert.alert('エラー', '辞退処理に失敗しました。');
          } finally {
            setProcessingIds((prev) => {
              const next = new Set(prev);
              next.delete(requestId);
              return next;
            });
          }
        },
      },
    ]);
  };

  // -----------------------------------------------------------
  // チャット画面へ遷移
  // -----------------------------------------------------------

  const handleOpenChat = (request: TonightRequest) => {
    if (!request.customer) return;
    navigation.navigate('ChatRoom', {
      matchId: request.id,
      partnerUser: request.customer,
    });
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestItem
            item={item}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onOpenChat={handleOpenChat}
            isProcessing={processingIds.has(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.screenTitle}>今夜行ける？リクエスト</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="nights-stay" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>まだリクエストがありません</Text>
            <Text style={styles.emptyDesc}>
              出勤中にお客様からのリクエストが届きます。
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
    flexGrow: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // リクエストカード
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    flexShrink: 0,
  },
  requestHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // メッセージ
  messageBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    flex: 1,
  },

  // アクション
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: COLORS.success,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.background,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },

  // 空状態
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
