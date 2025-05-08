
import { Expense, RecurrenceType } from "@/types/models";
import { ExpenseFormData } from "./expenseFormTypes";
import { generateRecurringExpenses } from "@/utils/expenseUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export function useRecurringExpenseHandler() {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRecurringExpense = (formData: ExpenseFormData) => {
    console.log("Recurring expense handler called with user:", user?.id);
    console.log("Form data:", formData);
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error("Invalid amount:", formData.amount);
      throw new Error("יש להזין סכום חיובי");
    }

    if (!formData.startDate) {
      console.error("Missing start date");
      throw new Error("יש להזין תאריך התחלה");
    }

    if (!formData.categoryId) {
      console.error("Missing category ID");
      throw new Error("יש לבחור קטגוריה");
    }

    if (!formData.paymentSourceId) {
      console.error("Missing payment source ID");
      throw new Error("יש לבחור אמצעי תשלום");
    }
    
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("יש להתחבר למערכת כדי להוסיף הוצאה");
    }
    
    try {
      // Generate recurring expenses for 12 months
      const expenses = generateRecurringExpenses(
        amount,
        formData.startDate,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        formData.time,
        user.id
      );
      
      console.log("Generated recurring expenses:", expenses);
      return expenses;
    } catch (err) {
      console.error("Error generating recurring expenses:", err);
      throw err;
    }
  };

  return {
    handleRecurringExpense
  };
}
