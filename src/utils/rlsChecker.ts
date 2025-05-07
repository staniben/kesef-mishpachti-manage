
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
  data?: any;
}

interface RlsSummary {
  table: TableName;
  totalTests: number;
  passedTests: number;
  operations: {
    [key in RlsOperation]?: boolean;
  };
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
          
        if (!result.error) {
          // Also try to fetch a specific record
          const detailQuery = await supabase
            .from(table)
            .select('*')
            .eq('user_id', userData.user.id)
            .limit(1);
            
          if (detailQuery.error) {
            result = detailQuery;
          } else {
            result.data = {
              count: result.count,
              sample: detailQuery.data && detailQuery.data.length > 0 ? detailQuery.data[0] : null
            };
          }
        }
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
      message: `RLS ${operation} policy working for ${table}`,
      data: result.data
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
  
  /**
   * Tests all RLS policies for all tables
   */
  const testAllTables = async (): Promise<RlsSummary[]> => {
    const tables: TableName[] = ['categories', 'expenses', 'payment_sources'];
    const summaries: RlsSummary[] = [];
    
    for (const table of tables) {
      const results = await testAllPolicies(table);
      const summary: RlsSummary = {
        table,
        totalTests: results.length,
        passedTests: results.filter(r => r.success).length,
        operations: {}
      };
      
      // Populate operation results
      for (const result of results) {
        summary.operations[result.operation] = result.success;
      }
      
      summaries.push(summary);
    }
    
    // Show overall summary
    const totalTests = summaries.reduce((sum, s) => sum + s.totalTests, 0);
    const passedTests = summaries.reduce((sum, s) => sum + s.passedTests, 0);
    
    toast({
      title: "RLS Policy Test Complete",
      description: `${passedTests} of ${totalTests} tests passed across all tables`,
      variant: passedTests === totalTests ? "default" : "destructive",
    });
    
    return summaries;
  };
  
  /**
   * Check if user has appropriate RLS access to create items
   */
  const checkUserAccess = async (): Promise<{
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
        .select('count(*)', { count: 'exact', head: true })
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
  
  return { testRlsPolicy, testAllPolicies, testAllTables, checkUserAccess };
};
