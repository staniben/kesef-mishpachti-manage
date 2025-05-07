
import { Expense } from '@/types/models';
import { addMonths } from 'date-fns';
import { generateId } from './idGenerator';

/**
 * Generate an array of recurring expenses
 */
export const generateRecurringExpenses = (
  amount: number,
  startDate: Date,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  time?: string
): Expense[] => {
  const now = new Date().toISOString();
  const recurrenceId = generateId();
  
  // For simplicity, we'll just generate one recurring expense
  // In a real app, you would generate multiple instances or handle recurrence differently
  return [{
    id: generateId(),
    amount: amount,
    date: startDate.toISOString().split('T')[0],
    time: time || '00:00',
    name: name,
    categoryId: categoryId,
    paymentSourceId: paymentSourceId,
    paymentType: 'recurring',
    isRecurring: true,
    recurrenceId: recurrenceId,
    recurrenceType: 'monthly',
    user_id: 'mock-user-id', // This should be replaced with the actual user ID in production
    createdAt: now,
    updatedAt: now,
  }];
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
  time?: string
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
      user_id: 'mock-user-id', // This should be replaced with the actual user ID in production
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return expenses;
};
