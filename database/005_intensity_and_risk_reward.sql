-- ============================================================
-- Intensity Modes + Risk/Reward + Expanded Task Content
-- Adds intensity levels, bold versions, and 80+ new tasks
-- ============================================================

-- 1. Add new columns to game_tasks
ALTER TABLE game_tasks ADD COLUMN IF NOT EXISTS intensity VARCHAR(10) DEFAULT 'wild'
    CHECK (intensity IN ('chill', 'wild', 'extreme'));
ALTER TABLE game_tasks ADD COLUMN IF NOT EXISTS bold_description TEXT;
ALTER TABLE game_tasks ADD COLUMN IF NOT EXISTS bold_points INTEGER DEFAULT 2;
ALTER TABLE game_tasks ADD COLUMN IF NOT EXISTS category VARCHAR(30);

-- 2. Add intensity column to game_sessions (chosen by creator at setup)
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS intensity VARCHAR(10) DEFAULT 'wild'
    CHECK (intensity IN ('chill', 'wild', 'extreme'));

-- 3. Add chosen_bold flag to game_rounds (did the player pick the bold version?)
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS chose_bold BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_game_tasks_intensity ON game_tasks(intensity);
CREATE INDEX IF NOT EXISTS idx_game_tasks_category ON game_tasks(category);

-- 4. Tag existing tasks with intensity + category + bold versions
-- Speed / Timer tasks
UPDATE game_tasks SET intensity = 'wild', category = 'speed',
    bold_description = 'Finish your ENTIRE drink as fast as possible — timer starts now!'
WHERE title = 'Drink Race';

UPDATE game_tasks SET intensity = 'extreme', category = 'speed',
    bold_description = 'Down TWO shots in under 5 seconds'
WHERE title = 'Shot Sprint';

UPDATE game_tasks SET intensity = 'wild', category = 'speed',
    bold_description = 'Finish your ENTIRE drink before the 15-second mark'
WHERE title = 'Chug Challenge';

-- Social tasks
UPDATE game_tasks SET intensity = 'wild', category = 'social',
    bold_description = 'Chat with someone at another table AND get their phone number'
WHERE title = 'Table Social';

UPDATE game_tasks SET intensity = 'extreme', category = 'social',
    bold_description = 'Get TWO other bar guests to drink with you — photo proof required'
WHERE title = 'Influence Others';

UPDATE game_tasks SET intensity = 'chill', category = 'social',
    bold_description = 'Take a photo with the bartender AND get them to do a pose'
WHERE title = 'Bartender Photo';

UPDATE game_tasks SET intensity = 'chill', category = 'social',
    bold_description = 'Get everyone in the group into one selfie — must include a stranger too'
WHERE title = 'Group Selfie';

UPDATE game_tasks SET intensity = 'wild', category = 'social',
    bold_description = 'Take a selfie with THREE people you don''t know'
WHERE title = 'Stranger Selfie';

UPDATE game_tasks SET intensity = 'chill', category = 'social',
    bold_description = 'Stand on a chair and give a 60-second toast — everyone must listen'
WHERE title = 'Toast Master';

UPDATE game_tasks SET intensity = 'chill', category = 'social',
    bold_description = 'Give a genuine compliment to each player AND a stranger at the next table'
WHERE title = 'Compliment Round';

UPDATE game_tasks SET intensity = 'wild', category = 'social',
    bold_description = 'Hit the dance floor for at least TWO full songs and get someone to join you'
WHERE title = 'Dance Floor';

UPDATE game_tasks SET intensity = 'wild', category = 'social',
    bold_description = 'Sing an entire chorus of a song at full volume — no backing out'
WHERE title = 'Karaoke Moment';

-- Dare tasks
UPDATE game_tasks SET intensity = 'wild', category = 'dare',
    bold_description = 'Finish your entire drink without using your hands — no help allowed'
WHERE title = 'No Hands Drink';

UPDATE game_tasks SET intensity = 'chill', category = 'dare' WHERE title = 'Left Buys Shot';
UPDATE game_tasks SET intensity = 'chill', category = 'dare' WHERE title = 'Right Buys Shot';

