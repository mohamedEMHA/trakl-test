import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';

const AnimatedPressable = createAnimatedComponent(Pressable);

/**
 * Distinct-but-coherent press feedback treatments. Each surface type gets the
 * motion that fits it: chunky buttons dip firmly, cards settle softly, chips
 * pop quickly, tab/icon taps give a light bounce.
 */
export type PressFeedback = 'button' | 'card' | 'chip' | 'tab' | 'icon';

type FeedbackSpec = {
  /** Scale while pressed. */
  scale: number;
  /** Opacity while pressed. */
  opacity: number;
  /** Spring config for the press-down. */
  spring: { damping: number; stiffness: number; mass: number };
};

const SPECS: Record<PressFeedback, FeedbackSpec> = {
  // Solid CTA — a firm, confident dip.
  button: { scale: 0.96, opacity: 0.96, spring: { damping: 15, stiffness: 320, mass: 0.7 } },
  // Large surface — gentle, slow settle so big areas don't feel jumpy.
  card: { scale: 0.975, opacity: 0.94, spring: { damping: 20, stiffness: 240, mass: 0.9 } },
  // Pill filter — quick, snappy pop.
  chip: { scale: 0.92, opacity: 0.9, spring: { damping: 12, stiffness: 400, mass: 0.5 } },
  // Bottom-nav item — subtle, restrained.
  tab: { scale: 0.9, opacity: 1, spring: { damping: 14, stiffness: 380, mass: 0.6 } },
  // Standalone icon / FAB — lively bounce.
  icon: { scale: 0.88, opacity: 1, spring: { damping: 11, stiffness: 420, mass: 0.5 } },
};

/** The haptic each feedback variant fires on press-in (web/Expo-safe no-op). */
const HAPTIC: Record<PressFeedback, () => void> = {
  button: haptics.tapMedium,
  card: haptics.selection,
  chip: haptics.tapLight,
  tab: haptics.selection,
  icon: haptics.tapLight,
};

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children?: ReactNode;
  feedback?: PressFeedback;
  /** Set false to suppress the haptic for this element (motion only). */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Drop-in Pressable that animates scale + opacity on the UI thread using
 * Reanimated springs, so press feedback feels physical instead of a static
 * style flip. Pick the `feedback` variant that matches the element.
 */
export function PressableScale({
  children,
  feedback = 'button',
  haptic = true,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const spec = SPECS[feedback];
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(1 - (1 - spec.scale) * progress.value, spec.spring),
      },
    ],
    opacity: withTiming(1 - (1 - spec.opacity) * progress.value, { duration: 90 }),
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          progress.value = 1;
          if (haptic) HAPTIC[feedback]();
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        progress.value = 0;
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
