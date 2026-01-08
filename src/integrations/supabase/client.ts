import { createClient } from '@supabase/supabase-js';

// Using credentials directly to ensure connection reliability
const supabaseUrl = 'https://bcfkkrfrzutbmhdbosaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmtrcmZyenV0Ym1oZGJvc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDY3NDIsImV4cCI6MjA4MzAyMjc0Mn0.ZdvPAHk-vxlVQuO39q4wU0Zb05xrjnlRJEiJOdMGmY0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);