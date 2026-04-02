-- Game System Database Schema

-- Game sessions table - tracks active games
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL, -- Total game duration
    interval_minutes INTEGER NOT NULL, -- Time between tasks (10, 20, 30, 60)
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_task_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_task_at TIMESTAMP WITH TIME ZONE,
    current_round INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game tasks/challenges table
CREATE TABLE game_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requires_photo BOOLEAN DEFAULT FALSE,
    requires_timer BOOLEAN DEFAULT FALSE,
    badge_name VARCHAR(100), -- NULL if no badge awarded
    badge_description TEXT,
    difficulty_level INTEGER DEFAULT 1, -- 1-5 difficulty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game rounds - tracks each task round in a session
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    task_id UUID NOT NULL REFERENCES game_tasks(id),
    selected_player_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, skipped
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    photo_url TEXT,
    timer_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player badges - earned badges from completing tasks
CREATE TABLE player_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    group_id UUID REFERENCES groups(id),
    round_id UUID REFERENCES game_rounds(id),
    photo_url TEXT, -- Photo evidence if applicable
    timer_seconds INTEGER, -- Timer evidence if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default game tasks
-- difficulty_level: 1 (easy) → 5 (legendary)
INSERT INTO game_tasks (title, description, requires_photo, requires_timer, badge_name, badge_description, difficulty_level) VALUES

-- === SPEED / TIMER ===
('Drink Race',            'Drink your glass as fast as possible — timer starts now!',                                    FALSE, TRUE,  'Speed Drinker',       'Completed a drink race in record time',                          2),
('Shot Sprint',           'Down a shot in under 3 seconds',                                                              FALSE, TRUE,  'Lightning Fast',      'Downed a shot at lightning speed',                               3),
('Chug Challenge',        'Finish half your drink before the 10-second mark',                                            FALSE, TRUE,  'Chug Champion',       'Crushed the chug challenge on the clock',                        2),

-- === SOCIAL ===
('Table Social',          'Go chat with someone at another table and get their name',                                    TRUE,  FALSE, 'Social Butterfly',    'Made contact with a stranger',                                   2),
('Influence Others',      'Get another bar guest to drink with you — photo proof required',                              TRUE,  FALSE, 'Bad Influence',       'Convinced a stranger to drink along',                            3),
('Bartender Photo',       'Take a photo with the bartender',                                                             TRUE,  FALSE, 'Bar Buddy',           'Made friends with the staff',                                    1),
('Group Selfie',          'Get everyone in the group into one selfie',                                                   TRUE,  FALSE, 'Group Shot',          'Assembled the whole crew for a photo',                           1),
('Stranger Selfie',       'Take a selfie with someone you don\'t know',                                                  TRUE,  FALSE, 'Crowd Pleaser',       'Charmed a stranger into a selfie',                               3),
('Toast Master',          'Stand up and give a 30-second toast — everyone must listen',                                  FALSE, FALSE, 'Toast Master',        'Delivered a legendary toast',                                    2),
('Compliment Round',      'Give a genuine compliment to each player at the table',                                       FALSE, FALSE, 'Team Player',         'Spread the love around the table',                               1),
('Dance Floor',           'Hit the dance floor for at least one full song',                                              TRUE,  FALSE, 'Party Animal',        'Tore up the dance floor',                                        3),
('Karaoke Moment',        'Sing one verse of any song out loud (no music needed)',                                       FALSE, FALSE, 'Storyteller',         'Entertained the group with song',                                2),

