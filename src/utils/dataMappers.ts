
import { Expense, ExpenseCategory, PaymentSource } from '@/types/models';

// Type for database models
interface DbExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  time?: string;
  category_id?: string;
  payment_source_id?: string;
  payment_type: string;
  related_expense_id?: string;
  installment?: boolean;
  installment_count?: number;
  total_installments?: number;
  recurring?: boolean;
  recurring_interval?: string;
  recurrence_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface DbCategory {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface DbPaymentSource {
  id: string;
  name: string;
  type: 'cash' | 'credit' | 'bank' | 'other';
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Maps database expense to frontend expense model
 */
export const mapDbExpenseToModel = (dbExpense: any): Expense => ({
  id: dbExpense.id,
  amount: dbExpense.amount,
  date: dbExpense.date,
  time: dbExpense.time || '',
  name: dbExpense.title, // DB uses 'title', frontend uses 'name'
  categoryId: dbExpense.category_id || '',
  paymentSourceId: dbExpense.payment_source_id || '',
  paymentType: dbExpense.payment_type,
  relatedExpenseId: dbExpense.related_expense_id,
  installmentNumber: dbExpense.installment_count,
  totalInstallments: dbExpense.total_installments,
  isInstallment: dbExpense.installment || false,
  isRecurring: dbExpense.recurring || false,
  recurrenceId: dbExpense.recurrence_id,
  recurrenceType: dbExpense.recurring_interval,
  createdAt: dbExpense.created_at,
  updatedAt: dbExpense.updated_at
});

/**
 * Maps frontend expense model to database schema
 */
export const mapModelToDbExpense = (expense: Expense, userId?: string): Partial<DbExpense> => {
  // Create a database-compatible object
  const dbExpense: Partial<DbExpense> = {
    id: expense.id,
    title: expense.name, // Frontend uses 'name', DB uses 'title'
    amount: Number(expense.amount), // Ensure it's a number
    date: expense.date,
    time: expense.time,
    category_id: expense.categoryId,
    payment_source_id: expense.paymentSourceId,
    payment_type: expense.paymentType,
    related_expense_id: expense.relatedExpenseId,
    installment: expense.isInstallment || false,
    installment_count: expense.installmentNumber,
    total_installments: expense.totalInstallments,
    recurring: expense.isRecurring || false,
    recurring_interval: expense.recurrenceType,
    recurrence_id: expense.recurrenceId,
    created_at: expense.createdAt || new Date().toISOString(),
    updated_at: expense.updatedAt || new Date().toISOString(),
  };
  
  // Set the user_id if provided
  if (userId) {
    dbExpense.user_id = userId;
  }
  
  return dbExpense;
};

/**
 * Maps database category to frontend category model
 */
export const mapDbCategoryToModel = (dbCategory: any): ExpenseCategory => ({
  id: dbCategory.id,
  name: dbCategory.name,
  color: dbCategory.color || '#3B82F6', // Default color if not provided
  createdAt: dbCategory.created_at,
  updatedAt: dbCategory.updated_at
});

/**
 * Maps frontend category model to database schema
 */
export const mapModelToDbCategory = (category: ExpenseCategory, userId?: string): Partial<DbCategory> => {
  const dbCategory: Partial<DbCategory> = {
    id: category.id,
    name: category.name,
    color: category.color || '#3B82F6', // Ensure color has a default value
    created_at: category.createdAt || new Date().toISOString(),
    updated_at: category.updatedAt || new Date().toISOString(),
  };
  
  // Set the user_id if provided
  if (userId) {
    dbCategory.user_id = userId;
  }
  
  return dbCategory;
};

/**
 * Maps database payment source to frontend payment source model
 */
export const mapDbPaymentSourceToModel = (dbSource: any): PaymentSource => ({
  id: dbSource.id,
  name: dbSource.name,
  type: dbSource.type,
  color: dbSource.color || "#2196F3", // Default color if not provided
  createdAt: dbSource.created_at,
  updatedAt: dbSource.updated_at
});

/**
 * Maps frontend payment source model to database schema
 */
export const mapModelToDbPaymentSource = (source: PaymentSource, userId?: string): Partial<DbPaymentSource> => {
  const dbSource: Partial<DbPaymentSource> = {
    id: source.id,
    name: source.name,
    type: source.type,
    color: source.color || "#2196F3", // Ensure color has a default value
    created_at: source.createdAt || new Date().toISOString(),
    updated_at: source.updatedAt || new Date().toISOString(),
  };
  
  // Set the user_id if provided
  if (userId) {
    dbSource.user_id = userId;
  }
  
  return dbSource;
};
