
import { Expense } from "@/types";
import { ExpenseFormData } from "./expenseFormTypes";
import { format, addMonths } from "date-fns";
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
    
    // Calculate monthly amount
    const monthlyAmount = totalAmount / installments;
    
    // Create multiple expenses for each installment
    const installmentExpenses: Expense[] = [];
    
    for (let i = 0; i < installments; i++) {
      const installmentDate = addMonths(formData.startDate, i);
      const formattedDate = format(installmentDate, "yyyy-MM-dd");
      
      const expense: Expense = {
        id: new Date().getTime().toString() + "-" + i, // Ensure unique IDs for each installment
        amount: monthlyAmount,
        date: formattedDate,
        time: formData.time,
        name: `${formData.name} (${i+1}/${installments})`,
        categoryId: formData.categoryId,
        paymentSourceId: formData.paymentSourceId,
        paymentType: "installment",
        installmentNumber: i + 1,
        totalInstallments: installments,
        isInstallment: true,
      };
      
      installmentExpenses.push(expense);
    }
    
    return installmentExpenses;
  };

  return {
    handleInstallmentExpense
  };
}
