
import { useToast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Extracts a user-friendly error message from various error types
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Handle standard JS errors
    if (error.message.includes("JWT") || error.message.includes("auth")) {
      return "שגיאת אימות משתמש. נא להתחבר מחדש";
    } else if (error.message.includes("policy")) {
      return "שגיאת הרשאות: אין גישה לנתונים";
    }
    return error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Handle Supabase errors
    const supabaseError = error as { message?: string, details?: string, hint?: string };
    if (supabaseError.message) {
      return supabaseError.message;
    }
    if (supabaseError.details) {
      return supabaseError.details;
    }
  }
  
  // Fallback for unknown error formats
  return "אירעה שגיאה בלתי צפויה";
};

/**
 * Handles Supabase errors with consistent logging and user feedback
 */
export const handleSupabaseError = (
  error: PostgrestError | null | unknown,
  operation: string,
  toastFn?: ReturnType<typeof useToast>["toast"]
): void => {
  if (!error) return;
  
  console.error(`Error during ${operation}:`, error);
  
  let userMessage: string;
  
  // Extract specific PostgresError information
  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgrestError;
    
    // Log detailed information
    if (pgError.code) {
      console.error('Error code:', pgError.code);
      console.error('Error message:', pgError.message);
      console.error('Error details:', pgError.details);
    }
    
    // Handle specific PostgreSQL error codes
    if (pgError.code === '42501') {
      userMessage = `הרשאות: אין לך הרשאות מתאימות ל${operation}`;
      console.error('🔒 RLS ERROR: Permissions error. Check RLS policies.');
    } else if (pgError.code === '23503') {
      userMessage = `שגיאת התייחסות: לא ניתן להשלים את ה${operation}`;
      console.error('🔑 FOREIGN KEY ERROR: Foreign key constraint violation.');
    } else if (pgError.code === '23505') {
      userMessage = `ערך כבר קיים: לא ניתן להשלים את ה${operation}`;
      console.error('🔢 UNIQUE VIOLATION: Unique constraint violated.');
    } else {
      userMessage = `שגיאה ב${operation}: ${extractErrorMessage(error)}`;
    }
  } else {
    userMessage = `שגיאה ב${operation}: ${extractErrorMessage(error)}`;
  }
  
  // Display toast notification if toast function is provided
  if (toastFn) {
    toastFn({
      title: `שגיאה ב${operation}`,
      description: userMessage,
      variant: "destructive",
    });
  }
};

/**
 * Checks if a value is defined and not null
 * Useful for validating required fields
 */
export const isValidField = (value: any): boolean => {
  return value !== undefined && value !== null && value !== '';
};

/**
 * Validates an expense object for required fields
 */
export const validateExpenseData = (
  data: Record<string, any>
): { isValid: boolean; errorMessage?: string } => {
  // Check required fields
  if (!isValidField(data.name || data.title)) {
    return { isValid: false, errorMessage: "שם הוצאה הוא שדה חובה" };
  }
  
  if (!isValidField(data.amount) || isNaN(Number(data.amount))) {
    return { isValid: false, errorMessage: "סכום חוקי הוא שדה חובה" };
  }
  
  if (!isValidField(data.date)) {
    return { isValid: false, errorMessage: "תאריך הוא שדה חובה" };
  }
  
  if (!isValidField(data.paymentType || data.payment_type)) {
    return { isValid: false, errorMessage: "סוג תשלום הוא שדה חובה" };
  }
  
  if (!isValidField(data.categoryId || data.category_id)) {
    return { isValid: false, errorMessage: "קטגוריה היא שדה חובה" };
  }
  
  if (!isValidField(data.paymentSourceId || data.payment_source_id)) {
    return { isValid: false, errorMessage: "אמצעי תשלום הוא שדה חובה" };
  }
  
  // All validations passed
  return { isValid: true };
};
