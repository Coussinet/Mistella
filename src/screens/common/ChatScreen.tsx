// ============================================================
// Mistella - ChatScreen（共通）
// - メッセージグルーピング（同一送信者・5分以内）
// - 日付セパレータ（今日 / 昨日 / M月D日）
// - expo-blur 入力バー + reanimated 送信ボタン
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY, withAlpha } from '@/constants/theme';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import MessageBubble from '@/components/messages/MessageBubble';
import type { BubbleGroupPosition } from '@/components/messages/MessageBubble';
import {
  useMarkMessagesAsRead,
  useMessages,
  useSendMessage,
} from '@/hooks/queries/useMessages';
import { useAuthStore } from '@/store/authStore';
import type {
  CastStackParamList,
  CustomerStackParamList,
  Message,
  User,
} from '@/types';
import { tapLight } from '@/utils/haptics';

type ChatRouteParams = {
  matchId: string;
  partnerUser: User;
};

// -----------------------------------------------------------
// リスト項目（メッセージ + 日付セパレータ）
// -----------------------------------------------------------

type ChatListItem =
  | { type: 'date'; id: string; label: string }
  | {
      type: 'message';
      id: string;
      message: Message;
      groupPosition: BubbleGroupPosition;
    };

/** 同一グループとみなす送信間隔（5分） */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
const SEND_BUTTON_SIZE = 40;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 日付セパレータのラベル（今日 / 昨日 / M月D日） */
function formatDateLabel(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(d)) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (d.getFullYear() !== now.getFullYear()) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 2つのメッセージを同一グループ（連続表示）にできるか */
function isGrouped(a: Message, b: Message): boolean {
  if (a.sender_id !== b.sender_id) return false;
  const ta = new Date(a.created_at);
  const tb = new Date(b.created_at);
  if (!isSameDay(ta, tb)) return false;
  return Math.abs(tb.getTime() - ta.getTime()) <= GROUP_WINDOW_MS;
}

/** メッセージ配列を日付セパレータ入りのリスト項目へ変換する */
function buildListItems(messages: Message[]): ChatListItem[] {
  const items: ChatListItem[] = [];

  messages.forEach((message, index) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const next = index < messages.length - 1 ? messages[index + 1] : null;

    // 日付が変わる位置にセパレータを挿入
    const current = new Date(message.created_at);
    if (!prev || !isSameDay(new Date(prev.created_at), current)) {
      items.push({
        type: 'date',
        id: `date-${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`,
        label: formatDateLabel(message.created_at),
      });
    }

    const linkedPrev = !!prev && isGrouped(prev, message);
    const linkedNext = !!next && isGrouped(message, next);
    const groupPosition: BubbleGroupPosition =
      linkedPrev && linkedNext
        ? 'middle'
        : linkedPrev
          ? 'last'
          : linkedNext
            ? 'first'
            : 'single';

    items.push({ type: 'message', id: message.id, message, groupPosition });
  });

  return items;
}

