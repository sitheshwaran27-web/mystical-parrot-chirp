import { createClient } from '@supabase/supabase-js';

// Using credentials from environment variables with fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bcfkkrfrzutbmhdbosaa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmtrcmZyenV0Ym1oZGJvc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDY3NDIsImV4cCI6MjA4MzAyMjc0Mn0.ZdvPAHk-vxlVQuO39q4wU0Zb05xrjnlRJEiJOdMGmY0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);