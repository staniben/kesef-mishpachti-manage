
import { Expense } from "@/types/models";
import { createBaseExpense } from "@/utils/expenseUtils";
import { ExpenseFormData } from "./expenseFormTypes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { checkRlsAccess } from "@/integrations/supabase/client";

export function useSingleExpenseHandler() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user from auth context

  const handleSingleExpense = (formData: ExpenseFormData, editId?: string) => {
    console.log("Single expense handler called with user:", user?.id);
    console.log("Form data:", formData);
    
    // First, test RLS access to help debug issues
    checkRlsAccess().then(result => {
      console.log("RLS access check result:", result);
    }).catch(err => {
      console.error("RLS access check failed:", err);
    });
    
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
      // Create the expense object
      const expense: Expense = createBaseExpense(
        editId,
        totalAmount,
        formData.date!,
        formData.time,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        formData.paymentType,
        user.id // Pass the user ID from auth
      );
      
      console.log("Created expense object:", expense);
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
