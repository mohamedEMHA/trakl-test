import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { type TrackerInsight } from '@/lib/stats';
import { type TrackerMeta, withAlpha } from '@/lib/trackers';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { Card } from './Card';
import { PressableScale } from './PressableScale';
import { ProgressRing } from './Progress';
import { Sparkline } from './Sparkline';
import { Caption, ClashText, InterText } from './Typography';

type CompactProps = {
  tracker: TrackerMeta;
  stat: string;
  name?: string;
  onPress?: () => void;
};

/** 140x100 horizontal-scroll tracker card (Home). */
export function TrackerMiniCard({ tracker, stat, name, onPress }: CompactProps) {
  const Icon = tracker.icon;
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents[tracker.key];
  return (
    <PressableScale feedback="card" onPress={onPress}>
      <View
        style={{
          width: 140,
          height: 104,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 0,
        }}
        className="justify-between rounded-2xl p-4"
      >
        <Icon size={22} color={accent} strokeWidth={1.5} />
        <View className="gap-0.5">
          <Caption fit>{name ?? tracker.name}</Caption>
          <ClashText weight="bold" style={{ fontSize: 22 }}>
            {stat}
          </ClashText>
        </View>
      </View>
    </PressableScale>
  );
}

type GridProps = {
  tracker: TrackerMeta;
  stat: string;
  name?: string;
  insight: TrackerInsight;
  pinned?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

/** 2-column grid tracker card (Trackers hub) — gradient + visual + trend. */
export function TrackerGridCard({
  tracker,
  stat,
  name,
  insight,
  pinned,
  onPress,
  onLongPress,
}: GridProps) {
  const Icon = tracker.icon;
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents[tracker.key];

  return (
    <PressableScale
      feedback="card"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      className="flex-1"
    >
      <Card padded={false} className="flex-1 overflow-hidden" style={{ height: 188 }}>
        <LinearGradient
          colors={[withAlpha(accent, 0.14), withAlpha(accent, 0.02)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-between p-4">
            {/* Header: icon + (pin/attention badge) */}
            <View className="flex-row items-start justify-between">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: withAlpha(accent, 0.16),
                }}
                className="items-center justify-center"
              >
                <Icon size={20} color={accent} strokeWidth={1.6} />
              </View>
              <View className="items-end gap-1">
                {pinned ? (
                  <View
                    style={{ backgroundColor: withAlpha(accent, 0.18) }}
                    className="rounded-full px-2 py-0.5"
                  >
                    <Caption color={accent} style={{ fontSize: 10, letterSpacing: 0.3 }}>
                      ★
                    </Caption>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Visual: progress ring / sparkline / count */}
            <View className="items-center justify-center" style={{ height: 44 }}>
              {insight.visual === 'progress' ? (
                <ProgressRing
                  size={44}
                  stroke={5}
                  progress={insight.progress}
                  color={accent}
                  trackColor={withAlpha(accent, 0.12)}
                  label={`${insight.progress}`}
                />
              ) : insight.visual === 'sparkline' ? (
                <Sparkline data={insight.series} color={accent} width={120} height={40} />
              ) : (
                <View className="w-full flex-row items-end justify-between" style={{ height: 36 }}>
                  {insight.series.map((v, i) => {
                    const max = Math.max(1, ...insight.series);
                    const h = v === 0 ? 3 : Math.max(5, (v / max) * 34);
                    return (
                      <View
                        // Fixed-length positional bars; index is stable identity.
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        style={{
                          width: 6,
                          height: h,
                          borderRadius: 3,
                          backgroundColor: v === 0 ? withAlpha(accent, 0.12) : accent,
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>

            {/* Footer: name + stat */}
            <View className="gap-1">
              <ClashText weight="medium" style={{ fontSize: 16 }} numberOfLines={1}>
                {name ?? tracker.name}
              </ClashText>
              <InterText color={colors.muted} style={{ fontSize: 12 }} numberOfLines={1}>
                {stat}
              </InterText>
            </View>
          </View>
        </LinearGradient>
      </Card>
    </PressableScale>
  );
}
