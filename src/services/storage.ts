import { openDB, IDBPDatabase } from 'idb';
import { Transaction, Budget, Category, Goal } from '../types';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB('fimply', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function saveTransaction(t: Transaction): Promise<void> {
  const db = await getDb();
  await db.put('transactions', t);
}

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  const db = await getDb();
  const all = await db.getAll('transactions') as Transaction[];
  return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
  const db = await getDb();
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const all = await db.getAll('transactions') as Transaction[];
  return all
    .filter(t => t.date >= start && t.date <= end)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('transactions', id);
}

export async function updateTransactionCategory(id: string, category: Category): Promise<void> {
  const db = await getDb();
  const tx = await db.get('transactions', id) as Transaction | undefined;
  if (tx) await db.put('transactions', { ...tx, category });
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function saveBudget(b: Budget): Promise<void> {
  const db = await getDb();
  await db.put('budgets', b);
}

async function getTotalByCategory(month: number, year: number): Promise<Partial<Record<Category, number>>> {
  const txs = await getTransactionsByMonth(month, year);
  const result: Partial<Record<Category, number>> = {};
  for (const t of txs) {
    if (t.amount >= 0) continue;
    result[t.category] = (result[t.category] ?? 0) + Math.abs(t.amount);
  }
  return result;
}

export async function getBudgets(month: number, year: number): Promise<Budget[]> {
  const db = await getDb();
  const all = await db.getAll('budgets') as Budget[];
  const monthBudgets = all.filter(b => b.month === month && b.year === year);
  const totals = await getTotalByCategory(month, year);
  return monthBudgets.map(b => ({ ...b, spent: totals[b.category] ?? 0 }));
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDb();
  const val = await db.get('settings', key);
  return (val as string | undefined) ?? defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.put('settings', value, key);
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function saveGoal(g: Goal): Promise<void> {
  const db = await getDb();
  await db.put('goals', g);
}

export async function getActiveGoal(): Promise<Goal | null> {
  const db = await getDb();
  const all = await db.getAll('goals') as Goal[];
  if (!all.length) return null;
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('goals', id);
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.clear('transactions');
  await db.clear('budgets');
  await db.clear('settings');
}
