
import { Expense } from "@/types/models";
import { ExpenseFormData } from "./expenseFormTypes";
import { generateInstallmentExpenses } from "@/utils/expenseUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

export function useInstallmentExpenseHandler() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user from auth context

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
    
    if (!user) {
      throw new Error("יש להתחבר למערכת כדי להוסיף הוצאה");
    }
    
    return generateInstallmentExpenses(
      totalAmount,
      installments,
      formData.startDate,
      formData.name,
      formData.categoryId,
      formData.paymentSourceId,
      formData.time,
      user.id // Pass the user ID from auth
    );
  };

  return {
    handleInstallmentExpense
  };
}
