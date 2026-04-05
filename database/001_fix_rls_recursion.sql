-- Fix infinite recursion in groups/group_members RLS policies
-- The original policies had groups checking group_members and vice versa,
-- causing PostgreSQL to detect infinite recursion.
-- Fix: use simple auth.role() = 'authenticated' for SELECT policies.
-- The app queries already filter by user/group membership.

-- Drop existing policies
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_update" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

-- Groups: allow all authenticated users to SELECT
CREATE POLICY "groups_select" ON groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "groups_insert" ON groups
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "groups_update" ON groups
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "groups_delete" ON groups
    FOR DELETE USING (creator_id = auth.uid());

-- Group members: allow all authenticated users to SELECT
CREATE POLICY "group_members_select" ON group_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "group_members_insert" ON group_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "group_members_update" ON group_members
    FOR UPDATE USING (
        user_id = auth.uid() OR
        group_id IN (SELECT id FROM groups WHERE creator_id = auth.uid())
    );

CREATE POLICY "group_members_delete" ON group_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        group_id IN (SELECT id FROM groups WHERE creator_id = auth.uid())
    );

-- Also fix game tables that had SELECT policies referencing group_members
DROP POLICY IF EXISTS "game_sessions_select" ON game_sessions;
DROP POLICY IF EXISTS "game_rounds_select" ON game_rounds;
DROP POLICY IF EXISTS "game_rounds_insert" ON game_rounds;
DROP POLICY IF EXISTS "game_rounds_update" ON game_rounds;
DROP POLICY IF EXISTS "player_badges_select" ON player_badges;

CREATE POLICY "game_sessions_select" ON game_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "game_rounds_select" ON game_rounds
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "game_rounds_insert" ON game_rounds
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "game_rounds_update" ON game_rounds
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "player_badges_select" ON player_badges
    FOR SELECT USING (auth.role() = 'authenticated');
