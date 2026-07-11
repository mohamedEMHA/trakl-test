import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParseKeys } from 'i18next';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TrackerKey } from './trackers';
import { saveTransactionsSecure, getTransactionsSecure, deleteTransactionsSecure } from './secureStorage';
import type {
  Achievement,
  AppNotification,
  CustomTracker,
  Goal,
  Habit,
  MeditationSession,
  MoodEntry,
  PlannerEvent,
  Profile,
  SleepEntry,
  Task,
  Transaction,
  WaterEntry,
  WeightEntry,
  Workout,
} from './types';
import i18n from './i18n';
import {
  buildCustom,
  buildGoals,
  buildHabits,
  buildMeditation,
  buildMood,
  buildNotifications,
  buildPlanner,
  buildTasks,
  buildTransactions,
  buildWorkouts,
  dayISO,
  seedAchievements,
  seedSleep,
  seedWater,
  seedWeight,
} from './seed';

// New users start with no budget set (0). The Finance budget card handles the
// 0 state gracefully and the user sets their own budget via Edit.
const MONTHLY_BUDGET = 0;

const ALL_TRACKERS: TrackerKey[] = [
  'finance',
  'habits',
  'tasks',
  'goals',
  'planner',
  'sleep',
  'fitness',
  'mood',
  'water',
  'weight',
  'meditation',
  'custom',
];

/** Daily water goal in glasses. */
export const WATER_GOAL = 8;

interface TraklState {
  hydrated: boolean;
  /**
   * True when AsyncStorage rehydration threw (corrupt/partial JSON, migration
   * error, etc.). In that case the in-memory state is the *default* (empty,
   * not onboarded), which must NOT be allowed to overwrite the user's real
   * persisted data by bouncing them back into onboarding.
   */
  rehydrateFailed: boolean;
  onboarded: boolean;
  enabledTrackers: TrackerKey[];
  pinnedTrackers: TrackerKey[];
  profile: Profile;

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
  notifications: AppNotification[];
  achievements: Achievement[];

  monthlyBudget: number;
  notificationsEnabled: boolean;
  waterGoal: number;

  // actions
  completeOnboarding: (data: {
    profile: Partial<Profile>;
    trackers: TrackerKey[];
    sampleData?: boolean;
  }) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  setEnabledTrackers: (keys: TrackerKey[]) => void;
  toggleTracker: (key: TrackerKey) => void;
  togglePinTracker: (key: TrackerKey) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setMonthlyBudget: (budget: number) => void;

  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  toggleHabitToday: (id: string) => void;
  addHabit: (name: string, color: string) => void;
  updateHabit: (id: string, patch: { name: string; color: string }) => void;
  deleteHabit: (id: string) => void;
  toggleTask: (id: string) => void;
  setTaskStatus: (id: string, status: Task['status']) => void;
  addTask: (t: Omit<Task, 'id' | 'done' | 'status'>) => void;
  deleteTask: (id: string) => void;
  addGoal: (name: string, deadline: string) => void;
  addGoalFull: (g: Omit<Goal, 'id' | 'progress'>) => void;
  updateGoal: (id: string, patch: Omit<Goal, 'id' | 'progress'>) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  deleteGoal: (id: string) => void;
  addSleep: (entry: Omit<SleepEntry, 'id'>) => void;
  addWorkout: (w: Omit<Workout, 'id'>) => void;
  deleteWorkout: (id: string) => void;
  addPlannerEvent: (e: Omit<PlannerEvent, 'id'>) => void;
  deletePlannerEvent: (id: string) => void;
  addMood: (entry: Omit<MoodEntry, 'id'>) => void;
  deleteMood: (id: string) => void;
  addWater: (glasses: number) => void;
  resetWaterToday: () => void;
  setWaterGoal: (goal: number) => void;
  addWeight: (kg: number) => void;
  deleteWeight: (id: string) => void;
  addMeditation: (entry: Omit<MeditationSession, 'id'>) => void;
  deleteMeditation: (id: string) => void;
  addCustomTracker: (c: Omit<CustomTracker, 'id' | 'logs'>) => void;
  updateCustomTracker: (id: string, patch: Partial<Omit<CustomTracker, 'id' | 'logs'>>) => void;
  logCustomValue: (trackerId: string, value: number) => void;
  deleteCustomLog: (trackerId: string, logId: string) => void;
  deleteCustomTracker: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetApp: () => void;
}