UPDATE game_tasks SET intensity = 'wild', category = 'dare',
    bold_description = 'Answer TWO embarrassing truth questions honestly — or finish your drink'
WHERE title = 'Truth or Drink';

UPDATE game_tasks SET intensity = 'wild', category = 'dare' WHERE title = 'Hands-Free Finish';

UPDATE game_tasks SET intensity = 'wild', category = 'dare',
    bold_description = 'Take THREE sips blindfolded — different players guide each one'
WHERE title = 'Blindfolded Sip';

UPDATE game_tasks SET intensity = 'chill', category = 'dare' WHERE title = 'Switch Drinks';
UPDATE game_tasks SET intensity = 'chill', category = 'dare' WHERE title = 'Left Passes Right';

UPDATE game_tasks SET intensity = 'wild', category = 'dare',
    bold_description = 'Invent a rule that everyone must follow for the next 10 minutes — anyone who breaks it drinks'
WHERE title = 'Rule Maker';

UPDATE game_tasks SET intensity = 'wild', category = 'dare',
    bold_description = 'Name 10 types of alcohol in 15 seconds — fail and finish your drink AND buy the next round'
WHERE title = 'Penalty Round';

-- Creative tasks
UPDATE game_tasks SET intensity = 'chill', category = 'creative',
    bold_description = 'Do your best celebrity impression — if the group can''t guess who, finish your drink'
WHERE title = 'Best Impression';

UPDATE game_tasks SET intensity = 'chill', category = 'creative',
    bold_description = 'Mannequin challenge BUT the last person to freeze takes a shot'
WHERE title = 'Mannequin Challenge';

UPDATE game_tasks SET intensity = 'chill', category = 'creative',
    bold_description = 'Make up an 8-line poem about the group — must rhyme — finish your drink after'
WHERE title = 'Sip Poem';

UPDATE game_tasks SET intensity = 'chill', category = 'creative' WHERE title = 'Most Likely';
UPDATE game_tasks SET intensity = 'chill', category = 'creative' WHERE title = 'Two Truths One Lie';

-- Location tasks
UPDATE game_tasks SET intensity = 'wild', category = 'adventure',
    bold_description = 'Ask THREE strangers for advice on the same topic — report back the best answer'
WHERE title = 'Bathroom Dare';

UPDATE game_tasks SET intensity = 'wild', category = 'adventure',
    bold_description = 'Order the weirdest thing on the menu AND eat/drink all of it — photo proof'
WHERE title = 'Menu Challenge';

UPDATE game_tasks SET intensity = 'wild', category = 'adventure',
    bold_description = 'Photobomb THREE different people''s photos in 2 minutes — get evidence of all three'
WHERE title = 'Background Star';

-- Group tasks
UPDATE game_tasks SET intensity = 'chill', category = 'group' WHERE title = 'Share Sips';

UPDATE game_tasks SET intensity = 'wild', category = 'group',
    bold_description = 'Start drinking and everyone else must follow — last person to stop wins immunity from next dare'
WHERE title = 'Waterfall';

UPDATE game_tasks SET intensity = 'chill', category = 'group' WHERE title = 'Never Have I Ever';
UPDATE game_tasks SET intensity = 'chill', category = 'group' WHERE title = 'Speed Categories';

UPDATE game_tasks SET intensity = 'extreme', category = 'group',
    bold_description = 'The whole group must do something EXTREMELY embarrassing in public — photo proof AND must last 30 seconds'
WHERE title = 'Group Dare';

-- 5. INSERT 80+ NEW TASKS
INSERT INTO game_tasks (title, description, requires_photo, requires_timer, badge_name, badge_description, difficulty_level, intensity, category, bold_description, bold_points) VALUES

