import { useEffect } from 'react';
import { getTransactionsSecure, saveTransactionsSecure } from '@/src/infrastructure/storage/secureStorage';
import { useTrakl } from '@/src/application/store';

/**
 * Syncs transactions to encrypted secure storage whenever they change.
 * Runs after the store has hydrated to avoid overwriting persisted data.
 */
export function useTransactionSync(): void {
  const hydrated = useTrakl((s) => s.hydrated);
  const transactions = useTrakl((s) => s.transactions);

  // On mount, restore transactions from secure storage if available
  useEffect(() => {
    if (!hydrated) return;
    void getTransactionsSecure().then((secure) => {
      if (secure && secure.length > 0) {
        // Merge secure transactions with in-memory ones
        // (prefer secure storage as source of truth)
        const current = useTrakl.getState().transactions;
        if (current.length === 0) {
          useTrakl.setState({ transactions: secure });
        }
      }
    });
  }, [hydrated]);

  // Save transactions to secure storage whenever they change
  useEffect(() => {
    if (!hydrated) return;
    void saveTransactionsSecure(transactions);
  }, [hydrated, transactions]);
}
