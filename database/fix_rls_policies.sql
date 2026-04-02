-- Fix RLS policies to prevent infinite recursion

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can invite members" ON group_members;
DROP POLICY IF EXISTS "Users can update their own membership status" ON group_members;

-- Disable RLS temporarily to avoid issues
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-recursive policies for groups
CREATE POLICY "groups_select_policy" ON groups
    FOR SELECT USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members gm 
            WHERE gm.group_id = groups.id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'accepted'
        )
    );

CREATE POLICY "groups_insert_policy" ON groups
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "groups_update_policy" ON groups
    FOR UPDATE USING (creator_id = auth.uid());

-- Create simplified, non-recursive policies for group_members
CREATE POLICY "group_members_select_policy" ON group_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_members.group_id 
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "group_members_insert_policy" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_id 
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "group_members_update_policy" ON group_members
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_members.group_id 
            AND g.creator_id = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON groups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON group_members TO authenticated;

-- No sequences needed since we're using UUID with gen_random_uuid()