-- === CHILL / ICEBREAKER ===
('Trivia Toast',       'Answer a trivia question correctly or take a sip',                                FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'creative', 'Answer THREE trivia questions in a row — miss one and finish your drink', 2),
('Story Time',         'Tell a 30-second story about your most embarrassing moment',                      FALSE, FALSE, 'Storyteller',     'Shared a legendary embarrassing story',         1, 'chill', 'social',   'Tell a 60-second story so embarrassing the group cringes — they vote if it counts', 2),
('Accent Challenge',   'Order your next drink in a foreign accent',                                       FALSE, FALSE, 'World Traveler',  'Convinced everyone with a fake accent',         1, 'chill', 'creative', 'Keep the accent going for the next 5 minutes — break character and drink', 2),
('Whisper Game',       'Whisper a secret to the player on your left — they must announce it to the group', FALSE, FALSE, NULL,             NULL,                                           1, 'chill', 'social',   'Whisper something so wild the announcer can''t keep a straight face', 2),
('Phone Roulette',     'Open your camera roll — the 7th photo gets shown to the group',                   TRUE,  FALSE, 'Open Book',       'Bravely showed a random camera roll photo',     1, 'chill', 'dare',     'Show the 7th, 17th, AND 27th photos from your camera roll', 2),
('Hot Take',           'Share an unpopular opinion — if everyone agrees, drink',                           FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'social',   'Share THREE unpopular opinions — drink for each one the group agrees with', 2),
('Mime It',            'Act out your last text message without words — group guesses',                     FALSE, FALSE, 'Class Clown',     'Entertained with an impression',                1, 'chill', 'creative', 'Act out your last 3 text messages as one continuous story', 2),
('Song Lyric',         'Sing the first line of the last song you listened to',                             FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'creative', 'Sing the entire chorus at full volume — standing up', 2),
('Thumb War',          'Challenge the player across from you to a thumb war — loser drinks',               FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'group',    'Tournament-style: everyone pairs up, losers drink, winners face off until one champion remains', 2),
('Reverse Compliment', 'Give someone a backhanded compliment so subtle they say thank you',                FALSE, FALSE, 'Smooth Operator', 'Mastered the art of the backhanded compliment',  1, 'chill', 'social',   'Give backhanded compliments to everyone at the table without anyone catching on', 2),
('Rate My Fit',        'Everyone rates your outfit 1-10 — average under 7 means you drink',                FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'social',   'Rate everyone''s outfit — lowest score buys next round', 2),
('Emoji Charades',     'The group picks 3 emojis — act them out in order',                                 FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'creative', 'Act out 5 emojis as a continuous scene — must make narrative sense', 2),
('Two Word Story',     'Go around the table adding two words each to build a story — whoever ruins it drinks', FALSE, FALSE, NULL,          NULL,                                           1, 'chill', 'group',    'One word at a time, twice as fast — hesitate for more than 2 seconds and drink', 2),
('Confessions',        'Confess something mild you''ve never told the group',                              FALSE, FALSE, 'Honest Soul',     'Opened up to the group',                        1, 'chill', 'social',   'Confess something genuinely shocking — group votes if it deserves a drink', 2),

