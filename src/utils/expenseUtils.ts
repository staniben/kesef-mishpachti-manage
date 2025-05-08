import { Expense } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';
import { addMonths } from 'date-fns';

// Define a type for the form data
export type ExpenseFormData = {
  id?: string;
  name: string;
  amount: string;
  date?: Date;
  time?: string;
  categoryId: string;
  paymentSourceId: string;
  paymentType: string;
  totalAmount: string;
  numberOfInstallments: string;
  startDate?: Date;
};

// Helper to generate new ID (will be replaced with database IDs in the future)
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Creates a single expense object from form data
 */
export const createSingleExpenseFromForm = (formData: ExpenseFormData, userId: string): Expense => {
  const now = new Date().toISOString();
  
  return {
    id: formData.id || generateId(),
    amount: Number(formData.amount),
    date: formData.date?.toISOString().split('T')[0] || now.split('T')[0],
    time: formData.time || '00:00',
    name: formData.name,
    categoryId: formData.categoryId,
    paymentSourceId: formData.paymentSourceId,
    paymentType: 'one-time', // Fix: Use proper PaymentType value
    user_id: userId, // Use the provided userId instead of hardcoded value
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Creates an array of installment expenses from form data
 */
export const createInstallmentExpensesFromForm = (formData: ExpenseFormData, userId: string): Expense[] => {
  const now = new Date().toISOString();
  const totalAmount = Number(formData.totalAmount);
  const numberOfInstallments = Number(formData.numberOfInstallments);
  const startDate = formData.startDate || new Date();
  
  // Validate that totalAmount and numberOfInstallments are valid numbers
  if (isNaN(totalAmount) || isNaN(numberOfInstallments) || numberOfInstallments <= 0) {
    console.error("Invalid totalAmount or numberOfInstallments");
    return [];
  }
  
  // Generate the installment expenses
  const installments: Expense[] = [];
  const installmentAmount = totalAmount / numberOfInstallments;
  
  for (let i = 0; i < numberOfInstallments; i++) {
    const installmentDate = addMonths(startDate, i);
    const formattedDate = installmentDate.toISOString().split('T')[0];
    
    installments.push({
      id: generateId(),
      amount: installmentAmount,
      date: formattedDate,
      time: '00:00',
      name: `${formData.name} (${i + 1}/${numberOfInstallments})`,
      categoryId: formData.categoryId,
      paymentSourceId: formData.paymentSourceId,
      paymentType: 'installment',
      installmentNumber: i + 1,
      totalInstallments: numberOfInstallments,
      isInstallment: true,
      user_id: userId, // Use the provided userId instead of hardcoded value
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return installments;
};

/**
 * Creates a recurring expense from form data
 */
export const createRecurringExpenseFromForm = (formData: ExpenseFormData, userId: string): Expense => {
  const now = new Date().toISOString();
  const startDate = formData.startDate || new Date();
  
  return {
    id: formData.id || generateId(),
    amount: Number(formData.amount),
    date: startDate.toISOString().split('T')[0],
    time: '00:00',
    name: formData.name,
    categoryId: formData.categoryId,
    paymentSourceId: formData.paymentSourceId,
    paymentType: 'recurring',
    isRecurring: true,
    recurrenceId: generateId(),
    recurrenceType: 'monthly', // Currently only supporting monthly
    totalInstallments: 0, // Infinite
    installmentNumber: 1,
    user_id: userId, // Use the provided userId instead of hardcoded value
    createdAt: now,
    updatedAt: now,
  };
};

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

/**
 * Calculate total amount of all expenses
 */
export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

/**
 * Create base expense object from common fields
 */
export const createBaseExpense = (
  id: string | undefined, 
  amount: number, 
  date: Date, 
  time: string | undefined, 
  name: string, 
  categoryId: string, 
  paymentSourceId: string, 
  paymentType: string,
  userId: string
): Expense => {
  const now = new Date().toISOString();
  
  return {
    id: id || generateId(),
    amount: amount,
    date: date.toISOString().split('T')[0],
    time: time || '00:00',
    name: name,
    categoryId: categoryId,
    paymentSourceId: paymentSourceId,
    paymentType: paymentType as 'one-time' | 'installment' | 'recurring',
    user_id: userId, // Use the provided userId instead of hardcoded value
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Generate an array of recurring expenses
 * Creates expenses for 12 months starting from the specified date
 */
export const generateRecurringExpenses = (
  amount: number,
  startDate: Date,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  time?: string,
  userId: string = ''
): Expense[] => {
  const now = new Date().toISOString();
  const recurrenceId = generateId();
  const numberOfMonths = 12; // Generate expenses for 12 months
  const expenses: Expense[] = [];
  
  for (let i = 0; i < numberOfMonths; i++) {
    const expenseDate = addMonths(startDate, i);
    
    expenses.push({
      id: generateId(),
      amount: amount,
      date: expenseDate.toISOString().split('T')[0],
      time: time || '00:00',
      name: `${name} (${i + 1}/${numberOfMonths})`,
      categoryId: categoryId,
      paymentSourceId: paymentSourceId,
      paymentType: 'recurring',
      isRecurring: true,
      recurrenceId: recurrenceId, // Same recurrenceId to link all recurring expenses
      recurrenceType: 'monthly',
      installmentNumber: i + 1,
      totalInstallments: numberOfMonths,
      user_id: userId,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return expenses;
};

/**
 * Generate an array of installment expenses
 */
export const generateInstallmentExpenses = (
  totalAmount: number,
  numberOfInstallments: number,
  startDate: Date,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  time?: string,
  userId: string = ''
): Expense[] => {
  const now = new Date().toISOString();
  const installmentAmount = totalAmount / numberOfInstallments;
  const expenses: Expense[] = [];
  
  for (let i = 0; i < numberOfInstallments; i++) {
    const installmentDate = addMonths(startDate, i);
    
    expenses.push({
      id: generateId(),
      amount: installmentAmount,
      date: installmentDate.toISOString().split('T')[0],
      time: time || '00:00',
      name: `${name} (${i + 1}/${numberOfInstallments})`,
      categoryId: categoryId,
      paymentSourceId: paymentSourceId,
      paymentType: 'installment',
      isInstallment: true,
      installmentNumber: i + 1,
      totalInstallments: numberOfInstallments,
      user_id: userId,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return expenses;
};
