
import { format, addMonths } from "date-fns";
import { Expense, PaymentType } from "@/types";

/**
 * Creates a base expense object from form data
 */
export const createBaseExpense = (
  editId: string | undefined,
  amount: number,
  date: Date,
  time: string,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  paymentType: PaymentType
): Expense => {
  return {
    id: editId || new Date().getTime().toString(),
    amount,
    date: format(date, "yyyy-MM-dd"),
    time,
    name,
    categoryId,
    paymentSourceId,
    paymentType,
  };
};

/**
 * Generates recurring expenses based on the base expense
 */
export const generateRecurringExpenses = (
  baseExpense: Expense,
): Expense[] => {
  const expenses: Expense[] = [];
  const baseDate = new Date(baseExpense.date);
  const originalName = baseExpense.name;
  
  // Generate 12 recurring expenses, including original month
  for (let i = 0; i < 12; i++) {
    const recurringDate = i === 0 ? baseDate : addMonths(baseDate, i);
    
    const recurringExpense: Expense = {
      id: new Date().getTime().toString() + `-rec-${i}`,
      amount: baseExpense.amount,
      date: format(recurringDate, "yyyy-MM-dd"),
      time: baseExpense.time,
      name: i === 0 ? originalName : `${originalName} (חודשי ${i + 1})`,
      categoryId: baseExpense.categoryId,
      paymentSourceId: baseExpense.paymentSourceId,
      paymentType: "recurring",
      recurringEndDate: baseExpense.recurringEndDate,
      isRecurring: true,
      recurrenceType: "monthly",
      relatedExpenseId: i === 0 ? undefined : baseExpense.id,
    };
    
    expenses.push(recurringExpense);
  }
  
  return expenses;
};
