import { bestStreak } from './stats';
import type { CustomTracker, Goal, Habit, SleepEntry, Task, Transaction, Workout } from './types';

/**
 * Real, data-driven achievement system.
 *
 * Each achievement defines a `metric` (some real number derived from the
 * user's actual activity) and a `goal` threshold. An achievement is unlocked
 * when its current value reaches the goal. Everything is computed live from the
 * store, so unlocking happens automatically as the user uses the app.
 */

export type AchievementId =
  | 'a1'
  | 'a2'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'a6'
  | 'a7'
  | 'a8'
  | 'a9'
  | 'a10'
  | 'a11'
  | 'a12'
  | 'a13'
  | 'a14'
  | 'a15'
  | 'a16'
  | 'a17'
  | 'a18';

export interface AchievementInput {
  transactions: Transaction[];
  habits: Habit[];
  tasks: Task[];
  goals: Goal[];
  sleep: SleepEntry[];
  workouts: Workout[];
  customTrackers: CustomTracker[];
}

export interface AchievementDef {
  id: AchievementId;
  /** i18n key suffix under `achievements.defs.<id>` for name + description. */
  goal: number;
  /** Compute the live progress value (clamped to >= 0). */
  value: (input: AchievementInput) => number;
}

/** Total minutes slept overall, used for sleep totals. */
function totalSleepHours(sleep: SleepEntry[]): number {
  return Math.round(sleep.reduce((acc, s) => acc + s.durationMinutes, 0) / 60);
}

/** Count of nights with quality >= 4. */
function goodSleepNights(sleep: SleepEntry[]): number {
  return sleep.filter((s) => s.quality >= 4).length;
}

/** Total custom-tracker logs across all custom trackers. */
function customLogCount(customTrackers: CustomTracker[]): number {
  return customTrackers.reduce((acc, c) => acc + (c.logs?.length ?? 0), 0);
}

/** Goals that are fully complete (progress === 100). */
function completedGoals(goals: Goal[]): number {
  return goals.filter((g) => g.progress >= 100).length;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // First Step — log any activity at all.
  {
    id: 'a1',
    goal: 1,
    value: (i) =>
      i.transactions.length +
      i.tasks.filter((t) => t.done).length +
      i.workouts.length +
      i.sleep.length,
  },
  // 7-Day Streak — keep a habit going 7 days.
  { id: 'a2', goal: 7, value: (i) => bestStreak(i.habits) },
  // Early Bird — log 3 sleeps (waking habit baseline).
  { id: 'a3', goal: 3, value: (i) => i.sleep.length },
  // Budget Boss — log 10 transactions.
  { id: 'a4', goal: 10, value: (i) => i.transactions.length },
  // Goal Getter — complete 1 goal.
  { id: 'a5', goal: 1, value: (i) => completedGoals(i.goals) },
  // Night Owl — record 5 nights of sleep.
  { id: 'a6', goal: 5, value: (i) => i.sleep.length },
  // Iron Will — finish 3 tasks.
  { id: 'a7', goal: 3, value: (i) => i.tasks.filter((t) => t.done).length },
  // Bookworm — 20 custom-tracker logs.
  { id: 'a8', goal: 20, value: (i) => customLogCount(i.customTrackers) },
  // Marathoner — 3 workouts logged.
  { id: 'a9', goal: 3, value: (i) => i.workouts.length },
  // Centurion — finish 10 tasks.
  { id: 'a10', goal: 10, value: (i) => i.tasks.filter((t) => t.done).length },
  // Perfect Week — 5 habits completed today.
  {
    id: 'a11',
    goal: 5,
    value: (i) =>
      i.habits.filter((h) => h.completions[new Date().toISOString().slice(0, 10)]).length,
  },
  // Consistency King — 14-day habit streak.
  { id: 'a12', goal: 14, value: (i) => bestStreak(i.habits) },
  // 30-Day Streak.
  { id: 'a13', goal: 30, value: (i) => bestStreak(i.habits) },
  // Millionaire Mindset — complete 3 goals.
  { id: 'a14', goal: 3, value: (i) => completedGoals(i.goals) },
  // Zen Master — 10 good-quality sleep nights.
  { id: 'a15', goal: 10, value: (i) => goodSleepNights(i.sleep) },
  // Power Lifter — 10 workouts.
  { id: 'a16', goal: 10, value: (i) => i.workouts.length },
  // Sleep Champion — 50 total hours of sleep tracked.
  { id: 'a17', goal: 50, value: (i) => totalSleepHours(i.sleep) },
  // Task Terminator — finish 25 tasks.
  { id: 'a18', goal: 25, value: (i) => i.tasks.filter((t) => t.done).length },
];

export interface ComputedAchievement {
  id: AchievementId;
  unlocked: boolean;
  value: number;
  goal: number;
  /** 0-1 progress toward the goal. */
  progress: number;
}

export function computeAchievements(input: AchievementInput): ComputedAchievement[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const value = Math.max(0, def.value(input));
    const unlocked = value >= def.goal;
    return {
      id: def.id,
      unlocked,
      value,
      goal: def.goal,
      progress: Math.min(1, def.goal === 0 ? 1 : value / def.goal),
    };
  });
}
