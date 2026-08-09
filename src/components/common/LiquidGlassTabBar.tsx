// ============================================================
// Mistella - Liquid Glass Tab Bar parts
// iOS 26+: native GlassView / other platforms: expo-blur fallback
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { RADIUS, withAlpha } from '@/constants/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

function supportsNativeLiquidGlass() {
  return Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
}

/** タブバー全面のガラス面。非対応端末ではBlurViewへ自然にフォールバックする。 */
export function LiquidGlassTabBackground() {
  if (supportsNativeLiquidGlass()) {
    return (
      <GlassView
        glassEffectStyle="regular"
        tintColor={withAlpha(COLORS.background, 0.42)}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return (
    <BlurView intensity={62} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.fallbackTint} />
    </BlurView>
  );
}

/** 選択時に浮上し、光が流れるLiquid Glass風のタブアイコン。 */
export function LiquidGlassTabIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);
  const glint = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 220, mass: 0.7 });
    if (focused) {
      glint.value = 0;
      glint.value = withSequence(
        withTiming(1, { duration: 380 }),
        withTiming(0, { duration: 120 }),
      );
    }
  }, [focused, glint, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -3]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
    ],
  }));
  const glintStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(glint.value, [0, 1], [-34, 34]) }, { rotate: '18deg' }],
  }));

  return (
    <Animated.View style={[styles.iconShell, animatedStyle]}>
      {focused ? (
        supportsNativeLiquidGlass() ? (
          <GlassView
            isInteractive
            glassEffectStyle="clear"
            tintColor={withAlpha(COLORS.gold, 0.24)}
            style={styles.activeGlass}
          />
        ) : (
          <View style={[styles.activeGlass, styles.activeFallback]} />
        )
      ) : null}
      {focused ? <Animated.View pointerEvents="none" style={[styles.glint, glintStyle]} /> : null}
      <MaterialIcons name={name} size={23} color={color} style={styles.icon} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(COLORS.background, 0.54),
  },
  iconShell: {
    width: 46,
    height: 31,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activeGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.pill,
  },
  activeFallback: {
    backgroundColor: withAlpha(COLORS.gold, 0.17),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.goldLight, 0.3),
  },
  glint: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    width: 12,
    backgroundColor: withAlpha(COLORS.text, 0.2),
  },
  icon: {
    textShadowColor: withAlpha(COLORS.background, 0.7),
    textShadowRadius: 5,
  },
});
