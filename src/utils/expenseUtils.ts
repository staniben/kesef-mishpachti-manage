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
    paymentType: formData.paymentType,
    user_id: userId,
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
      user_id: userId,
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
    user_id: userId,
    createdAt: now,
    updatedAt: now,
  };
};
