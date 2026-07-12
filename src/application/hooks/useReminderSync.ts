import { useEffect, useRef } from 'react';

import { configureNotificationHandler, syncReminders } from '@/src/infrastructure/services/notifications';
import { useTrakl } from '@/src/application/store';

/**
 * Keeps on-device local notifications in sync with the store.
 *
 * Re-schedules reminders whenever the reminder-bearing data changes
 * (habits, tasks, custom trackers) or the user toggles notifications.
 * Runs only after the persisted store has hydrated, so we never schedule
 * against stale seed data on cold start.
 */
export function useReminderSync(): void {
  const hydrated = useTrakl((s) => s.hydrated);
  const enabled = useTrakl((s) => s.notificationsEnabled);
  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const customTrackers = useTrakl((s) => s.customTrackers);

  // Configure the foreground presentation handler once.
  useEffect(() => {
    configureNotificationHandler();
  }, []);

  // Serialize schedule runs. A naive boolean guard that *drops* a run while
  // another is in flight causes two problems: (1) the latest state can be lost,
  // and (2) two runs starting near-simultaneously each do cancel-then-reschedule
  // and can race into scheduling duplicate notifications. Instead we chain every
  // request onto a single promise so runs execute strictly one after another,
  // and always run the most recent snapshot last.
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = { habits, tasks, customTrackers };
    chain.current = chain.current
      .catch(() => undefined)
      .then(() => syncReminders(snapshot, enabled))
      .then(() => undefined);
  }, [hydrated, enabled, habits, tasks, customTrackers]);
}
