
import { Expense } from "@/types/models";
import { createBaseExpense } from "@/utils/expenseUtils";
import { ExpenseFormData } from "./expenseFormTypes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

export function useSingleExpenseHandler() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user from auth context

  const handleSingleExpense = (formData: ExpenseFormData, editId?: string) => {
    const totalAmount = parseFloat(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("יש להזין סכום חיובי");
    }
    
    if (!user) {
      throw new Error("יש להתחבר למערכת כדי להוסיף הוצאה");
    }
    
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
    
    return expense;
  };

  return {
    handleSingleExpense
  };
}
