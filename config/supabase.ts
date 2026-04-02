import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase config (you'll get these from Supabase Dashboard)
const supabaseUrl = 'https://isccbktzvxrvozpmgqdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY2Nia3R6dnhydm96cG1ncWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzEwMDgsImV4cCI6MjA3NDkwNzAwOH0.NwHfPTJ1uwqbItF6N591WwZNcYNrcnprQu3VL3WJjTU';

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