/** Recompute goal progress from completed milestones (0-100). */
function progressFromMilestones(milestones: Goal['milestones']): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.done).length;
  return Math.round((done / milestones.length) * 100);
}

const defaultProfile: Profile = {
  name: 'Alex',
  avatarEmoji: '🦊',
  language: 'English',
  focus: 'all',
  memberSince: new Date(new Date().getFullYear(), 0, 12).toISOString(),
};

const id = () => Math.random().toString(36).slice(2, 10);

/** Translate a sample-data key in the currently-active language.
 *  Uses a translator explicitly bound to the resolved language so the seed
 *  strings can never fall back to English due to load timing. */
const sampleT = (key: string) => {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  return i18n.getFixedT(lng)(key as ParseKeys);
};

/** All the seed/demo content, used by the optional "Try with sample data" flow.
 *  Built lazily so the user-facing strings are translated into the language that
 *  is active at the moment the sample data is loaded. */
function buildSampleData() {
  const t = sampleT;
  return {
    transactions: buildTransactions(t),
    habits: buildHabits(t),
    tasks: buildTasks(t),
    goals: buildGoals(t),
    planner: buildPlanner(t),
    sleep: seedSleep,
    workouts: buildWorkouts(t),
    mood: buildMood(t),
    water: seedWater,
    weight: seedWeight,
    meditation: buildMeditation(t),
    customTrackers: buildCustom(t),
    notifications: buildNotifications(t),
    achievements: seedAchievements,
    monthlyBudget: 1600,
  };
}

/** A brand-new user starts with everything empty (no demo numbers). */
const EMPTY_DATA = {
  transactions: [] as Transaction[],
  habits: [] as Habit[],
  tasks: [] as Task[],
  goals: [] as Goal[],
  planner: [] as PlannerEvent[],
  sleep: [] as SleepEntry[],
  workouts: [] as Workout[],
  mood: [] as MoodEntry[],
  water: [] as WaterEntry[],
  weight: [] as WeightEntry[],
  meditation: [] as MeditationSession[],
  customTrackers: [] as CustomTracker[],
  notifications: [] as AppNotification[],
  achievements: [] as Achievement[],
} as const;

