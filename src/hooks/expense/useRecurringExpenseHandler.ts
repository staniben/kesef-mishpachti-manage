
import { Expense, RecurrenceType } from "@/types/models";
import { ExpenseFormData } from "./expenseFormTypes";
import { generateRecurringExpenses } from "@/utils/expenseUtils";
import { useToast } from "@/hooks/use-toast";

export function useRecurringExpenseHandler() {
  const { toast } = useToast();

  const handleRecurringExpense = (formData: ExpenseFormData) => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("יש להזין סכום חיובי");
    }

    if (!formData.startDate) {
      throw new Error("יש להזין תאריך התחלה");
    }

    if (!formData.categoryId) {
      throw new Error("יש לבחור קטגוריה");
    }

    if (!formData.paymentSourceId) {
      throw new Error("יש לבחור אמצעי תשלום");
    }
    
    return generateRecurringExpenses(
      amount,
      formData.startDate,
      formData.name,
      formData.categoryId,
      formData.paymentSourceId,
      formData.time
    );
  };

  return {
    handleRecurringExpense
  };
}
