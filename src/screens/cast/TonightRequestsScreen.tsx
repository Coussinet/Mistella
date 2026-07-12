// ============================================================
// Mistella - 今夜行ける？リクエスト一覧画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { COLORS } from '@/constants/colors';
import { withAlpha } from '@/constants/theme';
import {
  useBroadcastTonightRequests,
  useReactToBroadcast,
  useTonightRequests,
  useUpdateTonightRequestStatus,
} from '@/hooks/queries/useTonightRequests';
import type {
  BroadcastTonightRequest,
  CastStackParamList,
  TonightRequest,
  TonightRequestStatus,
} from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';

type Props = NativeStackScreenProps<CastStackParamList, 'TonightRequests'>;

// -----------------------------------------------------------
// ステータスバッジ設定
// -----------------------------------------------------------

const REQUEST_STATUS_CONFIG: Record<
  TonightRequestStatus,
  { label: string; color: string; bg: string }
> = {
  sent: { label: '未読', color: COLORS.neonBlue, bg: withAlpha(COLORS.neonBlue, 0.15) },
  read: { label: '確認済み', color: COLORS.textSecondary, bg: withAlpha(COLORS.textSecondary, 0.12) },
  accepted: { label: '承諾', color: COLORS.success, bg: withAlpha(COLORS.success, 0.15) },
  declined: { label: '辞退', color: COLORS.error, bg: withAlpha(COLORS.error, 0.12) },
};

// -----------------------------------------------------------
// 個別リクエストアイテム
// -----------------------------------------------------------

interface RequestItemProps {
  item: TonightRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onOpenChat: (request: TonightRequest) => void;
  isProcessing: boolean;
}