-- === WILD / PARTY ===
('Bartender''s Choice','Ask the bartender to make you their favorite drink — you must finish it',          TRUE,  FALSE, 'Adventurer',      'Let the bartender decide their fate',            2, 'wild', 'adventure', 'Ask the bartender for the WORST drink they can legally make — finish it', 2),
('DJ Request',         'Go request a song — if it plays within 10 min, everyone else drinks',              FALSE, FALSE, 'DJ',              'Got their song played at the venue',             2, 'wild', 'adventure', 'Request the most embarrassing song possible — must dance to it when it plays', 2),
('Trade Up',           'Trade an item you''re wearing with a stranger''s item — photo proof',              TRUE,  FALSE, 'Negotiator',      'Successfully traded with a stranger',            2, 'wild', 'dare',     'Trade THREE items with three different strangers in 5 minutes', 2),
('Floor is Lava',      'When you say GO everyone must get their feet off the ground — last one drinks',    TRUE,  FALSE, NULL,              NULL,                                           2, 'wild', 'group',    'Last TWO people to react both finish their drinks', 2),
('Staring Contest',    'Challenge someone to a staring contest — loser finishes their drink',              FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'dare',     'Best of 3 — loser does a shot', 2),
('Fake Proposal',      'Get down on one knee and fake-propose to a stranger — photo required',             TRUE,  FALSE, 'Romantic',        'Proposed to a complete stranger',                3, 'wild', 'dare',     'Fake propose AND convince the stranger to say yes — get the whole venue to clap', 2),
('Dance Battle',       'Challenge someone at another table to a dance-off — crowd decides winner',         TRUE,  FALSE, 'Dance King',      'Won a dance battle against a stranger',          2, 'wild', 'social',   'Challenge the BEST dancer in the venue — if you lose, finish your drink', 2),
('Speed Dial',         'Call the 5th contact in your phone and keep them on the line for 30 seconds',      FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'dare',     'Put the call on speaker — group can hear everything', 2),
('Accent Waiter',      'Order your next round entirely in a different accent — don''t break',              FALSE, FALSE, 'Method Actor',    'Ordered in character without breaking',          2, 'wild', 'creative', 'Keep the accent for the entire next round of the game', 2),
('Air Guitar',         'Perform a 30-second air guitar solo — must include a power slide',                 TRUE,  FALSE, 'Rock Star',       'Shredded an invisible guitar',                   2, 'wild', 'creative', 'Full 60-second performance with vocals, stage diving into the group', 2),
('Group Chant',        'Make up a group chant — everyone must do it together, loudly',                     FALSE, FALSE, 'Hype Man',        'Created a legendary group chant',                2, 'wild', 'group',    'The chant must be done standing on chairs — anyone who doesn''t participate drinks', 2),
('Pickup Line',        'Use the worst pickup line on a stranger — photo of their reaction',                TRUE,  FALSE, 'Charmer',         'Delivered the world''s worst pickup line',        2, 'wild', 'social',   'Use pickup lines on THREE strangers — get at least one laugh', 2),
('Body Language',      'For the next 2 minutes, communicate only through gestures — speak and drink',      FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'dare',     'Entire group goes silent for 5 minutes — first person to speak finishes their drink', 2),
('Reverse Drinking',   'Drink with your non-dominant hand for the next 10 minutes — caught = extra sip',   FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'dare',     'Non-dominant hand for 20 minutes — anyone who catches you drinks YOUR drink', 2),
('Power Hour',         'Take a sip every time someone says a designated word for 5 minutes',               FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'group',    'Everyone picks a DIFFERENT trigger word — chaos ensues', 2),
('Photo Bomb Run',     'Photobomb as many stranger photos as possible in 60 seconds',                     TRUE,  TRUE,  'Joker',           'Immortalised themselves as a photobomb legend',  2, 'wild', 'adventure', 'Get into at least 5 photos in 60 seconds — photo proof of each', 2),
('Drink Swap Roulette','Everyone puts their drink in the center — shuffle — you get a random one',         FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'group',    'Random drink AND you must finish at least half of it', 2),
('Silent Disco',       'Put in earphones and dance to your own music for 30 seconds in public',            TRUE,  FALSE, 'Free Spirit',     'Danced to their own beat in public',             2, 'wild', 'dare',     'Silent disco for 60 seconds AND you must stay on the dance floor', 2),
('Meme Recreation',    'Recreate a famous meme pose — group votes if it''s recognizable',                  TRUE,  FALSE, 'Meme Lord',       'Perfectly recreated a classic meme',              2, 'wild', 'creative', 'Recreate 3 memes in 2 minutes — group must guess all three', 2),
('Accent Roulette',    'Spin a virtual wheel — do your best accent of whatever country it lands on',       FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'creative', 'Keep the accent for 3 full minutes of conversation', 2),

