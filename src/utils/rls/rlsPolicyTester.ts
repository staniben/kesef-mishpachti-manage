
import { TableName } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { generateId } from "@/utils/expense";

// Mock data for insertion tests
const getMockDataForTable = (table: TableName): Record<string, any> => {
  const now = new Date().toISOString();
  
  switch (table) {
    case "categories":
      return { name: "Test Category", color: "#FF0000" };
    case "expenses":
      return { 
        title: "Test Expense", 
        amount: 100, 
        payment_type: "one-time",
        date: now
      };
    case "payment_sources":
      return { name: "Test Source", type: "cash", color: "#00FF00" };
    case "profiles":
      return { email: `test-${generateId()}@example.com` };
    default:
      return {};
  }
};

export const testInsertPermission = async (tableName: TableName): Promise<{ success: boolean; error?: string }> => {
  try {
    const mockData = getMockDataForTable(tableName);
    const { error } = await supabase.from(tableName).insert(mockData).select();
    
    if (error) {
      console.error(`Insert permission test failed for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error(`Error testing insert permission for ${tableName}:`, error);
    return { success: false, error: error.message };
  }
};
