
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
 * Generates installment expenses based on the base expense
 */
export const generateInstallmentExpenses = (
  baseExpense: Expense,
  addExpense: (expense: Expense) => void
): void => {
  const totalInstallments = baseExpense.totalInstallments || 1;
  const installmentAmount = baseExpense.amount; // Amount per installment already calculated
  
  // Generate future installments (starting from the 2nd installment)
  for (let i = 1; i < totalInstallments; i++) {
    const installmentDate = addMonths(new Date(baseExpense.date), i);
    
    const installmentExpense: Expense = {
      id: new Date().getTime().toString() + i, // Unique ID
      amount: installmentAmount,
      date: format(installmentDate, "yyyy-MM-dd"),
      time: baseExpense.time,
      name: `${baseExpense.name.split(' (')[0]} (${i + 1}/${totalInstallments})`, // Clean name and add installment number
      categoryId: baseExpense.categoryId,
      paymentSourceId: baseExpense.paymentSourceId,
      paymentType: "installments",
      installmentNumber: i + 1,
      totalInstallments: totalInstallments,
      isInstallment: true,
      relatedExpenseId: baseExpense.id, // Link to original expense
    };
    
    addExpense(installmentExpense);
  }
};

/**
 * Generates recurring expenses based on the base expense
 */
export const generateRecurringExpenses = (
  baseExpense: Expense,
  addExpense: (expense: Expense) => void
): void => {
  // Default to 12 months if no end date is provided
  const endDate = baseExpense.recurringEndDate 
    ? new Date(baseExpense.recurringEndDate)
    : addMonths(new Date(baseExpense.date), 12);
  
  const startDate = new Date(baseExpense.date);
  let currentDate = addMonths(startDate, 1); // Start from next month
  let counter = 1;
  
  // Generate recurring expenses until end date or max 12 months
  while (currentDate <= endDate && counter <= 12) {
    const recurringExpense: Expense = {
      id: new Date().getTime().toString() + counter,
      amount: baseExpense.amount,
      date: format(currentDate, "yyyy-MM-dd"),
      time: baseExpense.time,
      name: `${baseExpense.name} (חודשי ${counter + 1})`,
      categoryId: baseExpense.categoryId,
      paymentSourceId: baseExpense.paymentSourceId,
      paymentType: "recurring",
      recurringEndDate: baseExpense.recurringEndDate,
      isRecurring: true,
      recurrenceType: "monthly",
      relatedExpenseId: baseExpense.id,
    };
    
    addExpense(recurringExpense);
    
    currentDate = addMonths(currentDate, 1);
    counter++;
  }
};
