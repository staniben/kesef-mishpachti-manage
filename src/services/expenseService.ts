
import { Expense } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';
import { mapDbExpenseToModel as mapDbToModel, mapModelToDbExpense as mapModelToDb } from '@/utils/dataMappers';
import { DbExpense } from '@/types/supabase';

// Validate expense data before it's sent to the database
const validateExpenseForDB = (expense: Expense): string | null => {
  // Required fields validation
  if (!expense.name) return "שם ההוצאה נדרש";
  if (expense.amount === undefined || isNaN(Number(expense.amount))) return "סכום תקין נדרש";
  if (!expense.date) return "תאריך נדרש";
  if (!expense.paymentType) return "סוג תשלום נדרש";
  
  return null; // No validation errors
};

// Helper function to check RLS access
const checkRlsAccess = async () => {
  try {
    console.log("Testing RLS access in expenseService...");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;
    
    // Quick check to see if we can access expenses
    const { data, error } = await supabase
      .from('expenses')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('RLS check failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('RLS check error:', error);
    return false;
  }
};

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    console.log('Fetching expenses for user:', userData.user.id);
    
    // Test RLS access before the main query
    try {
      const rlsResult = await checkRlsAccess();
      console.log('RLS access check before fetching expenses:', rlsResult);
    } catch (error) {
      console.error('RLS check failed:', error);
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching expenses:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }

    console.log('Successfully fetched expenses:', data?.length || 0);
    return data ? data.map(mapDbToModel) : [];
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

    return data ? mapDbToModel(data) : null;
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

    return data ? data.map(mapDbToModel) : [];
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

    return data ? data.map(mapDbToModel) : [];
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

    return data ? data.map(mapDbToModel) : [];
  },

  create: async (expense: Expense): Promise<Expense> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        const authError = new Error('User not authenticated');
        console.error('Authentication error:', authError);
        throw authError;
      }
      
      console.log('Creating expense with authenticated user:', userData.user.id);
      console.log('Expense data:', expense);
      
      // Check RLS access before creating expense
      try {
        const rlsResult = await checkRlsAccess();
        console.log('RLS access check before creating expense:', rlsResult);
      } catch (error) {
        console.error('RLS check failed:', error);
      }
      
      // Validate the expense data
      const validationError = validateExpenseForDB(expense);
      if (validationError) {
        const error = new Error(validationError);
        console.error('Validation error:', error);
        throw error;
      }
      
      // Use the mapper function to convert our model to DB schema
      const dbExpense = mapModelToDb(
        {
          ...expense,
          id: expense.id || crypto.randomUUID(), // Use proper UUID
        }, 
        userData.user.id
      );
      
      // Cast the partial DbExpense to a complete type for insert
      // We've validated that all required fields are present
      const insertableExpense = {
        ...dbExpense,
        amount: Number(expense.amount), // Ensure amount is provided as required
        date: expense.date,             // Ensure date is provided as required
        title: expense.name,            // Ensure title is provided as required
        payment_type: expense.paymentType, // Ensure payment_type is provided as required
        user_id: userData.user.id       // Ensure user_id is provided as required
      } as Database['public']['Tables']['expenses']['Insert'];
      
      // Log what we're sending to Supabase for debugging
      console.log('Creating expense with data:', insertableExpense);
      console.log('User ID in expense:', insertableExpense.user_id);
      console.log('Auth UID matches User ID:', insertableExpense.user_id === userData.user.id);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(insertableExpense)
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        // Log RLS policies violation specifically
        if (error.code === '42501') {
          console.error('RLS policy violation detected. Check if policies are properly set up.');
          console.error('User ID provided:', insertableExpense.user_id);
          console.error('Authenticated user ID:', userData.user.id);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from expense creation');
      }

      console.log('Expense created successfully:', data);
      return mapDbToModel(data);
    } catch (error) {
      console.error('Failed to create expense:', error);
      throw error;
    }
  },
  
  createBatch: async (newExpenses: Expense[]): Promise<Expense[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        const authError = new Error('User not authenticated');
        console.error('Authentication error:', authError);
        throw authError;
      }
      
      console.log('Creating batch expenses with authenticated user:', userData.user.id);
      
      // Validate each expense in the batch
      const validationErrors: string[] = [];
      newExpenses.forEach((expense, index) => {
        const error = validateExpenseForDB(expense);
        if (error) {
          validationErrors.push(`Expense #${index + 1}: ${error}`);
        }
      });
      
      if (validationErrors.length > 0) {
        const error = new Error(`Validation failed: ${validationErrors.join(', ')}`);
        console.error('Validation errors:', error);
        throw error;
      }
      
      // Use the mapper function to convert our models to DB schema
      const dbExpenses = newExpenses.map(expense => {
        const mappedExpense = mapModelToDb({
          ...expense,
          id: expense.id || crypto.randomUUID(), // Use proper UUID
        }, userData.user.id);
        
        // Add required fields to ensure each expense meets the DB requirements
        return {
          ...mappedExpense,
          amount: Number(expense.amount),
          date: expense.date,
          title: expense.name,
          payment_type: expense.paymentType,
          user_id: userData.user.id
        } as Database['public']['Tables']['expenses']['Insert'];
      });
      
      console.log('Creating batch expenses:', dbExpenses);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(dbExpenses)
        .select();

      if (error) {
        console.error('Error creating batch expenses:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from batch expense creation');
      }

      console.log('Batch expenses created successfully:', data);
      return data ? data.map(mapDbToModel) : [];
    } catch (error) {
      console.error('Failed to create batch expenses:', error);
      throw error;
    }
  },

  update: async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        const authError = new Error('User not authenticated');
        console.error('Authentication error:', authError);
        throw authError;
      }
      
      console.log(`Updating expense ${id} for user ${userData.user.id}`);
      
      // Map the partial update data to DB format
      const dbExpenseUpdate: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (expenseData.name !== undefined) dbExpenseUpdate.title = expenseData.name;
      if (expenseData.amount !== undefined) dbExpenseUpdate.amount = Number(expenseData.amount);
      if (expenseData.date !== undefined) dbExpenseUpdate.date = expenseData.date;
      if (expenseData.time !== undefined) dbExpenseUpdate.time = expenseData.time;
      if (expenseData.categoryId !== undefined) dbExpenseUpdate.category_id = expenseData.categoryId;
      if (expenseData.paymentSourceId !== undefined) dbExpenseUpdate.payment_source_id = expenseData.paymentSourceId;
      if (expenseData.paymentType !== undefined) dbExpenseUpdate.payment_type = expenseData.paymentType;
      if (expenseData.isInstallment !== undefined) dbExpenseUpdate.installment = expenseData.isInstallment;
      if (expenseData.installmentNumber !== undefined) dbExpenseUpdate.installment_count = expenseData.installmentNumber;
      if (expenseData.totalInstallments !== undefined) dbExpenseUpdate.total_installments = expenseData.totalInstallments;
      if (expenseData.isRecurring !== undefined) dbExpenseUpdate.recurring = expenseData.isRecurring;
      if (expenseData.recurrenceType !== undefined) dbExpenseUpdate.recurring_interval = expenseData.recurrenceType;
      if (expenseData.relatedExpenseId !== undefined) dbExpenseUpdate.related_expense_id = expenseData.relatedExpenseId;
      if (expenseData.recurrenceId !== undefined) dbExpenseUpdate.recurrence_id = expenseData.recurrenceId;
      
      console.log(`Updating expense ${id} with data:`, dbExpenseUpdate);
      
      const { data, error } = await supabase
        .from('expenses')
        .update(dbExpenseUpdate)
        .eq('id', id)
        .eq('user_id', userData.user.id) // Ensure user can only update their own expenses
        .select()
        .single();

      if (error) {
        console.error(`Error updating expense with ID ${id}:`, error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }

      if (!data) {
        throw new Error(`No data returned from expense update for ID ${id}`);
      }

      console.log('Expense updated successfully:', data);
      return mapDbToModel(data);
    } catch (error) {
      console.error(`Failed to update expense ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        const authError = new Error('User not authenticated');
        console.error('Authentication error:', authError);
        throw authError;
      }
      
      console.log(`Deleting expense ${id} for user ${userData.user.id}`);
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userData.user.id); // Ensure user can only delete their own expenses

      if (error) {
        console.error(`Error deleting expense with ID ${id}:`, error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }
      
      console.log(`Expense ${id} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete expense ${id}:`, error);
      throw error;
    }
  }
};

// Import type for type assertion
import type { Database } from '@/integrations/supabase/types';
