
import { Expense } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }

    return data || [];
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

    return data;
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

    return data || [];
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

    return data || [];
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

    return data || [];
  },

  create: async (expense: Expense): Promise<Expense> => {
    const user = supabase.auth.getUser();
    
    const newExpense = {
      ...expense,
      id: expense.id || generateId(),
      user_id: (await user).data.user?.id,
    };
    
    const { data, error } = await supabase
      .from('expenses')
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw error;
    }

    return data;
  },
  
  createBatch: async (newExpenses: Expense[]): Promise<Expense[]> => {
    const user = supabase.auth.getUser();
    
    const expensesWithMetadata = await Promise.all(
      newExpenses.map(async (expense) => ({
        ...expense,
        id: expense.id || generateId(),
        user_id: (await user).data.user?.id,
      }))
    );
    
    const { data, error } = await supabase
      .from('expenses')
      .insert(expensesWithMetadata)
      .select();

    if (error) {
      console.error('Error creating batch expenses:', error);
      throw error;
    }

    return data || [];
  },

  update: async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating expense with ID ${id}:`, error);
      throw error;
    }

    return data;
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
