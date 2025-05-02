import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, ExpenseCategory, PaymentSource, Expense, PaymentType } from '@/types';

interface AppContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  categories: ExpenseCategory[];
  addCategory: (category: ExpenseCategory) => void;
  updateCategory: (id: string, category: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;
  paymentSources: PaymentSource[];
  addPaymentSource: (source: PaymentSource) => void;
  updatePaymentSource: (id: string, source: Partial<PaymentSource>) => void;
  deletePaymentSource: (id: string) => void;
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
}

const initialCategories: ExpenseCategory[] = [
  { id: '1', name: 'מזון', color: '#4CAF50' },
  { id: '2', name: 'תחבורה', color: '#2196F3' },
  { id: '3', name: 'בידור', color: '#FF9800' },
  { id: '4', name: 'חשבונות', color: '#F44336' },
  { id: '5', name: 'קניות', color: '#9C27B0' },
  { id: '6', name: 'בריאות', color: '#00BCD4' },
  { id: '7', name: 'אחר', color: '#607D8B' },
];

const initialPaymentSources: PaymentSource[] = [
  { id: '1', name: 'מזומן', type: 'cash', color: '#4CAF50' },
  { id: '2', name: 'אשראי - ויזה', type: 'credit', color: '#2196F3' },
  { id: '3', name: 'העברה בנקאית', type: 'bank', color: '#FF9800' },
];

// Initial expenses for demo purposes
const initialExpenses: Expense[] = [
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Get current date
  const today = new Date();
  
  const [theme, setTheme] = useState<ThemeType>('default');
  const [categories, setCategories] = useState<ExpenseCategory[]>(initialCategories);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>(initialPaymentSources);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // Apply theme class to body
  useEffect(() => {
    document.body.className = '';
    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const addCategory = (category: ExpenseCategory) => {
    setCategories([...categories, category]);
  };

  const updateCategory = (id: string, updatedCategory: Partial<ExpenseCategory>) => {
    setCategories(
      categories.map((category) =>
        category.id === id ? { ...category, ...updatedCategory } : category
      )
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((category) => category.id !== id));
  };

  const addPaymentSource = (source: PaymentSource) => {
    setPaymentSources([...paymentSources, source]);
  };

  const updatePaymentSource = (id: string, updatedSource: Partial<PaymentSource>) => {
    setPaymentSources(
      paymentSources.map((source) =>
        source.id === id ? { ...source, ...updatedSource } : source
      )
    );
  };

  const deletePaymentSource = (id: string) => {
    setPaymentSources(paymentSources.filter((source) => source.id !== id));
  };

  const addExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const value = {
    theme,
    setTheme,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    paymentSources,
    addPaymentSource,
    updatePaymentSource,
    deletePaymentSource,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    currentMonth,
    currentYear,
    setCurrentMonth,
    setCurrentYear,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
