
/**
 * Type definitions for Supabase database tables
 */

export interface DbCategory {
  id: string;
  name: string;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category_id: string | null;
  payment_source_id: string | null;
  payment_type: string;
  recurring: boolean | null;
  recurring_interval: string | null;
  recurring_end_date: string | null;
  installment: boolean | null;
  installment_count: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbPaymentSource {
  id: string;
  name: string;
  type: string;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type TableName = 'categories' | 'expenses' | 'payment_sources';

// Adding RPC function return type definitions
export interface RpcFunctionReturnTypes {
  get_auth_uid: string; // The function returns the user's UUID as a string
}
