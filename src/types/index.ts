
export type ThemeType = 'default' | 'purple' | 'blue' | 'green';

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
};

export type PaymentSource = {
  id: string;
  name: string;
  type: 'cash' | 'credit' | 'bank' | 'other';
  color?: string;
};

export type PaymentType = 'one-time' | 'installment';

export type Expense = {
  id: string;
  amount: number;
  date: string;
  time?: string;
  name: string;
  categoryId: string;
  paymentSourceId: string;
  paymentType: PaymentType;
  // For linking related expenses
  relatedExpenseId?: string;
  // For installment payments
  installmentNumber?: number;
  totalInstallments?: number;
  isInstallment?: boolean;
};
