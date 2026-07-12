import { dayISO } from './seed';
import type { TrackerKey } from '@/src/domain/trackers';
import type {
  CustomTracker,
  Goal,
  Habit,
  MeditationSession,
  MoodEntry,
  PlannerEvent,
  SleepEntry,
  Task,
  Transaction,
  WaterEntry,
  WeightEntry,
  Workout,
} from '@/src/domain/types';

export function monthExpenses(transactions: Transaction[]): number {
  const now = new Date();
  return transactions
    .filter((t) => t.kind === 'expense')
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthIncome(transactions: Transaction[]): number {
  const now = new Date();
  return transactions
    .filter((t) => t.kind === 'income')
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function netBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.kind === 'income' ? t.amount : -t.amount), 0);
}

/** Net balance (income - expenses) for the current calendar month only. */
export function monthNet(transactions: Transaction[]): number {
  return monthIncome(transactions) - monthExpenses(transactions);
}

export function budgetLeft(transactions: Transaction[], monthlyBudget: number): number {
  return Math.round(monthlyBudget - monthExpenses(transactions));
}

/** number of habits completed today / total */
export function habitsToday(habits: Habit[]): { done: number; total: number } {
  const today = dayISO(0).slice(0, 10);
  return {
    done: habits.filter((h) => h.completions[today]).length,
    total: habits.length,
  };
}

/** Best single-habit current streak across all habits. */
export function bestStreak(habits: Habit[]): number {
  let best = 0;
  for (const h of habits) {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      if (h.completions[dayISO(-i)]) streak++;
      else if (i === 0)
        continue; // today not yet done shouldn't break
      else break;
    }
    best = Math.max(best, streak);
  }
  return best;
}

/** Completions for one habit in the last 7 days. */
export function weekCount(habit: Habit): number {
  let c = 0;
  for (let i = 0; i < 7; i++) if (habit.completions[dayISO(-i)]) c++;
  return c;
}

export function tasksDueToday(tasks: Task[]): number {
  const today = new Date();
  return tasks.filter((t) => {
    if (t.done) return false;
    const d = new Date(t.due);
    return d.toDateString() === today.toDateString();
  }).length;
}

export function lastSleepHours(sleep: SleepEntry[]): number {
  if (sleep.length === 0) return 0;
  const sorted = [...sleep].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return Math.round((sorted[0].durationMinutes / 60) * 10) / 10;
}

export function avgSleepHours(sleep: SleepEntry[]): number {
  if (sleep.length === 0) return 0;
  const avg = sleep.reduce((s, e) => s + e.durationMinutes, 0) / sleep.length / 60;
  return Math.round(avg * 10) / 10;
}

