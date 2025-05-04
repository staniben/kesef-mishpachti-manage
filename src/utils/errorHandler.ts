
import { useToast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";

interface ToastConfig {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

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
 * Maps Supabase error codes to user-friendly messages
 */
export const getErrorMessageForCode = (code: string | undefined, operation: string): string => {
  if (!code) return `שגיאה ב${operation}`;
  
  switch (code) {
    case '42501': 
      return `הרשאות: אין לך הרשאות מתאימות ל${operation}`;
    case '23503': 
      return `שגיאת התייחסות: לא ניתן להשלים את ה${operation}`;
    case '23505': 
      return `ערך כבר קיים: לא ניתן להשלים את ה${operation}`;
    case '23502': 
      return `שדה חובה חסר: לא ניתן להשלים את ה${operation}`;
    default:
      return `שגיאה ב${operation}: קוד ${code}`;
  }
};

/**
 * Handles Supabase errors with consistent logging and user feedback
 */
export const handleSupabaseError = (
  error: PostgrestError | null | unknown,
  operation: string,
  toastFn?: (config: ToastConfig) => void
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
      
      userMessage = getErrorMessageForCode(pgError.code, operation);
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
  
  if (!isValidField(data.user_id)) {
    return { isValid: false, errorMessage: "מזהה משתמש הוא שדה חובה" };
  }
  
  // All validations passed
  return { isValid: true };
};