-- === EXTREME / LATE NIGHT ===
('Double Down',        'Finish two drinks back to back — no breaks',                                      FALSE, TRUE,  'Iron Stomach',    'Powered through a double down',                  4, 'extreme', 'speed',   'Three drinks. No breaks. Timer running.', 2),
('Dare Dealer',        'The group collectively decides your dare — you MUST do it or finish 2 drinks',    FALSE, FALSE, 'Fearless',        'Accepted any dare the group threw at them',      4, 'extreme', 'dare',    'The group picks your dare AND you must do it blindfolded', 2),
('Public Speech',      'Stand on something elevated and give a 60-second speech about anything',           TRUE,  FALSE, 'Public Speaker',  'Gave a speech to the entire venue',              4, 'extreme', 'social',  'Give the speech about how much you love the person to your left — make it dramatic', 2),
('Stranger Karaoke',   'Sing a duet with a complete stranger — any song',                                 TRUE,  FALSE, 'Duet Partner',    'Sang with a complete stranger',                  4, 'extreme', 'social',  'Full song performance, not just a few lines — the stranger must participate', 2),
('Shot Roulette',      'Line up different shots — close your eyes and pick one',                           TRUE,  FALSE, 'Gambler',         'Left their fate to shot roulette',                3, 'extreme', 'speed',   'Line up the shots AND let the group add a mystery ingredient to one', 2),
('Crowd Surf',         'Get at least 3 people to lift you — even briefly — photo proof',                   TRUE,  FALSE, 'Legend',          'Actually got crowd surfed',                       5, 'extreme', 'dare',    'Full crowd surf across the entire group — must last at least 5 seconds', 2),
('Truth Serum',        'Answer ANY question the group asks with complete honesty — 3 questions',           FALSE, FALSE, 'Truth Teller',    'Answered the group''s toughest questions',        3, 'extreme', 'social',  'FIVE questions and the group specifically tries to ask the hardest ones possible', 2),
('Belly Flop',         'Do a belly flop onto a couch or soft surface — photo proof',                       TRUE,  FALSE, 'Belly Flopper',   'Committed to the belly flop',                     3, 'extreme', 'dare',    'Belly flop AND hold the pose for 10 seconds while everyone photographs you', 2),
('Mix Master',         'Let the group mix you a drink from whatever''s available — drink it all',           TRUE,  FALSE, 'Guinea Pig',      'Survived a group-mixed concoction',               4, 'extreme', 'dare',    'The group can use up to 5 ingredients — NO limits on what they choose', 2),
('Wingman Challenge',  'Be someone''s wingman for 5 minutes — get them a number or a dance',               TRUE,  FALSE, 'Ultimate Wingman','Successfully wingmanned a friend',               3, 'extreme', 'social',  'Be a wingman for a STRANGER in the venue — get them talking to someone new', 2),
('Last One Standing',  'Everyone stands on one leg — last person standing picks who drinks',               FALSE, FALSE, NULL,              NULL,                                           3, 'extreme', 'group',   'One leg AND eyes closed — last person standing is immune from the next 2 dares', 2),
('Lemon Face',         'Eat a lemon slice without making a face — group judges',                           TRUE,  FALSE, 'Poker Face',      'Kept a straight face through a lemon',            3, 'extreme', 'dare',    'Eat TWO lemon slices and maintain eye contact with someone the entire time', 2),
('Mystery Drink',      'Close your eyes — someone orders you a drink — you must finish it',                FALSE, FALSE, 'Brave Soul',      'Drank a mystery drink without hesitation',        3, 'extreme', 'dare',    'THREE mystery sips from three different people''s drinks — guess each one', 2),
('Roast Battle',       'Roast the person to your right for 30 seconds — they can''t respond',              FALSE, FALSE, 'Roast Master',    'Delivered a legendary roast',                     3, 'extreme', 'social',  'Full roast battle: 30 seconds each, group votes winner, loser drinks', 2),
('Speed Friends',      'Get a stranger''s name, job, AND fun fact in under 60 seconds — timer running',   FALSE, TRUE,  'Speed Networker', 'Made a friend in under a minute',                 3, 'extreme', 'social',  'Do this with THREE strangers in 3 minutes total', 2),
('Handstand Sip',      'Attempt a handstand (against a wall is fine) and take a sip upside down',          TRUE,  FALSE, 'Acrobat',         'Defied gravity for a drink',                      4, 'extreme', 'dare',    'Freestanding handstand — no wall — someone holds your drink to your lips', 2),
('Impression Battle',  'Do impressions of everyone at the table — they rate each one',                     FALSE, FALSE, 'Mimic',           'Nailed everyone''s impression',                   2, 'extreme', 'creative','Do impressions of each person AND strangers at nearby tables', 2),
('Whole Table Toast',  'Get the entire venue to raise their glass with you on the count of 3',             TRUE,  FALSE, 'Commander',       'Got an entire venue to toast with them',           5, 'extreme', 'social',  'Give a 30-second speech THEN get the whole venue to toast', 2),