export function fmtSleep(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/**
 * Overall life score 0-100 blended from trackers.
 *
 * A tracker contributes to the score only when it is BOTH enabled by the user
 * AND actually has data (auto-detect): an enabled-but-empty tracker is skipped
 * instead of dragging the score down (e.g. empty sleep no longer scores 0) or
 * inflating it (e.g. zero tasks no longer scores a perfect 1). The base weights
 * (habits 25, tasks 20, sleep 20, goals 20, finance 15) are re-normalized across
 * the contributing subset so they always sum to 100%, no matter how many
 * trackers contribute. If no scored tracker contributes, returns 50 (neutral)
 * so the score never collapses to 0.
 *
 * Because callers read habits/tasks/sleep/goals/transactions directly from the
 * reactive store, the score auto-recalculates on every data change with no
 * manual refresh.
 */
export function lifeScore(args: {
  habits: Habit[];
  tasks: Task[];
  sleep: SleepEntry[];
  goals: Goal[];
  transactions: Transaction[];
  monthlyBudget: number;
  enabledTrackers?: TrackerKey[];
}): number | null {
  const { habits, tasks, sleep, goals, transactions, monthlyBudget, enabledTrackers } = args;

  const h = habitsToday(habits);
  const habitScore = h.total ? h.done / h.total : 0.5;

  const openTasks = tasks.filter((t) => !t.done).length;
  const totalTasks = tasks.length || 1;
  const taskScore = 1 - openTasks / (totalTasks + 2);

  const sleepScore = Math.min(1, avgSleepHours(sleep) / 8);

  const goalScore = goals.length
    ? goals.reduce((s, g) => s + g.progress, 0) / goals.length / 100
    : 0.5;

  const left = budgetLeft(transactions, monthlyBudget);
  const financeScore = monthlyBudget > 0 ? Math.min(1, left / monthlyBudget + 0.2) : 0.5;

  // Base weight + computed score + whether the tracker actually holds data.
  const parts: { key: TrackerKey; weight: number; score: number; hasData: boolean }[] = [
    { key: 'habits', weight: 0.25, score: habitScore, hasData: habits.length > 0 },
    { key: 'tasks', weight: 0.2, score: taskScore, hasData: tasks.length > 0 },
    { key: 'sleep', weight: 0.2, score: sleepScore, hasData: sleep.length > 0 },
    { key: 'goals', weight: 0.2, score: goalScore, hasData: goals.length > 0 },
    { key: 'finance', weight: 0.15, score: financeScore, hasData: transactions.length > 0 },
  ];

  // Auto-detect: a tracker counts only when it is enabled (when a list is
  // provided) AND has data. Empty trackers are skipped automatically.
  const active = parts.filter(
    (p) => (enabledTrackers ? enabledTrackers.includes(p.key) : true) && p.hasData,
  );

  const totalWeight = active.reduce((s, p) => s + p.weight, 0);
  // No enabled tracker holds any data yet (brand-new account) — return null so
  // the UI can show a neutral "—" placeholder instead of a misleading number.
  if (totalWeight === 0) return null;

  // Re-normalize weights across the contributing subset so they sum to 1.
  const blended = active.reduce((s, p) => s + p.score * (p.weight / totalWeight), 0);

  return Math.round(blended * 100);
}

const FINANCE_CATEGORY_COLORS: Record<string, string> = {
  Food: '#B8860B',
  Transport: '#2C5F8A',
  Home: '#8A4A2F',
  Health: '#2D7A4F',
  Entertainment: '#6B4C8A',
  Shopping: '#8A3A3A',
  Income: '#3A5A8A',
};

export function categoryColor(category: string): string {
  return FINANCE_CATEGORY_COLORS[category] ?? '#4A4A4A';
}

export function expenseByCategory(
  transactions: Transaction[],
): { category: string; amount: number; color: string }[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.kind === 'expense')
    .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount, color: categoryColor(category) }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Fraction (0-1) of all habits completed on the given day-offset (0 = today,
 * -1 = yesterday, ...). Returns 0 when there are no habits.
 */
export function habitDayLevel(habits: Habit[], offset: number): number {
  if (habits.length === 0) return 0;
  const key = dayISO(offset);
  const done = habits.filter((h) => h.completions[key]).length;
  return done / habits.length;
}

/** Number of habit completions across all habits on a given day-offset. */
export function habitDayCount(habits: Habit[], offset: number): number {
  const key = dayISO(offset);
  return habits.reduce((c, h) => c + (h.completions[key] ? 1 : 0), 0);
}

/** Sum of completions across all habits over the last `days` days. */
export function habitTotalCompletions(habits: Habit[], days = 30): number {
  let total = 0;
  for (let i = 0; i < days; i++) total += habitDayCount(habits, -i);
  return total;
}

/** Count of sleep entries recorded within the last `days` days. */
export function sleepNightsInWindow(sleep: SleepEntry[], days: number): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return sleep.filter((e) => +new Date(e.date) >= cutoff).length;
}

/** Average sleep hours over a recent window (defaults to 7 days). */
export function avgSleepHoursWindow(sleep: SleepEntry[], days = 7): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  const recent = sleep.filter((e) => +new Date(e.date) >= cutoff);
  if (recent.length === 0) return 0;
  const avg = recent.reduce((s, e) => s + e.durationMinutes, 0) / recent.length / 60;
  return Math.round(avg * 10) / 10;
}

