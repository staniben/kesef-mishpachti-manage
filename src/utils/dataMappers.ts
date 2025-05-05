
import { Expense, ExpenseCategory, PaymentSource } from '@/types/models';
import { DbCategory, DbExpense, DbPaymentSource } from '@/types/supabase';

/**
 * Maps database expense to frontend expense model
 */
export const mapDbExpenseToModel = (dbExpense: DbExpense): Expense => ({
  id: dbExpense.id,
  amount: dbExpense.amount,
  date: dbExpense.date,
  time: dbExpense.date.split('T')[1]?.substring(0, 5) || '',
  name: dbExpense.title, // DB uses 'title', frontend uses 'name'
  categoryId: dbExpense.category_id || '',
  paymentSourceId: dbExpense.payment_source_id || '',
  paymentType: dbExpense.payment_type as 'one-time' | 'installment' | 'recurring',
  user_id: dbExpense.user_id,
  relatedExpenseId: undefined, // Field is missing in current DB schema
  installmentNumber: dbExpense.installment_count,
  totalInstallments: dbExpense.installment_count, // Total not in current schema, using same value
  isInstallment: dbExpense.installment || false,
  isRecurring: dbExpense.recurring || false,
  recurrenceId: undefined, // Field is missing in current DB schema
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
    category_id: expense.categoryId,
    payment_source_id: expense.paymentSourceId,
    payment_type: expense.paymentType,
    installment: expense.isInstallment || false,
    installment_count: expense.installmentNumber,
    recurring: expense.isRecurring || false,
    recurring_interval: expense.recurrenceType,
    created_at: expense.createdAt || new Date().toISOString(),
    updated_at: expense.updatedAt || new Date().toISOString(),
    user_id: userId,
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
