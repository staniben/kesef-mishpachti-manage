
import { PaymentSource } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { toSnakeCase } from '@/utils/dataMappers';

// Map from camelCase to snake_case for database compatibility
export function mapPaymentSourceForInsert(paymentSource: any): PaymentSource {
  return {
    id: paymentSource.id,
    name: paymentSource.name,
    type: paymentSource.type,
    color: paymentSource.color,
    user_id: paymentSource.user_id || 'mock-user-id', // Add default user_id
    createdAt: paymentSource.createdAt,
    updatedAt: paymentSource.updatedAt,
  };
}

// Add new payment source
export async function addPaymentSource(paymentSource: Omit<PaymentSource, 'id'>): Promise<PaymentSource | null> {
  try {
    const { data, error } = await supabase
      .from('payment_sources')
      .insert([toSnakeCase(paymentSource)])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding payment source:', error);
    return null;
  }
}

// Update payment source
export async function updatePaymentSource(paymentSource: PaymentSource): Promise<PaymentSource | null> {
  try {
    const { data, error } = await supabase
      .from('payment_sources')
      .update(toSnakeCase(paymentSource))
      .eq('id', paymentSource.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment source:', error);
    return null;
  }
}

// Delete payment source
export async function deletePaymentSource(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payment_sources')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting payment source:', error);
    return false;
  }
}

// Get all payment sources for current user
export async function getPaymentSources(): Promise<PaymentSource[]> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return [];
    }
    
    const { data, error } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting payment sources:', error);
    return [];
  }
}
