
// Core data models that will be used across the application
// These will eventually map to database tables

export type ThemeType = 'default' | 'purple' | 'blue' | 'green';

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  user_id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentSource {
  id: string;
  name: string;
  type: 'cash' | 'credit' | 'bank' | 'other';
  user_id: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentType = 'one-time' | 'installment' | 'recurring';
export type RecurrenceType = 'monthly';

export interface Expense {
  id: string;
  amount: number;
  date: string;
  time?: string;
  name: string;
  categoryId: string;
  paymentSourceId: string;
  paymentType: PaymentType;
  user_id: string;
  // For linking related expenses
  relatedExpenseId?: string;
  // For installment payments
  installmentNumber?: number;
  totalInstallments?: number;
  isInstallment?: boolean;
  // For recurring payments
  isRecurring?: boolean;
  recurrenceId?: string;
  recurrenceType?: RecurrenceType;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

// User preferences/settings
export interface UserSettings {
  theme: ThemeType;
}
