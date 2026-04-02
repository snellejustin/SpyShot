-- Update RLS policies on profiles table to allow user search
-- Run this SQL in your Supabase SQL editor

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile only" ON public.profiles;

-- Create new policies that allow users to read basic profile info for search
-- Users can view all profiles (for search functionality)
CREATE POLICY "Users can view all profiles for search" ON public.profiles
    FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);
