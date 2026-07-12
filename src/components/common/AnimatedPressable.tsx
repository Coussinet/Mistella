// ============================================================
// Mistella - AnimatedPressable 共通コンポーネント
// 押下時にスプリングで縮小するプレスフィードバック付き Pressable。
// ============================================================

import React from 'react';
import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  /** 押下時の縮小率（デフォルト 0.97） */
  pressScale?: number;
  children?: React.ReactNode;
}

export default function AnimatedPressable({
  style,
  pressScale = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        // reanimated の shared value への代入は正規の使い方（ルールの誤検知）
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(pressScale, { damping: 20, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
