import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';

import { AdBanner } from '@/components/AdBanner';
import { Avatar } from '@/components/Avatar';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Confetti } from '@/components/Confetti';
import { Card } from '@/components/Card';
import { ProgressRing } from '@/components/Progress';
import { Screen } from '@/components/Screen';
import { HomeSkeleton } from '@/components/Skeleton';
import { SectionLabel } from '@/components/SectionLabel';
import { TrackerMiniCard } from '@/components/TrackerCard';
import { Caption, ClashText, InterText } from '@/components/Typography';
import {
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  Moon,
  TrendingDown,
  TrendingUp,
} from '@/components/icons';
import { Circle } from 'lucide-react-native';
import { PressableScale } from '@/components/PressableScale';
import { TRACKER_MAP, withAlpha, type TrackerKey } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import { haptics } from '@/lib/haptics';
import type { Transaction, Habit, Task, Goal, SleepEntry, Workout, PlannerEvent, CustomTracker, MoodEntry, WaterEntry, WeightEntry, MeditationSession } from '@/lib/types';
import {
  avgMood,
  avgSleepHours,
  bestStreak,
  budgetLeft,
  habitsToday,
  lastSleepHours,
  latestWeight,
  lifeScore,
  meditationStreak,
  meditationToday,
  monthNet,
  tasksDueToday,
  waterToday,
} from '@/lib/stats';

