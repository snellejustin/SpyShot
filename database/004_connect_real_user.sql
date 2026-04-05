-- ============================================================
-- Connect real user to fake users + add photos to feed items
-- ============================================================

-- 1. Add friendships between real user and all fake users
INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at) VALUES
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a1111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a2222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a3333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a4444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a5555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a6666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a7777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('706615eb-c2cf-4a83-a261-2489bb3de198', 'a8888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- 2. Add sample photos to some feed items (using picsum.photos for realistic images)
-- Update ~30% of feed items with photos to make the feed look more visual
UPDATE feed_items SET photo_url = 'https://picsum.photos/seed/' || LEFT(id::text, 8) || '/600/400'
WHERE badge_name IN (
  'Social Butterfly', 'Bar Buddy', 'Group Shot', 'Crowd Pleaser',
  'Daredevil', 'Wild Night', 'Party Animal', 'Joker', 'Director',
  'Mannequin Challenge', 'Innovator', 'Bad Influence'
)
AND photo_url IS NULL;
