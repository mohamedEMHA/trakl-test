import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTrackerAccents } from '@/lib/theme';
import { haptics } from '@/lib/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PIECE_COUNT = 70;

type PieceConfig = {
  startX: number;
  driftX: number;
  fallY: number;
  rotate: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  radius: number;
};

function Piece({ config }: { config: PieceConfig }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      config.delay,
      withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [t, config.delay, config.duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: config.startX + config.driftX * t.value },
      { translateY: config.fallY * t.value },
      { rotate: `${config.rotate * t.value}deg` },
    ],
    opacity: t.value > 0.85 ? 1 - (t.value - 0.85) / 0.15 : 1,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -20,
          width: config.size,
          height: config.size * 1.4,
          backgroundColor: config.color,
          borderRadius: config.radius,
        },
        style,
      ]}
    />
  );
}

type Props = {
  /** When true, a burst plays once. Toggle false→true to replay. */
  show: boolean;
  /** Called after the burst finishes so the parent can reset its trigger. */
  onDone?: () => void;
};

/**
 * Lightweight full-screen confetti burst. No native deps — pure Reanimated.
 * Mount it near the root of a screen and flip `show` to true to celebrate.
 */
export function Confetti({ show, onDone }: Props) {
  const accents = useTrackerAccents();

  const palette = useMemo(
    () => [
      accents.habits,
      accents.finance,
      accents.goals,
      accents.sleep,
      accents.fitness,
      accents.tasks,
    ],
    [accents],
  );

  const pieces = useMemo<PieceConfig[]>(() => {
    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      const startX = Math.random() * SCREEN_W;
      const size = 6 + Math.random() * 6;
      return {
        startX,
        driftX: (Math.random() - 0.5) * 160,
        fallY: SCREEN_H * (0.7 + Math.random() * 0.35),
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 180,
        duration: 1100 + Math.random() * 700,
        size,
        radius: Math.random() > 0.5 ? size / 2 : 2,
        color: palette[i % palette.length],
      };
    });
  }, [palette]);

  useEffect(() => {
    if (!show) return undefined;
    haptics.notifySuccess();
    const timer = setTimeout(() => onDone?.(), 2100);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((config, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Piece key={i} config={config} />
      ))}
    </View>
  );
}
