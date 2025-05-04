
import { Expense, ExpenseCategory, PaymentSource } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

// This file contains seed/initial data for the app

export const initialCategories: ExpenseCategory[] = [
  { id: '1', name: 'מזון', color: '#4CAF50' },
  { id: '2', name: 'תחבורה', color: '#2196F3' },
  { id: '3', name: 'בידור', color: '#FF9800' },
  { id: '4', name: 'חשבונות', color: '#F44336' },
  { id: '5', name: 'קניות', color: '#9C27B0' },
  { id: '6', name: 'בריאות', color: '#00BCD4' },
  { id: '7', name: 'אחר', color: '#607D8B' },
];

export const initialPaymentSources: PaymentSource[] = [
  { id: '1', name: 'מזומן', type: 'cash', color: '#4CAF50' },
  { id: '2', name: 'אשראי - ויזה', type: 'credit', color: '#2196F3' },
  { id: '3', name: 'העברה בנקאית', type: 'bank', color: '#FF9800' },
];

export const initialExpenses: Expense[] = [
  {
    id: '1',
    amount: 250,
    date: '2025-04-25',
    time: '12:30',
    name: 'קניות בסופר',
    categoryId: '1',
    paymentSourceId: '2',
    paymentType: 'one-time',
  },
  {
    id: '2',
    amount: 89,
    date: '2025-04-24',
    time: '18:15',
    name: 'דלק',
    categoryId: '2',
    paymentSourceId: '2',
    paymentType: 'one-time',
  },
  {
    id: '3',
    amount: 120,
    date: '2025-04-23',
    time: '20:00',
    name: 'ארוחה במסעדה',
    categoryId: '3',
    paymentSourceId: '1',
    paymentType: 'one-time',
  },
  {
    id: '4',
    amount: 350,
    date: '2025-04-20',
    time: '09:00',
    name: 'חשבון חשמל',
    categoryId: '4',
    paymentSourceId: '3',
    paymentType: 'one-time',
  },
  {
    id: '5',
    amount: 2400,
    date: '2025-04-15',
    time: '10:30',
    name: 'טלוויזיה חדשה',
    categoryId: '5',
    paymentSourceId: '2',
    paymentType: 'one-time',
  },
];

// Helper to generate new ID (will be replaced with database IDs in the future)
export const generateId = (): string => {
  return uuidv4();
};
