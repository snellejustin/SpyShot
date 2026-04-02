-- Fix Game Table RLS Policies
-- Run this to replace the development "DISABLE ROW LEVEL SECURITY" with
-- proper production policies on all game tables.

-- ============================================================
-- game_sessions
-- ============================================================
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Members of the group can view the session
CREATE POLICY "game_sessions_select" ON game_sessions
    FOR SELECT
    USING (
        group_id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = auth.uid()
              AND gm.status = 'accepted'
        )
    );

-- Only group members can create a session for their group
CREATE POLICY "game_sessions_insert" ON game_sessions
    FOR INSERT
    WITH CHECK (
        creator_id = auth.uid()
        AND group_id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = auth.uid()
              AND gm.status = 'accepted'
        )
    );

-- Only the session creator can update/end the session
CREATE POLICY "game_sessions_update" ON game_sessions
    FOR UPDATE
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

-- Only the session creator can delete it
CREATE POLICY "game_sessions_delete" ON game_sessions
    FOR DELETE
    USING (creator_id = auth.uid());

-- ============================================================
-- game_tasks  (read-only for all authenticated users)
-- ============================================================
ALTER TABLE game_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_tasks_select" ON game_tasks
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete tasks (managed via Supabase dashboard)

-- ============================================================
-- game_rounds
-- ============================================================
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

-- Members in the session's group can see all rounds
CREATE POLICY "game_rounds_select" ON game_rounds
    FOR SELECT
    USING (
        session_id IN (
            SELECT gs.id FROM game_sessions gs
            WHERE gs.group_id IN (
                SELECT gm.group_id FROM group_members gm
                WHERE gm.user_id = auth.uid()
                  AND gm.status = 'accepted'
            )
        )
    );

-- Members in the group can create rounds (startShuffle)
CREATE POLICY "game_rounds_insert" ON game_rounds
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT gs.id FROM game_sessions gs
            WHERE gs.group_id IN (
                SELECT gm.group_id FROM group_members gm
                WHERE gm.user_id = auth.uid()
                  AND gm.status = 'accepted'
            )
        )
    );

-- The selected player (or any member) can update their round (complete/pass)
CREATE POLICY "game_rounds_update" ON game_rounds
    FOR UPDATE
    USING (
        session_id IN (
            SELECT gs.id FROM game_sessions gs
            WHERE gs.group_id IN (
                SELECT gm.group_id FROM group_members gm
                WHERE gm.user_id = auth.uid()
                  AND gm.status = 'accepted'
            )
        )
    );

-- ============================================================
-- player_badges
-- ============================================================
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;

-- Players can view their own badges; group members can see badges earned in their group
CREATE POLICY "player_badges_select" ON player_badges
    FOR SELECT
    USING (
        player_id = auth.uid()
        OR group_id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = auth.uid()
              AND gm.status = 'accepted'
        )
    );

-- Badges are awarded by the system; players cannot self-insert
-- (insert via service role key from edge functions or triggers)
-- Uncomment the line below if you want client-side badge insertion (less secure):
-- CREATE POLICY "player_badges_insert" ON player_badges FOR INSERT WITH CHECK (player_id = auth.uid());

-- Players can update only their own badges (e.g. setting favorite)
CREATE POLICY "player_badges_update" ON player_badges
    FOR UPDATE
    USING (player_id = auth.uid());
