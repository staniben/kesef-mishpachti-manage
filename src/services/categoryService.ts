
import { ExpenseCategory } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';

// Map DB schema to frontend model
const mapDbCategoryToModel = (dbCategory: any): ExpenseCategory => ({
  id: dbCategory.id,
  name: dbCategory.name,
  color: dbCategory.color || '#3B82F6', // Default color if not provided
  createdAt: dbCategory.created_at,
  updatedAt: dbCategory.updated_at
});

// Map frontend model to DB schema
const mapModelToDbCategory = (category: ExpenseCategory) => ({
  id: category.id,
  name: category.name,
  color: category.color,
  created_at: category.createdAt,
  updated_at: category.updatedAt,
  user_id: null // Will be set in each method with the authenticated user's ID
});

export const categoryService = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data ? data.map(mapDbCategoryToModel) : [];
  },

  getById: async (id: string): Promise<ExpenseCategory | null> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      throw error;
    }

    return data ? mapDbCategoryToModel(data) : null;
  },

  create: async (category: ExpenseCategory): Promise<ExpenseCategory> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    const dbCategory = mapModelToDbCategory({
      ...category,
      id: category.id || generateId(),
    });
    
    // Set the user_id from authenticated session
    dbCategory.user_id = userData.user.id;
    
    const { data, error } = await supabase
      .from('categories')
      .insert(dbCategory)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return mapDbCategoryToModel(data);
  },

  update: async (id: string, categoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    // Map the partial update data to DB format
    const dbCategoryUpdate: Record<string, any> = {};
    
    if (categoryData.name !== undefined) dbCategoryUpdate.name = categoryData.name;
    if (categoryData.color !== undefined) dbCategoryUpdate.color = categoryData.color;
    
    const { data, error } = await supabase
      .from('categories')
      .update(dbCategoryUpdate)
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating category with ID ${id}:`, error);
      throw error;
    }

    return mapDbCategoryToModel(data);
  },

  delete: async (id: string): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    // First delete all expenses with this category
    await supabase
      .from('expenses')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userData.user.id);
    
    // Then delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error(`Error deleting category with ID ${id}:`, error);
      throw error;
    }
  }
};
