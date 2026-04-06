-- ============================================================
-- Phase 2 + 3: Who's Down, Hall of Fame, Customization,
-- User-Generated Challenges
-- ============================================================

-- ============================================================
-- 1. WHO'S DOWN? — Ready-to-play status
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ready_to_play BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ready_until TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- 2. HALL OF FAME — Post-game photo voting
-- ============================================================
CREATE TABLE hall_of_fame_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, voter_id)  -- one vote per player per session
);

CREATE TABLE hall_of_fame (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT,
    task_title VARCHAR(200),
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hof_group ON hall_of_fame(group_id);
CREATE INDEX idx_hof_votes_session ON hall_of_fame_votes(session_id);

ALTER TABLE hall_of_fame_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hof_votes_select" ON hall_of_fame_votes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "hof_votes_insert" ON hall_of_fame_votes
    FOR INSERT WITH CHECK (voter_id = auth.uid());
CREATE POLICY "hof_select" ON hall_of_fame
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "hof_insert" ON hall_of_fame
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. PROFILE CUSTOMIZATION / COSMETICS
-- ============================================================
CREATE TABLE cosmetics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,         -- 'frame', 'badge_skin', 'title', 'color'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_data JSONB DEFAULT '{}',   -- colors, border styles, etc.
    is_premium BOOLEAN DEFAULT FALSE,
    price_cents INTEGER DEFAULT 0,     -- 0 = free
    unlock_condition TEXT,             -- e.g. 'achievement:gold_tier' or 'purchase'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE player_cosmetics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cosmetic_key VARCHAR(50) NOT NULL REFERENCES cosmetics(key),
    equipped BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, cosmetic_key)
);

-- Add equipped cosmetics reference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_frame VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_title VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_color VARCHAR(10);

CREATE INDEX idx_player_cosmetics_player ON player_cosmetics(player_id);

ALTER TABLE cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cosmetics_select" ON cosmetics
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "player_cosmetics_select" ON player_cosmetics
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "player_cosmetics_insert" ON player_cosmetics
    FOR INSERT WITH CHECK (player_id = auth.uid());
CREATE POLICY "player_cosmetics_update" ON player_cosmetics
    FOR UPDATE USING (player_id = auth.uid());

-- Seed cosmetic items
INSERT INTO cosmetics (key, type, name, description, preview_data, is_premium, price_cents, unlock_condition) VALUES
    -- Free frames (unlock via achievements)
    ('frame_default',    'frame', 'Default',        'Standard profile frame',               '{"border":"none"}',                         false, 0,   null),
    ('frame_bronze',     'frame', 'Bronze Ring',     'A warm bronze border',                 '{"borderColor":"#CD7F32","borderWidth":3}', false, 0,   'achievement:first_badge'),
    ('frame_silver',     'frame', 'Silver Ring',     'A sleek silver border',                '{"borderColor":"#C0C0C0","borderWidth":3}', false, 0,   'achievement:silver_tier'),
    ('frame_gold',       'frame', 'Gold Ring',       'A prestigious gold border',            '{"borderColor":"#FFD700","borderWidth":3}', false, 0,   'achievement:gold_tier'),
    ('frame_fire',       'frame', 'Fire Ring',       'For the bold players',                 '{"borderColor":"#f97316","borderWidth":3,"glow":true}', false, 0, 'achievement:five_bold'),
    -- Premium frames
    ('frame_neon_pink',  'frame', 'Neon Pink',       'Electric pink glow',                   '{"borderColor":"#ec4899","borderWidth":3,"glow":true}', true, 299, 'purchase'),
    ('frame_neon_blue',  'frame', 'Neon Blue',       'Cool blue glow',                       '{"borderColor":"#3b82f6","borderWidth":3,"glow":true}', true, 299, 'purchase'),
    ('frame_rainbow',    'frame', 'Rainbow',         'All colors, all the time',             '{"borderColor":"rainbow","borderWidth":4,"glow":true}', true, 499, 'purchase'),
    ('frame_diamond',    'frame', 'Diamond',         'The ultimate flex',                    '{"borderColor":"#b9f2ff","borderWidth":4,"glow":true}', true, 799, 'purchase'),
    -- Free titles
    ('title_newcomer',   'title', 'Newcomer',        'Just getting started',                 '{}', false, 0, null),
    ('title_regular',    'title', 'Regular',          'A familiar face',                     '{}', false, 0, 'achievement:five_sessions'),
    ('title_veteran',    'title', 'Veteran',          'Seen it all',                         '{}', false, 0, 'achievement:ten_sessions'),
    ('title_legend',     'title', 'Legend',            'The stuff of stories',               '{}', false, 0, 'achievement:fifty_sessions'),
    -- Premium titles
    ('title_party_king', 'title', 'Party King',       'Rules the night',                    '{}', true, 199, 'purchase'),
    ('title_party_queen','title', 'Party Queen',      'Rules the night',                    '{}', true, 199, 'purchase'),
    ('title_chaos',      'title', 'Agent of Chaos',   'Embrace the madness',                '{}', true, 299, 'purchase'),
    ('title_vip',        'title', 'VIP',               'Very Important Partier',            '{}', true, 499, 'purchase'),
    -- Profile colors
    ('color_default',    'color', 'Default Yellow',    'Standard SpyShot yellow',           '{"color":"#fbbf24"}', false, 0, null),
    ('color_pink',       'color', 'Hot Pink',          'Stand out in pink',                 '{"color":"#ec4899"}', true, 199, 'purchase'),
    ('color_purple',     'color', 'Royal Purple',      'Regal vibes',                       '{"color":"#a855f7"}', true, 199, 'purchase'),
    ('color_green',      'color', 'Emerald',           'Fresh and green',                   '{"color":"#10b981"}', true, 199, 'purchase'),
    ('color_blue',       'color', 'Ocean Blue',        'Cool and calm',                     '{"color":"#3b82f6"}', true, 199, 'purchase')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 4. USER-GENERATED CHALLENGES
-- ============================================================
CREATE TABLE custom_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requires_photo BOOLEAN DEFAULT FALSE,
    requires_timer BOOLEAN DEFAULT FALSE,
    intensity VARCHAR(10) DEFAULT 'wild' CHECK (intensity IN ('chill', 'wild', 'extreme')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_tasks_group ON custom_tasks(group_id);

ALTER TABLE custom_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_tasks_select" ON custom_tasks
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "custom_tasks_insert" ON custom_tasks
    FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "custom_tasks_update" ON custom_tasks
    FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "custom_tasks_delete" ON custom_tasks
    FOR DELETE USING (created_by = auth.uid());
