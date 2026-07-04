import { useEffect } from 'react';
import { View, type ViewStyle, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

/** A single shimmering placeholder block. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: withAlpha(colors.muted, 0.18),
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton matching the app's surface cards. */
export function SkeletonCard({ height = 88 }: { height?: number }) {
  const colors = useColors();
  return (
    <View
      style={{
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 16,
        justifyContent: 'center',
        gap: 10,
      }}
    >
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={12} />
    </View>
  );
}

/** A full home-screen placeholder shown during store hydration. */
export function HomeSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={36} height={36} radius={999} />
        <Skeleton width={160} height={20} />
      </View>
      <SkeletonCard height={150} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SkeletonCard height={104} />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonCard height={104} />
        </View>
      </View>
      <SkeletonCard height={72} />
      <SkeletonCard height={72} />
    </View>
  );
}
