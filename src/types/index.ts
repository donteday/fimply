export type TransactionType = 'expense' | 'income' | 'transfer';

export type Category =
  | 'food'
  | 'cafe'
  | 'transport'
  | 'health'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'salary'
  | 'transfer'
  | 'other';

export interface Transaction {
  id: string;
  amount: number; // positive = income, negative = expense
  category: Category;
  merchant: string;
  description: string;
  source: 'sms' | 'push' | 'voice' | 'manual';
  date: string; // ISO string
  confirmed: boolean;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  spent: number;
  month: number;
  year: number;
}

export interface ParsedTransaction {
  amount: number;
  category: Category;
  merchantClean: string;
  description: string;
}
