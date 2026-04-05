-- ============================================================
-- Feed System: Activity feed + reactions
-- Stores activity items (badge earned, task completed, level up)
-- and emoji reactions from other users.
-- ============================================================

-- Feed items — one row per notable activity
CREATE TABLE feed_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,  -- 'badge_earned', 'task_completed', 'level_up', 'group_joined'
    title TEXT NOT NULL,
    subtitle TEXT,
    photo_url TEXT,             -- optional photo evidence
    badge_name VARCHAR(100),    -- for badge_earned type
    tier_name VARCHAR(30),      -- for level_up type (e.g. 'Silver')
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    round_id UUID REFERENCES game_rounds(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feed_items_user ON feed_items(user_id);
CREATE INDEX idx_feed_items_created ON feed_items(created_at DESC);
CREATE INDEX idx_feed_items_type ON feed_items(type);

ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_items_select" ON feed_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "feed_items_insert" ON feed_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reactions — emoji reactions on feed items
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,  -- e.g. 'fire', 'laugh', 'clap', 'skull', 'heart'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(feed_item_id, user_id)  -- one reaction per user per item
);

CREATE INDEX idx_reactions_feed_item ON reactions(feed_item_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON reactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "reactions_insert" ON reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_update" ON reactions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "reactions_delete" ON reactions
    FOR DELETE USING (user_id = auth.uid());

-- Enable realtime for feed
ALTER PUBLICATION supabase_realtime ADD TABLE feed_items;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- ============================================================
-- Seed: Generate feed items from existing badge data
-- ============================================================
INSERT INTO feed_items (user_id, type, title, subtitle, badge_name, group_id, created_at)
SELECT
    pb.player_id,
    'badge_earned',
    'Earned the ' || pb.badge_name || ' badge',
    pb.badge_description,
    pb.badge_name,
    pb.group_id,
    pb.earned_at
FROM player_badges pb
WHERE pb.player_id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555',
    'a6666666-6666-6666-6666-666666666666',
    'a7777777-7777-7777-7777-777777777777',
    'a8888888-8888-8888-8888-888888888888'
);

-- Add some fake reactions to make it feel alive
INSERT INTO reactions (feed_item_id, user_id, emoji)
SELECT
    fi.id,
    reactor_id,
    (ARRAY['fire', 'clap', 'laugh', 'heart', 'skull'])[floor(random() * 5 + 1)]
FROM feed_items fi
CROSS JOIN (
    VALUES
        ('a1111111-1111-1111-1111-111111111111'::uuid),
        ('a2222222-2222-2222-2222-222222222222'::uuid),
        ('a3333333-3333-3333-3333-333333333333'::uuid),
        ('a5555555-5555-5555-5555-555555555555'::uuid),
        ('a7777777-7777-7777-7777-777777777777'::uuid)
) AS reactors(reactor_id)
WHERE fi.user_id != reactor_id
  AND random() < 0.35  -- ~35% chance of reacting
ON CONFLICT (feed_item_id, user_id) DO NOTHING;
