import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AlertCircle, Layers, Search, SlidersHorizontal } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AdBanner } from '@/components/AdBanner';
import { Card } from '@/components/Card';
import { OptionSheet, type SheetOption } from '@/components/OptionSheet';
import { PressableScale } from '@/components/PressableScale';
import { RowActionSheet } from '@/components/RowActionSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { TrackerGridCard } from '@/components/TrackerCard';
import { Caption, ClashText, InterText } from '@/components/Typography';
import { iconForKey } from '@/components/icons';
import { formatLogValue } from '@/lib/customFormat';
import { TRACKERS, type TrackerKey, withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';
import {
  avgMood,
  budgetLeft,
  habitsToday,
  lastSleepHours,
  latestWeight,
  meditationStreak,
  tasksDueToday,
  trackerInsight,
  waterToday,
} from '@/lib/stats';

/** Per-tracker quick-add deep links (open the screen with its add form). */
const QUICK_ADD_ROUTE: Partial<Record<TrackerKey, Href>> = {
  finance: '/tracker/finance?add=expense',
  habits: '/tracker/habits?add=1',
  tasks: '/tracker/tasks?add=1',
  goals: '/tracker/goals?add=1',
  planner: '/tracker/planner?add=1',
  sleep: '/tracker/sleep?add=1',
  fitness: '/tracker/fitness?add=1',
  mood: '/tracker/mood?add=1',
  water: '/tracker/water?add=1',
  weight: '/tracker/weight?add=1',
  meditation: '/tracker/meditation?add=1',
  custom: '/tracker/custom',
};

export default function TrackersScreen() {
  const router = useRouter();
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const enabled = useTrakl((s) => s.enabledTrackers);
  const pinned = useTrakl((s) => s.pinnedTrackers);
  const togglePin = useTrakl((s) => s.togglePinTracker);
  const store = useTrakl();
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<'default' | 'name'>('default');
  const [actionKey, setActionKey] = useState<TrackerKey | null>(null);

  const insightInput = useMemo(
    () => ({
      transactions: store.transactions,
      habits: store.habits,
      tasks: store.tasks,
      goals: store.goals,
      planner: store.planner,
      sleep: store.sleep,
      workouts: store.workouts,
      mood: store.mood,
      water: store.water,
      weight: store.weight,
      meditation: store.meditation,
      customTrackers: store.customTrackers,
      monthlyBudget: store.monthlyBudget,
    }),
    [
      store.transactions,
      store.habits,
      store.tasks,
      store.goals,
      store.planner,
      store.sleep,
      store.workouts,
      store.mood,
      store.water,
      store.weight,
      store.meditation,
      store.customTrackers,
      store.monthlyBudget,
    ],
  );

  function statFor(key: TrackerKey): string {
    switch (key) {
      case 'finance':
        return t('trackerStats.financeLeft', {
          amount: fmt.currency(budgetLeft(store.transactions, store.monthlyBudget)),
        });
      case 'habits': {
        const h = habitsToday(store.habits);
        return t('trackerStats.habitsDone', { done: h.done, total: h.total });
      }
      case 'tasks':
        return t('trackerStats.tasksDue', { count: tasksDueToday(store.tasks) });
      case 'goals':
        return t('trackerStats.goalsInProgress', { count: store.goals.length });
      case 'planner':
        return t('trackerStats.plannerEvents', {
          count: store.planner.filter((e) => e.weekOffset === 0).length,
        });
      case 'sleep':
        return t('trackerStats.sleepLast', { hours: lastSleepHours(store.sleep) });
      case 'fitness':
        return t('trackerStats.workoutsLogged', { count: store.workouts.length });
      case 'mood': {
        const avg = avgMood(store.mood);
        return avg > 0 ? t('trackerStats.moodAvg', { value: avg }) : t('trackerStats.moodNone');
      }
      case 'water':
        return t('trackerStats.waterToday', {
          count: waterToday(store.water),
          goal: store.waterGoal,
        });
      case 'weight': {
        const latest = latestWeight(store.weight);
        return latest != null
          ? t('trackerStats.weightLatest', { value: fmt.number(latest) })
          : t('trackerStats.weightNone');
      }
      case 'meditation':
        return t('trackerStats.meditationStreak', { count: meditationStreak(store.meditation) });
      case 'custom':
        return t('trackerStats.customTrackers', { count: store.customTrackers.length });
      default:
        return '';
    }
  }

  /** Visible trackers in registry order, filtered by enabled set. */
  const baseVisible = TRACKERS.filter((tr) => enabled.includes(tr.key));

  // Build insight + sort. Pinned first (preserving relative order), then the
  // chosen sort applied to the rest.
  const decorated = baseVisible.map((tr) => ({
    tr,
    name: t(`trackerNames.${tr.key}`),
    insight: trackerInsight(tr.key, insightInput),
    isPinned: pinned.includes(tr.key),
  }));

  const sorted =
    sort === 'name' ? [...decorated].sort((a, b) => a.name.localeCompare(b.name)) : decorated;

  const ordered = [...sorted.filter((d) => d.isPinned), ...sorted.filter((d) => !d.isPinned)];

  // Needs-attention list (drives the summary banner + ordering hint).
  const attention = decorated.filter((d) => d.insight.attention);

  // pair into rows of 2 for a stable grid
  const rows: (typeof ordered)[] = [];
  for (let i = 0; i < ordered.length; i += 2) rows.push(ordered.slice(i, i + 2));

  const activeAction = actionKey ? decorated.find((d) => d.tr.key === actionKey) : null;

  return (
    <Screen>
      <View className="flex-1">
        <View className="pt-safe">
          <ScreenHeader
            title={t('trackers.title')}
            right={
              <View className="flex-row items-center gap-3">
                <PressableScale
                  feedback="icon"
                  onPress={() => router.push('/search')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t('search.title')}
                >
                  <Search size={22} color={colors.text} strokeWidth={1.5} />
                </PressableScale>
                <PressableScale
                  feedback="icon"
                  onPress={() => setSortOpen(true)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t('trackers.sortTitle')}
                >
                  <SlidersHorizontal size={22} color={colors.text} strokeWidth={1.5} />
                </PressableScale>
              </View>
            }
          />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview summary */}
          <Animated.View entering={FadeInDown.duration(320)}>
            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    style={{ backgroundColor: withAlpha(accents.goals, 0.14) }}
                    className="h-10 w-10 items-center justify-center rounded-xl"
                  >
                    <Layers size={20} color={accents.goals} strokeWidth={1.6} />
                  </View>
                  <View className="flex-1">
                    <ClashText weight="medium" style={{ fontSize: 17 }}>
                      {t('trackerHub.trackingCount', { count: baseVisible.length })}
                    </ClashText>
                    <InterText color={colors.muted} style={{ fontSize: 12 }}>
                      {attention.length > 0
                        ? t('trackerHub.needsAttentionCount', { count: attention.length })
                        : t('trackerHub.allCaughtUp')}
                    </InterText>
                  </View>
                </View>
                {attention.length > 0 ? (
                  <View
                    style={{ backgroundColor: withAlpha(colors.destructive, 0.12) }}
                    className="h-9 w-9 items-center justify-center rounded-full"
                  >
                    <AlertCircle size={18} color={colors.destructive} strokeWidth={1.8} />
                  </View>
                ) : null}
              </View>

              {attention.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {attention.map((d) => (
                    <PressableScale
                      key={d.tr.key}
                      feedback="chip"
                      onPress={() => router.push(d.tr.route)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: withAlpha(accents[d.tr.key], 0.1),
                        borderWidth: 1,
                        borderColor: withAlpha(accents[d.tr.key], 0.25),
                      }}
                    >
                      <d.tr.icon size={13} color={accents[d.tr.key]} strokeWidth={1.8} />
                      <InterText weight="medium" style={{ fontSize: 12 }}>
                        {d.name}
                      </InterText>
                    </PressableScale>
                  ))}
                </View>
              ) : null}
            </Card>
          </Animated.View>

          {/* Grid */}
          <View className="mt-1">
            <SectionLabel>{t('trackerHub.yourTrackers')}</SectionLabel>
            <View className="gap-3">
              {rows.map((row, rowIdx) => (
                <View key={row[0]?.tr.key ?? `row-${rowIdx}`} className="flex-row gap-3">
                  {row.map((d, colIdx) => (
                    <Animated.View
                      key={d.tr.key}
                      className="flex-1"
                      entering={FadeInDown.delay((rowIdx * 2 + colIdx) * 60).duration(360)}
                    >
                      <TrackerGridCard
                        tracker={d.tr}
                        name={d.name}
                        stat={statFor(d.tr.key)}
                        insight={d.insight}
                        pinned={d.isPinned}
                        onPress={() => router.push(d.tr.route)}
                        onLongPress={() => {
                          haptics.tapMedium();
                          setActionKey(d.tr.key);
                        }}
                      />
                    </Animated.View>
                  ))}
                  {row.length === 1 ? <View className="flex-1" /> : null}
                </View>
              ))}
            </View>
          </View>

          {/* Custom trackers created by the user */}
          {store.customTrackers.length > 0 ? (
            <View className="mt-2">
              <SectionLabel>{t('trackerHub.customSection')}</SectionLabel>
              <View className="gap-3">
                {store.customTrackers.map((tr, i) => {
                  const Icon = iconForKey(tr.icon);
                  const last = tr.logs?.[0];
                  return (
                    <Animated.View key={tr.id} entering={FadeInDown.delay(i * 50).duration(320)}>
                      <PressableScale
                        feedback="card"
                        onPress={() =>
                          router.push({
                            pathname: '/tracker/custom/[id]',
                            params: { id: tr.id },
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={tr.name}
                      >
                        <Card padded={false} className="p-4">
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: withAlpha(tr.color, 0.12),
                              }}
                              className="items-center justify-center"
                            >
                              <Icon size={20} color={tr.color} strokeWidth={1.5} />
                            </View>
                            <View className="flex-1 px-3">
                              <ClashText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                                {tr.name}
                              </ClashText>
                              <InterText
                                color={colors.muted}
                                style={{ fontSize: 12, marginTop: 2 }}
                                numberOfLines={1}
                              >
                                {t('trackerHub.customLogCount', { count: (tr.logs ?? []).length })}
                              </InterText>
                            </View>
                            {last ? (
                              <ClashText weight="medium" color={tr.color} style={{ fontSize: 16 }}>
                                {formatLogValue(tr.type, last.value, t)}
                              </ClashText>
                            ) : null}
                          </View>
                        </Card>
                      </PressableScale>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Hint */}
          <Caption color={colors.faint} style={{ fontSize: 11, textAlign: 'center', marginTop: 6 }}>
            {t('trackerHub.longPressHint')}
          </Caption>
        </ScrollView>

        <AdBanner />
      </View>

      <OptionSheet
        visible={sortOpen}
        title={t('trackers.sortTitle')}
        options={
          [
            { value: 'default', label: t('trackers.sortDefault') },
            { value: 'name', label: t('trackers.sortName') },
          ] satisfies SheetOption[]
        }
        selected={sort}
        onSelect={(v) => setSort(v === 'name' ? 'name' : 'default')}
        onClose={() => setSortOpen(false)}
      />

      <RowActionSheet
        visible={activeAction != null}
        onClose={() => setActionKey(null)}
        title={activeAction?.name ?? ''}
        subtitle={activeAction ? statFor(activeAction.tr.key) : undefined}
        closeLabel={t('common.close')}
        actions={
          activeAction
            ? [
                {
                  label: t('trackerHub.open', { name: activeAction.name }),
                  onPress: () => router.push(activeAction.tr.route),
                },
                ...(QUICK_ADD_ROUTE[activeAction.tr.key]
                  ? [
                      {
                        label: t('trackerHub.quickAdd'),
                        onPress: () => {
                          const route = QUICK_ADD_ROUTE[activeAction.tr.key];
                          if (route) router.push(route);
                        },
                      },
                    ]
                  : []),
                {
                  label: activeAction.isPinned ? t('trackerHub.unpin') : t('trackerHub.pin'),
                  onPress: () => togglePin(activeAction.tr.key),
                },
              ]
            : undefined
        }
      />
    </Screen>
  );
}