// -----------------------------------------------------------
// 日付セパレータ
// -----------------------------------------------------------

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateSeparator}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>{label}</Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function ChatScreen() {
  const route = useRoute<RouteProp<Record<string, ChatRouteParams>, string>>();
  const navigation = useNavigation<
    NativeStackNavigationProp<CastStackParamList & CustomerStackParamList>
  >();
  const { matchId, partnerUser } = route.params as ChatRouteParams;
  const user = useAuthStore((s) => s.user);

  const [inputText, setInputText] = useState('');
  const [inputBarHeight, setInputBarHeight] = useState(64);
  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  const { data, isPending, isError, error, refetch } = useMessages(matchId);
  const sendMutation = useSendMessage(matchId);
  useMarkMessagesAsRead(matchId);

  const messages = useMemo(() => data ?? [], [data]);
  const listItems = useMemo(() => buildListItems(messages), [messages]);
  const sending = sendMutation.isPending;
  const hasText = inputText.trim().length > 0;

  // 送信ボタンの出現アニメーション（テキスト入力があるときだけスプリングで表示）
  const sendProgress = useSharedValue(0);
  useEffect(() => {
    sendProgress.value = withSpring(hasText ? 1 : 0, {
      damping: 15,
      stiffness: 260,
    });
  }, [hasText, sendProgress]);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => {
    const p = sendProgress.value;
    return {
      width: Math.max(0, p) * SEND_BUTTON_SIZE,
      opacity: Math.min(1, Math.max(0, p)),
      transform: [{ scale: Math.max(0, p) }],
    };
  });

  useEffect(() => {
    navigation.setOptions({
      title: partnerUser.nickname,
      // 相手メモ・会った記録への導線
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('PartnerNote', { partnerId: partnerUser.id })}
          style={{ paddingRight: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="メモ・会った記録"
        >
          <MaterialIcons name="menu-book" size={22} color={COLORS.gold} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, partnerUser.nickname, partnerUser.id]);

  // 新着メッセージが来たら末尾にスクロール
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendText = () => {
    const text = inputText.trim();
    if (!user || !text) return;
    tapLight();
    setInputText('');
    sendMutation.mutate(
      { content: text },
      {
        // 失敗時は入力内容を復元する（エラー表示は hook 側で行う）
        onError: () => setInputText(text),
      },
    );
  };

  const handleSendImage = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    tapLight();
    sendMutation.mutate({ imageUri: result.assets[0].uri });
  };

  if (isPending) return <SkeletonList />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  const inputBarInner = (
    <View style={styles.inputRow}>
      <TouchableOpacity
        style={styles.imageButton}
        onPress={handleSendImage}
        disabled={sending}
        accessibilityLabel="画像を送信"
      >
        <MaterialIcons name="image" size={24} color={COLORS.neonBlue} />
      </TouchableOpacity>

      <TextInput
        style={styles.textInput}
        value={inputText}
        onChangeText={setInputText}
        placeholder="メッセージを入力..."
        placeholderTextColor={COLORS.textMuted}
        multiline
        maxLength={1000}
        returnKeyType="default"
      />

      <Animated.View style={[styles.sendButtonSlot, sendButtonAnimatedStyle]}>
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendText}
          disabled={!hasText || sending}
          accessibilityLabel="送信"
        >
          <MaterialIcons name="send" size={18} color={COLORS.background} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.type === 'date' ? (
            <DateSeparator label={item.label} />
          ) : (
            <MessageBubble
              message={item.message}
              isOwn={item.message.sender_id === user?.id}
              senderAvatar={partnerUser.avatar_url}
              senderNickname={partnerUser.nickname}
              groupPosition={item.groupPosition}
            />
          )
        }
        ListEmptyComponent={
          <EmptyState
            icon="chat-bubble-outline"
            title="最初のメッセージを送ってみましょう！"
          />
        }
        contentContainerStyle={[
          listItems.length === 0 ? styles.emptyList : styles.messageList,
          // 絶対配置の入力バーの背後に隠れないよう余白を確保
          { paddingBottom: inputBarHeight + SPACING.xs },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* 入力バー（メッセージがブラーの背後を流れるよう絶対配置） */}
      <View
        style={styles.inputBarContainer}
        onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={styles.inputBarBlur}>
            <View style={styles.inputBarGlass}>{inputBarInner}</View>
          </BlurView>
        ) : (
          <View style={styles.inputBarSolid}>{inputBarInner}</View>
        )}
      </View>
    </KeyboardAvoidingView>
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
  messageList: {
    paddingVertical: SPACING.sm,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // ---- 日付セパレータ ----------------------------------------
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xxs,
    paddingHorizontal: SPACING.lg,
  },
  dateSeparatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  dateSeparatorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    backgroundColor: withAlpha(COLORS.surfaceLight, 0.8),
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  // ---- 入力バー ----------------------------------------------
  inputBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.glassBorder,
  },
  inputBarBlur: {
    overflow: 'hidden',
  },
  inputBarGlass: {
    backgroundColor: COLORS.glassBg,
  },
  inputBarSolid: {
    backgroundColor: COLORS.glassBgSolid,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.xs + 2,
    gap: SPACING.xs,
  },
  imageButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: withAlpha(COLORS.surfaceLight, 0.9),
    color: COLORS.text,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButtonSlot: {
    height: SEND_BUTTON_SIZE,
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: SEND_BUTTON_SIZE / 2,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
