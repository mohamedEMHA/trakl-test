import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CONSENT_KEY = 'trakl-gdpr-consent-v1';

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

/**
 * Get the user's current GDPR/UMP consent status.
 * Returns 'unknown' if not yet determined, 'granted' if consented, 'denied' if rejected.
 */
export async function getConsentStatus(): Promise<ConsentStatus> {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    if (stored === 'granted' || stored === 'denied') {
      return stored;
    }
  } catch {
    // ignore read errors
  }
  return 'unknown';
}

/**
 * Set the user's GDPR/UMP consent status.
 * Call this after the user responds to the consent prompt.
 */
export async function setConsentStatus(status: ConsentStatus): Promise<void> {
  try {
    if (status === 'unknown') {
      await AsyncStorage.removeItem(CONSENT_KEY);
    } else {
      await AsyncStorage.setItem(CONSENT_KEY, status);
    }
  } catch {
    // non-fatal: persistence failure shouldn't block the app
  }
}

/**
 * Check if we should show the UMP consent prompt.
 * Returns true if consent is unknown (first time or cleared).
 * Web and Expo Go don't need consent (no real ads).
 */
export function shouldShowConsentPrompt(): boolean {
  if (Platform.OS === 'web') return false;
  // In a real app, you'd check the execution environment here
  // For now, we'll show the prompt on native platforms
  return true;
}
