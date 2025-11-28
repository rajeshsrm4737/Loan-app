import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'user' | 'admin';
          outstanding_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: 'user' | 'admin';
          outstanding_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'user' | 'admin';
          outstanding_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          outstanding_amount: number;
          interest_rate: number;
          status: 'pending' | 'active' | 'completed' | 'rejected';
          requested_at: string;
          approved_at: string | null;
          approved_by: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          loan_id: string;
          user_id: string;
          amount: number;
          transaction_id: string;
          status: 'completed' | 'reversed';
          processed_by: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          receipt_url: string | null;
          created_at: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          loan_id: string | null;
          message: string;
          created_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action_type: string;
          target_id: string | null;
          target_type: string | null;
          old_value: any;
          new_value: any;
          reason: string | null;
          metadata: any;
          created_at: string;
        };
      };
    };
  };
};
