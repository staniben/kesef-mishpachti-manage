
import { Expense } from '@/types/models';
import { storage } from './localStorage';
import { initialExpenses, generateId } from './mockData';

const STORAGE_KEY = 'expenses';

// Simulate API delay for realistic behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    await delay(300);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    return expenses;
  },

  getById: async (id: string): Promise<Expense | null> => {
    await delay(200);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    return expenses.find(expense => expense.id === id) || null;
  },

  getByMonth: async (month: number, year: number): Promise<Expense[]> => {
    await delay(300);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    return expenses.filter(expense => {
      const date = new Date(expense.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  },
  
  getByCategory: async (categoryId: string): Promise<Expense[]> => {
    await delay(300);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    return expenses.filter(expense => expense.categoryId === categoryId);
  },
  
  getByPaymentSource: async (sourceId: string): Promise<Expense[]> => {
    await delay(300);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    return expenses.filter(expense => expense.paymentSourceId === sourceId);
  },

  create: async (expense: Expense): Promise<Expense> => {
    await delay(400);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    
    const newExpense: Expense = {
      ...expense,
      id: expense.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.set(STORAGE_KEY, [...expenses, newExpense]);
    return newExpense;
  },
  
  createBatch: async (newExpenses: Expense[]): Promise<Expense[]> => {
    await delay(500);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    
    const expensesWithMetadata = newExpenses.map(expense => ({
      ...expense,
      id: expense.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    storage.set(STORAGE_KEY, [...expenses, ...expensesWithMetadata]);
    return expensesWithMetadata;
  },

  update: async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
    await delay(400);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    const index = expenses.findIndex(expense => expense.id === id);
    
    if (index === -1) {
      throw new Error(`Expense with ID ${id} not found`);
    }
    
    const updatedExpense: Expense = {
      ...expenses[index],
      ...expenseData,
      updatedAt: new Date().toISOString()
    };
    
    expenses[index] = updatedExpense;
    storage.set(STORAGE_KEY, expenses);
    
    return updatedExpense;
  },

  delete: async (id: string): Promise<void> => {
    await delay(400);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    
    // Also delete any related expenses (installments, recurring)
    const relatedExpenses = expenses.filter(
      expense => expense.relatedExpenseId === id ||
                (expense.recurrenceId && 
                 expenses.find(e => e.id === id)?.recurrenceId === expense.recurrenceId)
    );
    
    if (relatedExpenses.length > 0) {
      relatedExpenses.forEach(expense => {
        const index = filteredExpenses.findIndex(e => e.id === expense.id);
        if (index !== -1) {
          filteredExpenses.splice(index, 1);
        }
      });
    }
    
    storage.set(STORAGE_KEY, filteredExpenses);
  },
  
  // Delete all expenses for a specific category
  deleteByCategory: async (categoryId: string): Promise<void> => {
    await delay(400);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    const filteredExpenses = expenses.filter(expense => expense.categoryId !== categoryId);
    storage.set(STORAGE_KEY, filteredExpenses);
  },
  
  // Delete all expenses for a specific payment source
  deleteByPaymentSource: async (sourceId: string): Promise<void> => {
    await delay(400);
    const expenses = storage.get<Expense[]>(STORAGE_KEY, initialExpenses);
    const filteredExpenses = expenses.filter(expense => expense.paymentSourceId !== sourceId);
    storage.set(STORAGE_KEY, filteredExpenses);
  }
};
