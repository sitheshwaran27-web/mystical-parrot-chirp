import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not defined in environment variables.');
  // Fallback or throw an error if environment variables are missing
  // For now, we'll proceed but expect issues if not set.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);