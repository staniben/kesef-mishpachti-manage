
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// RLS policy types that can be tested
type RlsOperation = 'select' | 'insert' | 'update' | 'delete';
type RlsTable = 'categories' | 'expenses' | 'payment_sources';

interface RlsTestResult {
  operation: RlsOperation;
  table: RlsTable;
  success: boolean;
  error?: any;
  message: string;
}

/**
 * Tests RLS policies for a specific table and operation
 */
export const testRlsPolicy = async (
  table: RlsTable,
  operation: RlsOperation,
  testData?: Record<string, any>
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
    
    // Default test data if not provided
    const defaultTestData = {
      id: crypto.randomUUID(),
      name: `RLS Test ${Date.now()}`,
      user_id: userData.user.id,
    };
    
    const data = testData || defaultTestData;
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
          .insert({ ...data, user_id: userData.user.id })
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
          .insert({ ...data, user_id: userData.user.id })
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
          .insert({ ...data, user_id: userData.user.id })
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
  const testAllPolicies = async (table: RlsTable): Promise<RlsTestResult[]> => {
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
