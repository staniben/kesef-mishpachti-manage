
import { PaymentSource } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from './mockData';

export const paymentSourceService = {
  getAll: async (): Promise<PaymentSource[]> => {
    const { data, error } = await supabase
      .from('payment_sources')
      .select('*');

    if (error) {
      console.error('Error fetching payment sources:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<PaymentSource | null> => {
    const { data, error } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching payment source with ID ${id}:`, error);
      throw error;
    }

    return data;
  },

  create: async (source: PaymentSource): Promise<PaymentSource> => {
    const user = supabase.auth.getUser();
    
    const newSource = {
      ...source,
      id: source.id || generateId(),
      user_id: (await user).data.user?.id,
    };
    
    const { data, error } = await supabase
      .from('payment_sources')
      .insert(newSource)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment source:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, sourceData: Partial<PaymentSource>): Promise<PaymentSource> => {
    const { data, error } = await supabase
      .from('payment_sources')
      .update(sourceData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating payment source with ID ${id}:`, error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    // First check how many payment sources the user has
    const { count, error: countError } = await supabase
      .from('payment_sources')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting payment sources:', countError);
      throw countError;
    }
    
    // Check if this is the last payment source
    if (count !== null && count <= 1) {
      throw new Error('Cannot delete the last payment source');
    }
    
    // Delete the payment source
    const { error } = await supabase
      .from('payment_sources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting payment source with ID ${id}:`, error);
      throw error;
    }
  }
};
