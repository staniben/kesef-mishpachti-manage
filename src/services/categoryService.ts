import { ExpenseCategory } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';
import { handleSupabaseError } from '@/utils/errorHandler';
import { User } from '@supabase/supabase-js';

/**
 * Maps database category object to frontend model
 */
const mapDbCategoryToModel = (dbCategory: any): ExpenseCategory => ({
  id: dbCategory.id,
  name: dbCategory.name,
  color: dbCategory.color || '#3B82F6', // Default color if not provided
  user_id: dbCategory.user_id,
  createdAt: dbCategory.created_at,
  updatedAt: dbCategory.updated_at
});

/**
 * Maps frontend category model to database schema
 */
const mapModelToDbCategory = (category: ExpenseCategory) => ({
  id: category.id,
  name: category.name,
  color: category.color,
  created_at: category.createdAt,
  updated_at: category.updatedAt,
  user_id: category.user_id // Include user_id from the category object
});

/**
 * Verifies authentication and returns the current user
 * @returns Authenticated user or throws an error if not authenticated
 */
const verifyAuth = async (): Promise<User> => {
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error(`Authentication error: ${sessionError.message}`);
  }
  
  if (!session?.session?.user) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated');
  }
  
  // Verify token expiration
  const expiresInMs = (session.session.expires_at * 1000) - Date.now();
  const expiresInMinutes = Math.floor(expiresInMs / (1000 * 60));
  
  if (expiresInMinutes < 10) {
    console.warn(`⚠️ Auth token expires in ${expiresInMinutes} minutes!`);
  }
  
  return session.session.user;
};

export const categoryService = {
  /**
   * Gets all categories for the authenticated user
   * @returns Array of category objects
   */
  getAll: async (): Promise<ExpenseCategory[]> => {
    try {
      const user = await verifyAuth();
      console.log('Fetching categories for user:', user.id);
      
      // Test first with count to see if RLS allows access
      const { count, error: countError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (countError) {
        console.error('Error checking categories count:', countError);
        console.error('RLS might be preventing access to categories');
        throw countError;
      }
      
      console.log(`Found ${count || 0} categories with RLS rules`);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        handleSupabaseError(error, 'fetching categories');
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} categories`);
      return data ? data.map(mapDbCategoryToModel) : [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  },

  /**
   * Gets a single category by ID
   * @param id Category ID
   * @returns Category object or null if not found
   */
  getById: async (id: string): Promise<ExpenseCategory | null> => {
    try {
      const user = await verifyAuth();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        handleSupabaseError(error, `fetching category with ID ${id}`);
        throw error;
      }

      return data ? mapDbCategoryToModel(data) : null;
    } catch (error) {
      console.error(`Failed to get category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new category
   * @param category Category object to create
   * @returns Created category
   */
  create: async (category: ExpenseCategory): Promise<ExpenseCategory> => {
    try {
      const user = await verifyAuth();
      console.log('Creating category with authenticated user:', user.id);
      
      const dbCategory = mapModelToDbCategory({
        ...category,
        id: category.id || generateId(),
        createdAt: category.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Set the user_id from authenticated session
      dbCategory.user_id = user.id;
      
      console.log('Sending category payload to Supabase:', dbCategory);
      
      // First test if we can access the table with a simple count
      const { count, error: countError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Cannot access categories table:', countError);
        console.error('RLS might be preventing access to the categories table');
      } else {
        console.log(`User can access categories table, found ${count} existing categories`);
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert(dbCategory)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'creating category');
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from category creation');
      }

      console.log('Category created successfully:', data);
      return mapDbCategoryToModel(data);
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  },

  /**
   * Updates an existing category
   * @param id Category ID to update
   * @param categoryData Partial category data to update
   * @returns Updated category
   */
  update: async (id: string, categoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    try {
      const user = await verifyAuth();
      
      // Map the partial update data to DB format
      const dbCategoryUpdate: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (categoryData.name !== undefined) dbCategoryUpdate.name = categoryData.name;
      if (categoryData.color !== undefined) dbCategoryUpdate.color = categoryData.color;
      
      console.log(`Updating category ${id} with data:`, dbCategoryUpdate);
      
      const { data, error } = await supabase
        .from('categories')
        .update(dbCategoryUpdate)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, `updating category with ID ${id}`);
        throw error;
      }

      if (!data) {
        throw new Error(`No data returned from category update for ID ${id}`);
      }

      console.log('Category updated successfully:', data);
      return mapDbCategoryToModel(data);
    } catch (error) {
      console.error(`Failed to update category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a category and all associated expenses
   * @param id Category ID to delete
   */
  delete: async (id: string): Promise<void> => {
    try {
      const user = await verifyAuth();
      console.log(`Deleting category ${id} for user ${user.id}`);
      
      // First delete all expenses with this category
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('category_id', id)
        .eq('user_id', user.id);

      if (expensesError) {
        handleSupabaseError(expensesError, `deleting expenses for category ${id}`);
        throw expensesError;
      }
      
      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        handleSupabaseError(error, `deleting category with ID ${id}`);
        throw error;
      }
      
      console.log(`Category ${id} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete category ${id}:`, error);
      throw error;
    }
  }
};
