import { z } from 'zod';

/**
 * Validation schemas for user inputs across the app.
 * Used to ensure data integrity before persisting to store.
 */

export const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  emoji: z.string().emoji('Must be a valid emoji').optional(),
  imageUri: z.string().url().optional().or(z.literal('')),
  language: z.string().optional(),
  memberSince: z.string().datetime().optional(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  kind: z.enum(['expense', 'income']),
  amount: z.number().positive('Amount must be greater than 0').finite(),
  merchant: z.string().min(1, 'Merchant is required').max(100),
  category: z.string().min(1, 'Category is required'),
  date: z.string().datetime(),
});

export const HabitSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Habit name is required').max(100),
  cadence: z.enum(['daily', 'weekly']),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  logs: z.array(z.string().datetime()),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title is required').max(200),
  project: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  due: z.string().datetime().optional(),
  done: z.boolean(),
  completedAt: z.string().datetime().optional(),
});

export const GoalSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Goal title is required').max(200),
  target: z.number().positive('Target must be positive'),
  unit: z.string().max(50),
  progress: z.number().nonnegative(),
  deadline: z.string().datetime().optional(),
});

export const CustomTrackerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tracker name is required').max(100),
  type: z.enum(['number', 'yesno', 'scale', 'duration', 'counter']),
  unit: z.string().max(50).optional(),
  logs: z.array(
    z.object({
      date: z.string().datetime(),
      value: z.number(),
    }),
  ),
});

export const SleepEntrySchema = z.object({
  date: z.string().datetime(),
  hours: z.number().positive('Hours must be positive').max(24),
  quality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
});

export const WeightEntrySchema = z.object({
  date: z.string().datetime(),
  kg: z.number().positive('Weight must be positive').max(500),
});

export const WaterEntrySchema = z.object({
  date: z.string().datetime(),
  glasses: z.number().nonnegative().integer(),
});

export const WorkoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workout name is required').max(100),
  duration: z.number().positive('Duration must be positive'),
  date: z.string().datetime(),
  intensity: z.enum(['light', 'moderate', 'intense']).optional(),
});

export const MoodEntrySchema = z.object({
  date: z.string().datetime(),
  mood: z.enum(['terrible', 'bad', 'neutral', 'good', 'excellent']),
  note: z.string().max(500).optional(),
});

export const MeditationSessionSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().positive('Duration must be positive'),
  type: z.enum(['mindfulness', 'breathing', 'bodyscan']).optional(),
});