/**
 * Average sleep hours for the *previous* calendar window of `days` days
 * (i.e. the window ending the day before the current one starts). Uses the
 * same calendar-day boundaries as {@link avgSleepHoursWindow} so the two are
 * directly comparable.
 */
export function avgSleepHoursPrevWindow(sleep: SleepEntry[], days = 7): number {
  const start = +new Date(dayISO(-(days * 2 - 1)));
  const end = +new Date(dayISO(-(days - 1)));
  const recent = sleep.filter((e) => {
    const t = +new Date(e.date);
    return t >= start && t < end;
  });
  if (recent.length === 0) return 0;
  const avg = recent.reduce((s, e) => s + e.durationMinutes, 0) / recent.length / 60;
  return Math.round(avg * 10) / 10;
}

/** Expenses (sum) within the last `days` days. */
export function expensesInWindow(transactions: Transaction[], days: number): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return transactions
    .filter((t) => t.kind === 'expense' && +new Date(t.date) >= cutoff)
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Expenses (sum) for the *previous* calendar window of `days` days, using the
 * same day boundaries as {@link expensesInWindow} for a fair comparison.
 */
export function expensesInPrevWindow(transactions: Transaction[], days: number): number {
  const start = +new Date(dayISO(-(days * 2 - 1)));
  const end = +new Date(dayISO(-(days - 1)));
  return transactions
    .filter((t) => {
      if (t.kind !== 'expense') return false;
      const time = +new Date(t.date);
      return time >= start && time < end;
    })
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Tasks completed within the last `days` days. Prefers the real completion
 * timestamp (`completedAt`); falls back to the `due` date for tasks marked
 * done before completion tracking existed.
 */
export function tasksDoneInWindow(tasks: Task[], days: number): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return tasks.filter((t) => {
    if (!t.done) return false;
    const when = +new Date(t.completedAt ?? t.due);
    return when >= cutoff;
  }).length;
}

// ---------------------------------------------------------------------------
// Mood / Water / Weight / Meditation stats
// ---------------------------------------------------------------------------

function inDay(iso: string, offset: number): boolean {
  const start = +new Date(dayISO(offset));
  const end = +new Date(dayISO(offset + 1));
  const time = +new Date(iso);
  return time >= start && time < end;
}

/** Average mood (1-5) over the last `days`, or 0 when no entries. */
export function avgMood(mood: MoodEntry[], days = 7): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  const recent = mood.filter((m) => +new Date(m.date) >= cutoff);
  if (recent.length === 0) return 0;
  return Math.round((recent.reduce((s, m) => s + m.mood, 0) / recent.length) * 10) / 10;
}

/** Today's logged mood (most recent entry for today), or null. */
export function todayMood(mood: MoodEntry[]): MoodEntry | null {
  const today = mood
    .filter((m) => inDay(m.date, 0))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return today[0] ?? null;
}

/** 7-day mood series (oldest -> newest), 0 on days with no entry. */
export function moodSeries(mood: MoodEntry[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = mood.filter((m) => inDay(m.date, -i));
    out.push(day.length ? day.reduce((s, m) => s + m.mood, 0) / day.length : 0);
  }
  return out;
}

/** Glasses of water logged today. */
export function waterToday(water: WaterEntry[]): number {
  return water.filter((w) => inDay(w.date, 0)).reduce((s, w) => s + w.glasses, 0);
}

/** 7-day water-glasses series (oldest -> newest). */
export function waterSeries(water: WaterEntry[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    out.push(water.filter((w) => inDay(w.date, -i)).reduce((s, w) => s + w.glasses, 0));
  }
  return out;
}

/** Latest recorded weight (kg), or null when no entries. */
export function latestWeight(weight: WeightEntry[]): number | null {
  if (weight.length === 0) return null;
  const sorted = [...weight].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return sorted[0].kg;
}

/** Signed change between the latest weight and the oldest within `days`. */
export function weightChange(weight: WeightEntry[], days = 30): number | null {
  if (weight.length < 2) return null;
  const cutoff = +new Date(dayISO(-(days - 1)));
  const window = weight.filter((w) => +new Date(w.date) >= cutoff);
  const series = (window.length >= 2 ? window : weight).sort(
    (a, b) => +new Date(a.date) - +new Date(b.date),
  );
  const first = series[0].kg;
  const last = series[series.length - 1].kg;
  return Math.round((last - first) * 10) / 10;
}

