import { View } from 'react-native';

import { useColors } from '@/lib/theme';
import { Caption, InterText } from './Typography';

type Bar = { label: string; value: number };

type BarChartProps = {
  data: Bar[];
  color?: string;
  height?: number;
  unit?: string;
  showValue?: boolean;
};

/** Simple vertical bar chart for weekly stats. */
export function BarChart({ data, color, height = 120, unit, showValue }: BarChartProps) {
  const colors = useColors();
  const barColor = color ?? colors.text;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View className="flex-row items-end justify-between" style={{ height: height + 28 }}>
      {data.map((d, i) => {
        const h = d.value === 0 ? 3 : Math.max(6, (d.value / max) * height);
        return (
          <View
            // Chart bars are positional & fixed-length; labels can repeat
            // (e.g. Sat & Sun both "S"), so index is the stable identity.
            // eslint-disable-next-line react/no-array-index-key
            key={`${d.label}-${i}`}
            className="flex-1 items-center justify-end"
            style={{ gap: 6 }}
          >
            {showValue ? (
              <InterText weight="medium" color={colors.muted} style={{ fontSize: 10 }}>
                {d.value > 0 ? `${d.value}${unit ?? ''}` : ''}
              </InterText>
            ) : null}
            <View
              style={{
                width: '58%',
                height: h,
                backgroundColor: d.value === 0 ? colors.surface2 : barColor,
                borderRadius: 6,
              }}
            />
            <Caption color={colors.muted} style={{ fontSize: 10, letterSpacing: 0.4 }}>
              {d.label}
            </Caption>
          </View>
        );
      })}
    </View>
  );
}

type HBar = { label: string; value: number; color: string };

/** Horizontal labelled bars (per-habit / category). */
export function HBarChart({ data, suffix = '%' }: { data: HBar[]; suffix?: string }) {
  const colors = useColors();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View className="gap-3">
      {data.map((d, i) => (
        // Habit rows are positional & fixed-length; labels may repeat, so the
        // index is the stable identity here.
        // eslint-disable-next-line react/no-array-index-key
        <View key={`${d.label}-${i}`} className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <InterText weight="medium" style={{ fontSize: 13 }} numberOfLines={1}>
              {d.label}
            </InterText>
            <InterText weight="medium" color={colors.muted} style={{ fontSize: 12 }}>
              {d.value}
              {suffix}
            </InterText>
          </View>
          <View
            style={{ height: 8, borderRadius: 999, backgroundColor: colors.surface2 }}
            className="overflow-hidden"
          >
            <View
              style={{
                width: `${(d.value / max) * 100}%`,
                height: 8,
                borderRadius: 999,
                backgroundColor: d.color,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
