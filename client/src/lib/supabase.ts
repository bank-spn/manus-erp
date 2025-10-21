import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function URLs
export const EDGE_FUNCTIONS = {
  posCheckout: `${supabaseUrl}/functions/v1/pos_checkout`,
  erpInventoryAdjust: `${supabaseUrl}/functions/v1/erp_inventory_adjust`,
};