-- === ADDITIONAL CHILL ===
('Would You Rather',   'Ask the group a "Would you rather" — minority answer drinks',                     FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'group',    'Rapid fire: 5 "Would you rather" questions in 60 seconds — minority each time drinks', 2),
('Rhyme Time',         'Say a word — go around the table rhyming — first person who can''t, drinks',       FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'group',    'Must be REAL words and you have only 3 seconds each', 2),
('Compliment Battle',  'Take turns complimenting each other — first person to laugh drinks',                FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'social',   'Compliments must be increasingly over-the-top and dramatic', 2),
('Guess the Song',     'Hum a song — first person to guess it picks who drinks',                           FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'creative', 'Hum the song backwards — way harder to guess', 2),
('Desert Island',      'Name 3 things you''d bring to a desert island — group vetoes 1, drink for the veto', FALSE, FALSE, NULL,            NULL,                                           1, 'chill', 'creative', 'Group vetoes ALL THREE — you must justify each one or drink per veto', 2),
('Fact or Cap',        'Tell the group something about yourself — they vote fact or cap (lie). Wrong voters drink', FALSE, FALSE, NULL,      NULL,                                           1, 'chill', 'social',   'THREE statements rapid fire — vote after all three, wrong on any = drink', 2),
('Categories Sprint',  'Name 5 items in a category in 10 seconds — fail and drink',                        FALSE, TRUE,  NULL,              NULL,                                           1, 'chill', 'creative', 'Name 10 items in 15 seconds — no repeats from previous rounds', 2),
('Freeze Dance',       'Dance when music plays — freeze when it stops — last to freeze drinks',             FALSE, FALSE, NULL,              NULL,                                           1, 'chill', 'group',    'Freeze in the most ridiculous pose possible — least creative pose drinks too', 2),

-- === ADDITIONAL WILD ===
('Vocab Villain',      'Use a ridiculous word in conversation with a stranger without them noticing',       FALSE, FALSE, 'Linguist',        'Snuck a ridiculous word past a stranger',         2, 'wild', 'social',  'Use THREE ridiculous words in ONE conversation naturally', 2),
('Tip Jar Challenge',  'Add to the tip jar and take a selfie — bartender must be smiling',                  TRUE,  FALSE, 'Big Tipper',      'Made the bartender smile with a generous tip',    2, 'wild', 'social',  'Get the bartender to write a personalized note on a napkin for you', 2),
('Mirror Mirror',      'Copy everything the person to your right does for 2 minutes',                      FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'dare',    'Copy them for 5 minutes — they specifically try to make you fail', 2),
('Invisible Friend',   'Introduce your "invisible friend" to a stranger — keep a straight face',            FALSE, FALSE, 'Committed',       'Convinced someone an invisible person exists',    2, 'wild', 'dare',    'Keep the act going for a full 2-minute conversation', 2),
('Napkin Art',          'Draw a portrait of someone at the table on a napkin — they rate it',                TRUE,  FALSE, 'Artist',          'Created napkin masterpiece art',                   2, 'wild', 'creative','Draw a portrait of a STRANGER and give it to them as a gift', 2),
('Wrong Answers Only', 'Group asks you 5 questions — you must answer with confident wrong answers',         FALSE, FALSE, NULL,              NULL,                                           2, 'wild', 'creative','10 questions and you must keep a completely straight face throughout', 2),
('Shoe Swap',          'Swap shoes with someone at the table for the next round',                           TRUE,  FALSE, NULL,              NULL,                                           2, 'wild', 'dare',    'Swap shoes with a STRANGER for 10 minutes', 2),
('Human Jukebox',      'The group picks a song — you must perform it with choreography',                    TRUE,  FALSE, 'Performer',       'Gave a full musical performance',                 2, 'wild', 'creative','Full song with choreography AND you must recruit a backup dancer from the group', 2);
