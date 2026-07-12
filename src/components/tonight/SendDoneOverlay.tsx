// ============================================================
// Mistella - 送信完了オーバーレイ
// チェックマークのスプリング出現 + ゴールドパーティクルの放射 +
// 成功ハプティクスで送信完了を演出する全画面表示。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { SHADOWS, SPACING } from '@/constants/theme';
import { success } from '@/utils/haptics';

// -----------------------------------------------------------
// パーティクル定義（チェックマークから放射状に散らす）
// -----------------------------------------------------------

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  color: string;
  star: boolean;
}

const PARTICLE_COUNT = 10;

const PARTICLES: ParticleConfig[] = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2 - Math.PI / 2,
    distance: i % 2 === 0 ? 104 : 76,
    size: i % 3 === 0 ? 14 : 8,
    color: i % 2 === 0 ? COLORS.gold : COLORS.goldLight,
    star: i % 3 === 0,
  }),
);

interface ParticleProps {
  config: ParticleConfig;
  progress: SharedValue<number>;
}

function Particle({ config, progress }: ParticleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: Math.cos(config.angle) * config.distance * p },
        { translateY: Math.sin(config.angle) * config.distance * p },
        { scale: interpolate(p, [0, 0.2, 1], [0.3, 1, 0.4]) },
        { rotate: `${p * 150}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.particleWrap, animatedStyle]}
    >
      {config.star ? (
        <MaterialIcons name="star" size={config.size} color={config.color} />
      ) : (
        <View
          style={{
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
            backgroundColor: config.color,
          }}
        />
      )}
    </Animated.View>
  );
}

// -----------------------------------------------------------
// SendDoneOverlay
// -----------------------------------------------------------

export default function SendDoneOverlay() {
  const checkScale = useSharedValue(0);
  const burst = useSharedValue(0);
  const textReveal = useSharedValue(0);

  useEffect(() => {
    success();
    checkScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    burst.value = withDelay(
      120,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
    );
    textReveal.value = withDelay(260, withTiming(1, { duration: 400 }));
  }, [checkScale, burst, textReveal]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textReveal.value,
    transform: [{ translateY: interpolate(textReveal.value, [0, 1], [8, 0]) }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {PARTICLES.map((config) => (
          <Particle
            key={`${config.angle}-${config.distance}`}
            config={config}
            progress={burst}
          />
        ))}
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <MaterialIcons name="check" size={52} color={COLORS.background} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.doneText}>送信しました！</Text>
        <Text style={styles.doneSubText}>キャストからの返信をお待ちください</Text>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  stage: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  textBlock: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  doneText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  doneSubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
