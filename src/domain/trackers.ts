import type { Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  Brain,
  CalendarDays,
  CheckSquare,
  Droplet,
  Moon,
  Repeat2,
  Scale,
  SlidersHorizontal,
  Smile,
  Target,
  Wallet,
} from 'lucide-react-native';

export type TrackerKey =
  | 'finance'
  | 'habits'
  | 'tasks'
  | 'goals'
  | 'planner'
  | 'sleep'
  | 'fitness'
  | 'mood'
  | 'water'
  | 'weight'
  | 'meditation'
  | 'custom';

export interface TrackerMeta {
  key: TrackerKey;
  name: string;
  description: string;
  color: string;
  icon: LucideIcon;
  route: Href;
}

export const TRACKERS: TrackerMeta[] = [
  {
    key: 'finance',
    name: 'Finance',
    description: 'Track income & spending',
    color: '#B8860B',
    icon: Wallet,
    route: '/tracker/finance',
  },
  {
    key: 'habits',
    name: 'Habits',
    description: 'Build daily routines',
    color: '#2D7A4F',
    icon: Repeat2,
    route: '/tracker/habits',
  },
  {
    key: 'tasks',
    name: 'Tasks',
    description: 'Stay on top of to-dos',
    color: '#2C5F8A',
    icon: CheckSquare,
    route: '/tracker/tasks',
  },
  {
    key: 'goals',
    name: 'Goals',
    description: 'Reach milestones',
    color: '#6B4C8A',
    icon: Target,
    route: '/tracker/goals',
  },
  {
    key: 'planner',
    name: 'Planner',
    description: 'Plan your week',
    color: '#8A4A2F',
    icon: CalendarDays,
    route: '/tracker/planner',
  },
  {
    key: 'sleep',
    name: 'Sleep',
    description: 'Monitor your rest',
    color: '#3A5A8A',
    icon: Moon,
    route: '/tracker/sleep',
  },
  {
    key: 'fitness',
    name: 'Fitness',
    description: 'Log your workouts',
    color: '#8A3A3A',
    icon: Activity,
    route: '/tracker/fitness',
  },
  {
    key: 'mood',
    name: 'Mood',
    description: 'Check in with how you feel',
    color: '#C77D3A',
    icon: Smile,
    route: '/tracker/mood',
  },
  {
    key: 'water',
    name: 'Water',
    description: 'Stay hydrated daily',
    color: '#2F8FA8',
    icon: Droplet,
    route: '/tracker/water',
  },
  {
    key: 'weight',
    name: 'Weight',
    description: 'Track body weight trend',
    color: '#5A7A4A',
    icon: Scale,
    route: '/tracker/weight',
  },
  {
    key: 'meditation',
    name: 'Meditation',
    description: 'Build a mindful streak',
    color: '#7A6AA8',
    icon: Brain,
    route: '/tracker/meditation',
  },
  {
    key: 'custom',
    name: 'Custom',
    description: 'Track anything',
    color: '#4A4A4A',
    icon: SlidersHorizontal,
    route: '/tracker/custom',
  },
];

// Plain object literal — TypeScript validates all keys are present; no assertion needed.
export const TRACKER_MAP: Record<TrackerKey, TrackerMeta> = {
  finance: TRACKERS[0],
  habits: TRACKERS[1],
  tasks: TRACKERS[2],
  goals: TRACKERS[3],
  planner: TRACKERS[4],
  sleep: TRACKERS[5],
  fitness: TRACKERS[6],
  mood: TRACKERS[7],
  water: TRACKERS[8],
  weight: TRACKERS[9],
  meditation: TRACKERS[10],
  custom: TRACKERS[11],
};

/** Raw hex palette for use in non-className contexts (icons, charts, SVG). */
export const COLORS = {
  bg: '#F7F5F0',
  surface: '#FFFFFF',
  surface2: '#F0EDE8',
  border: '#E5E1DA',
  text: '#141210',
  muted: '#8A8480',
  faint: '#C5C0BA',
  ink: '#1A1A1A',
  destructive: '#C0392B',
  success: '#2D7A4F',
} as const;

/** Convert a hex color to rgba with the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
