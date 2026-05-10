// ============================================================
// Mistella - ChatScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import {
  getMessages,
  markMessagesAsRead,
  sendMessage,
  subscribeToMessages,
} from '../../services/messageService';
import { useAuthStore } from '../../store/authStore';
import type {
  CastStackParamList,
  CustomerStackParamList,
  Message,
  User,
} from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import { uploadImage } from '../../utils/imageUtils';

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
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: partnerUser.nickname });
  }, [navigation, partnerUser.nickname]);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMessages(matchId);
      setMessages(data);
      await markMessagesAsRead(matchId, user.id);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [matchId, user]);

  useEffect(() => {
    loadMessages();

    // Realtime 購読
    const unsub = subscribeToMessages(matchId, async (msg) => {
      setMessages((prev) => {
        // 重複チェック
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // 相手のメッセージを既読処理
      if (user && msg.sender_id !== user.id) {
        await markMessagesAsRead(matchId, user.id);
      }
    });
    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [matchId, user, loadMessages]);

  // 新着メッセージが来たら末尾にスクロール
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendText = async () => {
    if (!user || !inputText.trim()) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    try {
      const sent = await sendMessage(matchId, user.id, text);
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '送信に失敗しました。');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    setSending(true);
    try {
      const imageUrl = await uploadImage(
        result.assets[0].uri,
        'chat-images',
        `${matchId}/${user.id}/${Date.now()}.jpg`,
      );
      const sent = await sendMessage(matchId, user.id, null, imageUrl);
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '画像の送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

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
          <View style={styles.emptyChat}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyChatText}>
              最初のメッセージを送ってみましょう！
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    padding: 12,
    paddingBottom: 8,
  },
  emptyList: {
    flexGrow: 1,
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
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: 12,
  },
  emptyChatText: {
    color: COLORS.textSecondary,
    fontSize: 14,
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
