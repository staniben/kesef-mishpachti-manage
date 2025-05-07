
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { DbCategory, DbExpense, DbPaymentSource, TableName } from "@/types/supabase";

/**
 * Creates a table-specific test record for each table type
 */
export const createCategoryTestRecord = (userId: string): Omit<DbCategory, 'id'> => {
  const testId = uuidv4();
  const now = new Date().toISOString();
  
  return {
    name: `Test Category ${testId.substring(0, 8)}`,
    color: '#ff0000',
    user_id: userId,
    created_at: now,
    updated_at: now
  };
};

export const createExpenseTestRecord = (userId: string): Omit<DbExpense, 'id'> => {
  const testId = uuidv4();
  const now = new Date().toISOString();
  
  return {
    title: `Test Expense ${testId.substring(0, 8)}`,
    amount: 100,
    date: now,
    payment_type: 'one-time',
    user_id: userId,
    category_id: null,
    payment_source_id: null,
    recurring: false,
    recurring_interval: null,
    recurring_end_date: null,
    installment: false,
    installment_count: null,
    created_at: now,
    updated_at: now
  };
};

export const createPaymentSourceTestRecord = (userId: string): Omit<DbPaymentSource, 'id'> => {
  const testId = uuidv4();
  const now = new Date().toISOString();
  
  return {
    name: `Test Source ${testId.substring(0, 8)}`,
    type: 'cash', 
    color: '#00ff00',
    user_id: userId,
    created_at: now,
    updated_at: now
  };
};

/**
 * Creates a valid test record for a specific table
 */
export const createTestRecord = (table: TableName, userId: string) => {
  // Add table-specific required properties
  switch(table) {
    case 'categories':
      return createCategoryTestRecord(userId);
      
    case 'expenses':
      return createExpenseTestRecord(userId);
      
    case 'payment_sources':
      return createPaymentSourceTestRecord(userId);
      
    default:
      // Handle the 'profiles' case or any other table
      return { user_id: userId };
  }
};

/**
 * Check if user has appropriate RLS access to create items
 */
export const checkUserAccess = async (): Promise<{
  hasAccess: boolean;
  userId?: string | null;
  authUid?: string | null;
  message: string;
}> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      return {
        hasAccess: false,
        message: "No authenticated user found. Please log in first."
      };
    }
    
    // Test RLS access by trying to query categories
    const { data, error } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true })
      .eq('user_id', authData.user.id);
      
    if (error) {
      // Check auth.uid() to see if it matches
      const { data: authUid, error: authError } = await supabase
        .rpc('get_auth_uid');
      
      return {
        hasAccess: false,
        userId: authData.user.id,
        authUid: authError ? null : authUid,
        message: `RLS policy access failed: ${error.message}. Auth UID match: ${!authError && (authUid === authData.user.id)}`
      };
    }
    
    return {
      hasAccess: true,
      userId: authData.user.id,
      message: "User has proper RLS access"
    };
  } catch (error) {
    console.error("Error checking user access:", error);
    return {
      hasAccess: false,
      message: `Error checking access: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
