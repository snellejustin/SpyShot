import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase config (you'll get these from Supabase Dashboard)
const supabaseUrl = 'https://jkpayvjuikolturmtsvp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcGF5dmp1aWtvbHR1cm10c3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTMwMDQsImV4cCI6MjA5MDcyOTAwNH0.Y5pSorMSoiRf3lwj_hJbKcKui_FSMuye_4YW_IGIHxg';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