/** 7-point weight series for sparkline (oldest -> newest), carries last value forward. */
export function weightSeries(weight: WeightEntry[]): number[] {
  if (weight.length === 0) return [0, 0];
  const sorted = [...weight].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  return sorted.slice(-7).map((w) => w.kg);
}

/** Meditation minutes logged today. */
export function meditationToday(sessions: MeditationSession[]): number {
  return sessions.filter((m) => inDay(m.date, 0)).reduce((s, m) => s + m.durationMinutes, 0);
}

/** Total meditation minutes over the last `days`. */
export function meditationMinutes(sessions: MeditationSession[], days = 7): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return sessions
    .filter((m) => +new Date(m.date) >= cutoff)
    .reduce((s, m) => s + m.durationMinutes, 0);
}

/** Consecutive-day meditation streak ending today (or yesterday). */
export function meditationStreak(sessions: MeditationSession[]): number {
  const has = (offset: number) => sessions.some((m) => inDay(m.date, offset));
  let streak = 0;
  // Allow today to be not-yet-done without breaking the streak.
  const start = has(0) ? 0 : -1;
  for (let i = start; i > -365; i--) {
    if (has(i)) streak++;
    else break;
  }
  return streak;
}

/** 7-day meditation-minutes series (oldest -> newest). */
export function meditationSeries(sessions: MeditationSession[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    out.push(sessions.filter((m) => inDay(m.date, -i)).reduce((s, m) => s + m.durationMinutes, 0));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-tracker card insights (Trackers hub: sparkline / progress / trend / attention)
// ---------------------------------------------------------------------------

/** What the card's accent visual should render. */
export type TrackerVisual = 'progress' | 'sparkline' | 'count';

export interface TrackerInsight {
  /** 7-day series, oldest -> newest, used for the sparkline. */
  series: number[];
  /** Which visual the card should draw. */
  visual: TrackerVisual;
  /** Progress 0-100 (only meaningful when visual === 'progress'). */
  progress: number;
  /**
   * Week-over-week trend as a signed percentage. `null` when there is no
   * meaningful prior period to compare against.
   */
  trend: number | null;
  /**
   * Whether a higher trend value is good (e.g. habits up = good, spending up =
   * bad). Drives the trend arrow color.
   */
  higherIsBetter: boolean;
  /** True when the tracker has something pending the user should act on today. */
  attention: boolean;
  /** ISO timestamp of the most recent activity, or null if none. */
  lastUpdated: string | null;
}

/** Build a 7-day expense series (oldest -> newest) bucketed by calendar day. */
function expenseSeries(transactions: Transaction[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    const sum = transactions
      .filter((t) => t.kind === 'expense')
      .filter((t) => {
        const time = +new Date(t.date);
        return time >= dayStart && time < dayEnd;
      })
      .reduce((s, t) => s + t.amount, 0);
    out.push(Math.round(sum));
  }
  return out;
}

/** 7-day sleep-hours series (oldest -> newest), 0 on nights with no entry. */
function sleepSeries(sleep: SleepEntry[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    const entry = sleep.find((e) => {
      const time = +new Date(e.date);
      return time >= dayStart && time < dayEnd;
    });
    out.push(entry ? Math.round((entry.durationMinutes / 60) * 10) / 10 : 0);
  }
  return out;
}

/** 7-day habit-completion-count series (oldest -> newest). */
function habitSeries(habits: Habit[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) out.push(habitDayCount(habits, -i));
  return out;
}

/** 7-day workout-count series (oldest -> newest). */
function workoutSeries(workouts: Workout[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    out.push(
      workouts.filter((w) => {
        const time = +new Date(w.date);
        return time >= dayStart && time < dayEnd;
      }).length,
    );
  }
  return out;
}

/** 7-day task-completion-count series (oldest -> newest). */
function taskSeries(tasks: Task[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    out.push(
      tasks.filter((t) => {
        if (!t.done) return false;
        const time = +new Date(t.completedAt ?? t.due);
        return time >= dayStart && time < dayEnd;
      }).length,
    );
  }
  return out;
}

/** Signed % change between the sum of the last 3 days vs the prior 4 days. */
function seriesTrend(series: number[]): number | null {
  if (series.length < 7) return null;
  const recent = series.slice(4).reduce((s, v) => s + v, 0); // last 3 days
  const prior = series.slice(0, 4).reduce((s, v) => s + v, 0); // prior 4 days
  // Normalize to per-day so the 3-vs-4 split is fair.
  const recentAvg = recent / 3;
  const priorAvg = prior / 4;
  if (priorAvg === 0) return recentAvg === 0 ? null : 100;
  return Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
}

/** Most recent activity timestamp across a tracker's records. */
function latestDate(dates: string[]): string | null {
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (+new Date(a) >= +new Date(b) ? a : b));
}

interface InsightInput {
  transactions: Transaction[];
  habits: Habit[];
  tasks: Task[];
  goals: Goal[];
  planner: PlannerEvent[];
  sleep: SleepEntry[];
  workouts: Workout[];
  mood: MoodEntry[];
  water: WaterEntry[];
  weight: WeightEntry[];
  meditation: MeditationSession[];
  customTrackers: CustomTracker[];
  monthlyBudget: number;
}

/** Daily water goal (glasses) used for the water card progress ring. */
const WATER_GOAL_GLASSES = 8;

/**
 * Compute the rich card insight for a single tracker. Centralizes all the
 * per-tracker visual math (series, progress, trend, attention, recency) so the
 * Trackers hub card stays declarative.
 */
export function trackerInsight(key: TrackerKey, data: InsightInput): TrackerInsight {
  switch (key) {
    case 'finance': {
      const series = expenseSeries(data.transactions);
      const left = budgetLeft(data.transactions, data.monthlyBudget);
      const progress = data.monthlyBudget > 0 ? Math.round((left / data.monthlyBudget) * 100) : 0;
      return {
        series,
        visual: 'progress',
        progress,
        // For spending, going UP is bad.
        trend: seriesTrend(series),
        higherIsBetter: false,
        attention: left <= 0,
        lastUpdated: latestDate(data.transactions.map((t) => t.date)),
      };
    }
    case 'habits': {
      const series = habitSeries(data.habits);
      const today = habitsToday(data.habits);
      const progress = today.total ? Math.round((today.done / today.total) * 100) : 0;
      const lastDate = data.habits
        .flatMap((h) => Object.keys(h.completions).filter((d) => h.completions[d]))
        .reduce<string | null>((a, b) => (a && +new Date(a) >= +new Date(b) ? a : b), null);
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: today.total > 0 && today.done < today.total,
        lastUpdated: lastDate,
      };
    }
    case 'tasks': {
      const series = taskSeries(data.tasks);
      const due = tasksDueToday(data.tasks);
      const total = data.tasks.length;
      const done = data.tasks.filter((t) => t.done).length;
      const progress = total ? Math.round((done / total) * 100) : 0;
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: due > 0,
        lastUpdated: latestDate(data.tasks.flatMap((t) => (t.completedAt ? [t.completedAt] : []))),
      };
    }
    case 'goals': {
      const total = data.goals.length;
      const avg = total ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / total) : 0;
      const series = data.goals.slice(0, 7).map((g) => g.progress);
      return {
        series,
        visual: 'progress',
        progress: avg,
        trend: null,
        higherIsBetter: true,
        attention: total > 0 && data.goals.some((g) => g.progress < 100),
        lastUpdated: latestDate(data.goals.map((g) => g.deadline)),
      };
    }
    case 'planner': {
      const thisWeek = data.planner.filter((e) => e.weekOffset === 0);
      const series = Array.from(
        { length: 7 },
        (_, i) => thisWeek.filter((e) => e.day === i).length,
      );
      const todayDow = (new Date().getDay() + 6) % 7; // Mon=0
      const todayEvents = thisWeek.filter((e) => e.day === todayDow).length;
      return {
        series,
        visual: 'count',
        progress: 0,
        trend: null,
        higherIsBetter: true,
        attention: todayEvents > 0,
        lastUpdated: null,
      };
    }
    case 'sleep': {
      const series = sleepSeries(data.sleep);
      const last = lastSleepHours(data.sleep);
      const progress = Math.min(100, Math.round((last / 8) * 100));
      return {
        series,
        visual: 'sparkline',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: sleepNightsInWindow(data.sleep, 1) === 0,
        lastUpdated: latestDate(data.sleep.map((e) => e.date)),
      };
    }
    case 'fitness': {
      const series = workoutSeries(data.workouts);
      return {
        series,
        visual: 'sparkline',
        progress: 0,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: false,
        lastUpdated: latestDate(data.workouts.map((w) => w.date)),
      };
    }
    case 'mood': {
      const series = moodSeries(data.mood);
      const today = todayMood(data.mood);
      const avg = avgMood(data.mood);
      return {
        series,
        visual: 'sparkline',
        progress: Math.round((avg / 5) * 100),
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: today == null,
        lastUpdated: latestDate(data.mood.map((m) => m.date)),
      };
    }
    case 'water': {
      const series = waterSeries(data.water);
      const today = waterToday(data.water);
      const progress = Math.min(100, Math.round((today / WATER_GOAL_GLASSES) * 100));
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: today < WATER_GOAL_GLASSES,
        lastUpdated: latestDate(data.water.map((w) => w.date)),
      };
    }
    case 'weight': {
      const series = weightSeries(data.weight);
      const change = weightChange(data.weight);
      return {
        series,
        visual: 'sparkline',
        progress: 0,
        // Losing weight reads as the "down is good" default for this app's demo
        // data; we surface the raw signed change, lower is better.
        trend: change == null ? null : Math.round(change * 10),
        higherIsBetter: false,
        attention: false,
        lastUpdated: latestDate(data.weight.map((w) => w.date)),
      };
    }
    case 'meditation': {
      const series = meditationSeries(data.meditation);
      const todayMin = meditationToday(data.meditation);
      const progress = Math.min(100, Math.round((todayMin / 10) * 100));
      return {
        series,
        visual: 'sparkline',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: todayMin === 0,
        lastUpdated: latestDate(data.meditation.map((m) => m.date)),
      };
    }
    case 'custom': {
      const allLogs = data.customTrackers.flatMap((c) => c.logs ?? []);
      const series: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = +new Date(dayISO(-i));
        const dayEnd = +new Date(dayISO(-i + 1));
        series.push(
          allLogs.filter((l) => {
            const time = +new Date(l.date);
            return time >= dayStart && time < dayEnd;
          }).length,
        );
      }
      return {
        series,
        visual: 'count',
        progress: 0,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: data.customTrackers.some((c) => c.reminder && (c.logs ?? []).length === 0),
        lastUpdated: latestDate(allLogs.map((l) => l.date)),
      };
    }
    default:
      return {
        series: [],
        visual: 'count',
        progress: 0,
        trend: null,
        higherIsBetter: true,
        attention: false,
        lastUpdated: null,
      };
  }
}

