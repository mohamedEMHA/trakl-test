import { Platform } from 'react-native';

/**
 * Web-safe + Expo-Go-safe haptics wrapper. `expo-haptics` is a native module;
 * accessing it on web is a no-op and in Expo Go it works, but we guard the
 * import defensively and swallow any error so a missing module never crashes a
 * tap handler.
 */
const isWeb = Platform.OS === 'web';

// Haptics are fully supported in Expo Go; only web lacks them. Keep the guard
// loose but defensive.
const disabled = isWeb;

type HapticsModule = typeof import('expo-haptics');

let mod: HapticsModule | null = null;
function load(): HapticsModule | null {
  if (disabled) return null;
  if (mod) return mod;
  try {
    // Lazy require so the native module is never evaluated on web.
    // oxlint-disable-next-line eslint-plugin-import/no-require-imports
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- require() returns any; unknown bridge is intentional
    mod = require('expo-haptics') as unknown as HapticsModule;
    return mod;
  } catch {
    return null;
  }
}

function run(fn: (m: HapticsModule) => void): void {
  const m = load();
  if (!m) return;
  try {
    fn(m);
  } catch {
    // ignore — haptics are non-critical
  }
}

/** Light tap — selection, toggles, tab changes. */
export function tapLight(): void {
  run((m) => void m.impactAsync(m.ImpactFeedbackStyle.Light));
}

/** Medium tap — primary buttons, confirming an action. */
export function tapMedium(): void {
  run((m) => void m.impactAsync(m.ImpactFeedbackStyle.Medium));
}

/** Heavy tap — destructive or high-emphasis actions. */
export function tapHeavy(): void {
  run((m) => void m.impactAsync(m.ImpactFeedbackStyle.Heavy));
}

/** Selection tick — moving through segmented controls / pickers. */
export function selection(): void {
  run((m) => void m.selectionAsync());
}

/** Success notification — completing a goal / unlocking an achievement. */
export function notifySuccess(): void {
  run((m) => void m.notificationAsync(m.NotificationFeedbackType.Success));
}

/** Warning notification — validation failure. */
export function notifyWarning(): void {
  run((m) => void m.notificationAsync(m.NotificationFeedbackType.Warning));
}

/** Error notification — destructive confirm / failure. */
export function notifyError(): void {
  run((m) => void m.notificationAsync(m.NotificationFeedbackType.Error));
}

export const haptics = {
  tapLight,
  tapMedium,
  tapHeavy,
  selection,
  notifySuccess,
  notifyWarning,
  notifyError,
};
