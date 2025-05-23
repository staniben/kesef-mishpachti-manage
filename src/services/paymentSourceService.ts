
import { PaymentSource } from '@/types/models';
import { supabase } from '@/integrations/supabase/client';
import { toSnakeCase } from '@/utils/dataMappers';

// Map from camelCase to snake_case for database compatibility
export function mapPaymentSourceForInsert(paymentSource: any): PaymentSource {
  return {
    id: paymentSource.id,
    name: paymentSource.name,
    type: (paymentSource.type as "cash" | "credit" | "bank" | "other"), // Properly cast to ensure type safety
    color: paymentSource.color,
    user_id: paymentSource.user_id || 'mock-user-id', // Add default user_id
    createdAt: paymentSource.createdAt,
    updatedAt: paymentSource.updatedAt,
  };
}

// Add new payment source
export async function addPaymentSource(paymentSource: Omit<PaymentSource, 'id'>): Promise<PaymentSource | null> {
  try {
    // Ensure we're only passing valid data to Supabase
    const paymentSourceData = {
      name: paymentSource.name,
      type: paymentSource.type,
      color: paymentSource.color,
      user_id: paymentSource.user_id
    };

    // Cast the snake_case object to the correct type for Supabase insertion
    const snakeCaseObj = toSnakeCase(paymentSourceData) as {
      name: string;
      type: "cash" | "credit" | "bank" | "other";
      color?: string;
      user_id: string;
    };

    const { data, error } = await supabase
      .from('payment_sources')
      .insert([snakeCaseObj])
      .select()
      .single();
      
    if (error) throw error;
    
    // Cast the returned data to PaymentSource type
    return data as unknown as PaymentSource;
  } catch (error) {
    console.error('Error adding payment source:', error);
    return null;
  }
}

// Update payment source with the new interface
export async function updatePaymentSource(
  id: string,
  partialSource: Partial<PaymentSource>
): Promise<PaymentSource | null> {
  try {
    // Merge the id into the partial source
    const paymentSource = {
      ...partialSource,
      id,
    } as PaymentSource;

    // Prepare the data for Supabase (convert to snake_case, etc.)
    const paymentSourceData = {
      id: paymentSource.id,
      name: paymentSource.name,
      type: paymentSource.type,
      color: paymentSource.color,
      user_id: paymentSource.user_id,
    };

    const snakeCaseObj = toSnakeCase(paymentSourceData) as {
      id: string;
      name: string;
      type: "cash" | "credit" | "bank" | "other";
      color?: string;
      user_id: string;
    };

    const { data, error } = await supabase
      .from('payment_sources')
      .update(snakeCaseObj)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Cast the returned data to PaymentSource type
    return data as unknown as PaymentSource;
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
    
    // Cast the returned data to PaymentSource[] type
    return (data || []) as unknown as PaymentSource[];
  } catch (error) {
    console.error('Error getting payment sources:', error);
    return [];
  }
}

// Export the service as an object for use in other files
export const paymentSourceService = {
  getAll: getPaymentSources,
  create: addPaymentSource,
  update: updatePaymentSource, // Now expects (id, partialSource)
  delete: deletePaymentSource
};
