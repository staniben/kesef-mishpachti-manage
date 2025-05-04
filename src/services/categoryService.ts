
import { ExpenseCategory } from '@/types/models';
import { storage } from './localStorage';
import { initialCategories, generateId } from './mockData';
import { expenseService } from './expenseService';

const STORAGE_KEY = 'categories';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const categoryService = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    await delay(300);
    return storage.get<ExpenseCategory[]>(STORAGE_KEY, initialCategories);
  },

  getById: async (id: string): Promise<ExpenseCategory | null> => {
    await delay(200);
    const categories = storage.get<ExpenseCategory[]>(STORAGE_KEY, initialCategories);
    return categories.find(category => category.id === id) || null;
  },

  create: async (category: ExpenseCategory): Promise<ExpenseCategory> => {
    await delay(400);
    const categories = storage.get<ExpenseCategory[]>(STORAGE_KEY, initialCategories);
    
    const newCategory: ExpenseCategory = {
      ...category,
      id: category.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.set(STORAGE_KEY, [...categories, newCategory]);
    return newCategory;
  },

  update: async (id: string, categoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    await delay(400);
    const categories = storage.get<ExpenseCategory[]>(STORAGE_KEY, initialCategories);
    const index = categories.findIndex(category => category.id === id);
    
    if (index === -1) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    const updatedCategory: ExpenseCategory = {
      ...categories[index],
      ...categoryData,
      updatedAt: new Date().toISOString()
    };
    
    categories[index] = updatedCategory;
    storage.set(STORAGE_KEY, categories);
    
    return updatedCategory;
  },

  delete: async (id: string): Promise<void> => {
    await delay(400);
    const categories = storage.get<ExpenseCategory[]>(STORAGE_KEY, initialCategories);
    
    // Check if this is the last category
    if (categories.length <= 1) {
      throw new Error('Cannot delete the last category');
    }
    
    const filteredCategories = categories.filter(category => category.id !== id);
    storage.set(STORAGE_KEY, filteredCategories);
    
    // Delete or reassign related expenses
    await expenseService.deleteByCategory(id);
  }
};
