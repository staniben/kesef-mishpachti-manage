
import { Expense } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';

// Helper function to map Supabase DB schema to our frontend model
const mapDbExpenseToModel = (dbExpense: any): Expense => ({
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

// Helper function to map frontend model to Supabase DB schema
const mapModelToDbExpense = (expense: Expense, userId?: string) => ({
  id: expense.id,
  title: expense.name, // Frontend uses 'name', DB uses 'title'
  amount: expense.amount,
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
  created_at: expense.createdAt,
  updated_at: expense.updatedAt,
  user_id: userId
});

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },

  getById: async (id: string): Promise<Expense | null> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching expense with ID ${id}:`, error);
      throw error;
    }

    return data ? mapDbExpenseToModel(data) : null;
  },

  getByMonth: async (month: number, year: number): Promise<Expense[]> => {
    // Convert month/year to start and end dates for querying
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate.toISOString())
      .lt('date', endDate.toISOString());

    if (error) {
      console.error('Error fetching expenses by month:', error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },
  
  getByCategory: async (categoryId: string): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('category_id', categoryId);

    if (error) {
      console.error(`Error fetching expenses for category ${categoryId}:`, error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },
  
  getByPaymentSource: async (sourceId: string): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('payment_source_id', sourceId);

    if (error) {
      console.error(`Error fetching expenses for payment source ${sourceId}:`, error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },

  create: async (expense: Expense): Promise<Expense> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    const dbExpense = mapModelToDbExpense(
      {
        ...expense,
        id: expense.id || generateId(),
      },
      userData.user.id
    );
    
    const { data, error } = await supabase
      .from('expenses')
      .insert(dbExpense)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw error;
    }

    return mapDbExpenseToModel(data);
  },
  
  createBatch: async (newExpenses: Expense[]): Promise<Expense[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    const dbExpenses = newExpenses.map(expense => mapModelToDbExpense(
      {
        ...expense,
        id: expense.id || generateId(),
      },
      userData.user?.id
    ));
    
    const { data, error } = await supabase
      .from('expenses')
      .insert(dbExpenses)
      .select();

    if (error) {
      console.error('Error creating batch expenses:', error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },

  update: async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    // First get the existing expense to merge with updates
    const { data: existingExpense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!existingExpense) {
      throw new Error(`Expense with ID ${id} not found`);
    }
    
    // Map the partial update data to DB format
    const dbExpenseUpdate: Record<string, any> = {};
    
    if (expenseData.name !== undefined) dbExpenseUpdate.title = expenseData.name;
    if (expenseData.amount !== undefined) dbExpenseUpdate.amount = expenseData.amount;
    if (expenseData.date !== undefined) dbExpenseUpdate.date = expenseData.date;
    if (expenseData.time !== undefined) dbExpenseUpdate.time = expenseData.time;
    if (expenseData.categoryId !== undefined) dbExpenseUpdate.category_id = expenseData.categoryId;
    if (expenseData.paymentSourceId !== undefined) dbExpenseUpdate.payment_source_id = expenseData.paymentSourceId;
    if (expenseData.paymentType !== undefined) dbExpenseUpdate.payment_type = expenseData.paymentType;
    
    const { data, error } = await supabase
      .from('expenses')
      .update(dbExpenseUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating expense with ID ${id}:`, error);
      throw error;
    }

    return mapDbExpenseToModel(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting expense with ID ${id}:`, error);
      throw error;
    }
  },
  
  deleteByCategory: async (categoryId: string): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('category_id', categoryId);

    if (error) {
      console.error(`Error deleting expenses for category ${categoryId}:`, error);
      throw error;
    }
  },
  
  deleteByPaymentSource: async (sourceId: string): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('payment_source_id', sourceId);

    if (error) {
      console.error(`Error deleting expenses for payment source ${sourceId}:`, error);
      throw error;
    }
  }
};