export const useTrakl = create<TraklState>()(
  persist(
    (set) => ({
      hydrated: false,
      rehydrateFailed: false,
      onboarded: false,
      enabledTrackers: [...ALL_TRACKERS],
      pinnedTrackers: [],
      profile: defaultProfile,

      transactions: [],
      habits: [],
      tasks: [],
      goals: [],
      planner: [],
      sleep: [],
      workouts: [],
      mood: [],
      water: [],
      weight: [],
      meditation: [],
      customTrackers: [],
      notifications: [],
      achievements: [],

      monthlyBudget: MONTHLY_BUDGET,
      notificationsEnabled: true,
      waterGoal: WATER_GOAL,

      completeOnboarding: ({ profile, trackers, sampleData }) =>
        set((s) => ({
          onboarded: true,
          profile: {
            ...s.profile,
            ...profile,
            // Stamp the real sign-up moment when the user finishes onboarding.
            memberSince: new Date().toISOString(),
          },
          enabledTrackers: trackers.length > 0 ? trackers : s.enabledTrackers,
          // Optionally pre-fill demo content so the user can explore a populated
          // app. Off by default — a fresh account starts empty.
          ...(sampleData ? buildSampleData() : EMPTY_DATA),
        })),

      loadSampleData: () => set({ ...buildSampleData() }),

      clearAllData: () => set({ ...EMPTY_DATA, pinnedTrackers: [], monthlyBudget: 0 }),

      setEnabledTrackers: (keys) => set({ enabledTrackers: keys }),

      toggleTracker: (key) =>
        set((s) => ({
          enabledTrackers: s.enabledTrackers.includes(key)
            ? s.enabledTrackers.filter((k) => k !== key)
            : [...s.enabledTrackers, key],
        })),

      togglePinTracker: (key) =>
        set((s) => ({
          pinnedTrackers: s.pinnedTrackers.includes(key)
            ? s.pinnedTrackers.filter((k) => k !== key)
            : [...s.pinnedTrackers, key],
        })),

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setMonthlyBudget: (budget) => set({ monthlyBudget: Math.max(0, Math.round(budget)) }),

      addTransaction: (tx) =>
        set((s) => ({ transactions: [{ ...tx, id: id() }, ...s.transactions] })),

      deleteTransaction: (tid) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== tid) })),

      toggleHabitToday: (hid) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== hid) return h;
            const today = dayISO(0);
            const completions = { ...h.completions };
            if (completions[today]) delete completions[today];
            else completions[today] = true;
            return { ...h, completions };
          }),
        })),

      addHabit: (name, color) =>
        set((s) => ({
          habits: [...s.habits, { id: id(), name, cadence: 'Daily', color, completions: {} }],
        })),

      updateHabit: (hid, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === hid ? { ...h, ...patch } : h)),
        })),

      deleteHabit: (hid) => set((s) => ({ habits: s.habits.filter((h) => h.id !== hid) })),

      toggleTask: (tid) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === tid
              ? {
                  ...t,
                  done: !t.done,
                  status: !t.done ? 'done' : 'todo',
                  completedAt: !t.done ? new Date().toISOString() : undefined,
                }
              : t,
          ),
        })),

      setTaskStatus: (tid, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === tid
              ? {
                  ...t,
                  status,
                  done: status === 'done',
                  completedAt:
                    status === 'done' ? (t.completedAt ?? new Date().toISOString()) : undefined,
                }
              : t,
          ),
        })),

      addTask: (t) =>
        set((s) => ({
          tasks: [{ ...t, id: id(), done: false, status: 'todo' }, ...s.tasks],
        })),

      deleteTask: (tid) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== tid) })),

      addGoal: (name, deadline) =>
        set((s) => ({
          goals: [...s.goals, { id: id(), name, deadline, progress: 0, milestones: [] }],
        })),

      addGoalFull: (g) =>
        set((s) => ({
          goals: [...s.goals, { ...g, id: id(), progress: progressFromMilestones(g.milestones) }],
        })),

      updateGoal: (gid, patch) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === gid
              ? { ...g, ...patch, progress: progressFromMilestones(patch.milestones) }
              : g,
          ),
        })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, done: !m.done } : m,
            );
            return { ...g, milestones, progress: progressFromMilestones(milestones) };
          }),
        })),

      deleteGoal: (gid) => set((s) => ({ goals: s.goals.filter((g) => g.id !== gid) })),

      addSleep: (entry) => set((s) => ({ sleep: [{ ...entry, id: id() }, ...s.sleep] })),

      addWorkout: (w) => set((s) => ({ workouts: [{ ...w, id: id() }, ...s.workouts] })),

      deleteWorkout: (wid) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== wid) })),

      addPlannerEvent: (e) => set((s) => ({ planner: [...s.planner, { ...e, id: id() }] })),

      deletePlannerEvent: (pid) => set((s) => ({ planner: s.planner.filter((e) => e.id !== pid) })),

      addMood: (entry) => set((s) => ({ mood: [{ ...entry, id: id() }, ...s.mood] })),

      deleteMood: (mid) => set((s) => ({ mood: s.mood.filter((m) => m.id !== mid) })),

      addWater: (glasses) =>
        set((s) => ({
          water: [
            { id: id(), glasses: Math.max(1, Math.round(glasses)), date: new Date().toISOString() },
            ...s.water,
          ],
        })),

      resetWaterToday: () =>
        set((s) => {
          const start = +new Date(dayISO(0));
          const end = +new Date(dayISO(1));
          return {
            water: s.water.filter((w) => {
              const time = +new Date(w.date);
              return time < start || time >= end;
            }),
          };
        }),

      setWaterGoal: (goal) => set({ waterGoal: Math.min(30, Math.max(1, Math.round(goal))) }),

      addWeight: (kg) =>
        set((s) => ({
          weight: [
            { id: id(), kg: Math.round(kg * 10) / 10, date: new Date().toISOString() },
            ...s.weight,
          ],
        })),

      deleteWeight: (wid) => set((s) => ({ weight: s.weight.filter((w) => w.id !== wid) })),

      addMeditation: (entry) =>
        set((s) => ({ meditation: [{ ...entry, id: id() }, ...s.meditation] })),

      deleteMeditation: (mid) =>
        set((s) => ({ meditation: s.meditation.filter((m) => m.id !== mid) })),

      addCustomTracker: (c) =>
        set((s) => ({ customTrackers: [...s.customTrackers, { ...c, id: id(), logs: [] }] })),

      updateCustomTracker: (cid, patch) =>
        set((s) => ({
          customTrackers: s.customTrackers.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
        })),

      logCustomValue: (trackerId, value) =>
        set((s) => ({
          customTrackers: s.customTrackers.map((c) =>
            c.id === trackerId
              ? {
                  ...c,
                  logs: [{ id: id(), value, date: new Date().toISOString() }, ...(c.logs ?? [])],
                }
              : c,
          ),
        })),

      deleteCustomLog: (trackerId, logId) =>
        set((s) => ({
          customTrackers: s.customTrackers.map((c) =>
            c.id === trackerId ? { ...c, logs: (c.logs ?? []).filter((l) => l.id !== logId) } : c,
          ),
        })),

      deleteCustomTracker: (cid) =>
        set((s) => ({ customTrackers: s.customTrackers.filter((c) => c.id !== cid) })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      resetApp: () =>
        set({
          onboarded: false,
          profile: defaultProfile,
          enabledTrackers: [...ALL_TRACKERS],
          pinnedTrackers: [],
          ...EMPTY_DATA,
          monthlyBudget: MONTHLY_BUDGET,
          notificationsEnabled: true,
          waterGoal: WATER_GOAL,
        }),
    }),
    {
      name: 'trakl-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 10,
      migrate: (persisted, _version) => {
        try {
          // persisted is `unknown` (raw JSON from AsyncStorage). Narrow it safely
          // without assertions and backfill `logs` on custom trackers saved by an
          // older version that predates the `logs` field.
          if (!persisted || typeof persisted !== 'object') return persisted;
          const record: Record<string, unknown> = { ...persisted };
          if (Array.isArray(record.customTrackers)) {
            record.customTrackers = record.customTrackers.map((c: unknown) => {
              if (!c || typeof c !== 'object') return { logs: [] };
              const tracker: Record<string, unknown> = { ...c };
              if (!Array.isArray(tracker.logs)) tracker.logs = [];
              return tracker;
            });
          }
          // Backfill `completedAt` on tasks marked done by a version that predates
          // completion-time tracking. Falls back to the due date so they still
          // surface in recent-window stats instead of vanishing.
          if (Array.isArray(record.tasks)) {
            record.tasks = record.tasks.map((tk: unknown) => {
              if (!tk || typeof tk !== 'object') return tk;
              const task: Record<string, unknown> = { ...tk };
              if (task.done === true && typeof task.completedAt !== 'string') {
                task.completedAt =
                  typeof task.due === 'string' ? task.due : new Date().toISOString();
              }
              return task;
            });
          }
          // Backfill a real member-since date for profiles persisted before the
          // sign-up timestamp was stamped at onboarding completion.
          if (record.profile && typeof record.profile === 'object') {
            const profile: Record<string, unknown> = { ...record.profile };
            if (typeof profile.memberSince !== 'string' || !profile.memberSince) {
              profile.memberSince = new Date().toISOString();
            }
            record.profile = profile;
          }
          // Backfill the pinned-trackers list for stores persisted before pinning
          // existed so the Trackers hub doesn't read `undefined`.
          if (!Array.isArray(record.pinnedTrackers)) record.pinnedTrackers = [];
          // Backfill `weekOffset` on planner events persisted before per-week
          // scheduling existed. Default 0 keeps them in the current week.
          if (Array.isArray(record.planner)) {
            record.planner = record.planner.map((ev: unknown) => {
              if (!ev || typeof ev !== 'object') return ev;
              const event: Record<string, unknown> = { ...ev };
              if (typeof event.weekOffset !== 'number') event.weekOffset = 0;
              return event;
            });
          }
          // Backfill the four new tracker data slices (mood/water/weight/
          // meditation) for stores persisted before they existed, and seed them
          // with demo data so the new screens aren't empty on first upgrade.
          if (!Array.isArray(record.mood)) record.mood = buildMood(sampleT);
          if (!Array.isArray(record.water)) record.water = seedWater;
          if (!Array.isArray(record.weight)) record.weight = seedWeight;
          if (!Array.isArray(record.meditation)) record.meditation = buildMeditation(sampleT);
          // Enable the new trackers for existing users who already passed
          // onboarding (append any that aren't already in their enabled list).
          if (Array.isArray(record.enabledTrackers)) {
            const existing = record.enabledTrackers.filter(
              (k): k is string => typeof k === 'string',
            );
            for (const k of ['mood', 'water', 'weight', 'meditation']) {
              if (!existing.includes(k)) existing.push(k);
            }
            record.enabledTrackers = existing;
          }
          // Backfill the editable daily water goal for stores persisted before it
          // became user-configurable.
          if (typeof record.waterGoal !== 'number') record.waterGoal = WATER_GOAL;
          // Backfill a `title` on notifications persisted before titles existed so
          // the redesigned list always has a headline above the message.
          if (Array.isArray(record.notifications)) {
            record.notifications = record.notifications.map((n: unknown) => {
              if (!n || typeof n !== 'object') return n;
              const notif: Record<string, unknown> = { ...n };
              if (typeof notif.title !== 'string' || !notif.title) {
                notif.title = typeof notif.message === 'string' ? notif.message : 'Notification';
              }
              return notif;
            });
          }
          // Reset the stale 1600 default budget to 0 for users who never set a
          // budget and have no expenses yet (clean-start parity). Users with
          // transactions or a custom budget keep their value.
          if (record.monthlyBudget === 1600) {
            const hasTx = Array.isArray(record.transactions) && record.transactions.length > 0;
            if (!hasTx) record.monthlyBudget = 0;
          }
          // Backfill missing tracker arrays for users who upgraded from very old
          // versions before all trackers existed. Initialize with empty arrays.
          if (!Array.isArray(record.transactions)) record.transactions = [];
          if (!Array.isArray(record.habits)) record.habits = [];
          if (!Array.isArray(record.tasks)) record.tasks = [];
          if (!Array.isArray(record.goals)) record.goals = [];
          if (!Array.isArray(record.planner)) record.planner = [];
          if (!Array.isArray(record.sleep)) record.sleep = [];
          if (!Array.isArray(record.workouts)) record.workouts = [];
          if (!Array.isArray(record.mood)) record.mood = [];
          if (!Array.isArray(record.water)) record.water = [];
          if (!Array.isArray(record.weight)) record.weight = [];
          if (!Array.isArray(record.meditation)) record.meditation = [];
          if (!Array.isArray(record.customTrackers)) record.customTrackers = [];
          return record;
        } catch {
          // Never let a migration bug discard the whole persisted blob. Returning
          // the raw persisted object keeps the user's real data; missing
          // backfills are tolerated by null-safe reads across the app.
          return persisted;
        }
      },
      partialize: (s) => ({
        onboarded: s.onboarded,
        enabledTrackers: s.enabledTrackers,
        pinnedTrackers: s.pinnedTrackers,
        profile: s.profile,
        transactions: s.transactions,
        habits: s.habits,
        tasks: s.tasks,
        goals: s.goals,
        planner: s.planner,
        sleep: s.sleep,
        workouts: s.workouts,
        mood: s.mood,
        water: s.water,
        weight: s.weight,
        meditation: s.meditation,
        customTrackers: s.customTrackers,
        notifications: s.notifications,
        achievements: s.achievements,
        monthlyBudget: s.monthlyBudget,
        notificationsEnabled: s.notificationsEnabled,
        waterGoal: s.waterGoal,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Storage read or deserialization failed. Mark the failure so the
          // onboarding gate does NOT bounce the user (whose real data is still
          // on disk) into onboarding and overwrite it with empty defaults.
          useTrakl.setState({ hydrated: true, rehydrateFailed: true });
          return;
        }
        if (state) state.hydrated = true;
      },
    },
  ),
);

// ---------- Derived selectors (computed in screens) ----------
export type { TraklState };
