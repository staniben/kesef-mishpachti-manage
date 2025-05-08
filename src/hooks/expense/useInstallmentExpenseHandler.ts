
import { Expense } from "@/types/models";
import { ExpenseFormData } from "./expenseFormTypes";
import { generateInstallmentExpenses } from "@/utils/expenseUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

export function useInstallmentExpenseHandler() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user from auth context

  const handleInstallmentExpense = (formData: ExpenseFormData) => {
    console.log("Installment expense handler called with user:", user?.id);
    console.log("Form data:", formData);
    
    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      console.error("Invalid total amount:", formData.totalAmount);
      throw new Error("יש להזין סכום חיובי");
    }
    
    const installments = parseInt(formData.numberOfInstallments, 10);
    if (isNaN(installments) || installments < 2) {
      console.error("Invalid number of installments:", formData.numberOfInstallments);
      throw new Error("יש להזין לפחות 2 תשלומים");
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
      const expenses = generateInstallmentExpenses(
        totalAmount,
        installments,
        formData.startDate,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        formData.time,
        user.id // Pass the user ID from auth
      );
      
      console.log("Generated installment expenses:", expenses);
      return expenses;
    } catch (err) {
      console.error("Error generating installment expenses:", err);
      throw err;
    }
  };

  return {
    handleInstallmentExpense
  };
}
