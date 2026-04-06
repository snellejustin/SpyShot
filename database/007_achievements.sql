-- ============================================================
-- Achievements: Meta-milestones beyond task badges
-- ============================================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,       -- 'first_game', 'ten_sessions', etc.
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(30) NOT NULL,              -- Ionicons name
    color VARCHAR(10) NOT NULL,             -- hex color
    threshold INTEGER DEFAULT 1,            -- number needed to unlock
    category VARCHAR(30) NOT NULL           -- 'social', 'games', 'badges', 'special'
);

CREATE TABLE player_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_key VARCHAR(50) NOT NULL REFERENCES achievements(key),
    progress INTEGER DEFAULT 0,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, achievement_key)
);

CREATE INDEX idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX idx_player_achievements_unlocked ON player_achievements(unlocked);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select" ON achievements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "player_achievements_select" ON player_achievements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "player_achievements_insert" ON player_achievements
    FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "player_achievements_update" ON player_achievements
    FOR UPDATE USING (player_id = auth.uid());

-- Seed achievements
INSERT INTO achievements (key, title, description, icon, color, threshold, category) VALUES
    -- Games
    ('first_game',       'First Timer',        'Complete your first game session',         'game-controller', '#10b981', 1,  'games'),
    ('five_sessions',    'Regular',            'Play in 5 game sessions',                  'repeat',          '#3b82f6', 5,  'games'),
    ('ten_sessions',     'Veteran',            'Play in 10 game sessions',                 'shield-checkmark','#a855f7', 10, 'games'),
    ('twenty_sessions',  'Hardcore',           'Play in 20 game sessions',                 'diamond',         '#f97316', 20, 'games'),
    ('fifty_sessions',   'Legend',             'Play in 50 game sessions',                 'star',            '#fbbf24', 50, 'games'),

    -- Challenges
    ('ten_tasks',        'Getting Warmed Up',  'Complete 10 challenges',                   'checkmark-done',  '#10b981', 10, 'badges'),
    ('fifty_tasks',      'Challenge Accepted', 'Complete 50 challenges',                   'ribbon',          '#3b82f6', 50, 'badges'),
    ('hundred_tasks',    'Unstoppable',        'Complete 100 challenges',                  'trophy',          '#fbbf24', 100,'badges'),
    ('five_bold',        'Risk Taker',         'Choose the Bold option 5 times',           'flame',           '#f97316', 5,  'badges'),
    ('twenty_bold',      'Fearless',           'Choose the Bold option 20 times',          'skull',           '#ec4899', 20, 'badges'),

    -- Social
    ('five_friends',     'Social Starter',     'Add 5 friends',                            'people',          '#10b981', 5,  'social'),
    ('twenty_friends',   'Popular',            'Add 20 friends',                           'heart',           '#ec4899', 20, 'social'),
    ('three_groups',     'Group Lover',        'Join 3 different groups',                  'albums',          '#3b82f6', 3,  'social'),
    ('ten_groups',       'Community Builder',  'Join 10 different groups',                 'globe',           '#a855f7', 10, 'social'),
    ('twenty_players',   'Party Hopper',       'Play with 20 different people',            'shuffle',         '#f97316', 20, 'social'),

    -- Special
    ('first_badge',      'Badge Collector',    'Earn your first badge',                    'medal',           '#fbbf24', 1,  'special'),
    ('ten_badges',       'Badge Hoarder',      'Earn 10 different badges',                 'medal-outline',   '#a855f7', 10, 'special'),
    ('silver_tier',      'Rising Star',        'Reach Silver tier on any badge',           'arrow-up',        '#9ca3af', 1,  'special'),
    ('gold_tier',        'Golden',             'Reach Gold tier on any badge',             'star',            '#FFD700', 1,  'special'),
    ('host_five',        'Party Starter',      'Host 5 game sessions',                    'megaphone',       '#f97316', 5,  'special');

-- Seed some achievements for fake users
INSERT INTO player_achievements (player_id, achievement_key, progress, unlocked, unlocked_at) VALUES
    -- Emma (12 badges, many games)
    ('a1111111-1111-1111-1111-111111111111', 'first_game', 1, true, NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'five_sessions', 5, true, NOW() - INTERVAL '14 days'),
    ('a1111111-1111-1111-1111-111111111111', 'ten_tasks', 12, true, NOW() - INTERVAL '7 days'),
    ('a1111111-1111-1111-1111-111111111111', 'first_badge', 1, true, NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'ten_badges', 10, true, NOW() - INTERVAL '7 days'),
    ('a1111111-1111-1111-1111-111111111111', 'five_friends', 5, true, NOW() - INTERVAL '25 days'),
    -- Sofia (15 badges, daredevil)
    ('a3333333-3333-3333-3333-333333333333', 'first_game', 1, true, NOW() - INTERVAL '20 days'),
    ('a3333333-3333-3333-3333-333333333333', 'five_sessions', 5, true, NOW() - INTERVAL '10 days'),
    ('a3333333-3333-3333-3333-333333333333', 'ten_tasks', 15, true, NOW() - INTERVAL '5 days'),
    ('a3333333-3333-3333-3333-333333333333', 'fifty_tasks', 15, false, NULL),
    ('a3333333-3333-3333-3333-333333333333', 'first_badge', 1, true, NOW() - INTERVAL '20 days'),
    ('a3333333-3333-3333-3333-333333333333', 'ten_badges', 10, true, NOW() - INTERVAL '5 days'),
    ('a3333333-3333-3333-3333-333333333333', 'gold_tier', 1, true, NOW() - INTERVAL '3 days'),
    ('a3333333-3333-3333-3333-333333333333', 'five_bold', 5, true, NOW() - INTERVAL '10 days'),
    -- Liam (speed focused)
    ('a2222222-2222-2222-2222-222222222222', 'first_game', 1, true, NOW() - INTERVAL '30 days'),
    ('a2222222-2222-2222-2222-222222222222', 'ten_tasks', 8, false, NULL),
    ('a2222222-2222-2222-2222-222222222222', 'first_badge', 1, true, NOW() - INTERVAL '22 days'),
    ('a2222222-2222-2222-2222-222222222222', 'five_friends', 5, true, NOW() - INTERVAL '20 days')
ON CONFLICT (player_id, achievement_key) DO NOTHING;
