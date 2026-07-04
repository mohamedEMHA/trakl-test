/**
 * Shared formatting + input helpers for custom trackers.
 *
 * Centralizes how a CustomLog value is rendered per CustomType so the builder,
 * the detail screen, and the trackers hub all stay in sync (previously this
 * logic was duplicated and drifted across three files).
 */

import type { TFunction } from 'i18next';

import type { CustomType } from '@/lib/types';

/** Format minutes as a compact duration, e.g. 75 → "1h 15m", 40 → "40m". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Render a stored log value for display, given the tracker's type. */
export function formatLogValue(type: CustomType, value: number, t: TFunction): string {
  if (type === 'yesno') return value >= 1 ? t('forms.yes') : t('forms.no');
  if (type === 'scale') return `${value}/10`;
  if (type === 'duration') return formatDuration(value);
  if (type === 'counter') return String(Math.round(value));
  return String(value);
}

/** Whether logging this type opens a value form (false → one-tap quick log). */
export function typeNeedsForm(type: CustomType): boolean {
  return type !== 'counter';
}
