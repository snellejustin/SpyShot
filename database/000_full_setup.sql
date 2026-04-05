-- ============================================================
-- SpyShot: Full Database Setup (run in Supabase SQL Editor)
-- Run this ONCE on a fresh project to create all tables,
-- indexes, RLS policies, and seed data.
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    bio TEXT DEFAULT '',
    profile_picture TEXT,
    favorite_badge_id UUID,  -- FK added after player_badges exists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- 2. FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friendships (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_not_self_friend CHECK (user_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_insert" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friendships_update" ON friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_delete" ON friendships
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON friendships TO authenticated;
GRANT USAGE ON SEQUENCE friendships_id_seq TO authenticated;

-- ============================================================
-- 3. GROUPS + GROUP MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    type VARCHAR(50) NOT NULL,  -- 'cafe', 'home', 'general'
    mode VARCHAR(20) DEFAULT 'classic' CHECK (mode IN ('classic', 'party')),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'accepted', 'declined'
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Non-recursive group policies
CREATE POLICY "groups_select" ON groups
    FOR SELECT USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = groups.id
            AND gm.user_id = auth.uid()
            AND gm.status = 'accepted'
        )
    );

CREATE POLICY "groups_insert" ON groups
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "groups_update" ON groups
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "groups_delete" ON groups
    FOR DELETE USING (creator_id = auth.uid());

-- Group members policies
CREATE POLICY "group_members_select" ON group_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "group_members_insert" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "group_members_update" ON group_members
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "group_members_delete" ON group_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.creator_id = auth.uid()
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON group_members TO authenticated;

-- ============================================================
-- 4. GAME SYSTEM
-- ============================================================

-- Game sessions
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    interval_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, paused, completed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_task_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_task_at TIMESTAMP WITH TIME ZONE,
    current_round INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game tasks / challenges
CREATE TABLE game_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requires_photo BOOLEAN DEFAULT FALSE,
    requires_timer BOOLEAN DEFAULT FALSE,
    badge_name VARCHAR(100),
    badge_description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game rounds
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    task_id UUID NOT NULL REFERENCES game_tasks(id),
    selected_player_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, skipped
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    photo_url TEXT,
    timer_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player badges
CREATE TABLE player_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    group_id UUID REFERENCES groups(id),
    round_id UUID REFERENCES game_rounds(id),
    photo_url TEXT,
    timer_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_group_id ON game_sessions(group_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_rounds_session_id ON game_rounds(session_id);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_player_badges_player_id ON player_badges(player_id);

-- Add FK from profiles.favorite_badge_id now that player_badges exists
ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_favorite_badge
    FOREIGN KEY (favorite_badge_id) REFERENCES player_badges(id) ON DELETE SET NULL;

-- Game RLS policies
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;

-- game_sessions
CREATE POLICY "game_sessions_select" ON game_sessions
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
        )
    );

CREATE POLICY "game_sessions_insert" ON game_sessions
    FOR INSERT WITH CHECK (
        creator_id = auth.uid()
        AND group_id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
        )
    );

CREATE POLICY "game_sessions_update" ON game_sessions
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "game_sessions_delete" ON game_sessions
    FOR DELETE USING (creator_id = auth.uid());

-- game_tasks (read-only for authenticated users)
CREATE POLICY "game_tasks_select" ON game_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

-- game_rounds
CREATE POLICY "game_rounds_select" ON game_rounds
    FOR SELECT USING (
        session_id IN (
            SELECT gs.id FROM game_sessions gs
            WHERE gs.group_id IN (
                SELECT gm.group_id FROM group_members gm
                WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
            )
        )
    );

CREATE POLICY "game_rounds_insert" ON game_rounds
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT gs.id FROM game_sessions gs
            WHERE gs.group_id IN (
                SELECT gm.group_id FROM group_members gm
                WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
            )
        )
    );

CREATE POLICY "game_rounds_update" ON game_rounds
    FOR UPDATE USING (
        session_id IN (
            SELECT gs.id FROM game_sessions gs
            WHERE gs.group_id IN (
                SELECT gm.group_id FROM group_members gm
                WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
            )
        )
    );

