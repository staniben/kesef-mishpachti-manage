
import { PaymentSource } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';

// Map DB schema to frontend model
const mapDbSourceToModel = (dbSource: any): PaymentSource => ({
  id: dbSource.id,
  name: dbSource.name,
  type: dbSource.type,
  color: dbSource.color,
  createdAt: dbSource.created_at,
  updatedAt: dbSource.updated_at
});

// Map frontend model to DB schema
const mapModelToDbSource = (source: PaymentSource) => ({
  id: source.id,
  name: source.name,
  type: source.type,
  color: source.color,
  created_at: source.createdAt,
  updated_at: source.updatedAt,
  user_id: null // Will be set in each method with the authenticated user's ID
});

export const paymentSourceService = {
  getAll: async (): Promise<PaymentSource[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching payment sources:', error);
      throw error;
    }

    return data ? data.map(mapDbSourceToModel) : [];
  },

  getById: async (id: string): Promise<PaymentSource | null> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      console.error(`Error fetching payment source with ID ${id}:`, error);
      throw error;
    }

    return data ? mapDbSourceToModel(data) : null;
  },

  create: async (source: PaymentSource): Promise<PaymentSource> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    const dbSource = mapModelToDbSource({
      ...source,
      id: source.id || generateId(),
    });
    
    // Set the user_id from authenticated session
    dbSource.user_id = userData.user.id;
    
    const { data, error } = await supabase
      .from('payment_sources')
      .insert(dbSource)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment source:', error);
      throw error;
    }

    return mapDbSourceToModel(data);
  },

  update: async (id: string, sourceData: Partial<PaymentSource>): Promise<PaymentSource> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    // Map the partial update data to DB format
    const dbSourceUpdate: Record<string, any> = {};
    
    if (sourceData.name !== undefined) dbSourceUpdate.name = sourceData.name;
    if (sourceData.type !== undefined) dbSourceUpdate.type = sourceData.type;
    if (sourceData.color !== undefined) dbSourceUpdate.color = sourceData.color;
    
    const { data, error } = await supabase
      .from('payment_sources')
      .update(dbSourceUpdate)
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating payment source with ID ${id}:`, error);
      throw error;
    }

    return mapDbSourceToModel(data);
  },

  delete: async (id: string): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    // First check how many payment sources the user has
    const { count, error: countError } = await supabase
      .from('payment_sources')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id);
    
    if (countError) {
      console.error('Error counting payment sources:', countError);
      throw countError;
    }
    
    // Check if this is the last payment source
    if (count !== null && count <= 1) {
      throw new Error('Cannot delete the last payment source');
    }
    
    // Delete all expenses with this payment source
    await supabase
      .from('expenses')
      .delete()
      .eq('payment_source_id', id)
      .eq('user_id', userData.user.id);
    
    // Delete the payment source
    const { error } = await supabase
      .from('payment_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error(`Error deleting payment source with ID ${id}:`, error);
      throw error;
    }
  }
};
