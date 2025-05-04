
import { Expense, ExpenseCategory, PaymentSource, ThemeType } from './models';

/**
 * All possible action types for the store
 */
export type StoreActionType = 
  // Expense actions
  | 'SET_EXPENSES'
  | 'ADD_EXPENSE'
  | 'ADD_EXPENSES_BATCH' 
  | 'UPDATE_EXPENSE'
  | 'DELETE_EXPENSE'
  
  // Category actions
  | 'SET_CATEGORIES'
  | 'ADD_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  
  // Payment source actions
  | 'SET_PAYMENT_SOURCES'
  | 'ADD_PAYMENT_SOURCE'
  | 'UPDATE_PAYMENT_SOURCE'
  | 'DELETE_PAYMENT_SOURCE'
  
  // App settings actions
  | 'SET_THEME'
  | 'SET_CURRENT_MONTH'
  | 'SET_CURRENT_YEAR';

/**
 * Union type for all possible store actions
 */
export type StoreAction =
  // Expense actions
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'ADD_EXPENSES_BATCH'; payload: Expense[] }
  | { type: 'UPDATE_EXPENSE'; payload: { id: string; expense: Partial<Expense> } }
  | { type: 'DELETE_EXPENSE'; payload: string }
  
  // Category actions
  | { type: 'SET_CATEGORIES'; payload: ExpenseCategory[] }
  | { type: 'ADD_CATEGORY'; payload: ExpenseCategory }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; category: Partial<ExpenseCategory> } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  
  // Payment source actions
  | { type: 'SET_PAYMENT_SOURCES'; payload: PaymentSource[] }
  | { type: 'ADD_PAYMENT_SOURCE'; payload: PaymentSource }
  | { type: 'UPDATE_PAYMENT_SOURCE'; payload: { id: string; source: Partial<PaymentSource> } }
  | { type: 'DELETE_PAYMENT_SOURCE'; payload: string }
  
  // App settings actions
  | { type: 'SET_THEME'; payload: ThemeType }
  | { type: 'SET_CURRENT_MONTH'; payload: number }
  | { type: 'SET_CURRENT_YEAR'; payload: number };

/**
 * Type for operation result with loading and error states
 */
export interface OperationResult<T = void> {
  data?: T;
  error?: Error | unknown;
  isLoading: boolean;
}
