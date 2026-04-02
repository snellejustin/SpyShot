-- Badge Photos Table
-- Stores photo and timer evidence for each individual badge completion.
-- A player_badge row is the canonical badge record; badge_photos holds
-- the per-completion evidence (one row per play-through of that task).

CREATE TABLE IF NOT EXISTS badge_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES player_badges(id) ON DELETE CASCADE,
    round_id UUID REFERENCES game_rounds(id) ON DELETE SET NULL,
    photo_url TEXT,                    -- Supabase Storage public URL (nullable for timer-only tasks)
    timer_seconds INTEGER,             -- Milliseconds for speed tasks (nullable for photo-only tasks)
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_badge_photos_badge_id ON badge_photos(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_photos_round_id ON badge_photos(round_id);
CREATE INDEX IF NOT EXISTS idx_badge_photos_taken_at ON badge_photos(taken_at DESC);

-- Row Level Security
ALTER TABLE badge_photos ENABLE ROW LEVEL SECURITY;

-- Users can view badge photos for badges they earned OR for any badge in a group they belong to
CREATE POLICY "badge_photos_select" ON badge_photos
    FOR SELECT
    USING (
        badge_id IN (
            SELECT pb.id FROM player_badges pb
            WHERE pb.player_id = auth.uid()
               OR pb.group_id IN (
                   SELECT gm.group_id FROM group_members gm
                   WHERE gm.user_id = auth.uid()
                     AND gm.status = 'accepted'
               )
        )
    );

-- Only the system (via service role) or the badge owner can insert photos
CREATE POLICY "badge_photos_insert" ON badge_photos
    FOR INSERT
    WITH CHECK (
        badge_id IN (
            SELECT id FROM player_badges
            WHERE player_id = auth.uid()
        )
    );

-- Badge owners can delete their own photos
CREATE POLICY "badge_photos_delete" ON badge_photos
    FOR DELETE
    USING (
        badge_id IN (
            SELECT id FROM player_badges
            WHERE player_id = auth.uid()
        )
    );
