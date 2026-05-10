// ============================================================
// YoruConnect - TimelineScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { createTimeline, getTimelines } from '../../services/timelineService';
import { useAuthStore } from '../../store/authStore';
import type { Timeline } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import { compressImage } from '../../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 20;

// -----------------------------------------------------------
// タイムスタンプ：何時間後に消えるか
// -----------------------------------------------------------
function getExpiresLabel(expiresAt: string): string {
  const now = Date.now();
  const expMs = new Date(expiresAt).getTime();
  const diffMs = expMs - now;
  if (diffMs <= 0) return '期限切れ';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours > 0) return `${diffHours}時間後に消えます`;
  return `${diffMinutes}分後に消えます`;
}

// -----------------------------------------------------------
// 投稿アイテム
// -----------------------------------------------------------
type TimelineItemProps = { item: Timeline };

function TimelineItem({ item }: TimelineItemProps) {
  const avatarUri = item.user?.avatar_url;
  const nickname = item.user?.nickname ?? '不明なユーザー';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <MaterialIcons name="person" size={20} color={COLORS.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.nickname}>{nickname}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(item.created_at)}</Text>
        </View>
        <Text style={styles.expiresLabel}>{getExpiresLabel(item.expires_at)}</Text>
      </View>

      {item.content ? (
        <Text style={styles.content}>{item.content}</Text>
      ) : null}

      {item.media_url && item.media_type === 'image' ? (
        <Image
          source={{ uri: item.media_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      ) : null}

      {item.media_url && item.media_type === 'video' ? (
        <View style={styles.videoPlaceholder}>
          <MaterialIcons name="play-circle-outline" size={48} color={COLORS.gold} />
          <Text style={styles.videoLabel}>動画（3秒）</Text>
        </View>
      ) : null}
    </View>
  );
}

// -----------------------------------------------------------
// 投稿モーダル
// -----------------------------------------------------------
type PostModalProps = {
  visible: boolean;
  onClose: () => void;
  onPosted: (item: Timeline) => void;
};

function PostModal({ visible, onClose, onPosted }: PostModalProps) {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setText('');
    setMediaUri(null);
    setMediaType(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setMediaUri(result.assets[0].uri);
      setMediaType('image');
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 3,
    });
    if (!result.canceled && result.assets.length > 0) {
      const duration = result.assets[0].duration ?? 0;
      if (duration > 3000) {
        Alert.alert('エラー', '動画は3秒以内にしてください。');
        return;
      }
      setMediaUri(result.assets[0].uri);
      setMediaType('video');
    }
  };

  const handlePost = async () => {
    if (!user) return;
    if (!text.trim() && !mediaUri) {
      Alert.alert('エラー', 'テキストまたはメディアを入力してください。');
      return;
    }
    setPosting(true);
    try {
      let uploadedUrl: string | null = null;
      let finalMediaType: 'image' | 'video' | null = null;

      if (mediaUri && mediaType === 'image') {
        const compressed = await compressImage(mediaUri);
        const response = await fetch(compressed);
        const arrayBuffer = await response.arrayBuffer();
        const path = `timelines/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        uploadedUrl = data.publicUrl;
        finalMediaType = 'image';
      } else if (mediaUri && mediaType === 'video') {
        const response = await fetch(mediaUri);
        const arrayBuffer = await response.arrayBuffer();
        const path = `timelines/${user.id}/${Date.now()}.mp4`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, arrayBuffer, { contentType: 'video/mp4', upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        uploadedUrl = data.publicUrl;
        finalMediaType = 'video';
      }

      const created = await createTimeline(
        user.id,
        text.trim() || null,
        uploadedUrl,
        finalMediaType,
      );
      onPosted(created);
      reset();
      onClose();
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '投稿に失敗しました。');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>タイムライン投稿</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="今の気持ちを書いてみよう..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={300}
            value={text}
            onChangeText={setText}
          />

          {mediaUri && mediaType === 'image' ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeMedia}
                onPress={() => { setMediaUri(null); setMediaType(null); }}
              >
                <MaterialIcons name="cancel" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : null}

          {mediaUri && mediaType === 'video' ? (
            <View style={styles.videoSelectedBadge}>
              <MaterialIcons name="videocam" size={18} color={COLORS.gold} />
              <Text style={styles.videoSelectedText}>動画選択済み</Text>
              <TouchableOpacity onPress={() => { setMediaUri(null); setMediaType(null); }}>
                <MaterialIcons name="cancel" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <MaterialIcons name="image" size={24} color={COLORS.neonBlue} />
              <Text style={styles.mediaButtonText}>画像</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
              <MaterialIcons name="videocam" size={24} color={COLORS.neonBlue} />
              <Text style={styles.mediaButtonText}>動画</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.postButton, posting && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.postButtonText}>投稿する</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function TimelineScreen() {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadPage = useCallback(async (pageNum: number, replace: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getTimelines(pageNum, PAGE_SIZE);
      setTimelines((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getTimelines(0, PAGE_SIZE);
      setTimelines(data);
      setHasMore(data.length === PAGE_SIZE);
      setPage(0);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPage(0, true);

    // Realtime 購読
    const channel = supabase
      .channel('timelines-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'timelines' },
        async (payload) => {
          const { data } = await supabase
            .from('timelines')
            .select('*, user:users(*)')
            .eq('id', (payload.new as Timeline).id)
            .single();
          if (data) {
            setTimelines((prev) => [data as Timeline, ...prev]);
          }
        },
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPage(page + 1, false);
    }
  };

  const handlePosted = (item: Timeline) => {
    setTimelines((prev) => [item, ...prev]);
  };

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="dynamic-feed" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>まだ投稿がありません</Text>
      <Text style={styles.emptySubtitle}>最初の投稿をしてみましょう！</Text>
    </View>
  );

  const ListFooter = () =>
    loading && timelines.length > 0 ? (
      <ActivityIndicator style={{ margin: 16 }} color={COLORS.gold} />
    ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>タイムライン</Text>
      </View>

      <FlatList
        data={timelines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TimelineItem item={item} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={loading ? null : <ListEmpty />}
        ListFooterComponent={<ListFooter />}
        contentContainerStyle={timelines.length === 0 ? styles.emptyList : styles.listContent}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>

      <PostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPosted={handlePosted}
      />
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
  headerBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrapper: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  expiresLabel: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '500',
  },
  content: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  mediaImage: {
    width: '100%',
    height: (SCREEN_WIDTH - 24 - 28) * 0.56,
    borderRadius: 8,
    marginTop: 4,
  },
  videoPlaceholder: {
    width: '100%',
    height: (SCREEN_WIDTH - 24 - 28) * 0.4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  videoLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  previewWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  removeMedia: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  videoSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  videoSelectedText: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaButton: {
    alignItems: 'center',
    gap: 2,
  },
  mediaButtonText: {
    color: COLORS.neonBlue,
    fontSize: 10,
  },
  postButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
