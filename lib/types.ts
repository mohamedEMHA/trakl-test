import type { TrackerKey } from './trackers';

// ---------- Onboarding / profile ----------
export type FocusKey = 'save' | 'habits' | 'productive' | 'all';

export interface Profile {
  name: string;
  avatarEmoji: string;
  avatarImage?: string; // local file URI from image picker (optional)
  language: string;
  focus: FocusKey;
  memberSince: string; // ISO date
}

// ---------- Finance ----------
export type TxKind = 'income' | 'expense';
export interface Transaction {
  id: string;
  kind: TxKind;
  merchant: string;
  category: string;
  amount: number; // positive number
  date: string; // ISO
}

// ---------- Habits ----------
export interface Habit {
  id: string;
  name: string;
  cadence: string; // "Daily"
  color: string;
  // map of ISO date -> completed
  completions: Record<string, boolean>;
  // optional daily reminder "HH:mm"; undefined = no reminder
  reminderTime?: string;
}

// ---------- Tasks ----------
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export interface Task {
  id: string;
  name: string;
  project: string;
  priority: Priority;
  status: TaskStatus;
  due: string; // ISO
  done: boolean;
  /** ISO timestamp of when the task was last marked done. Optional for backward compat. */
  completedAt?: string;
}

// ---------- Goals ----------
export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}
export interface Goal {
  id: string;
  name: string;
  deadline: string; // ISO
  progress: number; // 0-100
  milestones: Milestone[];
}

// ---------- Planner ----------
export interface PlannerEvent {
  id: string;
  title: string;
  day: number; // 0-6 (Mon-Sun)
  weekOffset: number; // 0 = current week, -1 = previous, +1 = next
  startHour: number; // 6-22
  durationHours: number;
  color: string;
}

// ---------- Sleep ----------
export interface SleepEntry {
  id: string;
  date: string; // ISO
  durationMinutes: number;
  quality: number; // 1-5
  bedtime: string; // "23:10"
  wake: string; // "06:33"
}

// ---------- Fitness ----------
export interface Workout {
  id: string;
  name: string;
  date: string; // ISO
  durationMinutes: number;
  kcal: number;
}

// ---------- Mood ----------
export interface MoodEntry {
  id: string;
  date: string; // ISO
  /** 1 (awful) .. 5 (great) */
  mood: number;
  note: string;
}

// ---------- Water ----------
export interface WaterEntry {
  id: string;
  date: string; // ISO
  /** glasses logged in this entry */
  glasses: number;
}

// ---------- Weight ----------
export interface WeightEntry {
  id: string;
  date: string; // ISO
  /** weight in kilograms */
  kg: number;
}

// ---------- Meditation ----------
export interface MeditationSession {
  id: string;
  date: string; // ISO
  durationMinutes: number;
  kind: string; // e.g. "Mindfulness"
}

// ---------- Custom trackers ----------
export type CustomType = 'number' | 'yesno' | 'scale' | 'duration' | 'counter';
export interface CustomLog {
  id: string;
  value: number; // number value, 0/1 for yesno, 1-10 for scale, minutes for duration, count for counter
  date: string; // ISO
}
export interface CustomTracker {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide name key
  color: string;
  type: CustomType;
  reminder: boolean;
  reminderTime: string;
  logs: CustomLog[];
}

// ---------- Notifications ----------
export interface AppNotification {
  id: string;
  tracker: TrackerKey;
  title: string;
  message: string;
  time: string; // ISO
  read: boolean;
}

// ---------- Achievements ----------
export interface Achievement {
  id: string;
  name: string;
  unlocked: boolean;
}
