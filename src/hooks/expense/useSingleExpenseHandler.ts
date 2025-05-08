
import { Expense } from "@/types/models";
import { createBaseExpense } from "@/utils/expenseUtils";
import { ExpenseFormData } from "./expenseFormTypes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; 
import { checkRlsAccess } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function useSingleExpenseHandler() {
  const { toast } = useToast();
  const { user } = useAuth(); 

  const handleSingleExpense = async (formData: ExpenseFormData, editId?: string) => {
    console.log("Single expense handler called with user:", user?.id);
    console.log("Form data:", formData);
    
    // Test RLS access before proceeding
    try {
      const result = await checkRlsAccess();
      console.log("RLS access check result:", result);
      
      if (!result.success || !result.match) {
        console.warn("RLS access check failed or user ID mismatch detected!");
        toast({
          title: "בדיקת הרשאות נכשלה",
          description: "ייתכן שיש בעיה בהרשאות הגישה לנתונים. נא לרענן את הדף ולנסות שוב.",
          variant: "warning",
        });
      }
    } catch (err) {
      console.error("RLS access check failed:", err);
      // Continue anyway, as this is just a diagnostic check
    }
    
    // Validate input data
    const totalAmount = parseFloat(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      console.error("Invalid amount:", formData.amount);
      throw new Error("יש להזין סכום חיובי");
    }
    
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("יש להתחבר למערכת כדי להוסיף הוצאה");
    }

    if (!formData.categoryId) {
      console.error("Missing category ID");
      throw new Error("יש לבחור קטגוריה");
    }

    if (!formData.paymentSourceId) {
      console.error("Missing payment source ID");
      throw new Error("יש לבחור אמצעי תשלום");
    }
    
    try {
      // Create the expense object with the authenticated user ID
      const expense: Expense = createBaseExpense(
        editId,
        totalAmount,
        formData.date!,
        formData.time,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        formData.paymentType,
        user.id
      );
      
      console.log("Created expense object:", expense);
      console.log("Expense user_id:", expense.user_id);
      console.log("Current auth user:", user.id);
      
      // Verify that user_id is correctly set for RLS policies
      if (expense.user_id !== user.id) {
        console.error("User ID mismatch! This will cause RLS policy failures");
        throw new Error("שגיאת מערכת: אי התאמה במזהה משתמש");
      }
      
      return expense;
    } catch (err) {
      console.error("Error creating expense:", err);
      throw err;
    }
  };

  return {
    handleSingleExpense
  };
}
