import type { TFunction } from 'i18next';

import {
  avgSleepHoursPrevWindow,
  avgSleepHoursWindow,
  bestStreak,
  expensesInPrevWindow,
  expensesInWindow,
  habitTotalCompletions,
  sleepNightsInWindow,
  tasksDoneInWindow,
} from './stats';
import type { Goal, Habit, SleepEntry, Task, Transaction } from './types';

export type Insight = {
  id: string;
  /** Lucide icon key resolved by the screen. */
  tone: 'positive' | 'neutral' | 'attention';
  text: string;
};

type Input = {
  habits: Habit[];
  tasks: Task[];
  sleep: SleepEntry[];
  goals: Goal[];
  transactions: Transaction[];
  t: TFunction;
};

/**
 * Compares the most recent 7-day window to the previous one and produces a
 * short list of human-readable insights. Pure + deterministic so it can be
 * memoised against the store slices.
 */
export function weeklyInsights({ habits, tasks, sleep, transactions, t }: Input): Insight[] {
  const out: Insight[] = [];

  // Sleep: this week vs last week.
  const sleepThis = avgSleepHoursWindow(sleep, 7);
  const sleepPrev = avgSleepHoursPrevWindow(sleep, 7);
  if (sleepThis > 0) {
    if (sleepPrev > 0 && sleepThis > sleepPrev) {
      out.push({
        id: 'sleep-up',
        tone: 'positive',
        text: t('weekly.insightSleepUp', {
          hours: sleepThis,
          delta: Math.round((sleepThis - sleepPrev) * 10) / 10,
        }),
      });
    } else if (sleepThis < 7) {
      out.push({
        id: 'sleep-low',
        tone: 'attention',
        text: t('weekly.insightSleepLow', { hours: sleepThis }),
      });
    } else {
      out.push({
        id: 'sleep-ok',
        tone: 'neutral',
        text: t('weekly.insightSleepOk', { hours: sleepThis }),
      });
    }
  }

  // Habits: total completions + streak.
  const habitDone = habitTotalCompletions(habits, 7);
  const streak = bestStreak(habits);
  if (habits.length > 0) {
    if (streak >= 3) {
      out.push({
        id: 'streak',
        tone: 'positive',
        text: t('weekly.insightStreak', { days: streak }),
      });
    }
    out.push({
      id: 'habit-count',
      tone: habitDone > 0 ? 'neutral' : 'attention',
      text: t('weekly.insightHabits', { count: habitDone }),
    });
  }

  // Tasks completed this week.
  const tasksDone = tasksDoneInWindow(tasks, 7);
  if (tasks.length > 0) {
    out.push({
      id: 'tasks',
      tone: tasksDone > 0 ? 'positive' : 'neutral',
      text: t('weekly.insightTasks', { count: tasksDone }),
    });
  }

  // Spending: this week vs last week.
  const spentThis = Math.round(expensesInWindow(transactions, 7));
  const spentPrev = Math.round(expensesInPrevWindow(transactions, 7));
  if (transactions.length > 0) {
    if (spentPrev > 0 && spentThis < spentPrev) {
      out.push({
        id: 'spend-down',
        tone: 'positive',
        text: t('weekly.insightSpendDown', { delta: spentPrev - spentThis }),
      });
    } else if (spentPrev > 0 && spentThis > spentPrev) {
      out.push({
        id: 'spend-up',
        tone: 'attention',
        text: t('weekly.insightSpendUp', { delta: spentThis - spentPrev }),
      });
    }
  }

  if (out.length === 0) {
    out.push({ id: 'empty', tone: 'neutral', text: t('weekly.insightEmpty') });
  }

  return out;
}

export type WeeklyStats = {
  habitCompletions: number;
  tasksDone: number;
  avgSleep: number;
  sleepNights: number;
  spent: number;
  bestStreak: number;
};

export function weeklyStats(input: {
  habits: Habit[];
  tasks: Task[];
  sleep: SleepEntry[];
  transactions: Transaction[];
}): WeeklyStats {
  return {
    habitCompletions: habitTotalCompletions(input.habits, 7),
    tasksDone: tasksDoneInWindow(input.tasks, 7),
    avgSleep: avgSleepHoursWindow(input.sleep, 7),
    sleepNights: sleepNightsInWindow(input.sleep, 7),
    spent: Math.round(expensesInWindow(input.transactions, 7)),
    bestStreak: bestStreak(input.habits),
  };
}
