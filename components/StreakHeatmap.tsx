import { useMemo } from 'react';
import { View } from 'react-native';

import { useColors, useTrackerAccents } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { habitDayLevel } from '@/lib/stats';
import { Caption, InterText } from './Typography';
import type { Habit } from '@/lib/types';

type Props = {
  habits: Habit[];
  /** Number of weeks to display (default 12). */
  weeks?: number;
  /** Localised single-letter weekday labels, starting Monday. */
  weekdayLabels?: [string, string, string, string, string, string, string];
  legendLess?: string;
  legendMore?: string;
};

const CELL = 14;
const GAP = 4;

/**
 * GitHub-style contribution heatmap of habit consistency. Each column is a
 * week, each row a weekday; cell intensity reflects the fraction of habits
 * completed that day.
 */
export function StreakHeatmap({
  habits,
  weeks = 12,
  weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  legendLess,
  legendMore,
}: Props) {
  const colors = useColors();
  const accents = useTrackerAccents();
  const accent = accents.habits;

  // Build a grid of [week][weekday] offsets ending today, aligned so the last
  // column's bottom-most populated cell is today.
  const columns = useMemo(() => {
    const today = new Date();
    // 0 = Monday ... 6 = Sunday
    const todayDow = (today.getDay() + 6) % 7;
    const totalCells = weeks * 7;
    // offset of the most recent Sunday-end-of-grid relative to today
    const trailing = 6 - todayDow;

    const grid: { offset: number; level: number; future: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: { offset: number; level: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const index = w * 7 + d;
        // offset relative to today (negative = past)
        const offset = index - (totalCells - 1) + trailing;
        const future = offset > 0;
        col.push({
          offset,
          future,
          level: future ? 0 : habitDayLevel(habits, offset),
        });
      }
      grid.push(col);
    }
    return grid;
  }, [habits, weeks]);

  function cellColor(level: number, future: boolean): string {
    if (future) return 'transparent';
    if (level <= 0) return colors.surface2;
    if (level <= 0.34) return withAlpha(accent, 0.35);
    if (level <= 0.67) return withAlpha(accent, 0.6);
    return accent;
  }

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {/* Weekday labels column */}
        <View style={{ marginRight: 6, justifyContent: 'space-between' }}>
          {weekdayLabels.map((label, i) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              style={{ height: CELL, marginBottom: GAP, justifyContent: 'center' }}
            >
              <Caption style={{ fontSize: 9 }}>{i % 2 === 0 ? label : ''}</Caption>
            </View>
          ))}
        </View>
        {/* Week columns */}
        <View style={{ flexDirection: 'row', gap: GAP, flex: 1, justifyContent: 'space-between' }}>
          {columns.map((col, w) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={w} style={{ gap: GAP }}>
              {col.map((cell, d) => (
                <View
                  // eslint-disable-next-line react/no-array-index-key
                  key={d}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 3,
                    backgroundColor: cellColor(cell.level, cell.future),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          marginTop: 12,
        }}
      >
        <InterText color={colors.muted} style={{ fontSize: 11 }}>
          {legendLess ?? 'Less'}
        </InterText>
        {[colors.surface2, withAlpha(accent, 0.35), withAlpha(accent, 0.6), accent].map((c, i) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: c }}
          />
        ))}
        <InterText color={colors.muted} style={{ fontSize: 11 }}>
          {legendMore ?? 'More'}
        </InterText>
      </View>
    </View>
  );
}
