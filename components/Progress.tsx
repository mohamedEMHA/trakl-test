import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useColors } from '@/lib/theme';
import { ClashText, InterText } from './Typography';

type RingProps = {
  size?: number;
  stroke?: number;
  progress: number; // 0-100
  color?: string;
  trackColor?: string;
  label?: string;
};

/** Circular progress ring. */
export function ProgressRing({
  size = 60,
  stroke = 8,
  progress,
  color,
  trackColor,
  label,
}: RingProps) {
  const colors = useColors();
  const ringColor = color ?? colors.text;
  const ringTrack = trackColor ?? colors.border;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = c - (clamped / 100) * c;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label ? (
        <View className="absolute items-center justify-center">
          <ClashText weight="bold" style={{ fontSize: size * 0.28 }}>
            {label}
          </ClashText>
        </View>
      ) : null}
    </View>
  );
}

type BarProps = {
  progress: number; // 0-100
  color?: string;
  trackColor?: string;
  height?: number;
};

/** Horizontal progress bar. */
export function ProgressBar({ progress, color, trackColor, height = 8 }: BarProps) {
  const colors = useColors();
  const fill = color ?? colors.text;
  const track = trackColor ?? colors.surface2;
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View
      style={{ height, backgroundColor: track, borderRadius: 999 }}
      className="w-full overflow-hidden"
    >
      <View style={{ width: `${clamped}%`, height, backgroundColor: fill, borderRadius: 999 }} />
    </View>
  );
}

type SemiGaugeProps = {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  centerValue: string;
  centerLabel?: string;
};

/** Semicircular gauge used on Analytics. */
export function SemiGauge({
  progress,
  size = 220,
  stroke = 14,
  color,
  trackColor,
  centerValue,
  centerLabel,
}: SemiGaugeProps) {
  const colors = useColors();
  const arcColor = color ?? colors.text;
  const arcTrack = trackColor ?? colors.border;
  const r = (size - stroke) / 2;
  const half = Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = half - (clamped / 100) * half;
  const height = size / 2 + stroke;
  return (
    <View style={{ width: size, height }} className="items-center justify-end">
      <Svg width={size} height={height}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={arcTrack}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${half} ${half}`}
          transform={`rotate(180 ${size / 2} ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${half} ${half * 2}`}
          strokeDashoffset={offset}
          transform={`rotate(180 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute bottom-1 items-center">
        <ClashText weight="bold" style={{ fontSize: 56 }}>
          {centerValue}
        </ClashText>
        {centerLabel ? (
          <InterText
            weight="medium"
            color={colors.muted}
            style={{ letterSpacing: 1, fontSize: 11 }}
          >
            {centerLabel.toUpperCase()}
          </InterText>
        ) : null}
      </View>
    </View>
  );
}