-- player_badges
CREATE POLICY "player_badges_select" ON player_badges
    FOR SELECT USING (
        player_id = auth.uid()
        OR group_id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
        )
    );

CREATE POLICY "player_badges_insert" ON player_badges
    FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "player_badges_update" ON player_badges
    FOR UPDATE USING (player_id = auth.uid());

-- ============================================================
-- 5. BADGE PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS badge_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES player_badges(id) ON DELETE CASCADE,
    round_id UUID REFERENCES game_rounds(id) ON DELETE SET NULL,
    photo_url TEXT,
    timer_seconds INTEGER,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badge_photos_badge_id ON badge_photos(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_photos_round_id ON badge_photos(round_id);

ALTER TABLE badge_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badge_photos_select" ON badge_photos
    FOR SELECT USING (
        badge_id IN (
            SELECT pb.id FROM player_badges pb
            WHERE pb.player_id = auth.uid()
               OR pb.group_id IN (
                   SELECT gm.group_id FROM group_members gm
                   WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
               )
        )
    );

CREATE POLICY "badge_photos_insert" ON badge_photos
    FOR INSERT WITH CHECK (
        badge_id IN (
            SELECT id FROM player_badges WHERE player_id = auth.uid()
        )
    );

CREATE POLICY "badge_photos_delete" ON badge_photos
    FOR DELETE USING (
        badge_id IN (
            SELECT id FROM player_badges WHERE player_id = auth.uid()
        )
    );

-- ============================================================
-- 6. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "notifications_delete" ON notifications
    FOR DELETE USING (recipient_id = auth.uid());

-- ============================================================
-- 7. SEED: DEFAULT GAME TASKS
-- ============================================================
INSERT INTO game_tasks (title, description, requires_photo, requires_timer, badge_name, badge_description, difficulty_level) VALUES

-- Speed / Timer
('Drink Race',            'Drink your glass as fast as possible -- timer starts now!',                                   FALSE, TRUE,  'Speed Drinker',       'Completed a drink race in record time',                          2),
('Shot Sprint',           'Down a shot in under 3 seconds',                                                              FALSE, TRUE,  'Lightning Fast',      'Downed a shot at lightning speed',                               3),
('Chug Challenge',        'Finish half your drink before the 10-second mark',                                            FALSE, TRUE,  'Chug Champion',       'Crushed the chug challenge on the clock',                        2),

-- Social
('Table Social',          'Go chat with someone at another table and get their name',                                    TRUE,  FALSE, 'Social Butterfly',    'Made contact with a stranger',                                   2),
('Influence Others',      'Get another bar guest to drink with you -- photo proof required',                             TRUE,  FALSE, 'Bad Influence',       'Convinced a stranger to drink along',                            3),
('Bartender Photo',       'Take a photo with the bartender',                                                             TRUE,  FALSE, 'Bar Buddy',           'Made friends with the staff',                                    1),
('Group Selfie',          'Get everyone in the group into one selfie',                                                   TRUE,  FALSE, 'Group Shot',          'Assembled the whole crew for a photo',                           1),
('Stranger Selfie',       'Take a selfie with someone you don''t know',                                                  TRUE,  FALSE, 'Crowd Pleaser',       'Charmed a stranger into a selfie',                               3),
('Toast Master',          'Stand up and give a 30-second toast -- everyone must listen',                                 FALSE, FALSE, 'Toast Master',        'Delivered a legendary toast',                                    2),
('Compliment Round',      'Give a genuine compliment to each player at the table',                                       FALSE, FALSE, 'Team Player',         'Spread the love around the table',                               1),
('Dance Floor',           'Hit the dance floor for at least one full song',                                              TRUE,  FALSE, 'Party Animal',        'Tore up the dance floor',                                        3),
('Karaoke Moment',        'Sing one verse of any song out loud (no music needed)',                                       FALSE, FALSE, 'Storyteller',         'Entertained the group with song',                                2),

-- Dares / Challenges
('No Hands Drink',        'Take a sip without using your hands -- creative solutions allowed',                           TRUE,  FALSE, 'Daredevil',           'Drank without using hands',                                      2),
('Left Buys Shot',        'The player to your left buys you a shot of their choice -- you drink it',                     FALSE, FALSE, NULL,                  NULL,                                                             1),
('Right Buys Shot',       'The player to your right buys you a shot of their choice -- you drink it',                    FALSE, FALSE, NULL,                  NULL,                                                             1),
('Truth or Drink',        'Answer an embarrassing truth question honestly -- or finish your drink',                      FALSE, FALSE, 'Rebel',               'Chose to drink rather than reveal the truth',                    2),
('Hands-Free Finish',     'Finish your current drink without putting it down once you start',                            FALSE, FALSE, NULL,                  NULL,                                                             2),
('Blindfolded Sip',       'Take a sip blindfolded -- another player guides the glass',                                  TRUE,  FALSE, 'Thrill Seeker',       'Trusted a teammate with their drink',                            2),
('Switch Drinks',         'Swap your drink with the player of your choice for the next round',                           FALSE, FALSE, NULL,                  NULL,                                                             1),
('Left Passes Right',     'Give 3 sips from your drink to the player on your left',                                     FALSE, FALSE, NULL,                  NULL,                                                             1),
('Rule Maker',            'Invent a rule that everyone must follow for the next 5 minutes',                              FALSE, FALSE, 'Troublemaker',        'Imposed a rule on the entire group',                             2),
('Penalty Round',         'Name 5 types of alcohol in 10 seconds -- fail and finish your drink',                         FALSE, FALSE, 'Task Crusher',        'Named 5 types of alcohol under pressure',                        2),

-- Creative / Fun
('Best Impression',       'Do your best celebrity impression -- group votes if it''s passable',                          FALSE, FALSE, 'Class Clown',         'Entertained the group with an impression',                       2),
('Mannequin Challenge',   'Everyone freezes for 10 seconds while you take a photo of the scene',                        TRUE,  FALSE, 'Director',            'Orchestrated a perfect mannequin challenge',                     1),
('Sip Poem',              'Make up a 4-line poem about the group -- finish your drink after',                            FALSE, FALSE, 'Creative',            'Authored a spontaneous ode to the group',                        2),
('Most Likely',           'Point at who is most likely to [do something embarrassing] -- most votes drinks',             FALSE, FALSE, NULL,                  NULL,                                                             1),
('Two Truths One Lie',    'Say two truths and one lie -- anyone who guesses wrong takes a sip',                          FALSE, FALSE, NULL,                  NULL,                                                             1),

-- Location / Adventure
('Bathroom Dare',         'Go ask a stranger in the venue for a piece of advice -- report back',                         FALSE, FALSE, 'Explorer',            'Ventured out and returned with wisdom',                          3),
('Menu Challenge',        'Order the weirdest thing on the menu and post a photo of it',                                 TRUE,  FALSE, 'Innovator',           'Dared to order the unexpected',                                  3),
('Background Star',       'Get someone else''s photo ruined by photobombing them -- get the evidence',                   TRUE,  FALSE, 'Joker',               'Immortalised themselves as a photobomb legend',                  3),

-- Group Activities
('Share Sips',            'Distribute 5 sips among any players of your choice',                                          FALSE, FALSE, NULL,                  NULL,                                                             1),
('Waterfall',             'Start drinking and everyone else must follow -- you stop first',                              FALSE, FALSE, 'Influencer',          'Kicked off a legendary waterfall',                               2),
('Never Have I Ever',     'Say "Never have I ever..." -- anyone who has done it drinks',                                 FALSE, FALSE, NULL,                  NULL,                                                             1),
('Speed Categories',      'Name things in a category one by one -- first person to fail drinks',                         FALSE, FALSE, NULL,                  NULL,                                                             2),
('Group Dare',            'The whole group must do something embarrassing together -- photo proof',                       TRUE,  FALSE, 'Wild Night',          'Survived a group dare',                                          4);

-- ============================================================
-- 8. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;

-- ============================================================
-- Done! All tables, policies, indexes and seed data are ready.
-- ============================================================
