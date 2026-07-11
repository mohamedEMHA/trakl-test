import { Platform, Share } from 'react-native';

import type { TraklState } from './store';

export const BACKUP_VERSION = 'trakl-backup-v1';

export type BackupData = {
  version: string;
  exportedAt: string;
  onboarded: boolean;
  enabledTrackers: TraklState['enabledTrackers'];
  pinnedTrackers: TraklState['pinnedTrackers'];
  profile: TraklState['profile'];
  transactions: TraklState['transactions'];
  habits: TraklState['habits'];
  tasks: TraklState['tasks'];
  goals: TraklState['goals'];
  planner: TraklState['planner'];
  sleep: TraklState['sleep'];
  workouts: TraklState['workouts'];
  mood: TraklState['mood'];
  water: TraklState['water'];
  weight: TraklState['weight'];
  meditation: TraklState['meditation'];
  customTrackers: TraklState['customTrackers'];
  notifications: TraklState['notifications'];
  achievements: TraklState['achievements'];
  monthlyBudget: TraklState['monthlyBudget'];
  notificationsEnabled: TraklState['notificationsEnabled'];
  waterGoal: TraklState['waterGoal'];
};

const BACKUP_ARRAY_KEYS: (keyof BackupData)[] = [
  'transactions',
  'habits',
  'tasks',
  'goals',
  'planner',
  'sleep',
  'workouts',
  'mood',
  'water',
  'weight',
  'meditation',
  'customTrackers',
  'notifications',
  'achievements',
  'enabledTrackers',
  'pinnedTrackers',
];

/**
 * Serialize the current store state into a portable JSON backup.
 * Includes a version marker and timestamp so imports can be validated.
 */
export function createBackup(state: TraklState): string {
  const payload: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    onboarded: state.onboarded,
    enabledTrackers: state.enabledTrackers,
    pinnedTrackers: state.pinnedTrackers,
    profile: state.profile,
    transactions: state.transactions,
    habits: state.habits,
    tasks: state.tasks,
    goals: state.goals,
    planner: state.planner,
    sleep: state.sleep,
    workouts: state.workouts,
    mood: state.mood,
    water: state.water,
    weight: state.weight,
    meditation: state.meditation,
    customTrackers: state.customTrackers,
    notifications: state.notifications,
    achievements: state.achievements,
    monthlyBudget: state.monthlyBudget,
    notificationsEnabled: state.notificationsEnabled,
    waterGoal: state.waterGoal,
  };
  return JSON.stringify(payload, null, 2);
}

export type ParseResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string };

/**
 * Parse and validate a backup JSON string. Returns a typed BackupData when
 * valid, otherwise a human-readable error message.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseBackup(json: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'Invalid backup format' };
  }

  const version = parsed.version;
  if (version !== BACKUP_VERSION) {
    const versionLabel = typeof version === 'string' ? version : 'missing';
    return {
      ok: false,
      error: `Unsupported backup version: ${versionLabel}`,
    };
  }

  for (const key of BACKUP_ARRAY_KEYS) {
    if (!Array.isArray(parsed[key])) {
      return { ok: false, error: `Invalid backup: ${key} must be an array` };
    }
  }

  if (!isRecord(parsed.profile)) {
    return { ok: false, error: 'Invalid backup: profile is missing' };
  }

  if (typeof parsed.monthlyBudget !== 'number') {
    return { ok: false, error: 'Invalid backup: monthlyBudget is missing' };
  }

  // Backfill optional booleans/numbers with sane defaults if an older backup
  // omits them.
  if (typeof parsed.notificationsEnabled !== 'boolean') {
    parsed.notificationsEnabled = true;
  }
  if (typeof parsed.waterGoal !== 'number' || !Number.isFinite(parsed.waterGoal)) {
    parsed.waterGoal = 8;
  }
  if (typeof parsed.onboarded !== 'boolean') {
    parsed.onboarded = true;
  }

  // Fields validated above; casting the verified record to the public type.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { ok: true, data: (parsed as unknown) as BackupData };
}

/**
 * Suggest a filename for the backup based on the export timestamp.
 */
export function backupFileName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `trakl-backup-${stamp}.json`;
}

/**
 * Export the backup JSON. On web, triggers a file download. On native, opens the
 * system share sheet so the user can save it to Notes, Email, Files, etc.
 */
export async function shareBackup(json: string): Promise<void> {
  if (Platform.OS === 'web') {
    downloadBackup(json);
    return;
  }
  await Share.share({ message: json, title: 'TRAKL Backup' });
}

/**
 * Web-only: trigger a download of the JSON blob.
 */
export function downloadBackup(json: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
