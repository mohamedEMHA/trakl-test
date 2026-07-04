import { ScrollView, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckSquare,
  Flame,
  Minus,
  Moon,
  Sparkles,
  TrendingDown,
  Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AdBanner } from '@/components/AdBanner';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { StreakHeatmap } from '@/components/StreakHeatmap';
import { Caption, InterText } from '@/components/Typography';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { withAlpha } from '@/lib/trackers';
import { useTrakl } from '@/lib/store';
import { weeklyInsights, weeklyStats, type Insight } from '@/lib/weekly';

const TONE_ICON: Record<Insight['tone'], LucideIcon> = {
  positive: Sparkles,
  neutral: Minus,
  attention: TrendingDown,
};

export default function WeeklyReviewScreen() {
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();

  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const sleep = useTrakl((s) => s.sleep);
  const goals = useTrakl((s) => s.goals);
  const transactions = useTrakl((s) => s.transactions);

  const insights = useMemo(
    () => weeklyInsights({ habits, tasks, sleep, goals, transactions, t }),
    [habits, tasks, sleep, goals, transactions, t],
  );

  const stats = useMemo(
    () => weeklyStats({ habits, tasks, sleep, transactions }),
    [habits, tasks, sleep, transactions],
  );

  const toneColor = (tone: Insight['tone']): string =>
    tone === 'positive' ? colors.success : tone === 'attention' ? colors.destructive : colors.muted;

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- i18next returnObjects returns string per types but is an array at runtime
  const weekday = t('weekly.weekdays', { returnObjects: true }) as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  return (
    <Screen>
      <View className="pt-safe flex-1">
        <ScreenHeader
          title={t('weekly.title')}
          subtitle={
            <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 2 }}>
              {t('weekly.subtitle')}
            </InterText>
          }
          back
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stat grid */}
          <View className="px-5 pt-2">
            <View className="flex-row gap-3">
              <StatTile
                icon={Flame}
                accent={accents.habits}
                value={stats.bestStreak}
                suffix={t('weekly.daysShort')}
                label={t('weekly.streak')}
              />
              <StatTile
                icon={CheckSquare}
                accent={accents.tasks}
                value={stats.tasksDone}
                label={t('weekly.tasksDone')}
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <StatTile
                icon={Moon}
                accent={accents.sleep}
                value={stats.avgSleep}
                decimals={1}
                suffix="h"
                label={t('weekly.avgSleep')}
              />
              <StatTile
                icon={Wallet}
                accent={accents.finance}
                value={stats.spent}
                prefix="€"
                label={t('weekly.spent')}
              />
            </View>
          </View>

          {/* Insights digest */}
          <View className="px-5 pt-7">
            <SectionLabel>{t('weekly.highlights')}</SectionLabel>
            <View className="gap-2.5">
              {insights.map((insight, i) => {
                const Icon = TONE_ICON[insight.tone];
                const tint = toneColor(insight.tone);
                return (
                  <Animated.View
                    key={insight.id}
                    entering={FadeInDown.delay(i * 60)
                      .duration(360)
                      .springify()
                      .damping(18)}
                  >
                    <Card className="flex-row items-center gap-3 py-3.5">
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 999,
                          backgroundColor: withAlpha(tint, 0.12),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={17} color={tint} strokeWidth={1.8} />
                      </View>
                      <InterText style={{ fontSize: 14, flex: 1, lineHeight: 20 }}>
                        {insight.text}
                      </InterText>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Habit consistency heatmap */}
          <View className="px-5 pt-7">
            <SectionLabel>{t('weekly.consistency')}</SectionLabel>
            <Card>
              {habits.length === 0 ? (
                <InterText color={colors.muted} style={{ fontSize: 14 }}>
                  {t('weekly.noHabits')}
                </InterText>
              ) : (
                <StreakHeatmap
                  habits={habits}
                  weekdayLabels={weekday}
                  legendLess={t('weekly.less')}
                  legendMore={t('weekly.more')}
                />
              )}
            </Card>
          </View>

          {/* Footer summary */}
          <View className="px-5 pt-7">
            <Card className="items-center gap-1 py-6">
              <Caption>{t('weekly.totalHabitLogs')}</Caption>
              <AnimatedCounter
                value={stats.habitCompletions}
                weight="bold"
                style={{ fontSize: 44 }}
              />
              <InterText color={colors.muted} style={{ fontSize: 13, textAlign: 'center' }}>
                {t('weekly.footerLine', { nights: stats.sleepNights })}
              </InterText>
            </Card>
          </View>
        </ScrollView>
        <AdBanner />
      </View>
    </Screen>
  );
}

function StatTile({
  icon: Icon,
  accent,
  value,
  label,
  prefix,
  suffix,
  decimals,
}: {
  icon: LucideIcon;
  accent: string;
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <Card padded={false} className="flex-1 p-4" style={{ minHeight: 110 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: withAlpha(accent, 0.12),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={accent} strokeWidth={1.8} />
      </View>
      <View className="mt-3">
        <AnimatedCounter
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          weight="bold"
          style={{ fontSize: 26 }}
        />
        <Caption fit style={{ marginTop: 2 }}>
          {label}
        </Caption>
      </View>
    </Card>
  );
}
