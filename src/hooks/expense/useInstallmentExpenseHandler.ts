
import { Expense } from "@/types/models";
import { ExpenseFormData } from "./expenseFormTypes";
import { generateInstallmentExpenses } from "@/utils/expenseUtils";
import { useToast } from "@/hooks/use-toast";

export function useInstallmentExpenseHandler() {
  const { toast } = useToast();

  const handleInstallmentExpense = (formData: ExpenseFormData) => {
    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("יש להזין סכום חיובי");
    }
    
    const installments = parseInt(formData.numberOfInstallments, 10);
    if (isNaN(installments) || installments < 2) {
      throw new Error("יש להזין לפחות 2 תשלומים");
    }

    if (!formData.startDate) {
      throw new Error("יש להזין תאריך התחלה");
    }
    
    return generateInstallmentExpenses(
      totalAmount,
      installments,
      formData.startDate,
      formData.name,
      formData.categoryId,
      formData.paymentSourceId,
      formData.time
    );
  };

  return {
    handleInstallmentExpense
  };
}
