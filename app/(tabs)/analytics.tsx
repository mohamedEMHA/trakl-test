import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarRange, CheckSquare, ChevronRight, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AdBanner } from '@/components/AdBanner';
import { BarChart, HBarChart } from '@/components/Charts';
import { Card } from '@/components/Card';
import { PressableScale } from '@/components/PressableScale';
import { SemiGauge } from '@/components/Progress';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, InterText } from '@/components/Typography';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { useTrakl } from '@/lib/store';
import { bestStreak, lifeScore, weekCount } from '@/lib/stats';

const PERIOD_KEYS = ['day', 'week', 'month', 'year'] as const;

type Period = (typeof PERIOD_KEYS)[number];

function scoreBand(score: number, t: TFunction): string {
  if (score >= 80) return t('analyticsScreen.excellent');
  if (score >= 65) return t('analyticsScreen.good');
  if (score >= 50) return t('analyticsScreen.fair');
  return t('analyticsScreen.low');
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Time buckets (oldest -> newest) for the selected period. */
function periodBuckets(
  period: Period,
  dayLabels: string[],
  monthLabels: string[],
): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];

  if (period === 'day') {
    // Last 24 hours, split into 4 rolling six-hour blocks (oldest -> newest).
    // Anchor to the current hour so the most recent block ends "now".
    const anchor = new Date(now);
    anchor.setMinutes(0, 0, 0);
    anchor.setHours(anchor.getHours() + 1); // end of the newest block
    for (let i = 4; i >= 1; i--) {
      const start = new Date(anchor);
      start.setHours(start.getHours() - i * 6);
      const end = new Date(anchor);
      end.setHours(end.getHours() - (i - 1) * 6);
      const hh = ((start.getHours() % 24) + 24) % 24;
      buckets.push({ label: `${String(hh).padStart(2, '0')}h`, start, end });
    }
  } else if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(now);
      day.setDate(day.getDate() - i);
      const end = new Date(day);
      end.setDate(end.getDate() + 1);
      buckets.push({ label: dayLabels[(day.getDay() + 6) % 7], start: day, end });
    }
  } else if (period === 'month') {
    for (let i = 3; i >= 0; i--) {
      const start = startOfDay(now);
      start.setDate(start.getDate() - (i + 1) * 7 + 1);
      const end = startOfDay(now);
      end.setDate(end.getDate() - i * 7 + 1);
      buckets.push({ label: `W${4 - i}`, start, end });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ label: monthLabels[start.getMonth()], start, end });
    }
  }
  return buckets;
}

