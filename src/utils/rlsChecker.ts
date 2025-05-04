
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DbCategory, DbExpense, DbPaymentSource, TableName } from "@/types/supabase";
import { v4 as uuidv4 } from 'uuid';

// RLS policy types that can be tested
type RlsOperation = 'select' | 'insert' | 'update' | 'delete';

interface RlsTestResult {
  operation: RlsOperation;
  table: TableName;
  success: boolean;
  error?: any;
  message: string;
}

/**
 * Creates a table-specific test record for each table type
 */
const createCategoryTestRecord = (userId: string): Omit<DbCategory, 'id'> => {
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

const createExpenseTestRecord = (userId: string): Omit<DbExpense, 'id'> => {
  const testId = uuidv4();
  const now = new Date().toISOString();
  
  return {
    title: `Test Expense ${testId.substring(0, 8)}`,
    amount: 100,
    date: now,
    payment_type: 'one-time',
    user_id: userId,
    created_at: now,
    updated_at: now
  };
};

const createPaymentSourceTestRecord = (userId: string): Omit<DbPaymentSource, 'id'> => {
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
const createTestRecord = (table: TableName, userId: string) => {
  // Add table-specific required properties
  switch(table) {
    case 'categories':
      return createCategoryTestRecord(userId);
      
    case 'expenses':
      return createExpenseTestRecord(userId);
      
    case 'payment_sources':
      return createPaymentSourceTestRecord(userId);
  }
};

/**
 * Tests RLS policies for a specific table and operation
 */
export const testRlsPolicy = async (
  table: TableName,
  operation: RlsOperation
): Promise<RlsTestResult> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      return {
        operation,
        table,
        success: false,
        message: 'No authenticated user found'
      };
    }
    
    // Create a valid test record for the table
    const testData = createTestRecord(table, userData.user.id);
    let result: any;
    
    switch (operation) {
      case 'select':
        result = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true })
          .eq('user_id', userData.user.id);
        break;
        
      case 'insert':
        // Only perform a dry run - immediately delete after insert
        result = await supabase
          .from(table)
          .insert(testData)
          .select()
          .single();
          
        if (!result.error) {
          // Clean up - delete the test row
          await supabase
            .from(table)
            .delete()
            .eq('id', result.data.id);
        }
        break;
        
      case 'update':
        // First insert a test row
        const insertResult = await supabase
          .from(table)
          .insert(testData)
          .select()
          .single();
          
        if (insertResult.error) {
          return {
            operation,
            table,
            success: false,
            error: insertResult.error,
            message: `Failed to insert test row for update test: ${insertResult.error.message}`
          };
        }
        
        // Try to update it
        result = await supabase
          .from(table)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', insertResult.data.id)
          .eq('user_id', userData.user.id)
          .select()
          .single();
          
        // Clean up - delete the test row
        await supabase
          .from(table)
          .delete()
          .eq('id', insertResult.data.id);
        break;
        
      case 'delete':
        // First insert a test row
        const insertForDelete = await supabase
          .from(table)
          .insert(testData)
          .select()
          .single();
          
        if (insertForDelete.error) {
          return {
            operation,
            table,
            success: false,
            error: insertForDelete.error,
            message: `Failed to insert test row for delete test: ${insertForDelete.error.message}`
          };
        }
        
        // Try to delete it
        result = await supabase
          .from(table)
          .delete()
          .eq('id', insertForDelete.data.id)
          .eq('user_id', userData.user.id);
        break;
    }
    
    if (result.error) {
      return {
        operation,
        table,
        success: false,
        error: result.error,
        message: `RLS ${operation} test failed for ${table}: ${result.error.message}`
      };
    }
    
    return {
      operation,
      table,
      success: true,
      message: `RLS ${operation} policy working for ${table}`
    };
    
  } catch (error) {
    console.error(`Error testing RLS ${operation} policy for ${table}:`, error);
    return {
      operation,
      table,
      success: false,
      error,
      message: `Error testing RLS: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Hook to test all RLS policies for a table
 */
export const useRlsChecker = () => {
  const { toast } = useToast();
  
  /**
   * Tests all RLS policies (select, insert, update, delete) for a table
   */
  const testAllPolicies = async (table: TableName): Promise<RlsTestResult[]> => {
    const operations: RlsOperation[] = ['select', 'insert', 'update', 'delete'];
    const results: RlsTestResult[] = [];
    
    for (const operation of operations) {
      const result = await testRlsPolicy(table, operation);
      results.push(result);
      
      if (!result.success) {
        toast({
          title: "RLS Policy Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    }
    
    // Show summary toast
    const successCount = results.filter(r => r.success).length;
    toast({
      title: "RLS Policy Test Results",
      description: `${successCount} of ${operations.length} tests passed for ${table}`,
      variant: successCount === operations.length ? "default" : "destructive",
    });
    
    return results;
  };
  
  return { testRlsPolicy, testAllPolicies };
};
