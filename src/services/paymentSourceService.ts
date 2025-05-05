
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

// Update payment source
// Modified to handle both separate params and single object
export async function updatePaymentSource(paymentSourceOrId: PaymentSource | string, partialSource?: Partial<PaymentSource>): Promise<PaymentSource | null> {
  try {
    // Handle both calling conventions:
    // 1. update(source) - single parameter with complete object including id
    // 2. update(id, source) - separate id and partial source object
    let paymentSource: PaymentSource;
    
    if (typeof paymentSourceOrId === 'string' && partialSource) {
      // Handle: update(id, partialSource)
      paymentSource = {
        ...partialSource,
        id: paymentSourceOrId
      } as PaymentSource;
    } else {
      // Handle: update(source)
      paymentSource = paymentSourceOrId as PaymentSource;
    }

    // Ensure we're only passing valid data to Supabase
    const paymentSourceData = {
      id: paymentSource.id,
      name: paymentSource.name,
      type: paymentSource.type,
      color: paymentSource.color,
      user_id: paymentSource.user_id
    };

    // Cast the snake_case object to the correct type for Supabase update
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
      .eq('id', paymentSource.id)
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
  update: updatePaymentSource,
  delete: deletePaymentSource
};
