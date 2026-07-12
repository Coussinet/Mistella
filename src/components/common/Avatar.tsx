// ============================================================
// Mistella - 共通アバターコンポーネント
// ============================================================

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface AvatarProps {
  uri: string | null;
  size?: number;
  /** フォールバック用（頭文字表示） */
  nickname?: string;
  style?: ViewStyle;
  /** trueの場合は右下に緑のオンラインドットを表示 */
  isWorking?: boolean;
}

// -----------------------------------------------------------
// Avatar
// -----------------------------------------------------------

export default function Avatar({
  uri,
  size = 48,
  nickname,
  style,
  isWorking = false,
}: AvatarProps) {
  const dotSize = Math.max(10, Math.round(size * 0.22));
  const fontSize = Math.round(size * 0.38);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.wrapper, containerStyle, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, containerStyle]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          <Text style={[styles.initial, { fontSize }]}>
            {nickname ? nickname.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      )}

      {isWorking && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    backgroundColor: COLORS.surfaceLight,
  },
  fallback: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
});
