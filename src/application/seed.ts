import type { ParseKeys } from 'i18next';

import type {
  Achievement,
  AppNotification,
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

/** A minimal translate function compatible with i18next's `t`. */
type T = (key: ParseKeys) => string;

/** ISO date (no time) offset from today by `days`. */
export function dayISO(offset = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

function isoAt(offset: number, h: number, m: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function buildTransactions(t: T): Transaction[] {
  return [
    {
      id: 't1',
      kind: 'income',
      merchant: t('sample.txSalary'),
      category: 'Income',
      amount: 4200,
      date: dayISO(-4),
    },
    {
      id: 't2',
      kind: 'expense',
      merchant: t('sample.txGroceries'),
      category: 'Food',
      amount: 86.4,
      date: dayISO(-1),
    },
    {
      id: 't3',
      kind: 'expense',
      merchant: 'Uber',
      category: 'Transport',
      amount: 18.2,
      date: dayISO(-1),
    },
    {
      id: 't4',
      kind: 'expense',
      merchant: t('sample.txRent'),
      category: 'Home',
      amount: 980,
      date: dayISO(-3),
    },
    {
      id: 't5',
      kind: 'expense',
      merchant: 'Netflix',
      category: 'Entertainment',
      amount: 15.99,
      date: dayISO(-2),
    },
    {
      id: 't6',
      kind: 'expense',
      merchant: t('sample.txClothes'),
      category: 'Shopping',
      amount: 124.5,
      date: dayISO(-5),
    },
    {
      id: 't7',
      kind: 'expense',
      merchant: t('sample.txPharmacy'),
      category: 'Health',
      amount: 32.1,
      date: dayISO(-6),
    },
  ];
}

function habitCompletions(pattern: number[]): Record<string, boolean> {
  // pattern: offsets (negative) that are completed within the last 30 days
  const map: Record<string, boolean> = {};
  pattern.forEach((o) => {
    map[dayISO(o)] = true;
  });
  return map;
}

export function buildHabits(t: T): Habit[] {
  const daily = t('sample.cadenceDaily');
  return [
    {
      id: 'h1',
      name: t('sample.habitRun'),
      cadence: daily,
      color: '#2D7A4F',
      reminderTime: '07:00',
      completions: habitCompletions([0, -1, -2, -4, -6, -7, -9, -11, -14]),
    },
    {
      id: 'h2',
      name: t('sample.habitRead'),
      cadence: daily,
      color: '#2C5F8A',
      reminderTime: '21:00',
      completions: habitCompletions([0, -1, -3, -4, -5, -8, -10, -12]),
    },
    {
      id: 'h3',
      name: t('sample.habitWater'),
      cadence: daily,
      color: '#3A5A8A',
      completions: habitCompletions([0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10]),
    },
    {
      id: 'h4',
      name: t('sample.habitMeditate'),
      cadence: daily,
      color: '#6B4C8A',
      completions: habitCompletions([-1, -2, -5, -6, -9]),
    },
  ];
}

export function buildTasks(t: T): Task[] {
  return [
    {
      id: 'k1',
      name: t('sample.taskReport'),
      project: t('sample.projectWork'),
      priority: 'high',
      status: 'inprogress',
      due: isoAt(0, 17, 0),
      done: false,
    },
    {
      id: 'k2',
      name: t('sample.taskDentist'),
      project: t('sample.projectPersonal'),
      priority: 'high',
      status: 'todo',
      due: isoAt(0, 11, 30),
      done: false,
    },
    {
      id: 'k3',
      name: t('sample.taskPRs'),
      project: t('sample.projectWork'),
      priority: 'medium',
      status: 'todo',
      due: isoAt(0, 14, 0),
      done: false,
    },
    {
      id: 'k4',
      name: t('sample.taskTrip'),
      project: t('sample.projectPersonal'),
      priority: 'low',
      status: 'todo',
      due: isoAt(2, 9, 0),
      done: false,
    },
    {
      id: 'k5',
      name: t('sample.taskEmail'),
      project: t('sample.projectWork'),
      priority: 'medium',
      status: 'done',
      due: isoAt(-1, 16, 0),
      done: true,
    },
    {
      id: 'k6',
      name: t('sample.taskGroceries'),
      project: t('sample.projectHome'),
      priority: 'low',
      status: 'done',
      due: isoAt(-1, 18, 0),
      done: true,
    },
  ];
}

export function buildGoals(t: T): Goal[] {
  return [
    {
      id: 'g1',
      name: t('sample.goalSave'),
      deadline: dayISO(120),
      progress: 64,
      milestones: [
        { id: 'm1', label: '€1k', done: true },
        { id: 'm2', label: '€2.5k', done: true },
        { id: 'm3', label: '€4k', done: false },
        { id: 'm4', label: '€5k', done: false },
      ],
    },
    {
      id: 'g2',
      name: t('sample.goalMarathon'),
      deadline: dayISO(60),
      progress: 38,
      milestones: [
        { id: 'm5', label: '5k', done: true },
        { id: 'm6', label: '10k', done: false },
        { id: 'm7', label: '15k', done: false },
        { id: 'm8', label: '21k', done: false },
      ],
    },
    {
      id: 'g3',
      name: t('sample.goalBooks'),
      deadline: dayISO(200),
      progress: 100,
      milestones: [
        { id: 'm9', label: '6', done: true },
        { id: 'm10', label: '12', done: true },
        { id: 'm11', label: '18', done: true },
        { id: 'm12', label: '24', done: true },
      ],
    },
  ];
}

export function buildPlanner(t: T): PlannerEvent[] {
  return [
    {
      id: 'p1',
      title: t('sample.planStandup'),
      day: 0,
      weekOffset: 0,
      startHour: 9,
      durationHours: 1,
      color: '#2C5F8A',
    },
    {
      id: 'p2',
      title: t('sample.planDeepWork'),
      day: 0,
      weekOffset: 0,
      startHour: 10,
      durationHours: 3,
      color: '#6B4C8A',
    },
    {
      id: 'p3',
      title: t('sample.planGym'),
      day: 1,
      weekOffset: 0,
      startHour: 18,
      durationHours: 1,
      color: '#8A3A3A',
    },
    {
      id: 'p4',
      title: t('sample.planDesignReview'),
      day: 2,
      weekOffset: 0,
      startHour: 14,
      durationHours: 2,
      color: '#B8860B',
    },
    {
      id: 'p5',
      title: t('sample.planDinner'),
      day: 4,
      weekOffset: 0,
      startHour: 19,
      durationHours: 2,
      color: '#8A4A2F',
    },
  ];
}

function sleepMinutes(h: number, m: number) {
  return h * 60 + m;
}

export const seedSleep: SleepEntry[] = [
  {
    id: 's1',
    date: dayISO(0),
    durationMinutes: sleepMinutes(7, 23),
    quality: 4,
    bedtime: '23:10',
    wake: '06:33',
  },
  {
    id: 's2',
    date: dayISO(-1),
    durationMinutes: sleepMinutes(6, 50),
    quality: 3,
    bedtime: '23:45',
    wake: '06:35',
  },
  {
    id: 's3',
    date: dayISO(-2),
    durationMinutes: sleepMinutes(8, 12),
    quality: 5,
    bedtime: '22:30',
    wake: '06:42',
  },
  {
    id: 's4',
    date: dayISO(-3),
    durationMinutes: sleepMinutes(7, 5),
    quality: 4,
    bedtime: '23:20',
    wake: '06:25',
  },
  {
    id: 's5',
    date: dayISO(-4),
    durationMinutes: sleepMinutes(6, 30),
    quality: 2,
    bedtime: '00:10',
    wake: '06:40',
  },
  {
    id: 's6',
    date: dayISO(-5),
    durationMinutes: sleepMinutes(7, 40),
    quality: 4,
    bedtime: '22:55',
    wake: '06:35',
  },
  {
    id: 's7',
    date: dayISO(-6),
    durationMinutes: sleepMinutes(8, 42),
    quality: 5,
    bedtime: '22:10',
    wake: '06:52',
  },
];

export function buildWorkouts(t: T): Workout[] {
  return [
    { id: 'w1', name: t('sample.workoutRun'), date: dayISO(0), durationMinutes: 32, kcal: 410 },
    { id: 'w2', name: t('sample.workoutUpper'), date: dayISO(-2), durationMinutes: 48, kcal: 380 },
    { id: 'w3', name: t('sample.workoutYoga'), date: dayISO(-4), durationMinutes: 40, kcal: 220 },
    { id: 'w4', name: t('sample.workoutHiit'), date: dayISO(-5), durationMinutes: 25, kcal: 230 },
  ];
}

export function buildMood(t: T): MoodEntry[] {
  return [
    { id: 'mo1', date: dayISO(0), mood: 4, note: t('sample.moodProductive') },
    { id: 'mo2', date: dayISO(-1), mood: 3, note: '' },
    { id: 'mo3', date: dayISO(-2), mood: 5, note: t('sample.moodFriends') },
    { id: 'mo4', date: dayISO(-3), mood: 2, note: t('sample.moodTired') },
    { id: 'mo5', date: dayISO(-4), mood: 4, note: '' },
    { id: 'mo6', date: dayISO(-5), mood: 3, note: '' },
    { id: 'mo7', date: dayISO(-6), mood: 4, note: t('sample.moodRelaxed') },
  ];
}

export const seedWater: WaterEntry[] = [
  { id: 'wa1', date: isoAt(0, 8, 30), glasses: 1 },
  { id: 'wa2', date: isoAt(0, 11, 0), glasses: 2 },
  { id: 'wa3', date: isoAt(0, 14, 0), glasses: 1 },
  { id: 'wa4', date: isoAt(-1, 9, 0), glasses: 3 },
  { id: 'wa5', date: isoAt(-1, 16, 0), glasses: 4 },
  { id: 'wa6', date: isoAt(-2, 10, 0), glasses: 5 },
  { id: 'wa7', date: isoAt(-3, 12, 0), glasses: 6 },
];

export const seedWeight: WeightEntry[] = [
  { id: 'we1', date: dayISO(0), kg: 74.2 },
  { id: 'we2', date: dayISO(-3), kg: 74.6 },
  { id: 'we3', date: dayISO(-7), kg: 75.1 },
  { id: 'we4', date: dayISO(-14), kg: 75.8 },
  { id: 'we5', date: dayISO(-21), kg: 76.3 },
  { id: 'we6', date: dayISO(-30), kg: 77.0 },
];

export function buildMeditation(t: T): MeditationSession[] {
  return [
    { id: 'md1', date: dayISO(0), durationMinutes: 10, kind: t('sample.medMindfulness') },
    { id: 'md2', date: dayISO(-1), durationMinutes: 15, kind: t('sample.medBreathing') },
    { id: 'md3', date: dayISO(-2), durationMinutes: 10, kind: t('sample.medMindfulness') },
    { id: 'md4', date: dayISO(-4), durationMinutes: 20, kind: t('sample.medBodyScan') },
    { id: 'md5', date: dayISO(-5), durationMinutes: 12, kind: t('sample.medMindfulness') },
  ];
}

export function buildCustom(t: T): CustomTracker[] {
  return [
    {
      id: 'c1',
      name: t('sample.customWaterName'),
      description: t('sample.customWaterDesc'),
      icon: 'gauge',
      color: '#3A5A8A',
      type: 'number',
      reminder: true,
      reminderTime: '09:00',
      logs: [
        { id: 'cl1', value: 6, date: dayISO(0) },
        { id: 'cl2', value: 8, date: dayISO(-1) },
        { id: 'cl3', value: 5, date: dayISO(-2) },
      ],
    },
  ];
}

export function buildNotifications(t: T): AppNotification[] {
  return [
    {
      id: 'n1',
      tracker: 'habits',
      title: t('sample.notifHabitTitle'),
      message: t('sample.notifHabitMsg'),
      time: isoAt(0, 7, 0),
      read: false,
    },
    {
      id: 'n2',
      tracker: 'finance',
      title: t('sample.notifExpenseTitle'),
      message: t('sample.notifExpenseMsg'),
      time: isoAt(0, 13, 12),
      read: false,
    },
    {
      id: 'n3',
      tracker: 'tasks',
      title: t('sample.notifTasksTitle'),
      message: t('sample.notifTasksMsg'),
      time: isoAt(0, 8, 30),
      read: true,
    },
    {
      id: 'n4',
      tracker: 'sleep',
      title: t('sample.notifSleepTitle'),
      message: t('sample.notifSleepMsg'),
      time: isoAt(-6, 7, 0),
      read: true,
    },
    {
      id: 'n5',
      tracker: 'goals',
      title: t('sample.notifGoalTitle'),
      message: t('sample.notifGoalMsg'),
      time: isoAt(-3, 10, 0),
      read: true,
    },
  ];
}

export const seedAchievements: Achievement[] = [
  { id: 'a1', name: 'First Step', unlocked: true },
  { id: 'a2', name: '7-Day Streak', unlocked: true },
  { id: 'a3', name: 'Early Bird', unlocked: true },
  { id: 'a4', name: 'Budget Boss', unlocked: true },
  { id: 'a5', name: 'Goal Getter', unlocked: true },
  { id: 'a6', name: 'Night Owl', unlocked: true },
  { id: 'a7', name: 'Iron Will', unlocked: true },
  { id: 'a8', name: 'Bookworm', unlocked: true },
  { id: 'a9', name: 'Marathoner', unlocked: true },
  { id: 'a10', name: 'Centurion', unlocked: true },
  { id: 'a11', name: 'Perfect Week', unlocked: true },
  { id: 'a12', name: 'Consistency King', unlocked: true },
  { id: 'a13', name: '30-Day Streak', unlocked: false },
  { id: 'a14', name: 'Millionaire Mindset', unlocked: false },
  { id: 'a15', name: 'Zen Master', unlocked: false },
  { id: 'a16', name: 'Power Lifter', unlocked: false },
  { id: 'a17', name: 'Sleep Champion', unlocked: false },
  { id: 'a18', name: 'Task Terminator', unlocked: false },
];
