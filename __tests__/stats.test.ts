import { describe, it, expect } from '@jest/globals';
import {
  budgetLeft,
  habitsToday,
  tasksDueToday,
  lastSleepHours,
  lifeScore,
} from '@/lib/stats';
import type { Transaction, Habit, Task, SleepEntry, Goal } from '@/lib/types';

describe('Stats: Budget', () => {
  it('should calculate budget left correctly', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        kind: 'expense',
        amount: 100,
        merchant: 'Store',
        category: 'Shopping',
        date: new Date().toISOString(),
      },
      {
        id: '2',
        kind: 'expense',
        amount: 50,
        merchant: 'Cafe',
        category: 'Food',
        date: new Date().toISOString(),
      },
    ];

    const left = budgetLeft(transactions, 500);
    expect(left).toBe(350); // 500 - 100 - 50
  });

  it('should handle empty transactions', () => {
    const left = budgetLeft([], 1000);
    expect(left).toBe(1000);
  });

  it('should handle zero budget', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        kind: 'expense',
        amount: 50,
        merchant: 'Store',
        category: 'Shopping',
        date: new Date().toISOString(),
      },
    ];

    const left = budgetLeft(transactions, 0);
    expect(left).toBe(-50);
  });
});

describe('Stats: Habits', () => {
  it('should count habits done today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const habits: Habit[] = [
      {
        id: '1',
        name: 'Morning Run',
        cadence: 'Daily',
        color: '#f0c061',
        completions: { [today]: true },
      },
      {
        id: '2',
        name: 'Read',
        cadence: 'Daily',
        color: '#4a90d9',
        completions: {},
      },
    ];

    const result = habitsToday(habits);
    expect(result.done).toBe(1);
    expect(result.total).toBe(2);
  });

  it('should handle empty habits', () => {
    const result = habitsToday([]);
    expect(result.done).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('Stats: Tasks', () => {
  it('should count tasks due today', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        project: 'Work',
        priority: 'high',
        status: 'todo',
        due: today.toISOString(),
        done: false,
      },
      {
        id: '2',
        name: 'Task 2',
        project: 'Work',
        priority: 'medium',
        status: 'todo',
        due: tomorrow.toISOString(),
        done: false,
      },
    ];

    const count = tasksDueToday(tasks);
    expect(count).toBe(1);
  });

  it('should handle empty tasks', () => {
    const count = tasksDueToday([]);
    expect(count).toBe(0);
  });
});

describe('Stats: Sleep', () => {
  it('should get last sleep hours', () => {
    const sleep: SleepEntry[] = [
      {
        id: '1',
        date: new Date(Date.now() - 86400000).toISOString(), // yesterday
        durationMinutes: 450, // 7.5h
        quality: 4,
        bedtime: '23:00',
        wake: '06:30',
      },
      {
        id: '2',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        durationMinutes: 480, // 8h
        quality: 5,
        bedtime: '22:30',
        wake: '06:30',
      },
    ];

    const hours = lastSleepHours(sleep);
    expect(hours).toBe(7.5);
  });

  it('should return 0 for no sleep entries', () => {
    const hours = lastSleepHours([]);
    expect(hours).toBe(0);
  });
});

describe('Stats: Life Score', () => {
  it('should calculate life score', () => {
    const today = new Date().toISOString().slice(0, 10);
    const habits: Habit[] = [
      {
        id: '1',
        name: 'Morning Run',
        cadence: 'Daily',
        color: '#f0c061',
        completions: { [today]: true },
      },
    ];

    const tasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        project: 'Work',
        priority: 'high',
        status: 'done',
        due: new Date().toISOString(),
        done: true,
        completedAt: new Date().toISOString(),
      },
    ];

    const sleep: SleepEntry[] = [
      {
        id: '1',
        date: new Date().toISOString(),
        durationMinutes: 480,
        quality: 5,
        bedtime: '22:30',
        wake: '06:30',
      },
    ];

    const goals: Goal[] = [];
    const transactions: Transaction[] = [];

    const score = lifeScore({
      habits,
      tasks,
      sleep,
      goals,
      transactions,
      monthlyBudget: 1000,
      enabledTrackers: ['habits', 'tasks', 'sleep', 'goals', 'finance'],
    });

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should return null when no trackers enabled', () => {
    const score = lifeScore({
      habits: [],
      tasks: [],
      sleep: [],
      goals: [],
      transactions: [],
      monthlyBudget: 0,
      enabledTrackers: [],
    });

    expect(score).toBeNull();
  });
});
