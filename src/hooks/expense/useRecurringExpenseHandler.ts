
import { Expense, RecurrenceType } from "@/types";
import { ExpenseFormData } from "./expenseFormTypes";
import { format, addMonths } from "date-fns";
import { v4 as uuidv4 } from 'uuid';
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
    
    // Generate a unique recurrence ID
    const recurrenceId = uuidv4();
    const recurrenceType: RecurrenceType = "monthly";
    
    // Create 12 monthly recurring expenses
    const recurringExpenses: Expense[] = [];
    
    for (let i = 0; i < 12; i++) {
      const recurringDate = addMonths(formData.startDate, i);
      const formattedDate = format(recurringDate, "yyyy-MM-dd");
      
      const expense: Expense = {
        id: new Date().getTime().toString() + "-recurring-" + i, // Ensure unique IDs
        amount: amount,
        date: formattedDate,
        time: formData.time,
        name: formData.name,
        categoryId: formData.categoryId,
        paymentSourceId: formData.paymentSourceId,
        paymentType: "recurring",
        isRecurring: true,
        recurrenceId: recurrenceId,
        recurrenceType: recurrenceType
      };
      
      recurringExpenses.push(expense);
    }
    
    return recurringExpenses;
  };

  return {
    handleRecurringExpense
  };
}
