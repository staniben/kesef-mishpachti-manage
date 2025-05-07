
import { Expense } from '@/types/models';

/**
 * Filter expenses for a specific month and year
 */
export const filterExpensesByMonth = (expenses: Expense[], month: number, year: number): Expense[] => {
  return expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
};

/**
 * Sort expenses by date (newest first)
 */
export const sortExpensesByDate = (expenses: Expense[]): Expense[] => {
  return [...expenses].sort((a, b) => {
    // Convert to date objects for comparison
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    // Sort in descending order (newest first)
    return dateB.getTime() - dateA.getTime();
  });
};
