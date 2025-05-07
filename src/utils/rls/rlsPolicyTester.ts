
import { supabase } from "@/integrations/supabase/client";
import { TableName } from "@/types/supabase";
import { createTestRecord } from "./rlsTestUtils";

// RLS policy types that can be tested
export type RlsOperation = 'select' | 'insert' | 'update' | 'delete';

export interface RlsTestResult {
  operation: RlsOperation;
  table: TableName;
  success: boolean;
  error?: any;
  message: string;
  data?: any;
}

export interface RlsSummary {
  table: TableName;
  totalTests: number;
  passedTests: number;
  operations: {
    [key in RlsOperation]?: boolean;
  };
}

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
          .select('count', { count: 'exact', head: true })
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
