import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowRight, Search, Target, X } from 'lucide-react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Caption, InterText } from '@/components/Typography';
import { CheckSquare, FINANCE_CATEGORY_ICON, Repeat2, Wallet } from '@/components/icons';
import type { LucideIcon } from 'lucide-react-native';
import { withAlpha } from '@/lib/trackers';
import { useFormatters } from '@/lib/format';
import { useColors, useTrackerAccents } from '@/lib/theme';
import { useTrakl } from '@/lib/store';

type ResultGroup = 'finance' | 'tasks' | 'goals' | 'habits';

interface Result {
  id: string;
  group: ResultGroup;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  route: Href;
}

export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const accents = useTrackerAccents();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const transactions = useTrakl((s) => s.transactions);
  const tasks = useTrakl((s) => s.tasks);
  const goals = useTrakl((s) => s.goals);
  const habits = useTrakl((s) => s.habits);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const results = useMemo<Result[]>(() => {
    if (q.length === 0) return [];
    const out: Result[] = [];

    for (const tx of transactions) {
      if (tx.merchant.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)) {
        out.push({
          id: `tx-${tx.id}`,
          group: 'finance',
          title: tx.merchant,
          subtitle: `${tx.kind === 'income' ? '+' : '-'}${fmt.currency(tx.amount, {
            cents: true,
          })} · ${fmt.date(tx.date, { day: 'numeric', month: 'short' })}`,
          icon: FINANCE_CATEGORY_ICON[tx.category] ?? Wallet,
          accent: accents.finance,
          route: '/tracker/finance',
        });
      }
    }

    for (const task of tasks) {
      if (task.name.toLowerCase().includes(q) || task.project.toLowerCase().includes(q)) {
        out.push({
          id: `task-${task.id}`,
          group: 'tasks',
          title: task.name,
          subtitle: task.project,
          icon: CheckSquare,
          accent: accents.tasks,
          route: '/tracker/tasks',
        });
      }
    }

    for (const goal of goals) {
      if (
        goal.name.toLowerCase().includes(q) ||
        goal.milestones.some((m) => m.label.toLowerCase().includes(q))
      ) {
        out.push({
          id: `goal-${goal.id}`,
          group: 'goals',
          title: goal.name,
          subtitle: t('goalsDetail.progressLine', {
            progress: goal.progress,
            date: fmt.date(goal.deadline, { day: 'numeric', month: 'short' }),
          }),
          icon: Target,
          accent: accents.goals,
          route: '/tracker/goals',
        });
      }
    }

    for (const habit of habits) {
      if (habit.name.toLowerCase().includes(q)) {
        out.push({
          id: `habit-${habit.id}`,
          group: 'habits',
          title: habit.name,
          subtitle: habit.cadence === 'Daily' ? t('habits.daily') : habit.cadence,
          icon: Repeat2,
          accent: habit.color,
          route: '/tracker/habits',
        });
      }
    }

    return out;
  }, [q, transactions, tasks, goals, habits, accents, fmt, t]);

  const grouped = useMemo(() => {
    const order: ResultGroup[] = ['finance', 'tasks', 'goals', 'habits'];
    return order
      .map((group) => ({ group, items: results.filter((r) => r.group === group) }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  const GROUP_LABELS: Record<ResultGroup, string> = {
    finance: t('trackerNames.finance'),
    tasks: t('trackerNames.tasks'),
    goals: t('trackerNames.goals'),
    habits: t('trackerNames.habits'),
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="pt-safe flex-1">
          <ScreenHeader title={t('search.title')} back />

          <View className="px-5 pb-3">
            <View
              style={{
                backgroundColor: colors.surface2,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              className="flex-row items-center px-3.5"
            >
              <Search size={18} color={colors.muted} strokeWidth={1.5} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('search.placeholder')}
                placeholderTextColor={colors.faint}
                autoFocus
                returnKeyType="search"
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
              {query.length > 0 ? (
                <PressableScale
                  feedback="icon"
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                >
                  <X size={18} color={colors.muted} strokeWidth={1.5} />
                </PressableScale>
              ) : null}
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {q.length === 0 ? (
              <EmptyState
                icon={Search}
                accent={accents.goals}
                title={t('search.emptyTitle')}
                body={t('search.emptyBody')}
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={Search}
                accent={accents.goals}
                title={t('search.noResultsTitle')}
                body={t('search.noResultsBody', { query: query.trim() })}
              />
            ) : (
              <Animated.View entering={FadeIn.duration(180)}>
                <View className="px-5">
                  <Caption color={colors.muted}>
                    {t('search.resultCount', { count: results.length })}
                  </Caption>
                </View>
                {grouped.map((g) => (
                  <View key={g.group} className="px-5 pt-5">
                    <SectionLabel>{GROUP_LABELS[g.group]}</SectionLabel>
                    <View className="gap-3">
                      {g.items.map((r) => (
                        <Card
                          key={r.id}
                          padded={false}
                          className="p-4"
                          onPress={() => router.push(r.route)}
                        >
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: withAlpha(r.accent, 0.12),
                              }}
                              className="items-center justify-center"
                            >
                              <r.icon size={20} color={r.accent} strokeWidth={1.5} />
                            </View>
                            <View className="flex-1 px-3">
                              <InterText weight="medium" style={{ fontSize: 15 }} numberOfLines={1}>
                                {r.title}
                              </InterText>
                              <InterText
                                color={colors.muted}
                                style={{ fontSize: 12, marginTop: 2 }}
                                numberOfLines={1}
                              >
                                {r.subtitle}
                              </InterText>
                            </View>
                            <ArrowRight size={18} color={colors.faint} strokeWidth={1.5} />
                          </View>
                        </Card>
                      ))}
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