-- === DARES / CHALLENGES ===
('No Hands Drink',        'Take a sip without using your hands — creative solutions allowed',                            TRUE,  FALSE, 'Daredevil',           'Drank without using hands',                                      2),
('Left Buys Shot',        'The player to your left buys you a shot of their choice — you drink it',                     FALSE, FALSE, NULL,                  NULL,                                                             1),
('Right Buys Shot',       'The player to your right buys you a shot of their choice — you drink it',                    FALSE, FALSE, NULL,                  NULL,                                                             1),
('Truth or Drink',        'Answer an embarrassing truth question honestly — or finish your drink',                       FALSE, FALSE, 'Rebel',               'Chose to drink rather than reveal the truth',                    2),
('Hands-Free Finish',     'Finish your current drink without putting it down once you start',                            FALSE, FALSE, NULL,                  NULL,                                                             2),
('Blindfolded Sip',       'Take a sip blindfolded — another player guides the glass',                                   TRUE,  FALSE, 'Thrill Seeker',       'Trusted a teammate with their drink',                            2),
('Switch Drinks',         'Swap your drink with the player of your choice for the next round',                           FALSE, FALSE, NULL,                  NULL,                                                             1),
('Left Passes Right',     'Give 3 sips from your drink to the player on your left',                                     FALSE, FALSE, NULL,                  NULL,                                                             1),
('Rule Maker',            'Invent a rule that everyone must follow for the next 5 minutes',                              FALSE, FALSE, 'Troublemaker',        'Imposed a rule on the entire group',                             2),
('Penalty Round',         'Name 5 types of alcohol in 10 seconds — fail and finish your drink',                         FALSE, FALSE, 'Task Crusher',        'Named 5 types of alcohol under pressure',                        2),

-- === CREATIVE / FUN ===
('Best Impression',       'Do your best celebrity impression — group votes if it\'s passable',                           FALSE, FALSE, 'Class Clown',         'Entertained the group with an impression',                       2),
('Mannequin Challenge',   'Everyone freezes for 10 seconds while you take a photo of the scene',                        TRUE,  FALSE, 'Director',            'Orchestrated a perfect mannequin challenge',                     1),
('Sip Poem',              'Make up a 4-line poem about the group — finish your drink after',                             FALSE, FALSE, 'Creative',            'Authored a spontaneous ode to the group',                        2),
('Most Likely',           'Point at who is most likely to [do something embarrassing] — most votes drinks',              FALSE, FALSE, NULL,                  NULL,                                                             1),
('Two Truths One Lie',    'Say two truths and one lie — anyone who guesses wrong takes a sip',                           FALSE, FALSE, NULL,                  NULL,                                                             1),

-- === LOCATION / ADVENTURE ===
('Bathroom Dare',         'Go ask a stranger in the venue for a piece of advice — report back',                          FALSE, FALSE, 'Explorer',            'Ventured out and returned with wisdom',                          3),
('Menu Challenge',        'Order the weirdest thing on the menu and post a photo of it',                                 TRUE,  FALSE, 'Innovator',           'Dared to order the unexpected',                                  3),
('Background Star',       'Get someone else\'s photo ruined by photobombing them — get the evidence',                   TRUE,  FALSE, 'Joker',               'Immortalised themselves as a photobomb legend',                  3),

-- === GROUP ACTIVITIES ===
('Share Sips',            'Distribute 5 sips among any players of your choice',                                          FALSE, FALSE, NULL,                  NULL,                                                             1),
('Waterfall',             'Start drinking and everyone else must follow — you stop first',                               FALSE, FALSE, 'Influencer',          'Kicked off a legendary waterfall',                               2),
('Never Have I Ever',     'Say "Never have I ever..." — anyone who has done it drinks',                                  FALSE, FALSE, NULL,                  NULL,                                                             1),
('Speed Categories',      'Name things in a category one by one — first person to fail drinks',                         FALSE, FALSE, NULL,                  NULL,                                                             2),
('Group Dare',            'The whole group must do something embarrassing together — photo proof',                       TRUE,  FALSE, 'Wild Night',          'Survived a group dare',                                          4);

-- Create indexes for better performance
CREATE INDEX idx_game_sessions_group_id ON game_sessions(group_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_rounds_session_id ON game_rounds(session_id);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_player_badges_player_id ON player_badges(player_id);

-- Temporarily disable RLS for development
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_badges DISABLE ROW LEVEL SECURITY;
