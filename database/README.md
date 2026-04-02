# Database Setup for Friends Feature

## Required Database Tables

### 1. Friendships Table

To enable the friend search and management functionality, you need to create the
`friendships` table in your Supabase database.

#### Setup Instructions:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/friendships_table.sql`
4. Run the SQL script

This will create:

- `friendships` table with proper relationships
- Row Level Security (RLS) policies for data protection
- Indexes for performance
- Triggers for automatic timestamp updates

### 2. Existing Tables Used:

- `profiles` - User profile information (already exists)
- `auth.users` - Supabase authentication users (built-in)

## Features Enabled:

- User search by username
- Send friend requests
- Accept/reject friend requests (status: pending/accepted/rejected)
- View friends list
- Navigate to friend profiles
- Remove friends

## API Functions Available:

- `searchUsers(query, currentUserId)` - Search for users by username
- `getOtherUserProfile(userId)` - Get another user's profile
- `addFriend(currentUserId, friendId)` - Send friend request
- `removeFriend(currentUserId, friendId)` - Remove friendship
- `areFriends(currentUserId, friendId)` - Check friendship status
- `getFriends(userId)` - Get user's friends list

## Security:

- Row Level Security ensures users can only access their own friendships
- Users cannot add themselves as friends
- Duplicate friendships are prevented
- All database operations require authentication
