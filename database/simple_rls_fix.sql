-- Simple RLS policies that avoid infinite recursion
-- Copy and paste this entire code block into your Supabase SQL editor

-- Drop all existing policies first
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;
DROP POLICY IF EXISTS "group_members_select_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_update_policy" ON group_members;

-- Disable RLS temporarily
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- GROUPS TABLE POLICIES
-- Simple policy: users can only see groups they created
CREATE POLICY "groups_creators_only" ON groups
    FOR ALL USING (creator_id = auth.uid());

-- GROUP_MEMBERS TABLE POLICIES
-- Users can see all their own memberships
CREATE POLICY "group_members_own_memberships" ON group_members
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert memberships (for invitations) - this will be restricted by app logic
CREATE POLICY "group_members_insert_all" ON group_members
    FOR INSERT WITH CHECK (true);

-- Users can update their own membership status
CREATE POLICY "group_members_update_own" ON group_members
    FOR UPDATE USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON groups TO authenticated;
GRANT ALL ON group_members TO authenticated;
