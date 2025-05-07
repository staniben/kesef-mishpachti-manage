
import { Expense } from '@/types/models';

// Define a type for the expense form data
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
