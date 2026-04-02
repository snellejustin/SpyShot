-- Add favorite badge support to profiles table
ALTER TABLE profiles ADD COLUMN favorite_badge_id UUID REFERENCES player_badges(id) ON DELETE SET NULL;
