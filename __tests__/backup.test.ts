import { describe, it, expect } from '@jest/globals';

import { createBackup, parseBackup, BACKUP_VERSION } from '@/lib/backup';
import type { TraklState } from '@/lib/store';

const baseState: Pick<
  TraklState,
  | 'onboarded'
  | 'enabledTrackers'
  | 'pinnedTrackers'
  | 'profile'
  | 'transactions'
  | 'habits'
  | 'tasks'
  | 'goals'
  | 'planner'
  | 'sleep'
  | 'workouts'
  | 'mood'
  | 'water'
  | 'weight'
  | 'meditation'
  | 'customTrackers'
  | 'notifications'
  | 'achievements'
  | 'monthlyBudget'
  | 'notificationsEnabled'
  | 'waterGoal'
> = {
  onboarded: true,
  enabledTrackers: ['finance', 'habits', 'tasks'],
  pinnedTrackers: ['finance'],
  profile: {
    name: 'Alex',
    avatarEmoji: '🚀',
    language: 'en',
    focus: 'all',
    memberSince: '2024-01-01T00:00:00.000Z',
  },
  transactions: [
    { id: 't1', kind: 'income', amount: 1000, merchant: 'Salary', category: 'Income', date: '2024-01-01' },
  ],
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
  monthlyBudget: 1500,
  notificationsEnabled: false,
  waterGoal: 10,
};

describe('createBackup', () => {
  it('produces valid JSON with the expected version marker', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const json = createBackup(baseState as unknown as TraklState);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(BACKUP_VERSION);
    expect(parsed.exportedAt).toMatch(/^\d{4}-/);
    expect(parsed.profile.name).toBe('Alex');
    expect(parsed.transactions).toHaveLength(1);
    expect(parsed.monthlyBudget).toBe(1500);
  });
});

describe('parseBackup', () => {
  it('accepts a valid backup and returns its data', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const json = createBackup(baseState as unknown as TraklState);
    const result = parseBackup(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.profile.name).toBe('Alex');
    expect(result.data.transactions[0].amount).toBe(1000);
  });

  it('rejects invalid JSON', () => {
    const result = parseBackup('not-json');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not valid JSON/);
  });

  it('rejects backups with the wrong version', () => {
    const result = parseBackup(JSON.stringify({ version: 'old', exportedAt: new Date().toISOString() }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Unsupported backup version/);
  });

  it('rejects backups missing required arrays', () => {
    const result = parseBackup(JSON.stringify({ version: BACKUP_VERSION, exportedAt: new Date().toISOString() }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/must be an array/);
  });
});
