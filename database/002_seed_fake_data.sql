-- ============================================================
-- Seed Data: Fake players, groups, games, and badges
-- Run this AFTER 000_full_setup.sql and 001_fix_rls_recursion.sql
-- Creates realistic-looking sample data so the app doesn't feel empty.
-- ============================================================

-- 1. Create fake auth users (using Supabase's auth.users directly)
-- Note: These users can't actually log in — they're display-only.
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '45 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"emma_w","name":"Emma Wilson"}'),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'liam@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '38 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"liam_dev","name":"Liam Chen"}'),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '30 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"sofiaa","name":"Sofia Martinez"}'),
  ('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'noah@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '25 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"noah_k","name":"Noah Kim"}'),
  ('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'olivia@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '20 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"liv_jones","name":"Olivia Jones"}'),
  ('a6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucas@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '15 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"lucas_m","name":"Lucas Murphy"}'),
  ('a7777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mia@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '12 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"mia_r","name":"Mia Rodriguez"}'),
  ('a8888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ethan@example.com', crypt('fake_password_123', gen_salt('bf')), NOW(), NOW() - INTERVAL '10 days', NOW(), '', '{"provider":"email","providers":["email"]}', '{"username":"ethan_b","name":"Ethan Brown"}')
ON CONFLICT (id) DO NOTHING;

-- Also add identities for the fake users (required by Supabase auth)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'email', '{"sub":"a1111111-1111-1111-1111-111111111111","email":"emma@example.com"}', NOW(), NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'email', '{"sub":"a2222222-2222-2222-2222-222222222222","email":"liam@example.com"}', NOW(), NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'email', '{"sub":"a3333333-3333-3333-3333-333333333333","email":"sofia@example.com"}', NOW(), NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'email', '{"sub":"a4444444-4444-4444-4444-444444444444","email":"noah@example.com"}', NOW(), NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'email', '{"sub":"a5555555-5555-5555-5555-555555555555","email":"olivia@example.com"}', NOW(), NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'email', '{"sub":"a6666666-6666-6666-6666-666666666666","email":"lucas@example.com"}', NOW(), NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 'email', '{"sub":"a7777777-7777-7777-7777-777777777777","email":"mia@example.com"}', NOW(), NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', 'email', '{"sub":"a8888888-8888-8888-8888-888888888888","email":"ethan@example.com"}', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Create profiles for fake users
INSERT INTO profiles (id, email, username, name, bio, profile_picture) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'emma@example.com', 'emma_w', 'Emma Wilson', 'Life of the party', 'https://i.pravatar.cc/300?u=emma'),
  ('a2222222-2222-2222-2222-222222222222', 'liam@example.com', 'liam_dev', 'Liam Chen', 'Always up for a challenge', 'https://i.pravatar.cc/300?u=liam'),
  ('a3333333-3333-3333-3333-333333333333', 'sofia@example.com', 'sofiaa', 'Sofia Martinez', 'Queen of dares', 'https://i.pravatar.cc/300?u=sofia'),
  ('a4444444-4444-4444-4444-444444444444', 'noah@example.com', 'noah_k', 'Noah Kim', 'Fastest chugger in town', 'https://i.pravatar.cc/300?u=noah'),
  ('a5555555-5555-5555-5555-555555555555', 'olivia@example.com', 'liv_jones', 'Olivia Jones', 'Social butterfly', 'https://i.pravatar.cc/300?u=olivia'),
  ('a6666666-6666-6666-6666-666666666666', 'lucas@example.com', 'lucas_m', 'Lucas Murphy', 'Legend status incoming', 'https://i.pravatar.cc/300?u=lucas'),
  ('a7777777-7777-7777-7777-777777777777', 'mia@example.com', 'mia_r', 'Mia Rodriguez', 'Here for a good time', 'https://i.pravatar.cc/300?u=mia'),
  ('a8888888-8888-8888-8888-888888888888', 'ethan@example.com', 'ethan_b', 'Ethan Brown', 'Never backs down from a dare', 'https://i.pravatar.cc/300?u=ethan')
ON CONFLICT (id) DO NOTHING;

