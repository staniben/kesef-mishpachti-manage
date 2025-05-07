
import { Expense } from '@/types/models';

/**
 * Group expenses by category and calculate total for each category
 */
export const groupExpensesByCategory = (expenses: Expense[]): Record<string, number> => {
  const result: Record<string, number> = {};
  
  expenses.forEach((expense) => {
    const categoryId = expense.categoryId;
    if (!result[categoryId]) {
      result[categoryId] = 0;
    }
    result[categoryId] += expense.amount;
  });
  
  return result;
};

/**
 * Group expenses by payment source and calculate total for each source
 */
export const groupExpensesByPaymentSource = (expenses: Expense[]): Record<string, number> => {
  const result: Record<string, number> = {};
  
  expenses.forEach((expense) => {
    const sourceId = expense.paymentSourceId;
    if (!result[sourceId]) {
      result[sourceId] = 0;
    }
    result[sourceId] += expense.amount;
  });
  
  return result;
};

/**
 * Calculate total amount of all expenses
 */
export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};