/** Relative "x ago" label key/value resolver — returns minutes since the date. */
export function minutesSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - +new Date(iso)) / 60000);
}

// ---------------------------------------------------------------------------
// Finance: budget pacing, month-over-month comparison, recurring detection
// ---------------------------------------------------------------------------

/** Expenses for the *previous* calendar month. */
export function prevMonthExpenses(transactions: Transaction[]): number {
  const now = new Date();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return transactions
    .filter((t) => t.kind === 'expense')
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface MonthComparison {
  /** Current-month expenses. */
  current: number;
  /** Previous-month expenses. */
  previous: number;
  /** Signed difference (current - previous). */
  delta: number;
  /** Signed % change vs previous month, or null when there's no prior data. */
  percent: number | null;
}

/** Compare current-month spending against last month. */
export function monthComparison(transactions: Transaction[]): MonthComparison {
  const current = monthExpenses(transactions);
  const previous = prevMonthExpenses(transactions);
  const delta = current - previous;
  const percent = previous > 0 ? Math.round((delta / previous) * 100) : null;
  return { current, previous, delta, percent };
}

/**
 * Fraction (0-1) of the month elapsed. Used to compare actual spend pace with
 * the expected pace given how far through the month we are.
 */
export function monthElapsedFraction(now = new Date()): number {
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.min(1, day / daysInMonth);
}

export interface RecurringCharge {
  /** Normalized merchant key. */
  merchant: string;
  /** Most common category for this merchant. */
  category: string;
  /** Typical (median) charge amount. */
  amount: number;
  /** Number of months this merchant appeared in. */
  occurrences: number;
}

/**
 * Detect likely recurring charges / subscriptions: an expense merchant that
 * appears in 2+ distinct calendar months with a similar amount. Returns the
 * detected charges sorted by amount descending.
 */
export function recurringCharges(transactions: Transaction[]): RecurringCharge[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.kind !== 'expense') continue;
    const key = t.merchant.trim().toLowerCase();
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const out: RecurringCharge[] = [];
  for (const list of Array.from(groups.values())) {
    // Distinct year-month buckets this merchant was charged in.
    const months = new Set(
      list.map((t: Transaction) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }),
    );
    if (months.size < 2) continue;

    const amounts = list.map((t: Transaction) => t.amount).sort((a: number, b: number) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    // Most common category for the merchant.
    const catCounts = new Map<string, number>();
    for (const t of list) catCounts.set(t.category, (catCounts.get(t.category) ?? 0) + 1);
    const category = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];

    out.push({
      merchant: list[0].merchant.trim(),
      category,
      amount: Math.round(median * 100) / 100,
      occurrences: months.size,
    });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

/** Estimated total of detected recurring charges per month. */
export function recurringMonthlyTotal(transactions: Transaction[]): number {
  return recurringCharges(transactions).reduce((s, r) => s + r.amount, 0);
}

// ---------------------------------------------------------------------------
// Tasks: due-date grouping + sorting
// ---------------------------------------------------------------------------

export type TaskGroupKey = 'overdue' | 'today' | 'tomorrow' | 'later' | 'noDate' | 'done';
export type TaskSort = 'due' | 'priority';

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Which group a single task belongs to, based on its done flag + due date. */
export function taskGroupOf(task: Task): TaskGroupKey {
  if (task.done) return 'done';
  if (!task.due) return 'noDate';
  const d = new Date(task.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = +today;
  const dayMs = 86_400_000;
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  const diff = Math.round((+dDay - start) / dayMs);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'later';
}

/** Sort comparator for tasks by the chosen mode. */
function compareTasks(a: Task, b: Task, sort: TaskSort): number {
  if (sort === 'priority') {
    const pr = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (pr !== 0) return pr;
  }
  return +new Date(a.due) - +new Date(b.due);
}

export interface TaskGroup {
  key: TaskGroupKey;
  items: Task[];
}

const GROUP_ORDER: TaskGroupKey[] = ['overdue', 'today', 'tomorrow', 'later', 'noDate', 'done'];

/** Group tasks by due bucket and sort within each group. Empty groups omitted. */
export function groupTasks(tasks: Task[], sort: TaskSort): TaskGroup[] {
  const buckets = new Map<TaskGroupKey, Task[]>();
  for (const task of tasks) {
    const key = taskGroupOf(task);
    const list = buckets.get(key) ?? [];
    list.push(task);
    buckets.set(key, list);
  }
  return GROUP_ORDER.flatMap((key) => {
    const items = buckets.get(key);
    if (!items || items.length === 0) return [];
    return [{ key, items: [...items].sort((a, b) => compareTasks(a, b, sort)) }];
  });
}

// ---------------------------------------------------------------------------
// Habits: weekly target progress
// ---------------------------------------------------------------------------

/** Default weekly completion target per habit. */
export const WEEKLY_TARGET = 7;

/** Current consecutive-day streak for a single habit. */
export function habitStreak(habit: Habit): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (habit.completions[dayISO(-i)]) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
