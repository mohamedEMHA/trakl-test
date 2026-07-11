import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Transaction } from './types';

const TRANSACTIONS_KEY = 'trakl-transactions-secure';

/**
 * Encrypted storage for sensitive financial data (transactions).
 * Uses expo-secure-store on native (Keychain/Keystore), falls back to AsyncStorage on web.
 * On web, data is still stored in localStorage (not encrypted) — use HTTPS in production.
 */

export async function saveTransactionsSecure(transactions: Transaction[]): Promise<void> {
  try {
    const json = JSON.stringify(transactions);
    if (Platform.OS === 'web') {
      // Web fallback: store in localStorage (not encrypted, use HTTPS)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TRANSACTIONS_KEY, json);
      }
    } else {
      // Native: use secure keychain/keystore
      await SecureStore.setItemAsync(TRANSACTIONS_KEY, json);
    }
  } catch (error) {
    console.warn('[SecureStorage] Failed to save transactions:', error);
    // Non-fatal: the app should continue to work even if secure storage fails
  }
}

export async function getTransactionsSecure(): Promise<Transaction[] | null> {
  try {
    let json: string | null = null;
    if (Platform.OS === 'web') {
      // Web fallback
      if (typeof localStorage !== 'undefined') {
        json = localStorage.getItem(TRANSACTIONS_KEY);
      }
    } else {
      // Native: retrieve from secure keychain/keystore
      json = await SecureStore.getItemAsync(TRANSACTIONS_KEY);
    }
    if (!json) return null;
    return JSON.parse(json) as Transaction[];
  } catch (error) {
    console.warn('[SecureStorage] Failed to retrieve transactions:', error);
    return null;
  }
}

export async function deleteTransactionsSecure(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TRANSACTIONS_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TRANSACTIONS_KEY);
    }
  } catch (error) {
    console.warn('[SecureStorage] Failed to delete transactions:', error);
  }
}
