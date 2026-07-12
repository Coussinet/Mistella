// ============================================================
// Mistella - ChatScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
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
import { formatRelativeTime } from '@/utils/dateUtils';

type ChatRouteParams = {
  matchId: string;
  partnerUser: User;
};

// -----------------------------------------------------------
// メッセージバブル
// -----------------------------------------------------------
type BubbleProps = {
  message: Message;
  isMe: boolean;
  partnerAvatar: string | null;
};

function MessageBubble({ message, isMe, partnerAvatar }: BubbleProps) {
  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
      {!isMe && (
        partnerAvatar ? (
          <Image source={{ uri: partnerAvatar }} style={styles.bubbleAvatar} />
        ) : (
          <View style={[styles.bubbleAvatar, styles.bubbleAvatarFallback]}>
            <MaterialIcons name="person" size={14} color={COLORS.textMuted} />
          </View>
        )
      )}
      <View style={styles.bubbleContent}>
        {message.image_url ? (
          <Image
            source={{ uri: message.image_url }}
            style={[styles.bubbleImage, isMe ? styles.bubbleMe : styles.bubbleOther]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
              {message.content}
            </Text>
          </View>
        )}
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
          {formatRelativeTime(message.created_at)}
          {isMe && (
            <Text style={styles.readStatus}>
              {' '}{message.is_read ? '既読' : '未読'}
            </Text>
          )}
        </Text>
      </View>
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
  const flatListRef = useRef<FlatList<Message>>(null);

  const { data, isPending, isError, error, refetch } = useMessages(matchId);
  const sendMutation = useSendMessage(matchId);
  useMarkMessagesAsRead(matchId);

  const messages = data ?? [];
  const sending = sendMutation.isPending;

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

    sendMutation.mutate({ imageUri: result.assets[0].uri });
  };

  if (isPending) return <SkeletonList />;
  if (isError) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMe={item.sender_id === user?.id}
            partnerAvatar={partnerUser.avatar_url}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chat-bubble-outline"
            title="最初のメッセージを送ってみましょう！"
          />
        }
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* 入力エリア */}
      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.imageButton} onPress={handleSendImage} disabled={sending}>
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

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendText}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <MaterialIcons name="send" size={20} color={COLORS.background} />
          )}
        </TouchableOpacity>
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
    padding: 12,
    paddingBottom: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
    gap: 6,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 16,
  },
  bubbleAvatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContent: {
    maxWidth: '72%',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: COLORS.background,
  },
  bubbleTextOther: {
    color: COLORS.text,
  },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 2,
    color: COLORS.textMuted,
  },
  bubbleTimeMe: {
    textAlign: 'right',
  },
  bubbleTimeOther: {
    textAlign: 'left',
  },
  readStatus: {
    color: COLORS.neonBlue,
    fontSize: 10,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