import type { LucideIcon } from 'lucide-react-native';

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'home.greetingMorning';
  if (h < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

function trackerStat(
  key: TrackerKey,
  transactions: Transaction[],
  monthlyBudget: number,
  habits: Habit[],
  tasks: Task[],
  goals: Goal[],
  sleep: SleepEntry[],
  workouts: Workout[],
  planner: PlannerEvent[],
  customTrackers: CustomTracker[],
  mood: MoodEntry[],
  water: WaterEntry[],
  weight: WeightEntry[],
  meditation: MeditationSession[],
  waterGoal: number,
  fmt: ReturnType<typeof useFormatters>,
): string {
  switch (key) {
    case 'finance':
      return fmt.currency(budgetLeft(transactions, monthlyBudget));
    case 'habits': {
      const h = habitsToday(habits);
      return `${h.done}/${h.total}`;
    }
    case 'tasks':
      return `${tasksDueToday(tasks)}`;
    case 'goals':
      return `${goals.length}`;
    case 'sleep':
      return `${lastSleepHours(sleep)}h`;
    case 'fitness':
      return `${workouts.length}`;
    case 'planner':
      return `${planner.filter((e) => e.weekOffset === 0).length}`;
    case 'custom':
      return `${customTrackers.length}`;
    case 'mood': {
      const avg = avgMood(mood);
      return avg ? `${avg}/5` : '—';
    }
    case 'water': {
      const glasses = waterToday(water);
      return `${glasses}/${waterGoal}`;
    }
    case 'weight': {
      const kg = latestWeight(weight);
      return kg != null ? `${kg} kg` : '—';
    }
    case 'meditation': {
      const todayMin = meditationToday(meditation);
      return todayMin ? `${todayMin}m` : `${meditationStreak(meditation)}d`;
    }
    default:
      return '—';
  }
}

function InsightChip({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <Card padded={false} className="flex-1 justify-between p-4" style={{ height: 104 }}>
      <Icon size={18} color={iconColor} strokeWidth={1.5} />
      <View className="gap-1">
        <Caption fit>{label}</Caption>
        <ClashText weight="bold" style={{ fontSize: 22 }} numberOfLines={1}>
          {value}
        </ClashText>
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();

  const hydrated = useTrakl((s) => s.hydrated);
  const profile = useTrakl((s) => s.profile);
  const transactions = useTrakl((s) => s.transactions);
  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const sleep = useTrakl((s) => s.sleep);
  const goals = useTrakl((s) => s.goals);
  const monthlyBudget = useTrakl((s) => s.monthlyBudget);
  const enabledTrackers = useTrakl((s) => s.enabledTrackers);
  const notifications = useTrakl((s) => s.notifications);
  const toggleTask = useTrakl((s) => s.toggleTask);
  const mood = useTrakl((s) => s.mood);
  const water = useTrakl((s) => s.water);
  const weight = useTrakl((s) => s.weight);
  const meditation = useTrakl((s) => s.meditation);
  const waterGoal = useTrakl((s) => s.waterGoal);
  const customTrackers = useTrakl((s) => s.customTrackers);
  const workouts = useTrakl((s) => s.workouts);
  const planner = useTrakl((s) => s.planner);

  const priorityBar: Record<string, string> = {
    high: colors.destructive,
    medium: accents.finance,
    low: colors.faint,
  };

  const scoreValue = lifeScore({
    habits,
    tasks,
    sleep,
    goals,
    transactions,
    monthlyBudget,
    enabledTrackers,
  });
  // null = brand-new account with no data yet. Treat as 0 for ring sizing but
  // show a neutral "—" instead of a number.
  const hasScore = scoreValue !== null;
  const score = scoreValue ?? 0;
  const unread = notifications.some((n) => !n.read);

  const streak = bestStreak(habits);
  const net = Math.round(monthNet(transactions));
  const avgSleep = avgSleepHours(sleep);
  const tasksDoneCount = tasks.filter((t2) => t2.done).length;

  // Celebrate the moment every habit for today is complete — fire once per
  // transition into the "all done" state, not on every render.
  const habitsStatus = habitsToday(habits);
  const allHabitsDone = habitsStatus.total > 0 && habitsStatus.done === habitsStatus.total;
  const [celebrate, setCelebrate] = useState(false);
  const prevAllDone = useRef(allHabitsDone);
  useEffect(() => {
    if (allHabitsDone && !prevAllDone.current) setCelebrate(true);
    prevAllDone.current = allHabitsDone;
  }, [allHabitsDone]);

  const todayFocus = [...tasks]
    .filter((t2) => !t2.done)
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);

  const dateLabel = fmt.date(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Score-driven hero tint: green when thriving, amber mid, soft red when low.
  const heroAccent = score >= 75 ? accents.finance : score >= 50 ? accents.goals : accents.fitness;

  if (!hydrated) {
    return (
      <Screen>
        <View className="pt-safe flex-1">
          <HomeSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View className="pt-safe-offset-2 px-5 pb-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-3">
                <Avatar
                  image={profile.avatarImage}
                  emoji={profile.avatarEmoji}
                  size={36}
                  emojiSize={18}
                />
                <ClashText weight="medium" style={{ fontSize: 18 }} numberOfLines={1}>
                  {t(greetingKey(), { name: profile.name })}
                </ClashText>
              </View>
              <PressableScale
                feedback="icon"
                onPress={() => router.push('/notifications')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('profile.notifications')}
              >
                <View>
                  <Bell size={24} color={colors.text} strokeWidth={1.5} />
                  {unread ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: -1,
                        top: -1,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: colors.destructive,
                      }}
                    />
                  ) : null}
                </View>
              </PressableScale>
            </View>
            <InterText color={colors.muted} style={{ fontSize: 13, marginTop: 4 }}>
              {dateLabel}
            </InterText>
          </View>

          {/* Hero life score */}
          <View className="px-5 pt-4">
            <Card elevated padded={false} className="overflow-hidden">
              <LinearGradient
                colors={[withAlpha(heroAccent, 0.16), withAlpha(heroAccent, 0.02)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24 }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Caption>{t('home.lifeScore')}</Caption>
                    <View className="mt-1 flex-row items-end">
                      {hasScore ? (
                        <AnimatedCounter
                          value={score}
                          weight="bold"
                          style={{ fontSize: 72, lineHeight: 78 }}
                        />
                      ) : (
                        <ClashText weight="bold" style={{ fontSize: 72, lineHeight: 78 }}>
                          {t('homeExtra.scoreEmpty')}
                        </ClashText>
                      )}
                      <ClashText
                        weight="medium"
                        color={colors.muted}
                        style={{ fontSize: 24, marginBottom: 14, marginLeft: 4 }}
                      >
                        {t('homeExtra.scoreDenominator')}
                      </ClashText>
                    </View>
                  </View>
                  <View className="pt-2">
                    <ProgressRing size={64} stroke={8} progress={score} color={heroAccent} />
                  </View>
                </View>
                <InterText color={colors.muted} style={{ fontSize: 14, marginTop: 4 }}>
                  {!hasScore
                    ? t('homeExtra.progressEmpty')
                    : score >= 75
                      ? t('home.progress')
                      : score >= 50
                        ? t('homeExtra.progressSolid')
                        : t('homeExtra.progressLow')}
                </InterText>
              </LinearGradient>
            </Card>
          </View>

          {/* Insight chips */}
          <View className="px-5 pt-3">
            <View className="flex-row gap-3">
              <InsightChip
                icon={Flame}
                iconColor={accents.habits}
                label={t('insights.streak')}
                value={t('insights.streakValue', { count: streak })}
              />
              <InsightChip
                icon={net >= 0 ? TrendingUp : TrendingDown}
                iconColor={net >= 0 ? accents.finance : colors.destructive}
                label={t('insights.netThisMonth')}
                value={fmt.currency(net)}
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <InsightChip
                icon={Moon}
                iconColor={accents.sleep}
                label={t('insights.avgSleep')}
                value={t('insights.avgSleepValue', { hours: avgSleep })}
              />
              <InsightChip
                icon={CheckCircle2}
                iconColor={accents.tasks}
                label={t('insights.tasksDone')}
                value={`${tasksDoneCount}`}
              />
            </View>
          </View>

          {/* Today's focus */}
          <View className="px-5 pt-6">
            <SectionLabel>{t('home.todaysFocus')}</SectionLabel>
            <View className="gap-3">
              {todayFocus.length === 0 ? (
                <Card>
                  <InterText color={colors.muted} style={{ fontSize: 14 }}>
                    {t('homeExtra.focusEmpty')}
                  </InterText>
                </Card>
              ) : (
                todayFocus.map((task) => (
                  <Card key={task.id} padded={false} className="overflow-hidden">
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 4,
                          alignSelf: 'stretch',
                          backgroundColor: priorityBar[task.priority],
                        }}
                      />
                      <View className="flex-1 flex-row items-center justify-between p-4">
                        <View className="flex-1 pr-3">
                          <InterText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                            {task.name}
                          </InterText>
                          <View className="mt-1 flex-row items-center gap-1">
                            <Clock size={13} color={colors.muted} strokeWidth={1.5} />
                            <InterText color={colors.muted} style={{ fontSize: 12 }}>
                              {fmt.time(task.due)}
                            </InterText>
                          </View>
                        </View>
                        <PressableScale
                          feedback="icon"
                          onPress={() => {
                            haptics.tapMedium();
                            toggleTask(task.id);
                          }}
                          hitSlop={10}
                          accessibilityRole="button"
                          accessibilityLabel={`Complete ${task.name}`}
                        >
                          {task.done ? (
                            <CheckCircle2 size={26} color={colors.text} strokeWidth={1.5} />
                          ) : (
                            <Circle size={26} color={colors.faint} strokeWidth={1.5} />
                          )}
                        </PressableScale>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </View>

          {/* Active trackers */}
          <View className="px-5 pt-6">
            <SectionLabel
              right={
                <InterText color={colors.muted} style={{ fontSize: 13 }}>
                  {t('common.seeAll')}
                </InterText>
              }
              onRightPress={() => router.push('/trackers')}
            >
              {t('home.activeTrackers')}
            </SectionLabel>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {enabledTrackers.map((key) => {
              const meta = TRACKER_MAP[key];
              return (
                <TrackerMiniCard
                  key={key}
                  tracker={meta}
                  name={t(`trackerNames.${key}`)}
                  stat={trackerStat(
                    key,
                    transactions,
                    monthlyBudget,
                    habits,
                    tasks,
                    goals,
                    sleep,
                    workouts,
                    planner,
                    customTrackers,
                    mood,
                    water,
                    weight,
                    meditation,
                    waterGoal,
                    fmt,
                  )}
                  onPress={() => router.push(meta.route)}
                />
              );
            })}
          </ScrollView>
        </ScrollView>
        <AdBanner />
      </View>
      <Confetti show={celebrate} onDone={() => setCelebrate(false)} />
    </Screen>
  );
}
