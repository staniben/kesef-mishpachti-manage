
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { TableName } from "@/types/supabase";

// Define simplified error type to avoid recursion
type SimplifiedError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

// Define simplified table result type
type TableResult = {
  success: boolean;
  count?: number;
  error?: SimplifiedError;
};

/**
 * Enhanced debug function to check RLS access
 */
export const checkDetailedRlsAccess = async (user: User | null, onError?: (message: string) => void) => {
  if (!user) return { success: false, message: "No authenticated user" };
  
  try {
    // First use the built-in utility to check basic auth functionality
    // Note: We're using a specific RPC function that should exist in your Supabase project
    const { data: rlsCheckResult, error: rlsCheckError } = await supabase.rpc('get_auth_uid');
    const success = !rlsCheckError && !!rlsCheckResult;
    
    console.log("Basic auth check result:", success ? "Success" : "Failed", rlsCheckError);
    
    if (!success) {
      const message = "Basic auth check failed! This is likely preventing data access.";
      console.error("❗ " + message);
      onError?.(message);
      return { success: false, message, error: rlsCheckError };
    }
    
    // Test each table individually with detailed logging
    const tables: TableName[] = ['categories', 'expenses', 'payment_sources', 'profiles'];
    const tableResults: Record<string, TableResult> = {};
    
    let allSuccess = true;
    
    for (const table of tables) {
      console.log(`Testing RLS access for table: ${table}...`);
      
      // Test count access
      const countResult = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      const countError = countResult.error;
      const count = countResult.count ?? 0;
      
      // Use a simplified error object to avoid recursive type issues
      tableResults[table] = { 
        success: !countError, 
        count, 
        error: countError ? {
          code: countError.code,
          message: countError.message,
          details: countError.details,
          hint: countError.hint
        } : undefined 
      };
      
      if (countError) {
        allSuccess = false;
        console.error(`❌ RLS check for ${table} count failed:`, countError);
        console.error(`  - Code: ${countError.code}`);
        console.error(`  - Message: ${countError.message}`);
        console.error(`  - Details: ${countError.details}`);
        console.error(`  - Hint: ${countError.hint}`);
      } else {
        console.log(`✅ RLS check for ${table} passed! Found ${count} records`);
        
        // If count > 0, try to fetch one record to verify full access
        if (count && count > 0) {
          const { data, error: fetchError } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
            .single();
            
          if (fetchError) {
            console.error(`❌ RLS check for ${table} data fetch failed:`, fetchError);
          } else {
            console.log(`✅ Successfully fetched a record from ${table}:`, data);
          }
        }
      }
    }
    
    // Check if auth.uid() matches frontend user.id
    const { data: authData, error: authError } = await supabase.rpc('get_auth_uid');
      
    if (authError) {
      console.error("❌ Failed to get auth.uid():", authError);
      return { 
        success: false, 
        message: "Failed to verify auth.uid()", 
        error: authError,
        tables: tableResults 
      };
    }
    
    console.log("Current auth.uid():", authData);
    console.log("Stored user.id:", user.id);
    console.log("Do they match?", authData === user.id);
    
    if (authData !== user.id) {
      const message = "⚠️ CRITICAL ERROR: auth.uid() does not match user.id in frontend!";
      console.error(message);
      onError?.(message);
      return { 
        success: false, 
        message,
        tables: tableResults,
        authMismatch: true,
        authUid: authData,
        userId: user.id
      };
    }
    
    return { 
      success: allSuccess, 
      message: allSuccess ? "All RLS checks passed" : "Some RLS checks failed",
      tables: tableResults,
      authUid: authData
    };
  } catch (e) {
    console.error("Error in detailed RLS access check:", e);
    return { 
      success: false, 
      message: `Error checking RLS access: ${e instanceof Error ? e.message : String(e)}`,
      error: e
    };
  }
};

/**
 * Validates a JSON Web Token (JWT) expiration
 */
export const validateTokenExpiration = (expiresAt: number | undefined): { 
  valid: boolean; 
  expiresInMinutes: number; 
  warning?: string;
} => {
  if (!expiresAt) {
    return { valid: false, expiresInMinutes: -1, warning: "No token expiration found" };
  }
  
  const expiresInMs = (expiresAt * 1000) - Date.now();
  const expiresInMinutes = Math.floor(expiresInMs / (1000 * 60));
  
  let warning: string | undefined;
  
  if (expiresInMinutes < 0) {
    warning = "⚠️ Auth token has expired!";
  } else if (expiresInMinutes < 10) {
    warning = `⚠️ Auth token expires soon (${expiresInMinutes} minutes)!`;
  }
  
  return {
    valid: expiresInMinutes > 0,
    expiresInMinutes,
    warning
  };
};
