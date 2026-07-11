import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { useTrakl } from '@/lib/store';
import { createBackup } from '@/lib/backup';

function resetData() {
  return {
    transactions: [],
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
    monthlyBudget: 0,
  };
}

describe('Store: Transactions', () => {
  beforeEach(() => {
    useTrakl.setState(resetData());
  });

  it('should add a transaction', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.addTransaction({
        kind: 'expense',
        amount: 50.5,
        merchant: 'Coffee Shop',
        category: 'Food',
        date: new Date().toISOString(),
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].merchant).toBe('Coffee Shop');
    expect(result.current.transactions[0].amount).toBe(50.5);
  });

  it('should delete a transaction', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.addTransaction({
        kind: 'expense',
        amount: 50,
        merchant: 'Store',
        category: 'Shopping',
        date: new Date().toISOString(),
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    const txId = result.current.transactions[0].id;

    act(() => {
      result.current.deleteTransaction(txId);
    });

    expect(result.current.transactions).toHaveLength(0);
  });
});

describe('Store: Habits', () => {
  beforeEach(() => {
    useTrakl.setState(resetData());
  });

  it('should add a habit', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.addHabit('Morning Run', '#f0c061');
    });

    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].name).toBe('Morning Run');
  });

  it('should toggle a habit completion for today', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.addHabit('Morning Run', '#f0c061');
    });
    const habitId = result.current.habits[0].id;
    const today = new Date().toISOString().slice(0, 10);

    act(() => {
      result.current.toggleHabitToday(habitId);
    });

    expect(result.current.habits[0].completions[today]).toBe(true);

    act(() => {
      result.current.toggleHabitToday(habitId);
    });

    expect(result.current.habits[0].completions[today]).toBeFalsy();
  });
});

describe('Store: Tasks', () => {
  beforeEach(() => {
    useTrakl.setState(resetData());
  });

  it('should add a task', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.addTask({
        name: 'Buy groceries',
        project: 'Personal',
        priority: 'medium',
        due: new Date().toISOString(),
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].name).toBe('Buy groceries');
    expect(result.current.tasks[0].done).toBe(false);
  });

  it('should toggle a task completion', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.addTask({
        name: 'Buy groceries',
        project: 'Personal',
        priority: 'medium',
        due: new Date().toISOString(),
      });
    });
    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.toggleTask(taskId);
    });

    expect(result.current.tasks[0].done).toBe(true);
    expect(result.current.tasks[0].completedAt).toBeDefined();
  });
});

describe('Store: Profile', () => {
  it('should update profile', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.updateProfile({
        name: 'John Doe',
        avatarEmoji: '🦊',
      });
    });

    expect(result.current.profile.name).toBe('John Doe');
    expect(result.current.profile.avatarEmoji).toBe('🦊');
  });

  it('should set monthly budget', () => {
    const { result } = renderHook(() => useTrakl());

    act(() => {
      result.current.setMonthlyBudget(2000);
    });

    expect(result.current.monthlyBudget).toBe(2000);
  });

  it('should import a backup and restore state', () => {
    const { result } = renderHook(() => useTrakl());

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const backup = createBackup({
      ...result.current,
      profile: { ...result.current.profile, name: 'Imported User' },
      monthlyBudget: 1234,
      transactions: [
        { id: 'tx1', kind: 'income', amount: 500, merchant: 'Gift', category: 'Income', date: '2024-01-01' },
      ],
    } as unknown as Parameters<typeof createBackup>[0]);

    act(() => {
      result.current.importAppData(backup);
    });

    expect(result.current.profile.name).toBe('Imported User');
    expect(result.current.monthlyBudget).toBe(1234);
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].merchant).toBe('Gift');
  });

  it('should reject an invalid backup import', () => {
    const { result } = renderHook(() => useTrakl());

    let res: { success: boolean; message: string } = { success: true, message: '' };
    act(() => {
      res = result.current.importAppData('not-valid');
    });

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/not valid JSON/);
  });
});