-- 3. Create friendships between fake users (accepted)
INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '40 days', NOW() - INTERVAL '39 days'),
  ('a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '35 days', NOW() - INTERVAL '34 days'),
  ('a1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days'),
  ('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
  ('a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days'),
  ('a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '26 days', NOW() - INTERVAL '25 days'),
  ('a3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),
  ('a4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days'),
  ('a5555555-5555-5555-5555-555555555555', 'a6666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
  ('a6666666-6666-6666-6666-666666666666', 'a7777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
  ('a7777777-7777-7777-7777-777777777777', 'a8888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
  ('a1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
  ('a2222222-2222-2222-2222-222222222222', 'a8888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- 4. Create groups
INSERT INTO groups (id, name, description, type, mode, creator_id, created_at) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Friday Night Crew', 'The legendary Friday night squad', 'home', 'party', 'a1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '35 days'),
  ('b2222222-2222-2222-2222-222222222222', 'Coffee & Chaos', 'Caffeine-fueled challenges', 'cafe', 'classic', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '28 days'),
  ('b3333333-3333-3333-3333-333333333333', 'The Daredevils', 'No dare too bold', 'home', 'party', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days'),
  ('b4444444-4444-4444-4444-444444444444', 'Pub Quiz Legends', 'Smart and thirsty', 'cafe', 'classic', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Add members to groups
INSERT INTO group_members (group_id, user_id, status, joined_at) VALUES
  -- Friday Night Crew
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '35 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '34 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '34 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '33 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '30 days'),
  -- Coffee & Chaos
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '28 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '27 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '26 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a8888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '25 days'),
  -- The Daredevils
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '20 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '19 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '18 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '17 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a7777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '16 days'),
  -- Pub Quiz Legends
  ('b4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '14 days'),
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '13 days'),
  ('b4444444-4444-4444-4444-444444444444', 'a7777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '12 days'),
  ('b4444444-4444-4444-4444-444444444444', 'a8888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '11 days')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 6. Create completed game sessions
INSERT INTO game_sessions (id, group_id, creator_id, duration_minutes, interval_minutes, status, started_at, current_round, created_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 90, 5, 'completed', NOW() - INTERVAL '30 days', 8, NOW() - INTERVAL '30 days'),
  ('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 60, 10, 'completed', NOW() - INTERVAL '22 days', 5, NOW() - INTERVAL '22 days'),
  ('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 120, 5, 'completed', NOW() - INTERVAL '14 days', 10, NOW() - INTERVAL '14 days'),
  ('c4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 60, 5, 'completed', NOW() - INTERVAL '7 days', 6, NOW() - INTERVAL '7 days'),
  ('c5555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 90, 10, 'completed', NOW() - INTERVAL '5 days', 7, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Create player badges (varying amounts per player for different tiers)
-- Emma (12 badges - Silver tier on some)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Social Butterfly', 'Made contact with a stranger', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Social Butterfly', 'Made contact with a stranger', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Social Butterfly', 'Made contact with a stranger', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Party Animal', 'Tore up the dance floor', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Party Animal', 'Tore up the dance floor', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '13 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Daredevil', 'Drank without using hands', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '28 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Group Shot', 'Assembled the whole crew', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '27 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Toast Master', 'Delivered a legendary toast', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Wild Night', 'Survived a group dare', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Speed Drinker', 'Completed a drink race', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Troublemaker', 'Imposed a rule on the group', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '13 days'),
  ('a1111111-1111-1111-1111-111111111111', 'Class Clown', 'Entertained with an impression', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days');

-- Liam (8 badges)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a2222222-2222-2222-2222-222222222222', 'Speed Drinker', 'Completed a drink race', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '22 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Speed Drinker', 'Completed a drink race', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Lightning Fast', 'Downed a shot at lightning speed', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '21 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Chug Champion', 'Crushed the chug challenge', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Bar Buddy', 'Made friends with the staff', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Team Player', 'Spread the love around the table', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Task Crusher', 'Named 5 types of alcohol', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '22 days'),
  ('a2222222-2222-2222-2222-222222222222', 'Rebel', 'Chose to drink over truth', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days');

-- Sofia (15 badges - Gold tier on Daredevil!)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a3333333-3333-3333-3333-333333333333', 'Daredevil', 'Drank without using hands', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Daredevil', 'Drank without using hands', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Daredevil', 'Drank without using hands', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Daredevil', 'Drank without using hands', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Daredevil', 'Drank without using hands', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Thrill Seeker', 'Trusted a teammate with their drink', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '19 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Thrill Seeker', 'Trusted a teammate with their drink', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Wild Night', 'Survived a group dare', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '18 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Wild Night', 'Survived a group dare', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Crowd Pleaser', 'Charmed a stranger into a selfie', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '17 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Explorer', 'Ventured out and returned with wisdom', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '16 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Innovator', 'Dared to order the unexpected', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '15 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Joker', 'Photobomb legend', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Influencer', 'Kicked off a legendary waterfall', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a3333333-3333-3333-3333-333333333333', 'Bad Influence', 'Convinced a stranger to drink along', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '13 days');

-- Noah (6 badges - speed focused)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a4444444-4444-4444-4444-444444444444', 'Speed Drinker', 'Completed a drink race', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '22 days'),
  ('a4444444-4444-4444-4444-444444444444', 'Speed Drinker', 'Completed a drink race', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a4444444-4444-4444-4444-444444444444', 'Speed Drinker', 'Completed a drink race', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days'),
  ('a4444444-4444-4444-4444-444444444444', 'Lightning Fast', 'Downed a shot at lightning speed', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '21 days'),
  ('a4444444-4444-4444-4444-444444444444', 'Chug Champion', 'Crushed the chug challenge', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '13 days'),
  ('a4444444-4444-4444-4444-444444444444', 'Director', 'Orchestrated a mannequin challenge', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days');

-- Olivia (9 badges - social queen)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a5555555-5555-5555-5555-555555555555', 'Social Butterfly', 'Made contact with a stranger', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Social Butterfly', 'Made contact with a stranger', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Crowd Pleaser', 'Charmed a stranger into a selfie', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Crowd Pleaser', 'Charmed a stranger into a selfie', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '4 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Group Shot', 'Assembled the whole crew', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Bar Buddy', 'Made friends with the staff', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Team Player', 'Spread the love around the table', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '28 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Toast Master', 'Delivered a legendary toast', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '4 days'),
  ('a5555555-5555-5555-5555-555555555555', 'Creative', 'Authored a spontaneous ode', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days');

-- Lucas (4 badges)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a6666666-6666-6666-6666-666666666666', 'Troublemaker', 'Imposed a rule on the group', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '22 days'),
  ('a6666666-6666-6666-6666-666666666666', 'Rebel', 'Chose to drink over truth', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a6666666-6666-6666-6666-666666666666', 'Storyteller', 'Entertained with song', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '21 days'),
  ('a6666666-6666-6666-6666-666666666666', 'Bad Influence', 'Convinced a stranger to drink along', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '13 days');

-- Mia (7 badges)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a7777777-7777-7777-7777-777777777777', 'Party Animal', 'Tore up the dance floor', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
  ('a7777777-7777-7777-7777-777777777777', 'Party Animal', 'Tore up the dance floor', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a7777777-7777-7777-7777-777777777777', 'Party Animal', 'Tore up the dance floor', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),
  ('a7777777-7777-7777-7777-777777777777', 'Influencer', 'Kicked off a legendary waterfall', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days'),
  ('a7777777-7777-7777-7777-777777777777', 'Wild Night', 'Survived a group dare', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '14 days'),
  ('a7777777-7777-7777-7777-777777777777', 'Daredevil', 'Drank without using hands', 'b3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '13 days'),
  ('a7777777-7777-7777-7777-777777777777', 'Group Shot', 'Assembled the whole crew', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days');

-- Ethan (5 badges)
INSERT INTO player_badges (player_id, badge_name, badge_description, group_id, earned_at) VALUES
  ('a8888888-8888-8888-8888-888888888888', 'Chug Champion', 'Crushed the chug challenge', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '22 days'),
  ('a8888888-8888-8888-8888-888888888888', 'Task Crusher', 'Named 5 types of alcohol', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '21 days'),
  ('a8888888-8888-8888-8888-888888888888', 'Explorer', 'Ventured out and returned with wisdom', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),
  ('a8888888-8888-8888-8888-888888888888', 'Class Clown', 'Entertained with an impression', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days'),
  ('a8888888-8888-8888-8888-888888888888', 'Speed Drinker', 'Completed a drink race', 'b4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '4 days');

-- Set favorite badges for some users
UPDATE profiles SET favorite_badge_id = (
  SELECT id FROM player_badges WHERE player_id = 'a3333333-3333-3333-3333-333333333333' AND badge_name = 'Daredevil' LIMIT 1
) WHERE id = 'a3333333-3333-3333-3333-333333333333';

UPDATE profiles SET favorite_badge_id = (
  SELECT id FROM player_badges WHERE player_id = 'a7777777-7777-7777-7777-777777777777' AND badge_name = 'Party Animal' LIMIT 1
) WHERE id = 'a7777777-7777-7777-7777-777777777777';

UPDATE profiles SET favorite_badge_id = (
  SELECT id FROM player_badges WHERE player_id = 'a2222222-2222-2222-2222-222222222222' AND badge_name = 'Speed Drinker' LIMIT 1
) WHERE id = 'a2222222-2222-2222-2222-222222222222';

-- ============================================================
-- Done! 8 fake users with profiles, friendships, 4 groups,
-- 5 completed game sessions, and 66 badges across all players.
-- ============================================================
