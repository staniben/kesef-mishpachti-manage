
import { format, addMonths } from 'date-fns';
import { Expense, PaymentType, RecurrenceType } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

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
    id: editId || uuidv4(),
    amount,
    date: format(date, "yyyy-MM-dd"),
    time,
    name,
    categoryId,
    paymentSourceId,
    paymentType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Generate a batch of installment expenses
 */
export const generateInstallmentExpenses = (
  totalAmount: number,
  installments: number,
  startDate: Date,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  time: string = "00:00"
): Expense[] => {
  if (installments < 2) {
    throw new Error("Installments must be at least 2");
  }
  
  if (totalAmount <= 0) {
    throw new Error("Total amount must be positive");
  }

  const monthlyAmount = totalAmount / installments;
  const installmentExpenses: Expense[] = [];
  const recurrenceId = uuidv4();
  
  for (let i = 0; i < installments; i++) {
    const installmentDate = addMonths(startDate, i);
    const formattedDate = format(installmentDate, "yyyy-MM-dd");
    
    const expense: Expense = {
      id: uuidv4(),
      amount: monthlyAmount,
      date: formattedDate,
      time,
      name: `${name} (${i+1}/${installments})`,
      categoryId,
      paymentSourceId,
      paymentType: "installment",
      installmentNumber: i + 1,
      totalInstallments: installments,
      isInstallment: true,
      relatedExpenseId: i > 0 ? installmentExpenses[0].id : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    installmentExpenses.push(expense);
  }
  
  return installmentExpenses;
};

/**
 * Generate a batch of recurring expenses
 */
export const generateRecurringExpenses = (
  amount: number,
  startDate: Date,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  time: string = "00:00", 
  months: number = 12
): Expense[] => {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }
  
  const recurringExpenses: Expense[] = [];
  const recurrenceId = uuidv4();
  const recurrenceType: RecurrenceType = "monthly";
  
  for (let i = 0; i < months; i++) {
    const recurringDate = addMonths(startDate, i);
    const formattedDate = format(recurringDate, "yyyy-MM-dd");
    
    const expense: Expense = {
      id: uuidv4(),
      amount,
      date: formattedDate,
      time,
      name,
      categoryId,
      paymentSourceId,
      paymentType: "recurring",
      isRecurring: true,
      recurrenceId,
      recurrenceType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    recurringExpenses.push(expense);
  }
  
  return recurringExpenses;
};

/**
 * Calculate total expenses
 */
export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Group expenses by category
 */
export const groupExpensesByCategory = (expenses: Expense[]): Record<string, number> => {
  return expenses.reduce((acc, expense) => {
    const { categoryId, amount } = expense;
    acc[categoryId] = (acc[categoryId] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Group expenses by payment source
 */
export const groupExpensesByPaymentSource = (expenses: Expense[]): Record<string, number> => {
  return expenses.reduce((acc, expense) => {
    const { paymentSourceId, amount } = expense;
    acc[paymentSourceId] = (acc[paymentSourceId] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Filter expenses by month and year
 */
export const filterExpensesByMonth = (expenses: Expense[], month: number, year: number): Expense[] => {
  return expenses.filter(expense => {
    const date = new Date(expense.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
};

/**
 * Sort expenses by date (newest first)
 */
export const sortExpensesByDate = (expenses: Expense[], descending: boolean = true): Expense[] => {
  return [...expenses].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return descending ? dateB - dateA : dateA - dateB;
  });
};
