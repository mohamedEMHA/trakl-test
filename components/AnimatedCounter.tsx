import { useEffect, useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { ClashText } from './Typography';

type Props = {
  /** The target numeric value to count up to. */
  value: number;
  /** Decimal places to render (default 0). */
  decimals?: number;
  /** Animation duration in ms (default 900). */
  duration?: number;
  /** Text prefix, e.g. a currency symbol. */
  prefix?: string;
  /** Text suffix, e.g. a unit. */
  suffix?: string;
  /** Font weight for ClashText. */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  style?: object;
  numberOfLines?: number;
  /** Group thousands with a separator (uses Intl). */
  group?: boolean;
};

/**
 * A number that animates smoothly from 0 up to `value` on mount and whenever
 * `value` changes. Drives the count on the UI thread and mirrors it to React
 * state at a throttled cadence so the rendered text stays readable.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  duration = 900,
  prefix = '',
  suffix = '',
  weight = 'bold',
  color,
  style,
  numberOfLines,
  group = false,
}: Props) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, progress]);

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(setDisplay)(current);
    },
  );

  const rounded = Number(display.toFixed(decimals));
  const text = group
    ? rounded.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : rounded.toFixed(decimals);

  return (
    <ClashText weight={weight} color={color} style={style} numberOfLines={numberOfLines}>
      {prefix}
      {text}
      {suffix}
    </ClashText>
  );
}
