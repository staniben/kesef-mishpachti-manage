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
  user_id: dbExpense.user_id,
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

// Validate expense data before it's sent to the database
const validateExpenseForDB = (expense: Expense): string | null => {
  // Required fields validation
  if (!expense.name) return "שם ההוצאה נדרש";
  if (expense.amount === undefined || isNaN(Number(expense.amount))) return "סכום תקין נדרש";
  if (!expense.date) return "תאריך נדרש";
  if (!expense.paymentType) return "סוג תשלום נדרש";
  
  return null; // No validation errors
};

// Helper function to map frontend model to Supabase DB schema
const mapModelToDbExpense = (expense: Expense) => {
  // Create a database-compatible object
  const dbExpense = {
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
    user_id: null // Will be set in each method with the authenticated user's ID
  };
  
  return dbExpense;
};

// Helper function to check RLS access
const checkRlsAccess = async () => {
  // Implement your RLS access check logic here
  return true; // Placeholder for RLS access check
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
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        const authError = new Error('User not authenticated');
        console.error('Authentication error:', authError);
        throw authError;
      }
      
      console.log('Creating expense with authenticated user:', userData.user.id);
      
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
      
      const dbExpense = mapModelToDbExpense({
        ...expense,
        id: expense.id || generateId(),
      });
      
      // Set the user_id from authenticated session
      dbExpense.user_id = userData.user.id;
      
      // Log what we're sending to Supabase for debugging
      console.log('Creating expense with data:', dbExpense);
      console.log('User ID in expense:', dbExpense.user_id);
      console.log('Auth UID matches User ID:', dbExpense.user_id === userData.user.id);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(dbExpense)
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
          console.error('User ID provided:', dbExpense.user_id);
          console.error('Authenticated user ID:', userData.user.id);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from expense creation');
      }

      console.log('Expense created successfully:', data);
      return mapDbExpenseToModel(data);
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
      
      const dbExpenses = newExpenses.map(expense => {
        const dbExpense = mapModelToDbExpense({
          ...expense,
          id: expense.id || generateId(),
        });
        
        // Set the user_id from authenticated session
        dbExpense.user_id = userData.user.id;
        return dbExpense;
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
      return data ? data.map(mapDbExpenseToModel) : [];
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
      return mapDbExpenseToModel(data);
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