function rangeLabel(period: Period, t: TFunction): string {
  if (period === 'day') return t('analyticsScreen.rangeDay');
  if (period === 'week') return t('analyticsScreen.rangeWeek');
  if (period === 'month') return t('analyticsScreen.rangeMonth');
  return t('analyticsScreen.rangeYear');
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const router = useRouter();
  const [period, setPeriod] = useState<(typeof PERIOD_KEYS)[number]>('week');
  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const sleep = useTrakl((s) => s.sleep);
  const goals = useTrakl((s) => s.goals);
  const transactions = useTrakl((s) => s.transactions);
  const monthlyBudget = useTrakl((s) => s.monthlyBudget);
  const enabledTrackers = useTrakl((s) => s.enabledTrackers);

  const scoreValue = lifeScore({
    habits,
    tasks,
    sleep,
    goals,
    transactions,
    monthlyBudget,
    enabledTrackers,
  });
  const hasScore = scoreValue !== null;
  const score = scoreValue ?? 0;
  const tasksDone = tasks.filter((tk) => tk.done).length;

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- i18next returnObjects is typed as string but resolves to an array at runtime
  const dayInitials = t('analyticsScreen.dayInitials', {
    returnObjects: true,
  }) as unknown as string[];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- i18next returnObjects is typed as string but resolves to an array at runtime
  const monthInitials = t('analyticsScreen.monthInitials', {
    returnObjects: true,
  }) as unknown as string[];

  const buckets = periodBuckets(period, dayInitials, monthInitials);

  // Finance: expenses summed per bucket for the selected period.
  const financeBars = buckets.map((b) => {
    const spent = transactions
      .filter((tx) => tx.kind === 'expense')
      .filter((tx) => {
        const d = new Date(tx.date);
        return d >= b.start && d < b.end;
      })
      .reduce((s, tx) => s + tx.amount, 0);
    return { label: b.label, value: Math.round(spent) };
  });

  // Sleep: average hours per bucket (0 when no nights recorded in the bucket).
  const sleepBars = buckets.map((b) => {
    const nights = sleep.filter((e) => {
      const d = new Date(e.date);
      return d >= b.start && d < b.end;
    });
    const hours = nights.length
      ? nights.reduce((s, e) => s + e.durationMinutes, 0) / nights.length / 60
      : 0;
    return { label: b.label, value: Math.round(hours * 10) / 10 };
  });

  const habitBars = habits.slice(0, 6).map((h) => ({
    label: h.name,
    value: Math.round((weekCount(h) / 7) * 100),
    color: h.color,
  }));

  const spendingTitle = `${t('analyticsScreen.spending')} · ${rangeLabel(period, t)}`;
  const sleepTitle = `${t('analyticsScreen.sleep')} · ${rangeLabel(period, t)}`;

  return (
    <Screen>
      <View className="flex-1">
        <View className="pt-safe">
          <ScreenHeader title={t('analytics.title')} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Period tabs */}
          <View className="flex-row gap-5 pt-1">
            {PERIOD_KEYS.map((p) => {
              const active = period === p;
              return (
                <InterText
                  key={p}
                  weight={active ? 'semibold' : 'medium'}
                  color={active ? colors.text : colors.muted}
                  onPress={() => setPeriod(p)}
                  style={{
                    fontSize: 14,
                    paddingBottom: 6,
                    borderBottomWidth: 2,
                    borderBottomColor: active ? colors.text : 'transparent',
                  }}
                >
                  {t(`analytics.${p}`)}
                </InterText>
              );
            })}
          </View>

          {/* Weekly review entry */}
          <PressableScale feedback="card" onPress={() => router.push('/weekly-review')}>
            <Card
              padded={false}
              className="flex-row items-center gap-3 p-4"
              style={{ backgroundColor: withAlpha(accents.goals, 0.1) }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: withAlpha(accents.goals, 0.16),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarRange size={20} color={accents.goals} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <InterText weight="semibold" style={{ fontSize: 15 }}>
                  {t('weekly.title')}
                </InterText>
                <InterText color={colors.muted} style={{ fontSize: 13, marginTop: 1 }}>
                  {t('weekly.entrySub')}
                </InterText>
              </View>
              <ChevronRight size={20} color={colors.muted} strokeWidth={1.8} />
            </Card>
          </PressableScale>

          {/* Life score gauge */}
          <Card elevated className="items-center pt-5 pb-2">
            <Caption>{t('home.lifeScore')}</Caption>
            <View className="mt-2">
              <SemiGauge
                progress={score}
                centerValue={hasScore ? `${score}` : t('homeExtra.scoreEmpty')}
                centerLabel={hasScore ? scoreBand(score, t) : t('homeExtra.progressEmpty')}
              />
            </View>
          </Card>

          {/* Stat pills */}
          <View className="flex-row gap-3">
            <Card className="flex-1 flex-row items-center gap-2">
              <Zap size={18} color={colors.text} strokeWidth={1.5} />
              <View className="flex-1">
                <InterText weight="semibold" style={{ fontSize: 16 }}>
                  {t('analyticsScreen.streakDaysShort', { count: bestStreak(habits) })}
                </InterText>
                <Caption fit>{t('analyticsScreen.bestStreak')}</Caption>
              </View>
            </Card>
            <Card className="flex-1 flex-row items-center gap-2">
              <CheckSquare size={18} color={colors.text} strokeWidth={1.5} />
              <View className="flex-1">
                <InterText weight="semibold" style={{ fontSize: 16 }}>
                  {tasksDone}
                </InterText>
                <Caption fit>{t('analyticsScreen.tasksDone')}</Caption>
              </View>
            </Card>
          </View>

          {/* Finance */}
          <View>
            <SectionLabel>{spendingTitle}</SectionLabel>
            <Card>
              <BarChart data={financeBars} color={colors.destructive} unit="" showValue />
            </Card>
          </View>

          {/* Habits */}
          <View>
            <SectionLabel>{t('analyticsScreen.habitConsistency')}</SectionLabel>
            <Card>
              {habitBars.length > 0 ? (
                <HBarChart data={habitBars} />
              ) : (
                <InterText color={colors.muted} style={{ fontSize: 14 }}>
                  {t('analyticsScreen.noHabits')}
                </InterText>
              )}
            </Card>
          </View>

          {/* Sleep */}
          <View>
            <SectionLabel>{sleepTitle}</SectionLabel>
            <Card>
              <BarChart data={sleepBars} color={accents.sleep} unit="h" showValue />
            </Card>
          </View>
        </ScrollView>
        <AdBanner />
      </View>
    </Screen>
  );
}
