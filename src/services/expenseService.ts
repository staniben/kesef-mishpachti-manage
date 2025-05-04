
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
const mapModelToDbExpense = (expense: Expense) => ({
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
  user_id: null // Will be set in each method with the authenticated user's ID
});

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },

  getById: async (id: string): Promise<Expense | null> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      console.error(`Error fetching expense with ID ${id}:`, error);
      throw error;
    }

    return data ? mapDbExpenseToModel(data) : null;
  },

  getByMonth: async (month: number, year: number): Promise<Expense[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    // Convert month/year to start and end dates for querying
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.user.id)
      .gte('date', startDate.toISOString())
      .lt('date', endDate.toISOString());

    if (error) {
      console.error('Error fetching expenses by month:', error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },
  
  getByCategory: async (categoryId: string): Promise<Expense[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('category_id', categoryId);

    if (error) {
      console.error(`Error fetching expenses for category ${categoryId}:`, error);
      throw error;
    }

    return data ? data.map(mapDbExpenseToModel) : [];
  },
  
  getByPaymentSource: async (sourceId: string): Promise<Expense[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.user.id)
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
      }
    );
    
    // Set the user_id from authenticated session
    dbExpense.user_id = userData.user.id;
    
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
    
    const dbExpenses = newExpenses.map(expense => {
      const dbExpense = mapModelToDbExpense({
        ...expense,
        id: expense.id || generateId(),
      });
      
      // Set the user_id from authenticated session
      dbExpense.user_id = userData.user.id;
      return dbExpense;
    });
    
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
      .eq('user_id', userData.user.id) // Ensure user can only update their own expenses
      .select()
      .single();

    if (error) {
      console.error(`Error updating expense with ID ${id}:`, error);
      throw error;
    }

    return mapDbExpenseToModel(data);
  },

  delete: async (id: string): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id); // Ensure user can only delete their own expenses

    if (error) {
      console.error(`Error deleting expense with ID ${id}:`, error);
      throw error;
    }
  }
};
