import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CONSENT_KEY = 'trakl-gdpr-consent-v1';

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

/**
 * Get the user's current GDPR/UMP consent status from local cache.
 * This is a local mirror of the UMP SDK's status — the source of truth
 * is the SDK itself, but we cache it so AdBanner doesn't need to call
 * the SDK on every render.
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
 * Set the user's GDPR/UMP consent status locally.
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
 * Request UMP consent via the official Google AdsConsent SDK.
 * On web/Expo Go (no native module), returns 'granted' (no ads shown anyway).
 * On native, calls AdsConsent.requestInfoUpdate() and shows the UMP form
 * if consent is required. The ATT prompt on iOS is handled by the UMP SDK
 * when user_tracking_usage_description is set in app.config.ts.
 *
 * Returns the resolved consent status ('granted' | 'denied').
 */
export async function requestAndShowConsent(): Promise<ConsentStatus> {
  // Web: no native SDK, skip consent.
  if (Platform.OS === 'web') {
    return 'granted';
  }

  try {
    // Dynamic import so Expo Go doesn't crash on missing native module.
    const { AdsConsent, AdsConsentStatus } =
      await import('react-native-google-mobile-ads');

    const consentInfo = await AdsConsent.requestInfoUpdate();

    // If consent is required and a form is available, show it.
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      const formResult = await AdsConsent.showForm();
      const granted = formResult.status === AdsConsentStatus.OBTAINED;
      const status: ConsentStatus = granted ? 'granted' : 'denied';
      await setConsentStatus(status);
      return status;
    }

    // If consent is NOT_REQUIRED or already OBTAINED, treat as granted.
    if (
      consentInfo.status === AdsConsentStatus.NOT_REQUIRED ||
      consentInfo.status === AdsConsentStatus.OBTAINED
    ) {
      await setConsentStatus('granted');
      return 'granted';
    }

    // Unknown status — default to denied to be safe.
    await setConsentStatus('denied');
    return 'denied';
  } catch {
    // SDK not available (Expo Go) or error — allow ads to proceed
    // since no consent form could be shown. The AdBanner will still
    // fall back to placeholder if the native module is missing.
    return 'granted';
  }
}

/**
 * Check if we should show the consent prompt.
 * Returns true if consent hasn't been determined yet.
 */
export function shouldShowConsentPrompt(): boolean {
  if (Platform.OS === 'web') return false;
  return true;
}
