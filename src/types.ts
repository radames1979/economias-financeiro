export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  costCenterId?: string;
  accountId: string;
  toAccountId?: string;
  userId: string;
  createdAt: any;
  updatedAt?: any;
  consolidated: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  userId: string;
  parentId?: string;
  monthlyBudget?: number;
}

export type Frequency = 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  frequency: Frequency;
  startDate: string;
  lastProcessedDate?: string;
  categoryId: string;
  costCenterId?: string;
  accountId: string;
  userId: string;
  active: boolean;
}
