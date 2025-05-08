
import { Expense } from "@/types/models";
import { createBaseExpense } from "@/utils/expenseUtils";
import { ExpenseFormData } from "./expenseFormTypes";
import { useToast } from "@/hooks/use-toast";

export function useSingleExpenseHandler() {
  const { toast } = useToast();

  const handleSingleExpense = (formData: ExpenseFormData, editId?: string) => {
    const totalAmount = parseFloat(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("יש להזין סכום חיובי");
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
      formData.paymentType
    );
    
    return expense;
  };

  return {
    handleSingleExpense
  };
}
