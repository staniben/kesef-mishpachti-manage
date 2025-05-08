
import { Expense, ExpenseCategory, PaymentSource } from '@/types/models';
import { DbCategory, DbExpense, DbPaymentSource } from '@/types/supabase';

/**
 * Converts object keys from camelCase to snake_case
 */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
      toSnakeCase(value)
    ])
  );
}

/**
 * Maps database expense to frontend expense model
 */
export const mapDbExpenseToModel = (dbExpense: DbExpense): Expense => ({
  id: dbExpense.id,
  amount: dbExpense.amount,
  date: dbExpense.date,
  time: dbExpense.time || '',
  name: dbExpense.title, // DB uses 'title', frontend uses 'name'
  categoryId: dbExpense.category_id || '',
  paymentSourceId: dbExpense.payment_source_id || '',
  paymentType: dbExpense.payment_type as 'one-time' | 'installment' | 'recurring',
  user_id: dbExpense.user_id,
  relatedExpenseId: dbExpense.related_expense_id || undefined,
  installmentNumber: dbExpense.installment_count,
  totalInstallments: dbExpense.total_installments,
  isInstallment: dbExpense.installment || false,
  isRecurring: dbExpense.recurring || false,
  recurrenceId: dbExpense.recurrence_id || undefined,
  recurrenceType: dbExpense.recurring_interval as 'monthly' | undefined,
  createdAt: dbExpense.created_at,
  updatedAt: dbExpense.updated_at
});

/**
 * Maps frontend expense model to database schema
 */
export const mapModelToDbExpense = (expense: Expense, userId: string): Partial<DbExpense> => {
  // Create a database-compatible object
  const dbExpense: Partial<DbExpense> = {
    id: expense.id,
    title: expense.name, // Frontend uses 'name', DB uses 'title'
    amount: Number(expense.amount), // Ensure it's a number
    date: expense.date,
    time: expense.time || null,
    category_id: expense.categoryId || null,
    payment_source_id: expense.paymentSourceId || null,
    payment_type: expense.paymentType,
    installment: expense.isInstallment || false,
    installment_count: expense.installmentNumber || null,
    total_installments: expense.totalInstallments || null,
    recurring: expense.isRecurring || false,
    recurring_interval: expense.recurrenceType || null,
    recurrence_id: expense.recurrenceId || null,
    related_expense_id: expense.relatedExpenseId || null,
    created_at: expense.createdAt || new Date().toISOString(),
    updated_at: expense.updatedAt || new Date().toISOString(),
    user_id: userId || expense.user_id, // Use provided userId or from the expense
  };
  
  return dbExpense;
};

/**
 * Maps database category to frontend category model
 */
export const mapDbCategoryToModel = (dbCategory: DbCategory): ExpenseCategory => ({
  id: dbCategory.id,
  name: dbCategory.name,
  color: dbCategory.color || '#3B82F6', // Default color if not provided
  user_id: dbCategory.user_id,
  createdAt: dbCategory.created_at,
  updatedAt: dbCategory.updated_at
});

/**
 * Maps frontend category model to database schema
 */
export const mapModelToDbCategory = (category: ExpenseCategory, userId: string): Partial<DbCategory> => {
  const dbCategory: Partial<DbCategory> = {
    id: category.id,
    name: category.name,
    color: category.color || '#3B82F6', // Ensure color has a default value
    created_at: category.createdAt || new Date().toISOString(),
    updated_at: category.updatedAt || new Date().toISOString(),
    user_id: userId || category.user_id, // Use provided userId or from the category
  };
  
  return dbCategory;
};

/**
 * Maps database payment source to frontend payment source model
 */
export const mapDbPaymentSourceToModel = (dbSource: DbPaymentSource): PaymentSource => ({
  id: dbSource.id,
  name: dbSource.name,
  type: dbSource.type as 'cash' | 'credit' | 'bank' | 'other',
  color: dbSource.color || "#2196F3", // Default color if not provided
  user_id: dbSource.user_id,
  createdAt: dbSource.created_at,
  updatedAt: dbSource.updated_at
});

/**
 * Maps frontend payment source model to database schema
 */
export const mapModelToDbPaymentSource = (source: PaymentSource, userId: string): Partial<DbPaymentSource> => {
  const dbSource: Partial<DbPaymentSource> = {
    id: source.id,
    name: source.name,
    type: source.type,
    color: source.color || "#2196F3", // Ensure color has a default value
    created_at: source.createdAt || new Date().toISOString(),
    updated_at: source.updatedAt || new Date().toISOString(),
    user_id: userId || source.user_id, // Use provided userId or from the source
  };
  
  return dbSource;
};

/**
 * Verifies that a user is authenticated and returns the user ID
 * Throws an error if not authenticated
 */
export const getAuthenticatedUserId = async (): Promise<string> => {
  const { data: userData, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Authentication error:', error);
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!userData?.user) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated');
  }
  
  return userData.user.id;
};

// We need to import supabase for getAuthenticatedUserId
import { supabase } from '@/integrations/supabase/client';
