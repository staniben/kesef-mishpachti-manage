
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TableName } from "@/types/supabase";

export type RlsOperation = 'select' | 'insert' | 'update' | 'delete';

export interface RlsTestResult {
  table: TableName;
  operation: RlsOperation;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export interface RlsSummary {
  table: TableName;
  totalTests: number;
  passedTests: number;
  operations: Record<RlsOperation, boolean>;
}

/**
 * Tests a specific RLS policy for a table
 */
export const testRlsPolicy = async (
  table: TableName,
  operation: RlsOperation
): Promise<RlsTestResult> => {
  const result: RlsTestResult = {
    table,
    operation,
    success: false,
    message: `Testing ${operation} policy for ${table}...`
  };
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      result.message = `No authenticated user found when testing ${operation} for ${table}`;
      return result;
    }
    
    // Prepare test data specific to each table
    const testData = getTestDataForTable(table, user.id);
    
    // Perform the test based on the operation
    switch (operation) {
      case 'select':
        const { data: selectData, error: selectError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);
          
        result.success = !selectError;
        result.message = selectError 
          ? `Failed to ${operation} from ${table}: ${selectError.message}`
          : `Successfully tested ${operation} policy for ${table}`;
        result.data = selectData;
        result.error = selectError;
        break;
        
      case 'insert':
        const { data: insertData, error: insertError } = await supabase
          .from(table)
          .insert(testData)
          .select();
          
        result.success = !insertError;
        result.message = insertError 
          ? `Failed to ${operation} into ${table}: ${insertError.message}`
          : `Successfully tested ${operation} policy for ${table}`;
        result.data = insertData;
        result.error = insertError;
        
        // Clean up the inserted data
        if (result.success && insertData && insertData.length > 0) {
          const id = insertData[0].id;
          await supabase.from(table).delete().eq('id', id);
        }
        break;
        
      case 'update':
        // First insert test data
        const { data: preData, error: preError } = await supabase
          .from(table)
          .insert(testData)
          .select();
          
        if (preError || !preData || preData.length === 0) {
          result.success = false;
          result.message = `Failed to create test data for ${operation} on ${table}`;
          result.error = preError;
          return result;
        }
        
        // Then try to update it
        const id = preData[0].id;
        const { data: updateData, error: updateError } = await supabase
          .from(table)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
          .select();
          
        result.success = !updateError;
        result.message = updateError 
          ? `Failed to ${operation} ${table}: ${updateError.message}`
          : `Successfully tested ${operation} policy for ${table}`;
        result.data = updateData;
        result.error = updateError;
        
        // Clean up the test data
        await supabase.from(table).delete().eq('id', id);
        break;
        
      case 'delete':
        // First insert test data
        const { data: deleteTestData, error: deleteTestError } = await supabase
          .from(table)
          .insert(testData)
          .select();
          
        if (deleteTestError || !deleteTestData || deleteTestData.length === 0) {
          result.success = false;
          result.message = `Failed to create test data for ${operation} on ${table}`;
          result.error = deleteTestError;
          return result;
        }
        
        // Then try to delete it
        const deleteId = deleteTestData[0].id;
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', deleteId)
          .eq('user_id', user.id);
          
        result.success = !deleteError;
        result.message = deleteError 
          ? `Failed to ${operation} from ${table}: ${deleteError.message}`
          : `Successfully tested ${operation} policy for ${table}`;
        result.error = deleteError;
        break;
    }
    
  } catch (error) {
    result.success = false;
    result.message = `Error testing ${operation} policy for ${table}: ${error instanceof Error ? error.message : String(error)}`;
    result.error = error;
  }
  
  return result;
};

/**
 * Gets valid test data for a specific table and operation
 */
const getTestDataForTable = (table: TableName, userId: string): Record<string, any> => {
  const timestamp = new Date().toISOString();
  
  switch (table) {
    case 'categories':
      return {
        name: `Test Category ${timestamp}`,
        color: '#FF5733',
        user_id: userId
      };
      
    case 'expenses':
      return {
        title: `Test Expense ${timestamp}`,
        amount: 10.99,
        date: timestamp,
        payment_type: 'one-time',
        user_id: userId
      };
      
    case 'payment_sources':
      return {
        name: `Test Source ${timestamp}`,
        type: 'credit',
        user_id: userId
      };
      
    case 'profiles':
      return {
        id: userId,
        email: `test-${timestamp}@example.com`
      };
      
    default:
      return { user_id: userId };
  }
};
