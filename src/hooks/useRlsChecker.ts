
import { useToast } from "@/hooks/use-toast";
import { TableName } from "@/types/supabase";
import { testRlsPolicy, RlsTestResult, RlsSummary, RlsOperation } from "@/utils/rls/rlsPolicyTester";
import { checkUserAccess } from "@/utils/rls/rlsTestUtils";

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
    const tables: TableName[] = ['categories', 'expenses', 'payment_sources', 'profiles'];
    const summaries: RlsSummary[] = [];
    
    for (const table of tables) {
      const results = await testAllPolicies(table);
      const summary: RlsSummary = {
        table,
        totalTests: results.length,
        passedTests: results.filter(r => r.success).length,
        operations: {
          select: false,
          insert: false,
          update: false,
          delete: false
        }
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
  
  return { testRlsPolicy, testAllPolicies, testAllTables, checkUserAccess };
};
