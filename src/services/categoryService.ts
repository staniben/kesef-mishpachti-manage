
import { ExpenseCategory } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';

export const categoryService = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<ExpenseCategory | null> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      throw error;
    }

    return data;
  },

  create: async (category: ExpenseCategory): Promise<ExpenseCategory> => {
    const user = supabase.auth.getUser();
    
    const newCategory = {
      ...category,
      id: category.id || generateId(),
      user_id: (await user).data.user?.id,
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert(newCategory)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, categoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating category with ID ${id}:`, error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    // First check how many categories the user has
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting categories:', countError);
      throw countError;
    }
    
    // Check if this is the last category
    if (count !== null && count <= 1) {
      throw new Error('Cannot delete the last category');
    }
    
    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting category with ID ${id}:`, error);
      throw error;
    }
  }
};
