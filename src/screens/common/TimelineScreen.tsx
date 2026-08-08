// ============================================================
// Mistella - TimelineScreen（共通）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { avatarSource } from '@/constants/demoAvatars';
import { RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import PageHeader from '@/components/common/PageHeader';
import WorkStatusToggle from '@/components/cast/WorkStatusToggle';
import EmptyState from '@/components/common/EmptyState';
import ErrorView from '@/components/common/ErrorView';
import { SkeletonList } from '@/components/common/Skeleton';
import { useUpdateWorkStatus } from '@/hooks/queries/useCastWork';
import {
  useCreateTimeline,
  useTimelines,
  useTimelinesRealtime,
} from '@/hooks/queries/useTimelines';
import { useAuthStore } from '@/store/authStore';
import type { CastStackParamList, Timeline } from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { showError } from '@/utils/showError';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
type TimelineItemProps = { item: Timeline; onAvatarPress?: () => void };

function TimelineItem({ item, onAvatarPress }: TimelineItemProps) {
  const avatarUri = item.user?.avatar_url;
  const nickname = item.user?.nickname ?? '不明なユーザー';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={onAvatarPress}
          activeOpacity={onAvatarPress ? 0.7 : 1}
          disabled={!onAvatarPress}
        >
          {avatarUri ? (
            <Image source={avatarSource(avatarUri)} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <MaterialIcons name="person" size={20} color={COLORS.textMuted} />
            </View>
          )}
        </TouchableOpacity>
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
};

function PostModal({ visible, onClose }: PostModalProps) {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const createMutation = useCreateTimeline();
  const posting = createMutation.isPending;

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
        showError('動画は3秒以内にしてください。');
        return;
      }
      setMediaUri(result.assets[0].uri);
      setMediaType('video');
    }
  };

  const handlePost = async () => {
    if (!user) return;
    if (!text.trim() && !mediaUri) {
      showError('テキストまたはメディアを入力してください。');
      return;
    }
    try {
      await createMutation.mutateAsync({
        content: text.trim() || null,
        mediaUri,
        mediaType,
      });
      reset();
      onClose();
    } catch (e: unknown) {
      showError(e, '投稿に失敗しました。');
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

type NavProp = NativeStackNavigationProp<CastStackParamList>;

// -----------------------------------------------------------
// キャスト用: ホーム常設の出勤ステータスヘッダー
// -----------------------------------------------------------

function CastWorkHeader() {
  const castProfile = useAuthStore((s) => s.castProfile);
  const updateMutation = useUpdateWorkStatus();

  if (!castProfile) return null;

  return (
    <View style={styles.workHeader}>
      <Text style={styles.workHeaderLabel}>出勤ステータス</Text>
      <WorkStatusToggle
        current={castProfile.work_status}
        onChange={(status) => updateMutation.mutate(status)}
        disabled={updateMutation.isPending}
      />
    </View>
  );
}

export default function TimelineScreen() {
  const navigation = useNavigation<NavProp>();
  const profile = useAuthStore((s) => s.profile);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTimelines();
  useTimelinesRealtime();

  const timelines = useMemo(() => {
    const all = data?.pages.flat() ?? [];
    // キャストのホームには他の女性(キャスト)の投稿を表示しない（自分の投稿は残す）
    if (profile?.role === 'cast') {
      return all.filter(
        (t) => t.user?.role !== 'cast' || t.user_id === profile.id,
      );
    }
    return all;
  }, [data, profile]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isPending) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SkeletonList />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorView error={error} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const listFooter = isFetchingNextPage ? (
    <ActivityIndicator style={{ margin: 16 }} color={COLORS.gold} />
  ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader
        title="ホーム"
        description="お客様とのつながりを、丁寧に育てる"
        compact
      />
      <FlatList
        data={timelines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TimelineItem
            item={item}
            onAvatarPress={
              item.user_id
                ? () => navigation.navigate('UserProfile', { userId: item.user_id })
                : undefined
            }
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onRefresh={refetch}
        refreshing={isRefetching && !isFetchingNextPage}
        ListHeaderComponent={profile?.role === 'cast' ? <CastWorkHeader /> : null}
        ListEmptyComponent={
          <EmptyState
            icon="dynamic-feed"
            title="まだ投稿がありません"
            description="最初の投稿をしてみましょう！"
          />
        }
        ListFooterComponent={listFooter}
        contentContainerStyle={timelines.length === 0 ? styles.emptyList : styles.listContent}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="タイムラインに投稿する"
      >
        <MaterialIcons name="add" size={28} color={COLORS.background} />
      </TouchableOpacity>

      <PostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  workHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  workHeaderLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingTop: SPACING.xxs,
    paddingBottom: 112,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.sm,
    marginVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
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
  fab: {
    position: 'absolute',
    bottom: 104,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
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
