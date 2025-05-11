
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
  
  // Actions - Data Management
  refreshAllData: () => Promise<void>;
  clearStore: () => void;
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
        try {
          const expenses = await expenseService.getAll();
          set({ expenses });
        } catch (error) {
          console.error("Error fetching expenses:", error);
          throw error;
        }
      },
      
      addExpense: async (expense) => {
        try {
          const addedExpense = await expenseService.create(expense);
          set((state) => ({ expenses: [...state.expenses, addedExpense] }));
        } catch (error) {
          console.error("Error adding expense:", error);
          throw error;
        }
      },
      
      addMultipleExpenses: async (expenses) => {
        try {
          const addedExpenses = await expenseService.createBatch(expenses);
          set((state) => ({ expenses: [...state.expenses, ...addedExpenses] }));
        } catch (error) {
          console.error("Error adding multiple expenses:", error);
          throw error;
        }
      },
      
      updateExpense: async (id, expense) => {
        try {
          const updatedExpense = await expenseService.update(id, expense);
          set((state) => ({
            expenses: state.expenses.map((e) => 
              e.id === id ? { ...e, ...updatedExpense } : e
            )
          }));
        } catch (error) {
          console.error(`Error updating expense ${id}:`, error);
          throw error;
        }
      },
      
      deleteExpense: async (id) => {
        try {
          await expenseService.delete(id);
          set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id)
          }));
        } catch (error) {
          console.error(`Error deleting expense ${id}:`, error);
          throw error;
        }
      },
      
      // Category actions
      fetchCategories: async () => {
        try {
          const categories = await categoryService.getAll();
          set({ categories });
        } catch (error) {
          console.error("Error fetching categories:", error);
          throw error;
        }
      },
      
      addCategory: async (category) => {
        try {
          const addedCategory = await categoryService.create(category);
          set((state) => ({ categories: [...state.categories, addedCategory] }));
        } catch (error) {
          console.error("Error adding category:", error);
          throw error;
        }
      },
      
      updateCategory: async (id, category) => {
        try {
          const updatedCategory = await categoryService.update(id, category);
          set((state) => ({
            categories: state.categories.map((c) => 
              c.id === id ? { ...c, ...updatedCategory } : c
            )
          }));
        } catch (error) {
          console.error(`Error updating category ${id}:`, error);
          throw error;
        }
      },
      
      deleteCategory: async (id) => {
        try {
          await categoryService.delete(id);
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id)
          }));
        } catch (error) {
          console.error(`Error deleting category ${id}:`, error);
          throw error;
        }
      },
      
      // Payment source actions
      fetchPaymentSources: async () => {
        try {
          console.log("Fetching payment sources...");
          const paymentSources = await paymentSourceService.getAll();
          console.log("Fetched payment sources:", paymentSources);
          set({ paymentSources });
        } catch (error) {
          console.error("Error fetching payment sources:", error);
          throw error;
        }
      },
      
      addPaymentSource: async (source) => {
        try {
          console.log("Adding payment source:", source);
          // Ensure the source has required fields
          const sourceWithDefaults = {
            ...source,
            color: source.color || "#2196F3"
          };
          
          const addedSource = await paymentSourceService.create(sourceWithDefaults);
          console.log("Added payment source:", addedSource);
          
          set((state) => ({ 
            paymentSources: [...state.paymentSources, addedSource] 
          }));
        } catch (error) {
          console.error("Error adding payment source:", error);
          throw error;
        }
      },
      
      updatePaymentSource: async (id, source) => {
        try {
          console.log(`Updating payment source ${id}:`, source);
          const updatedSource = await paymentSourceService.update(id, source);
          console.log("Updated payment source:", updatedSource);
          
          set((state) => ({
            paymentSources: state.paymentSources.map((s) => 
              s.id === id ? { ...s, ...updatedSource } : s
            )
          }));
        } catch (error) {
          console.error(`Error updating payment source ${id}:`, error);
          throw error;
        }
      },
      
      deletePaymentSource: async (id) => {
        try {
          console.log(`Deleting payment source ${id}`);
          await paymentSourceService.delete(id);
          
          set((state) => ({
            paymentSources: state.paymentSources.filter((s) => s.id !== id)
          }));
        } catch (error) {
          console.error(`Error deleting payment source ${id}:`, error);
          throw error;
        }
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
      
      // New data management actions
      refreshAllData: async () => {
        console.log("Refreshing all data from server...");
        try {
          // Fetch all data in parallel for faster refresh
          await Promise.all([
            get().fetchCategories(),
            get().fetchPaymentSources(),
            get().fetchExpenses()
          ]);
          console.log("All data refreshed successfully");
        } catch (error) {
          console.error("Error refreshing data:", error);
          throw error;
        }
      },
      
      clearStore: () => {
        console.log("Clearing store state");
        set({
          expenses: [],
          categories: [],
          paymentSources: []
        });
      }
    }),
    {
      name: 'expense-tracker-store'
    }
  )
);
