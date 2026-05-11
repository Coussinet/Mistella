// ============================================================
// Mistella - UserProfileScreen（他ユーザープロフィール）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { getProfile } from '../../services/authService';
import {
  addFavorite,
  addFootprint,
  isFavorite,
  removeFavorite,
  sendTonightRequest,
} from '../../services/customerService';
import { blockUser, reportUser } from '../../services/blockService';
import { sendLike } from '../../services/matchService';
import { getMyTimelines } from '../../services/timelineService';
import { useAuthStore } from '../../store/authStore';
import type {
  CastProfile,
  ReportReason,
  Timeline,
  User,
} from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

type RouteParams = { userId: string };

// -----------------------------------------------------------
// 出勤ステータスバッジ
// -----------------------------------------------------------
type WorkStatus = 'working' | 'break' | 'off';

function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const config: Record<WorkStatus, { label: string; color: string }> = {
    working: { label: '出勤中', color: COLORS.success },
    break: { label: '休憩中', color: COLORS.gold },
    off: { label: 'オフ', color: COLORS.textMuted },
  };
  const { label, color } = config[status];
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

// -----------------------------------------------------------
// グリッドアイテム
// -----------------------------------------------------------
function GridItem({ item }: { item: Timeline }) {
  return (
    <View style={styles.gridItem}>
      {item.media_url && item.media_type === 'image' ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} resizeMode="cover" />
      ) : item.media_url && item.media_type === 'video' ? (
        <View style={[styles.gridImage, styles.gridVideo]}>
          <MaterialIcons name="play-circle-outline" size={28} color={COLORS.gold} />
        </View>
      ) : (
        <View style={[styles.gridImage, styles.gridText]}>
          <Text style={styles.gridTextPreview} numberOfLines={3}>
            {item.content ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// 今夜行ける？モーダル
// -----------------------------------------------------------
type TonightModalProps = {
  visible: boolean;
  castId: string;
  onClose: () => void;
};

function TonightModal({ visible, castId, onClose }: TonightModalProps) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user) return;
    setSending(true);
    try {
      await sendTonightRequest(user.id, castId, message.trim() || undefined);
      Alert.alert('送信完了', 'リクエストを送りました！');
      setMessage('');
      onClose();
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>今夜行ける？</Text>
          <Text style={modalStyles.subtitle}>メッセージを添えてリクエストを送りましょう</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="メッセージ（任意）"
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
          />
          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
              <Text style={modalStyles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.sendButton, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={modalStyles.sendText}>送る</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  sendText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
});

// -----------------------------------------------------------
// 通報モーダル
// -----------------------------------------------------------
type ReportModalProps = {
	visible: boolean;
	targetUserId: string;
	onClose: () => void;
};

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
	{ value: 'spam',                  label: 'スパム' },
	{ value: 'inappropriate_content', label: '不適切なコンテンツ' },
	{ value: 'harassment',            label: '嫌がらせ' },
	{ value: 'other',                 label: 'その他' },
];

function ReportModal({ visible, targetUserId, onClose }: ReportModalProps) {
	const { user } = useAuthStore();
	const [reason, setReason] = useState<ReportReason | null>(null);
	const [detail, setDetail] = useState('');
	const [sending, setSending] = useState(false);

	const handleSend = async () => {
		if (!user || !reason) return;
		setSending(true);
		try {
			await reportUser({
				reporterId: user.id,
				reportedUserId: targetUserId,
				reason,
				detail: detail.trim() || undefined,
			});
			Alert.alert('通報完了', '通報を受け付けました。ご協力ありがとうございます。');
			setReason(null);
			setDetail('');
			onClose();
		} catch {
			Alert.alert('エラー', '通報に失敗しました。');
		} finally {
			setSending(false);
		}
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={reportStyles.overlay}>
				<View style={reportStyles.sheet}>
					<Text style={reportStyles.title}>通報する</Text>
					<Text style={reportStyles.subtitle}>理由を選択してください</Text>
					{REPORT_REASONS.map((r) => (
						<TouchableOpacity
							key={r.value}
							style={[reportStyles.reasonRow, reason === r.value && reportStyles.reasonRowSelected]}
							onPress={() => setReason(r.value)}
						>
							<MaterialIcons
								name={reason === r.value ? 'radio-button-checked' : 'radio-button-unchecked'}
								size={20}
								color={reason === r.value ? COLORS.gold : COLORS.textMuted}
							/>
							<Text style={[reportStyles.reasonText, reason === r.value && { color: COLORS.gold }]}>
								{r.label}
							</Text>
						</TouchableOpacity>
					))}
					<TextInput
						style={reportStyles.input}
						placeholder="補足（任意・200文字以内）"
						placeholderTextColor={COLORS.textMuted}
						value={detail}
						onChangeText={setDetail}
						multiline
						maxLength={200}
					/>
					<View style={reportStyles.actions}>
						<TouchableOpacity style={reportStyles.cancelButton} onPress={() => { setReason(null); setDetail(''); onClose(); }}>
							<Text style={reportStyles.cancelText}>キャンセル</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[reportStyles.sendButton, (!reason || sending) && { opacity: 0.5 }]}
							onPress={handleSend}
							disabled={!reason || sending}
						>
							{sending
								? <ActivityIndicator size="small" color={COLORS.background} />
								: <Text style={reportStyles.sendText}>通報する</Text>}
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const reportStyles = StyleSheet.create({
	overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
	sheet:    { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, width: '100%' },
	title:    { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
	subtitle: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 16 },
	reasonRow: {
		flexDirection: 'row', alignItems: 'center', gap: 10,
		paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
	},
	reasonRowSelected: { backgroundColor: 'transparent' },
	reasonText:        { color: COLORS.text, fontSize: 14 },
	input: {
		backgroundColor: COLORS.surfaceLight, color: COLORS.text, borderRadius: 10,
		padding: 12, fontSize: 14, minHeight: 64, textAlignVertical: 'top',
		borderWidth: 1, borderColor: COLORS.border, marginTop: 12, marginBottom: 16,
	},
	actions:      { flexDirection: 'row', gap: 10 },
	cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
	cancelText:   { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
	sendButton:   { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: COLORS.error, alignItems: 'center' },
	sendText:     { color: COLORS.text, fontSize: 14, fontWeight: '700' },
});

// -----------------------------------------------------------
// メイン画面
// -----------------------------------------------------------

export default function UserProfileScreen() {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { userId } = route.params as RouteParams;
  const { user: currentUser, profile: currentProfile } = useAuthStore();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [castProfile, setCastProfile] = useState<CastProfile | null>(null);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [favoritingAction, setFavoritingAction] = useState(false);
  const [tonightModalVisible, setTonightModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [userProfile, timelineData] = await Promise.all([
        getProfile(userId),
        getMyTimelines(userId),
      ]);
      setTargetUser(userProfile);
      setTimelines(timelineData);

      // キャストプロフィール取得
      if (userProfile.role === 'cast') {
        const { data } = await supabase
          .from('cast_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        setCastProfile(data as CastProfile | null);
      }

      // お気に入り確認
      const fav = await isFavorite(currentUser.id, userId);
      setFavorited(fav);

      // 足跡を残す（自分自身は除く）
      if (currentUser.id !== userId) {
        await addFootprint(currentUser.id, userId);
      }
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLike = async () => {
    if (!currentUser || liking) return;
    setLiking(true);
    try {
      const { matched } = await sendLike(currentUser.id, userId);
      setLiked(true);
      if (matched) {
        Alert.alert('マッチング成立！', 'マッチングしました！チャットを始めましょう。');
      } else {
        Alert.alert('いいね！', 'いいねを送りました。');
      }
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'いいねに失敗しました。');
    } finally {
      setLiking(false);
    }
  };

  const handleFavorite = async () => {
    if (!currentUser || favoritingAction) return;
    setFavoritingAction(true);
    try {
      if (favorited) {
        await removeFavorite(currentUser.id, userId);
        setFavorited(false);
      } else {
        await addFavorite(currentUser.id, userId);
        setFavorited(true);
      }
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '操作に失敗しました。');
    } finally {
      setFavoritingAction(false);
    }
  };

  const navigation = useNavigation();

  const handleBlock = useCallback(() => {
    if (!currentUser) return;
    Alert.alert(
      'ブロックしますか？',
      'ブロックすると相手はあなたのプロフィールや投稿を閲覧できなくなります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ブロック',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(currentUser.id, userId);
              Alert.alert('ブロックしました', '', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('エラー', 'ブロックに失敗しました。');
            }
          },
        },
      ],
    );
  }, [currentUser, userId, navigation]);

  useEffect(() => {
    if (currentUser?.id === userId) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            Alert.alert('', '', [
              { text: '通報する', onPress: () => setReportModalVisible(true) },
              { text: 'ブロックする', style: 'destructive', onPress: handleBlock },
              { text: 'キャンセル', style: 'cancel' },
            ])
          }
          style={{ paddingRight: 16 }}
        >
          <MaterialIcons name="more-vert" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [userId, currentUser, navigation, handleBlock]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!targetUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>ユーザーが見つかりませんでした。</Text>
      </View>
    );
  }

  const isCustomer = currentProfile?.role === 'customer';
  const isCastTarget = targetUser.role === 'cast';

  return (
    <>
      <FlatList
        data={timelines}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => <GridItem item={item} />}
        ListHeaderComponent={
          <View>
            {/* プロフィールヘッダー */}
            <View style={styles.profileHeader}>
              {targetUser.avatar_url ? (
                <Image source={{ uri: targetUser.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <MaterialIcons name="person" size={40} color={COLORS.textMuted} />
                </View>
              )}
              <View style={styles.profileMeta}>
                <Text style={styles.nickname}>{targetUser.nickname}</Text>
                {isCastTarget && castProfile && (
                  <WorkStatusBadge status={castProfile.work_status} />
                )}
                {isCastTarget && castProfile?.shop_name ? (
                  <Text style={styles.shopName}>
                    <MaterialIcons name="store" size={12} color={COLORS.textSecondary} />{' '}
                    {castProfile.shop_name}
                  </Text>
                ) : null}
                {isCastTarget && castProfile?.shop_address ? (
                  <Text style={styles.shopAddress}>
                    <MaterialIcons name="place" size={12} color={COLORS.textMuted} />{' '}
                    {castProfile.shop_address}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* 自己紹介 */}
            {targetUser.bio ? (
              <Text style={styles.bio}>{targetUser.bio}</Text>
            ) : null}

            {/* 料金情報（キャストのみ） */}
            {isCastTarget && castProfile?.price_info ? (
              <View style={styles.priceInfo}>
                <MaterialIcons name="attach-money" size={16} color={COLORS.gold} />
                <Text style={styles.priceInfoText}>{castProfile.price_info}</Text>
              </View>
            ) : null}

            {/* アクションボタン（自分以外） */}
            {currentUser?.id !== userId && (
              <View style={styles.actionRow}>
                {/* いいねボタン */}
                <TouchableOpacity
                  style={[styles.actionButton, liked && styles.actionButtonActive]}
                  onPress={handleLike}
                  disabled={liked || liking}
                >
                  {liking ? (
                    <ActivityIndicator size="small" color={liked ? COLORS.background : COLORS.error} />
                  ) : (
                    <MaterialIcons
                      name={liked ? 'favorite' : 'favorite-border'}
                      size={22}
                      color={liked ? COLORS.background : COLORS.error}
                    />
                  )}
                  <Text style={[styles.actionButtonText, liked && styles.actionButtonTextActive]}>
                    {liked ? 'いいね済み' : 'いいね'}
                  </Text>
                </TouchableOpacity>

                {/* お気に入りボタン */}
                <TouchableOpacity
                  style={[styles.actionButton, favorited && styles.actionButtonFav]}
                  onPress={handleFavorite}
                  disabled={favoritingAction}
                >
                  {favoritingAction ? (
                    <ActivityIndicator size="small" color={favorited ? COLORS.background : COLORS.gold} />
                  ) : (
                    <MaterialIcons
                      name={favorited ? 'star' : 'star-border'}
                      size={22}
                      color={favorited ? COLORS.background : COLORS.gold}
                    />
                  )}
                  <Text style={[styles.actionButtonText, favorited && styles.actionButtonTextActive]}>
                    {favorited ? 'お気に入り済み' : 'お気に入り'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 今夜行ける？ボタン（顧客かつキャストのプロフィール） */}
            {isCustomer && isCastTarget && currentUser?.id !== userId && (
              <TouchableOpacity
                style={styles.tonightButton}
                onPress={() => setTonightModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialIcons name="nightlight-round" size={20} color={COLORS.background} />
                <Text style={styles.tonightButtonText}>今夜行ける？</Text>
              </TouchableOpacity>
            )}

            {/* グリッドヘッダー */}
            {timelines.length > 0 && (
              <View style={styles.gridHeader}>
                <MaterialIcons name="grid-on" size={18} color={COLORS.textSecondary} />
                <Text style={styles.gridHeaderText}>投稿</Text>
              </View>
            )}

            {timelines.length === 0 && (
              <View style={styles.emptyTimeline}>
                <MaterialIcons name="dynamic-feed" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTimelineText}>まだ投稿がありません</Text>
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        style={styles.container}
      />

      {isCastTarget && (
        <TonightModal
          visible={tonightModalVisible}
          castId={userId}
          onClose={() => setTonightModalVisible(false)}
        />
      )}
      <ReportModal
        visible={reportModalVisible}
        targetUserId={userId}
        onClose={() => setReportModalVisible(false)}
      />
    </>
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
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  avatarFallback: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  nickname: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopName: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  shopAddress: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceInfoText: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  actionButtonFav: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: COLORS.background,
  },
  tonightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    gap: 8,
    elevation: 4,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tonightButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  gridHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 0.5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridVideo: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridText: {
    backgroundColor: COLORS.surface,
    padding: 6,
    justifyContent: 'center',
  },
  gridTextPreview: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTimelineText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