function RequestItem({ item, onAccept, onDecline, onOpenChat, isProcessing }: RequestItemProps) {
  const statusConfig = REQUEST_STATUS_CONFIG[item.status];
  const isAccepted = item.status === 'accepted';
  const isPending = item.status === 'sent' || item.status === 'read';

  return (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => isAccepted && onOpenChat(item)}
      activeOpacity={isAccepted ? 0.8 : 1}
    >
      <View style={styles.requestHeader}>
        <Avatar uri={item.customer?.avatar_url ?? null} size={48} nickname={item.customer?.nickname} style={styles.avatar} />
        <View style={styles.requestHeaderInfo}>
          <View style={styles.requestNameRow}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer?.nickname ?? '不明なお客様'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '55' }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>
          <Text style={styles.requestTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
      </View>

      {item.message && (
        <View style={styles.messageBox}>
          <MaterialIcons name="chat" size={14} color={COLORS.textMuted} />
          <Text style={styles.messageText} numberOfLines={3}>{item.message}</Text>
        </View>
      )}

      {isPending && (
        <View style={styles.actionRow}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <>
              <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(item.id)} activeOpacity={0.8}>
                <MaterialIcons name="close" size={16} color={COLORS.error} />
                <Text style={styles.declineBtnText}>辞退</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(item.id)} activeOpacity={0.8}>
                <MaterialIcons name="check" size={16} color={COLORS.background} />
                <Text style={styles.acceptBtnText}>承諾</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {isAccepted && (
        <TouchableOpacity style={styles.chatBtn} onPress={() => onOpenChat(item)} activeOpacity={0.8}>
          <MaterialIcons name="chat-bubble" size={16} color={COLORS.background} />
          <Text style={styles.chatBtnText}>チャットを開く</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------
// 全体投稿アイテム
// -----------------------------------------------------------

interface BroadcastItemProps {
  item: BroadcastTonightRequest;
  onInterested: (id: string) => void;
  onStartMessage: (id: string) => void;
  composingId: string | null;
  composingText: string;
  onComposingTextChange: (text: string) => void;
  onSendMessage: (id: string) => void;
  isProcessing: boolean;
}

function BroadcastItem({
  item,
  onInterested,
  onStartMessage,
  composingId,
  composingText,
  onComposingTextChange,
  onSendMessage,
  isProcessing,
}: BroadcastItemProps) {
  const reaction = item.my_reaction;
  const isComposing = composingId === item.id;

  return (
    <View style={styles.requestCard}>
      {/* ヘッダー */}
      <View style={styles.requestHeader}>
        <Avatar uri={item.customer?.avatar_url ?? null} size={48} nickname={item.customer?.nickname} style={styles.avatar} />
        <View style={styles.requestHeaderInfo}>
          <View style={styles.requestNameRow}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer?.nickname ?? '不明なお客様'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: withAlpha(COLORS.gold, 0.15), borderColor: withAlpha(COLORS.gold, 0.4) }]}>
              <Text style={[styles.statusBadgeText, { color: COLORS.gold }]}>全体投稿</Text>
            </View>
          </View>
          <Text style={styles.requestTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
      </View>

      {/* メッセージ */}
      {item.message && (
        <View style={styles.messageBox}>
          <MaterialIcons name="chat" size={14} color={COLORS.textMuted} />
          <Text style={styles.messageText} numberOfLines={3}>{item.message}</Text>
        </View>
      )}

      {/* 反応済みバッジ */}
      {reaction && !isComposing && (
        <View style={styles.reactionBadgeRow}>
          {reaction.type === 'interested' ? (
            <View style={styles.reactionBadge}>
              <MaterialIcons name="favorite" size={14} color={COLORS.gold} />
              <Text style={styles.reactionBadgeText}>興味ありを送信済み</Text>
            </View>
          ) : (
            <View style={[styles.reactionBadge, styles.reactionBadgeMessage]}>
              <MaterialIcons name="send" size={14} color={COLORS.neonBlue} />
              <Text style={[styles.reactionBadgeText, { color: COLORS.neonBlue }]}>メッセージを送信済み</Text>
            </View>
          )}
        </View>
      )}

      {/* アクションボタン（未反応時） */}
      {!reaction && !isComposing && (
        <View style={styles.actionRow}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <>
              <TouchableOpacity style={styles.interestedBtn} onPress={() => onInterested(item.id)} activeOpacity={0.8}>
                <MaterialIcons name="favorite" size={16} color={COLORS.gold} />
                <Text style={styles.interestedBtnText}>興味あり</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageBtn} onPress={() => onStartMessage(item.id)} activeOpacity={0.8}>
                <MaterialIcons name="send" size={16} color={COLORS.background} />
                <Text style={styles.messageBtnText}>メッセージ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* メッセージ入力エリア */}
      {isComposing && (
        <View style={styles.composeArea}>
          <TextInput
            style={styles.composeInput}
            placeholder="メッセージを入力..."
            placeholderTextColor={COLORS.textMuted}
            value={composingText}
            onChangeText={onComposingTextChange}
            multiline
            maxLength={200}
            autoFocus
          />
          <View style={styles.composeActions}>
            <TouchableOpacity style={styles.cancelComposeBtn} onPress={() => onStartMessage('')}>
              <Text style={styles.cancelComposeBtnText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendComposeBtn, !composingText.trim() && styles.sendComposeBtnDisabled]}
              onPress={() => onSendMessage(item.id)}
              disabled={!composingText.trim()}
            >
              <MaterialIcons name="send" size={16} color={COLORS.background} />
              <Text style={styles.sendComposeBtnText}>送信</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// TonightRequestsScreen
// -----------------------------------------------------------

export default function TonightRequestsScreen({ navigation }: Props) {
  // タブ
  const [activeTab, setActiveTab] = useState<'direct' | 'broadcast'>('broadcast');

  // 個別リクエスト（取得 + Realtime はフック内）
  const requestsQuery = useTonightRequests();
  const requests = requestsQuery.data ?? [];
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const updateStatusMutation = useUpdateTonightRequestStatus();

  // 全体投稿（取得 + Realtime はフック内）
  const broadcastsQuery = useBroadcastTonightRequests();
  const broadcastPosts = broadcastsQuery.data ?? [];
  const [broadcastProcessingIds, setBroadcastProcessingIds] = useState<Set<string>>(new Set());
  const [composingId, setComposingId] = useState<string | null>(null);
  const [composingText, setComposingText] = useState('');
  const reactMutation = useReactToBroadcast();

  // -----------------------------------------------------------
  // 個別: 承諾
  // -----------------------------------------------------------

  const handleAccept = (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    updateStatusMutation.mutate(
      { requestId, status: 'accepted' },
      {
        onSettled: () => {
          setProcessingIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
        },
      },
    );
  };

  // -----------------------------------------------------------
  // 個別: 辞退
  // -----------------------------------------------------------

  const handleDecline = (requestId: string) => {
    Alert.alert('辞退の確認', 'このリクエストを辞退しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '辞退する',
        style: 'destructive',
        onPress: () => {
          setProcessingIds((prev) => new Set(prev).add(requestId));
          updateStatusMutation.mutate(
            { requestId, status: 'declined' },
            {
              onSettled: () => {
                setProcessingIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
              },
            },
          );
        },
      },
    ]);
  };

  // -----------------------------------------------------------
  // チャット画面へ
  // -----------------------------------------------------------

  const handleOpenChat = (request: TonightRequest) => {
    if (!request.customer) return;
    navigation.navigate('ChatRoom', { matchId: request.id, partnerUser: request.customer });
  };

  // -----------------------------------------------------------
  // 全体投稿: 興味あり
  // -----------------------------------------------------------

  const handleInterested = (requestId: string) => {
    setBroadcastProcessingIds((prev) => new Set(prev).add(requestId));
    reactMutation.mutate(
      { requestId, type: 'interested' },
      {
        onSettled: () => {
          setBroadcastProcessingIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
        },
      },
    );
  };

  // -----------------------------------------------------------
  // 全体投稿: メッセージ送信
  // -----------------------------------------------------------

  const handleSendMessage = (requestId: string) => {
    if (!composingText.trim()) return;
    setBroadcastProcessingIds((prev) => new Set(prev).add(requestId));
    reactMutation.mutate(
      { requestId, type: 'message', message: composingText.trim() },
      {
        onSuccess: () => {
          setComposingId(null);
          setComposingText('');
        },
        onSettled: () => {
          setBroadcastProcessingIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
        },
      },
    );
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  const isInitialLoading =
    activeTab === 'direct' ? requestsQuery.isPending : broadcastsQuery.isPending;

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <SkeletonList />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* スクリーンタイトル */}
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>今夜行ける？</Text>
      </View>

      {/* タブバー */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'broadcast' && styles.tabItemActive]}
          onPress={() => setActiveTab('broadcast')}
        >
          <MaterialIcons name="campaign" size={16} color={activeTab === 'broadcast' ? COLORS.gold : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'broadcast' && styles.tabTextActive]}>全体投稿</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'direct' && styles.tabItemActive]}
          onPress={() => setActiveTab('direct')}
        >
          <MaterialIcons name="person" size={16} color={activeTab === 'direct' ? COLORS.gold : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'direct' && styles.tabTextActive]}>個別リクエスト</Text>
          {requests.filter((r) => r.status === 'sent').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{requests.filter((r) => r.status === 'sent').length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 個別リクエストタブ */}
      {activeTab === 'direct' &&
        (requestsQuery.isError ? (
          <ErrorView error={requestsQuery.error} onRetry={requestsQuery.refetch} />
        ) : (
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
            ListEmptyComponent={
              <EmptyState
                icon="nights-stay"
                title="まだリクエストがありません"
                description="出勤中にお客様からのリクエストが届きます。"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ))}

      {/* 全体投稿タブ */}
      {activeTab === 'broadcast' &&
        (broadcastsQuery.isError ? (
          <ErrorView error={broadcastsQuery.error} onRetry={broadcastsQuery.refetch} />
        ) : (
          <FlatList
            data={broadcastPosts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BroadcastItem
                item={item}
                onInterested={handleInterested}
                onStartMessage={(id) => {
                  setComposingId(id || null);
                  setComposingText('');
                }}
                composingId={composingId}
                composingText={composingText}
                onComposingTextChange={setComposingText}
                onSendMessage={handleSendMessage}
                isProcessing={broadcastProcessingIds.has(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="campaign"
                title="全体投稿はありません"
                description={'お客様が「全キャスト向け」で投稿すると\nここに表示されます。'}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ))}
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  // タブバー
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 5,
  },
  tabItemActive: {
    backgroundColor: withAlpha(COLORS.gold, 0.12),
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.gold,
  },
  tabBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
    flexGrow: 1,
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
  requestHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatar: { flexShrink: 0 },
  requestHeaderInfo: { flex: 1, justifyContent: 'center' },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  requestTime: { fontSize: 11, color: COLORS.textMuted },

  messageBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  messageText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, flex: 1 },

  // アクションボタン共通行
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // 個別: 辞退・承諾
  declineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.error,
  },
  declineBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.error },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 9, paddingHorizontal: 18,
    borderRadius: 20, backgroundColor: COLORS.success,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.background },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.gold,
  },
  chatBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.background },

  // 全体投稿: 反応ボタン
  interestedBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.gold,
  },
  interestedBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  messageBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 20, backgroundColor: COLORS.neonBlue,
  },
  messageBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.background },

  // 反応済みバッジ
  reactionBadgeRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reactionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: withAlpha(COLORS.gold, 0.1),
    borderRadius: 10, borderWidth: 1, borderColor: withAlpha(COLORS.gold, 0.3),
    paddingVertical: 5, paddingHorizontal: 10,
  },
  reactionBadgeMessage: {
    backgroundColor: withAlpha(COLORS.neonBlue, 0.1),
    borderColor: withAlpha(COLORS.neonBlue, 0.3),
  },
  reactionBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.gold },

  // メッセージ入力エリア
  composeArea: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  composeInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  composeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelComposeBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  cancelComposeBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  sendComposeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: 20, backgroundColor: COLORS.neonBlue,
  },
  sendComposeBtnDisabled: { opacity: 0.4 },
  sendComposeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.background },

});
