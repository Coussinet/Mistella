// ============================================================
// Mistella - ProfileActionBar
// プロフィール画面下部の固定ガラスアクションバー。
// - iOS: expo-blur / Android: 半透明背景
// - いいね・お気に入り・メッセージ・「今夜行ける？」を集約
// - タップで tapMedium() + reanimated スプリングのスケールバースト
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { tapMedium } from '@/utils/haptics';

/** コンテンツ下部パディング算出用のバー高さ（マージン込みの目安） */
export const ACTION_BAR_HEIGHT = 88;

// -----------------------------------------------------------
// スケールバースト付きアイコンボタン
// -----------------------------------------------------------

interface BurstIconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function BurstIconButton({
  icon,
  label,
  color,
  active = false,
  disabled = false,
  onPress,
}: BurstIconButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    tapMedium();
    // reanimated の shared value への代入は正規の使い方（ルールの誤検知）
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSequence(
      withSpring(1.35, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 14, stiffness: 260 }),
    );
    onPress();
  };

  const tint = disabled ? COLORS.textMuted : color;

  return (
    <Pressable
      style={styles.iconAction}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Animated.View
        style={[
          styles.iconCircle,
          active && { backgroundColor: tint, borderColor: tint },
          animatedStyle,
        ]}
      >
        <MaterialIcons name={icon} size={24} color={active ? COLORS.background : tint} />
      </Animated.View>
      <Text style={[styles.iconLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

// -----------------------------------------------------------
// アクションバー本体
// -----------------------------------------------------------

interface ProfileActionBarProps {
  liked: boolean;
  liking: boolean;
  favorited: boolean;
  favoriting: boolean;
  /** 「今夜行ける？」を表示するか（顧客→キャストのみ） */
  showTonight: boolean;
  /** マッチ済みか（メッセージボタンの活性） */
  matched: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onTonight: () => void;
  onMessage: () => void;
}

export default function ProfileActionBar({
  liked,
  liking,
  favorited,
  favoriting,
  showTonight,
  matched,
  onLike,
  onFavorite,
  onTonight,
  onMessage,
}: ProfileActionBarProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={styles.row}>
      <BurstIconButton
        icon={liked ? 'favorite' : 'favorite-border'}
        label={liked ? 'いいね済み' : 'いいね'}
        color={COLORS.error}
        active={liked}
        disabled={liked || liking}
        onPress={onLike}
      />
      <BurstIconButton
        icon={favorited ? 'star' : 'star-border'}
        label={favorited ? 'お気に入り済み' : 'お気に入り'}
        color={COLORS.gold}
        active={favorited}
        disabled={favoriting}
        onPress={onFavorite}
      />
      <BurstIconButton
        icon="chat-bubble-outline"
        label="メッセージ"
        color={COLORS.neonBlue}
        disabled={!matched}
        onPress={onMessage}
      />
      {showTonight && (
        <BurstIconButton
          icon="nightlight-round"
          label="今夜行ける？"
          color={COLORS.gold}
          onPress={onTonight}
        />
      )}
    </View>
  );

  return (
    <View
      style={[styles.container, { bottom: Math.max(insets.bottom, SPACING.sm) }]}
      pointerEvents="box-none"
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="dark" style={[styles.bar, styles.barBlur]}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.bar, styles.barSolid]}>{content}</View>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
  },
  bar: {
    borderRadius: RADIUS.pill,
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  barBlur: {
    backgroundColor: COLORS.glassBg,
  },
  barSolid: {
    backgroundColor: COLORS.glassBgSolid,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  iconAction: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 52,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
