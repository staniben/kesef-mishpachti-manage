
import { create } from 'zustand';
import { Expense, ExpenseCategory, PaymentSource, ThemeType } from '@/types/models';
import { expenseService } from '@/services/expenseService';
import { categoryService } from '@/services/categoryService';
import { paymentSourceService } from '@/services/paymentSourceService';
import { devtools } from 'zustand/middleware';

interface StoreState {
  // Data
  expenses: Expense[];
  categories: ExpenseCategory[];
  paymentSources: PaymentSource[];
  
  // UI state
  currentMonth: number;
  currentYear: number;
  theme: ThemeType;
  
  // Actions - Expenses
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  addMultipleExpenses: (expenses: Expense[]) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Actions - Categories
  fetchCategories: () => Promise<void>;
  addCategory: (category: ExpenseCategory) => Promise<void>;
  updateCategory: (id: string, category: Partial<ExpenseCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Actions - Payment Sources
  fetchPaymentSources: () => Promise<void>;
  addPaymentSource: (source: PaymentSource) => Promise<void>;
  updatePaymentSource: (id: string, source: Partial<PaymentSource>) => Promise<void>;
  deletePaymentSource: (id: string) => Promise<void>;
  
  // Actions - App Settings
  setTheme: (theme: ThemeType) => void;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
}

export const useAppStore = create<StoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      expenses: [],
      categories: [],
      paymentSources: [],
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      theme: 'default',
      
      // Expense actions
      fetchExpenses: async () => {
        const expenses = await expenseService.getAll();
        set({ expenses });
      },
      
      addExpense: async (expense) => {
        const addedExpense = await expenseService.create(expense);
        set((state) => ({ expenses: [...state.expenses, addedExpense] }));
      },
      
      addMultipleExpenses: async (expenses) => {
        const addedExpenses = await expenseService.createBatch(expenses);
        set((state) => ({ expenses: [...state.expenses, ...addedExpenses] }));
      },
      
      updateExpense: async (id, expense) => {
        const updatedExpense = await expenseService.update(id, expense);
        set((state) => ({
          expenses: state.expenses.map((e) => 
            e.id === id ? { ...e, ...updatedExpense } : e
          )
        }));
      },
      
      deleteExpense: async (id) => {
        await expenseService.delete(id);
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id)
        }));
      },
      
      // Category actions
      fetchCategories: async () => {
        const categories = await categoryService.getAll();
        set({ categories });
      },
      
      addCategory: async (category) => {
        const addedCategory = await categoryService.create(category);
        set((state) => ({ categories: [...state.categories, addedCategory] }));
      },
      
      updateCategory: async (id, category) => {
        const updatedCategory = await categoryService.update(id, category);
        set((state) => ({
          categories: state.categories.map((c) => 
            c.id === id ? { ...c, ...updatedCategory } : c
          )
        }));
      },
      
      deleteCategory: async (id) => {
        await categoryService.delete(id);
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id)
        }));
      },
      
      // Payment source actions
      fetchPaymentSources: async () => {
        const paymentSources = await paymentSourceService.getAll();
        set({ paymentSources });
      },
      
      addPaymentSource: async (source) => {
        const addedSource = await paymentSourceService.create(source);
        set((state) => ({ paymentSources: [...state.paymentSources, addedSource] }));
      },
      
      updatePaymentSource: async (id, source) => {
        const updatedSource = await paymentSourceService.update(id, source);
        set((state) => ({
          paymentSources: state.paymentSources.map((s) => 
            s.id === id ? { ...s, ...updatedSource } : s
          )
        }));
      },
      
      deletePaymentSource: async (id) => {
        await paymentSourceService.delete(id);
        set((state) => ({
          paymentSources: state.paymentSources.filter((s) => s.id !== id)
        }));
      },
      
      // App settings actions
      setTheme: (theme) => {
        set({ theme });
      },
      
      setCurrentMonth: (month) => {
        set({ currentMonth: month });
      },
      
      setCurrentYear: (year) => {
        set({ currentYear: year });
      },
    }),
    {
      name: 'expense-tracker-store'
    }
  )
);
