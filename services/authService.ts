import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

class AuthService {
  // Register new user — only creates the auth account.
  // Profile is created on first login via ensureProfile().
  // Returns { user, needsEmailConfirmation }.
  async register(
    email: string,
    password: string,
    username: string,
    name: string
  ): Promise<{ user: any; needsEmailConfirmation: boolean }> {
    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Create auth user with profile data stored in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, name },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // If the session exists, email confirmation is off — create profile now
      const needsEmailConfirmation = !authData.session;

      if (authData.session) {
        await this.ensureProfile(authData.user);
      }

      return { user: authData.user, needsEmailConfirmation };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Ensure a profile row exists for the authenticated user.
  // Reads username/name from auth user metadata if creating for the first time.
  async ensureProfile(user: { id: string; email?: string; user_metadata?: any }): Promise<UserProfile> {
    try {
      // Check if profile already exists
      const { data: existing, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existing && !getError) {
        return existing as UserProfile;
      }

      // Create profile from auth metadata
      const meta = user.user_metadata || {};
      const email = user.email || '';
      const username = meta.username || email.split('@')[0];
      const name = meta.name || username;

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email,
          username,
          name,
          bio: '',
          profile_picture: null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in user — also creates the profile if this is the first login
  // (e.g. after confirming email).
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed - no user returned');

      // ensureProfile creates the profile on first login if it doesn't exist yet
      const userProfile = await this.ensureProfile(authData.user);
      return userProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign out user
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update authenticated user's password
  async updatePassword(newPassword: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  }

  // Delete user account and profile data
  async deleteAccount(userId: string): Promise<void> {
    try {
      // Delete profile row — cascades to friendships, group_members, player_badges
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileError) throw profileError;

      // Sign out the user (Supabase auth record deletion requires service-role key,
      // so we sign out here and the profile row is gone — the auth record can be
      // cleaned up via a Supabase edge function or database webhook if needed).
      await supabase.auth.signOut();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get user profile from database
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User profile not found');
      
      return data as UserProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Create user profile (or get existing one)
  async createProfile(userId: string, email: string, username?: string): Promise<UserProfile> {
    try {
      // First, try to get existing profile
      const { data: existingProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile && !getError) {
        return existingProfile as UserProfile;
      }

      // If profile doesn't exist, create new one
      const newProfile = {
        id: userId,
        email: email,
        username: username || email.split('@')[0], // Use email prefix as default username
        name: username || email.split('@')[0], // Use email prefix as default name
        bio: '',
        profile_picture: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create profile');

      return data as UserProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Upload profile picture
  async uploadProfilePicture(userId: string, imageUri: string): Promise<string> {
    try {
      // Convert image to buffer for upload
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;
      

      // Upload image to Supabase Storage using the buffer
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, uint8Array, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt}`
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      await this.updateUserProfile(userId, { profile_picture: publicUrl });

      return publicUrl;
    } catch (error: any) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Search for users by username or name
  async searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, name, profile_picture')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(10);

      if (error) throw error;

      return (data || []).map(user => ({
        ...user,
        email: '',
        bio: '',
        created_at: '',
        updated_at: '',
      }));
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get other user profile by ID (for viewing other users)
  async getOtherUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  // Add friend relationship
  async addFriend(currentUserId: string, friendId: string): Promise<void> {
    try {
      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`)
        .single();

      if (existing) {
        throw new Error('Friendship already exists');
      }

      // Insert friendship
      const { error } = await supabase
        .from('friendships')
        .insert([
          { user_id: currentUserId, friend_id: friendId, status: 'pending' }
        ]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to add friend:', error);
      throw new Error(`Failed to add friend: ${error.message}`);
    }
  }

  // Remove friend relationship
  async removeFriend(currentUserId: string, friendId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to remove friend:', error);
      throw new Error(`Failed to remove friend: ${error.message}`);
    }
  }

  // Accept friend request
  async acceptFriendRequest(currentUserId: string, requesterId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', requesterId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to accept friend request:', error);
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }
  }

  // Decline friend request
  async declineFriendRequest(currentUserId: string, requesterId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to decline friend request:', error);
      throw new Error(`Failed to decline friend request: ${error.message}`);
    }
  }

  // Get pending friend requests (received by current user)
  async getPendingFriendRequests(currentUserId: string): Promise<UserProfile[]> {
    try {
      // First get the friendship records
      const { data: friendshipData, error: friendshipError } = await supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (friendshipError) throw friendshipError;

      if (!friendshipData || friendshipData.length === 0) {
        return [];
      }

      // Then get the profile information for those users
      const userIds = friendshipData.map(item => item.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, name, profile_picture')
        .in('id', userIds);

      if (profileError) throw profileError;

      return profileData?.map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profile_picture: profile.profile_picture,
        email: '',
        bio: '',
        created_at: '',
        updated_at: ''
      })) || [];
    } catch (error: any) {
      console.error('Failed to get pending friend requests:', error);
      return [];
    }
  }

  // Get friendship status between two users
  async getFriendshipStatus(currentUserId: string, friendId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      if (error) throw error;
      if (!data || data.length === 0) return 'none';

      const friendship = data[0];
      
      if (friendship.status === 'accepted') return 'friends';
      if (friendship.user_id === currentUserId) return 'pending_sent';
      return 'pending_received';
    } catch (error: any) {
      console.error('Failed to get friendship status:', error);
      return 'none';
    }
  }

  // Check if users are friends
  async areFriends(currentUserId: string, friendId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`)
        .eq('status', 'accepted')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return !!data;
    } catch (error: any) {
      console.error('Failed to check friendship:', error);
      return false;
    }
  }

  // Get user's friends (accepted friendships in both directions)
  async getFriends(userId: string): Promise<UserProfile[]> {
    try {
      // Get friendships where user is the requester
      const { data: sentFriendships, error: sentError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (sentError) throw sentError;

      // Get friendships where user is the recipient
      const { data: receivedFriendships, error: receivedError } = await supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (receivedError) throw receivedError;

      // Collect all friend IDs
      const sentFriendIds = sentFriendships?.map(f => f.friend_id) || [];
      const receivedFriendIds = receivedFriendships?.map(f => f.user_id) || [];
      const allFriendIds = [...sentFriendIds, ...receivedFriendIds];

      if (allFriendIds.length === 0) {
        return [];
      }

      // Get profile information for all friends
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, name, profile_picture, ready_to_play, ready_until')
        .in('id', allFriendIds);

      if (profileError) throw profileError;

      return profileData?.map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profile_picture: profile.profile_picture,
        email: '',
        bio: '',
        created_at: '',
        updated_at: ''
      })) || [];
    } catch (error: any) {
      console.error('Failed to fetch friends:', error);
      throw new Error(`Failed to fetch friends: ${error.message}`);
    }
  }

  // GROUP-RELATED METHODS

  // Create a new group
  async createGroup(groupData: {
    name: string;
    description?: string;
    type: string;
    mode: 'classic' | 'party';
    creator_id: string;
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name: groupData.name,
          description: groupData.description || '',
          type: groupData.type,
          mode: groupData.mode,
          creator_id: groupData.creator_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as a member with accepted status
      await supabase
        .from('group_members')
        .insert([{
          group_id: data.id,
          user_id: groupData.creator_id,
          status: 'accepted',
          joined_at: new Date().toISOString()
        }]);

      return data;
    } catch (error: any) {
      console.error('Failed to create group:', error);
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  // Send group invitations to multiple users
  async sendGroupInvitations(groupId: string, userIds: string[]): Promise<void> {
    try {
      const invitations = userIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        status: 'pending',
        invited_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('group_members')
        .insert(invitations);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to send group invitations:', error);
      throw new Error(`Failed to send group invitations: ${error.message}`);
    }
  }

  // Get groups where user is a member
  async getUserGroups(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(status),
          creator:profiles!groups_creator_id_fkey(name, username)
        `)
        .eq('group_members.user_id', userId)
        .eq('group_members.status', 'accepted');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get user groups:', error);
      throw new Error(`Failed to get user groups: ${error.message}`);
    }
  }

  // Get pending group invitations for user
  async getPendingGroupInvitations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(status, invited_at),
          creator:profiles!groups_creator_id_fkey(name, username)
        `)
        .eq('group_members.user_id', userId)
        .eq('group_members.status', 'pending');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get pending group invitations:', error);
      return [];
    }
  }

  // Accept group invitation
  async acceptGroupInvitation(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ 
          status: 'accepted',
          joined_at: new Date().toISOString()
        })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to accept group invitation:', error);
      throw new Error(`Failed to accept group invitation: ${error.message}`);
    }
  }

  // Decline group invitation
  async declineGroupInvitation(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ status: 'declined' })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to decline group invitation:', error);
      throw new Error(`Failed to decline group invitation: ${error.message}`);
    }
  }

  // Get group members
  async getGroupMembers(groupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:profiles(id, username, name, profile_picture)
        `)
        .eq('group_id', groupId)
        .eq('status', 'accepted');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get group members:', error);
      throw new Error(`Failed to get group members: ${error.message}`);
    }
  }

  // Get detailed information about a specific group
  async getGroupDetails(groupId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles!groups_creator_id_fkey(name, username)
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to get group details:', error);
      throw new Error(`Failed to get group details: ${error.message}`);
    }
  }

  // Delete a group (only group creator can do this)
  async deleteGroup(groupId: string): Promise<void> {
    try {
      // Delete the group (cascade will handle group_members)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  // Leave a group (remove user from group_members)
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      throw new Error(`Failed to leave group: ${error.message}`);
    }
  }

  // Get total unread notification count (friend requests + group invitations + other notifications)
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      // Get friend request count
      const friendRequests = await this.getPendingFriendRequests(userId);
      
      // Get group invitation count  
      const groupInvitations = await this.getPendingGroupInvitations(userId);
      
      // Get other unread notifications from notifications table (if it exists)
      let otherNotifications = 0;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .eq('recipient_id', userId)
          .eq('read', false);
        
        if (!error && data) {
          otherNotifications = data.length;
        }
      } catch {
        // Notifications table might not exist yet — ignore silently
      }
      
      return friendRequests.length + groupInvitations.length + otherNotifications;
    } catch (error: any) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  }

  // GAME SYSTEM METHODS

  // Start a new game session
  async startGameSession(groupId: string, creatorId: string, durationMinutes: number, intervalMinutes: number, intensity: string = 'wild'): Promise<any> {
    try {
      const now = new Date();
      const nextTaskAt = new Date(now.getTime());

      // Generate a room code
      const { data: codeResult } = await supabase.rpc('generate_room_code');
      const roomCode = codeResult || Math.random().toString(36).substring(2, 6).toUpperCase();

      const { data, error } = await supabase
        .from('game_sessions')
        .insert([{
          group_id: groupId,
          creator_id: creatorId,
          duration_minutes: durationMinutes,
          interval_minutes: intervalMinutes,
          intensity,
          room_code: roomCode,
          status: 'active',
          started_at: now.toISOString(),
          last_task_at: now.toISOString(),
          next_task_at: nextTaskAt.toISOString(),
          current_round: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to start game session:', error);
      throw new Error(`Failed to start game session: ${error.message}`);
    }
  }

  // Get active game session for a group
  async getActiveGameSession(groupId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to get active game session:', error);
      return null;
    }
  }

  // Get user's active game sessions
  async getUserActiveGameSessions(userId: string): Promise<any[]> {
    try {
      // First get all groups where user is a member
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (groupsError) throw groupsError;
      if (!userGroups || userGroups.length === 0) return [];

      const groupIds = userGroups.map(gm => gm.group_id);

      // Then get active game sessions for those groups
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          group:groups(
            id,
            name,
            type,
            mode,
            creator:profiles!groups_creator_id_fkey(
              id,
              name,
              username
            )
          )
        `)
        .eq('status', 'active')
        .in('group_id', groupIds);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get user active game sessions:', error);
      return [];
    }
  }

  // Get all game tasks
  async getGameTasks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('game_tasks')
        .select('*')
        .order('id');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get game tasks:', error);
      throw new Error(`Failed to get game tasks: ${error.message}`);
    }
  }

  // Create a new game round with random player selection
  async createGameRound(sessionId: string, groupId: string): Promise<any> {
    try {
      // Get group members
      const members = await this.getGroupMembers(groupId);
      if (members.length === 0) {
        throw new Error('No group members found');
      }

      // Get session intensity to filter tasks
      const { data: sessionInfo } = await supabase
        .from('game_sessions')
        .select('intensity')
        .eq('id', sessionId)
        .single();
      const intensity = sessionInfo?.intensity || 'wild';

      // Get tasks matching the session's intensity (chill includes chill only,
      // wild includes chill + wild, extreme includes all)
      const intensityFilter = intensity === 'chill' ? ['chill']
        : intensity === 'wild' ? ['chill', 'wild']
        : ['chill', 'wild', 'extreme'];

      const { data: tasks, error: tasksError } = await supabase
        .from('game_tasks')
        .select('*')
        .in('intensity', intensityFilter);

      if (tasksError) throw tasksError;

      // Also fetch custom tasks for this group
      const { data: customTasks } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('group_id', groupId)
        .eq('active', true)
        .in('intensity', intensityFilter);

      // Merge standard + custom tasks (custom tasks get same shape)
      const allTasks = [
        ...(tasks || []),
        ...(customTasks || []).map((ct: any) => ({
          ...ct,
          badge_name: null,
          badge_description: null,
          bold_description: null,
          difficulty_level: 2,
        })),
      ];

      if (allTasks.length === 0) {
        throw new Error('No game tasks available');
      }

      // Randomly select a player and task
      const randomPlayer = members[Math.floor(Math.random() * members.length)];
      const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];

      // Get current round number
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('current_round')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const newRoundNumber = sessionData.current_round + 1;

      // Create the game round
      const { data, error } = await supabase
        .from('game_rounds')
        .insert([{
          session_id: sessionId,
          round_number: newRoundNumber,
          task_id: randomTask.id,
          selected_player_id: randomPlayer.profile.id,
          status: 'pending',
          started_at: new Date().toISOString()
        }])
        .select(`
          *,
          task:game_tasks(*),
          player:profiles!game_rounds_selected_player_id_fkey(id, username, name, profile_picture)
        `)
        .single();

      if (error) throw error;

      // Update session's current round (but don't set next_task_at yet - wait for completion/pass)
      await supabase
        .from('game_sessions')
        .update({
          current_round: newRoundNumber,
          last_task_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return data;
    } catch (error: any) {
      console.error('Failed to create game round:', error);
      throw new Error(`Failed to create game round: ${error.message}`);
    }
  }

  // Get game session by ID
  async getGameSession(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to get game session:', error);
      throw new Error(`Failed to get game session: ${error.message}`);
    }
  }

  // Complete a game round with optional photo/timer evidence
  async completeGameRound(roundId: string, photoUrl?: string, timerMilliseconds?: number): Promise<void> {
    try {
      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      if (photoUrl) updateData.photo_url = photoUrl;
      if (timerMilliseconds) updateData.timer_seconds = timerMilliseconds;

      const { error } = await supabase
        .from('game_rounds')
        .update(updateData)
        .eq('id', roundId);

      if (error) throw error;

      // Get the session details to set next task timer
      const { data: roundData, error: roundError } = await supabase
        .from('game_rounds')
        .select('session_id')
        .eq('id', roundId)
        .single();

      if (roundError) throw roundError;

      const session = await this.getGameSession(roundData.session_id);
      const nextTaskAt = new Date();
      nextTaskAt.setMinutes(nextTaskAt.getMinutes() + session.interval_minutes);

      // Update session with next task time
      await supabase
        .from('game_sessions')
        .update({
          next_task_at: nextTaskAt.toISOString()
        })
        .eq('id', roundData.session_id);

      // Award badge if applicable
      await this.awardBadgeForCompletedRound(roundId);
    } catch (error: any) {
      console.error('Failed to complete game round:', error);
      throw new Error(`Failed to complete game round: ${error.message}`);
    }
  }

  // Get game round details
  async getGameRound(roundId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('id', roundId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to get game round:', error);
      throw new Error(`Failed to get game round: ${error.message}`);
    }
  }

  // Pass (skip) a game round without completing it
  async passGameRound(roundId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_rounds')
        .update({
          status: 'passed',
          completed_at: new Date().toISOString()
        })
        .eq('id', roundId);

      if (error) throw error;

      // Get the session details to set next task timer
      const { data: roundData, error: roundError } = await supabase
        .from('game_rounds')
        .select('session_id')
        .eq('id', roundId)
        .single();

      if (roundError) throw roundError;

      const session = await this.getGameSession(roundData.session_id);
      const nextTaskAt = new Date();
      nextTaskAt.setMinutes(nextTaskAt.getMinutes() + session.interval_minutes);

      // Update session with next task time
      await supabase
        .from('game_sessions')
        .update({
          next_task_at: nextTaskAt.toISOString()
        })
        .eq('id', roundData.session_id);
    } catch (error: any) {
      console.error('Failed to pass game round:', error);
      throw new Error(`Failed to pass game round: ${error.message}`);
    }
  }

  // Award badge for completed round
  async awardBadgeForCompletedRound(roundId: string): Promise<void> {
    try {
      // Get round details with task info
      const { data: roundData, error: roundError } = await supabase
        .from('game_rounds')
        .select(`
          *,
          task:game_tasks(*),
          session:game_sessions(group_id)
        `)
        .eq('id', roundId)
        .single();

      if (roundError) throw roundError;

      // Check if task awards a badge
      if (roundData.task.badge_name) {
        // Check if player already has this badge
        const { data: existingBadge, error: checkError } = await supabase
          .from('player_badges')
          .select('*')
          .eq('player_id', roundData.selected_player_id)
          .eq('badge_name', roundData.task.badge_name)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError; // Throw if it's not a "no rows" error
        }

        if (existingBadge) {
          // Badge exists, add this photo/timer data to the badge's collection
          await this.addPhotoToBadge(existingBadge.id, roundData.photo_url, roundData.timer_seconds, roundId);
        } else {
          // First time earning this badge, create new badge entry
          const { data: newBadge, error: badgeError } = await supabase
            .from('player_badges')
            .insert([{
              player_id: roundData.selected_player_id,
              badge_name: roundData.task.badge_name,
              badge_description: roundData.task.badge_description,
              group_id: roundData.session.group_id,
              round_id: roundId,
              photo_url: roundData.photo_url,
              timer_seconds: roundData.timer_seconds,
              earned_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (badgeError) throw badgeError;

          // Add the photo to the photos collection as well
          if (roundData.photo_url || roundData.timer_seconds) {
            await this.addPhotoToBadge(newBadge.id, roundData.photo_url, roundData.timer_seconds, roundId);
          }
        }

        // Create feed item for the badge
        await this.createFeedItem({
          userId: roundData.selected_player_id,
          type: 'badge_earned',
          title: `Earned the ${roundData.task.badge_name} badge`,
          subtitle: roundData.task.badge_description,
          photoUrl: roundData.photo_url || undefined,
          badgeName: roundData.task.badge_name,
          groupId: roundData.session.group_id,
          roundId,
        });
      }
    } catch (error: any) {
      console.error('Failed to award badge:', error);
      // Don't throw here as this is a secondary action
    }
  }

  // Add photo/timer data to a badge's collection
  async addPhotoToBadge(badgeId: string, photoUrl?: string, timerSeconds?: number, roundId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_photos')
        .insert([{
          badge_id: badgeId,
          photo_url: photoUrl,
          timer_seconds: timerSeconds,
          round_id: roundId,
          taken_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to add photo to badge:', error);
      throw error;
    }
  }



  // Get player badges grouped by badge name with tier progression
  async getPlayerBadges(playerId: string): Promise<any[]> {
    try {
      // Get all unique badges for this player
      const { data: badgesData, error: badgesError } = await supabase
        .from('player_badges')
        .select(`
          *,
          group:groups(name)
        `)
        .eq('player_id', playerId)
        .order('earned_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Group badges by badge_name to avoid duplicates
      const groupedBadges = new Map();
      
      for (const badge of badgesData || []) {
        const key = badge.badge_name;
        if (!groupedBadges.has(key)) {
          // First instance of this badge, keep it
          groupedBadges.set(key, badge);
        }
      }

      // Get user's favorite badge
      const { data: profileData } = await supabase
        .from('profiles')
        .select('favorite_badge_id')
        .eq('id', playerId)
        .single();

      // Now fetch all photos for each unique badge and add tier information
      const badgesWithPhotos = [];
      
      for (const badge of groupedBadges.values()) {
        // Get all photos for this specific badge from badge_photos table
        const { data: photosData, error: photosError } = await supabase
          .from('badge_photos')
          .select('*')
          .eq('badge_id', badge.id)
          .order('taken_at', { ascending: false });
          
        if (photosError) {
          console.error(`Error fetching photos for badge ${badge.id}:`, photosError);
        }
        
        const photos = [];
        
        // Add photos from badge_photos table
        if (photosData && photosData.length > 0) {
          photos.push(...photosData);
        }
        
        // Add original photo from player_badges if it exists and not already in photos
        if (badge.photo_url || badge.timer_seconds) {
          const originalPhotoExists = photos.some(photo => 
            photo.photo_url === badge.photo_url && 
            photo.timer_seconds === badge.timer_seconds
          );
          
          if (!originalPhotoExists) {
            photos.push({
              photo_url: badge.photo_url,
              timer_seconds: badge.timer_seconds,
              taken_at: badge.earned_at,
              round_id: badge.round_id
            });
          }
        }
        
        const badgeWithPhotos = {
          ...badge,
          photos: photos,
          completion_count: photos.length, // Use photo count as completion count
          is_favorite: profileData?.favorite_badge_id === badge.id
        };
        

        
        badgesWithPhotos.push(badgeWithPhotos);
      }

      return badgesWithPhotos;
    } catch (error: any) {
      console.error('Failed to get player badges:', error);
      return [];
    }
  }

  // Get all photos for a specific badge
  async getBadgePhotos(badgeId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('badge_photos')
        .select('*')
        .eq('badge_id', badgeId)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get badge photos:', error);
      return [];
    }
  }

  // Set favorite badge for a user
  async setFavoriteBadge(userId: string, badgeId: string): Promise<void> {
    try {
      // Verify the badge belongs to this user
      const { data: badge, error: badgeError } = await supabase
        .from('player_badges')
        .select('id')
        .eq('id', badgeId)
        .eq('player_id', userId)
        .single();

      if (badgeError || !badge) {
        throw new Error('Badge not found or does not belong to user');
      }

      // Update user's favorite badge
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_badge_id: badgeId })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to set favorite badge:', error);
      throw new Error(`Failed to set favorite badge: ${error.message}`);
    }
  }

  // Remove favorite badge for a user
  async removeFavoriteBadge(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_badge_id: null })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to remove favorite badge:', error);
      throw new Error(`Failed to remove favorite badge: ${error.message}`);
    }
  }

  // Get user's favorite badge with details
  async getFavoriteBadge(userId: string): Promise<any | null> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('favorite_badge_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.favorite_badge_id) {
        return null;
      }

      // Get the favorite badge details
      const { data: badge, error: badgeError } = await supabase
        .from('player_badges')
        .select('*')
        .eq('id', profile.favorite_badge_id)
        .single();

      if (badgeError || !badge) {
        return null;
      }

      // Get photos for this badge
      const { data: photosData } = await supabase
        .from('badge_photos')
        .select('*')
        .eq('badge_id', badge.id)
        .order('taken_at', { ascending: false });

      const photos = [...(photosData || [])];
      
      // Add original photo if it exists
      if (badge.photo_url || badge.timer_seconds) {
        const originalPhotoExists = photos.some(photo => 
          photo.photo_url === badge.photo_url && 
          photo.timer_seconds === badge.timer_seconds
        );
        
        if (!originalPhotoExists) {
          photos.push({
            photo_url: badge.photo_url,
            timer_seconds: badge.timer_seconds,
            taken_at: badge.earned_at,
            round_id: badge.round_id
          });
        }
      }

      return {
        ...badge,
        photos,
        completion_count: photos.length, // Add completion count based on photos
        is_favorite: true
      };
    } catch (error: any) {
      console.error('Failed to get favorite badge:', error);
      return null;
    }
  }

  // End game session (creator only)
  async endGameSession(sessionId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      // First verify the user is the creator of this game session
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .select('creator_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!session) throw new Error('Game session not found');
      if (session.creator_id !== user.id) {
        throw new Error('Only the game creator can end the session');
      }

      // Now update the session status
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('creator_id', user.id); // Additional security check

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to end game session:', error);
      throw new Error(`Failed to end game session: ${error.message}`);
    }
  }

  // Get game leaderboard with task completion statistics
  async getGameLeaderboard(sessionId: string): Promise<any[]> {
    try {
      // Get all group members for this session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('group_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const members = await this.getGroupMembers(sessionData.group_id);

      // Get task completion stats for each member
      const leaderboardData = await Promise.all(
        members.map(async (member) => {
          const { data: completedTasks, error: tasksError } = await supabase
            .from('game_rounds')
            .select('status')
            .eq('session_id', sessionId)
            .eq('selected_player_id', member.profile.id);

          if (tasksError) throw tasksError;

          const completedCount = completedTasks?.filter(task => task.status === 'completed').length || 0;
          const passedCount = completedTasks?.filter(task => task.status === 'passed').length || 0;
          const totalAssigned = completedTasks?.length || 0;

          return {
            profile: member.profile,
            completedTasks: completedCount,
            passedTasks: passedCount,
            totalAssigned,
            score: completedCount // Simple scoring: 1 point per completed task
          };
        })
      );

      // Sort by score (completed tasks) descending
      return leaderboardData.sort((a, b) => b.score - a.score);
    } catch (error: any) {
      console.error('Failed to get game leaderboard:', error);
      throw new Error(`Failed to get game leaderboard: ${error.message}`);
    }
  }

  // Get current active round for a session
  async getCurrentRound(sessionId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('game_rounds')
        .select(`
          *,
          task:game_tasks(*),
          player:profiles!game_rounds_selected_player_id_fkey(id, username, name, profile_picture)
        `)
        .eq('session_id', sessionId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to get current round:', error);
      return null;
    }
  }

  // Upload game photo evidence
  async uploadGamePhoto(roundId: string, imageUri: string): Promise<string> {
    try {
      // Convert image to buffer for upload
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `game-${roundId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('game-photos')
        .upload(filePath, uint8Array, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt}`
        });

      if (uploadError) {
        console.error('Game photo upload failed:', uploadError.message);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('game-photos')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error: any) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Get friends leaderboard — sorted by total badge completions
  async getFriendsLeaderboard(userId: string): Promise<any[]> {
    try {
      const friends = await this.getFriends(userId);

      // Include the current user themselves
      const currentProfile = await this.getUserProfile(userId);
      const allPlayers = [currentProfile, ...friends];

      const leaderboard = await Promise.all(
        allPlayers.map(async (player) => {
          const { data: badgeRows } = await supabase
            .from('player_badges')
            .select('id')
            .eq('player_id', player.id);

          // Total completions = number of badge rows (each row = one earned task)
          const totalCompletions = badgeRows?.length ?? 0;

          return {
            profile: player,
            totalCompletions,
            isCurrentUser: player.id === userId,
          };
        })
      );

      return leaderboard.sort((a, b) => b.totalCompletions - a.totalCompletions);
    } catch (error: any) {
      throw new Error(`Failed to load leaderboard: ${error.message}`);
    }
  }
  // Join a game session by room code
  async joinByRoomCode(roomCode: string, userId: string): Promise<any> {
    try {
      // Find active session with this code
      const { data: session, error } = await supabase
        .from('game_sessions')
        .select('*, group:groups(id, name)')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (error || !session) throw new Error('No active game found with that code');

      // Add user to the group if not already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', session.group_id)
        .eq('user_id', userId)
        .single();

      if (!existingMember) {
        await supabase
          .from('group_members')
          .insert([{
            group_id: session.group_id,
            user_id: userId,
            status: 'accepted',
            joined_at: new Date().toISOString(),
          }]);
      }

      return session;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // ============================================================
  // WHO'S DOWN METHODS
  // ============================================================

  async setReadyToPlay(userId: string, ready: boolean): Promise<void> {
    try {
      const readyUntil = ready ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null;
      await supabase
        .from('profiles')
        .update({ ready_to_play: ready, ready_until: readyUntil })
        .eq('id', userId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getReadyFriends(userId: string): Promise<any[]> {
    try {
      const friends = await this.getFriends(userId);
      const now = new Date().toISOString();
      return friends.filter((f: any) => f.ready_to_play && f.ready_until && f.ready_until > now);
    } catch {
      return [];
    }
  }

  // ============================================================
  // HALL OF FAME METHODS
  // ============================================================

  async getSessionPhotos(sessionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('game_rounds')
        .select(`
          id, photo_url, status,
          task:game_tasks(title),
          player:profiles!game_rounds_selected_player_id_fkey(id, username, profile_picture)
        `)
        .eq('session_id', sessionId)
        .eq('status', 'completed')
        .not('photo_url', 'is', null);

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  async voteForPhoto(sessionId: string, roundId: string, voterId: string): Promise<void> {
    try {
      await supabase
        .from('hall_of_fame_votes')
        .upsert({
          session_id: sessionId,
          round_id: roundId,
          voter_id: voterId,
        }, { onConflict: 'session_id,voter_id' });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getGroupHallOfFame(groupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('hall_of_fame')
        .select(`
          *,
          player:profiles!hall_of_fame_player_id_fkey(id, username, profile_picture)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  // ============================================================
  // COSMETICS METHODS
  // ============================================================

  async getAllCosmetics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cosmetics')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  async getPlayerCosmetics(playerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('player_cosmetics')
        .select('*, cosmetic:cosmetics(*)')
        .eq('player_id', playerId);

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  async equipCosmetic(userId: string, cosmeticKey: string, type: string): Promise<void> {
    try {
      const updateField = type === 'frame' ? 'equipped_frame'
        : type === 'title' ? 'equipped_title'
        : 'profile_color';

      await supabase
        .from('profiles')
        .update({ [updateField]: cosmeticKey })
        .eq('id', userId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async unlockCosmetic(userId: string, cosmeticKey: string): Promise<void> {
    try {
      await supabase
        .from('player_cosmetics')
        .upsert({
          player_id: userId,
          cosmetic_key: cosmeticKey,
          unlocked_at: new Date().toISOString(),
        }, { onConflict: 'player_id,cosmetic_key' });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // ============================================================
  // CUSTOM TASKS METHODS
  // ============================================================

  async getCustomTasks(groupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('custom_tasks')
        .select(`
          *,
          creator:profiles!custom_tasks_created_by_fkey(username)
        `)
        .eq('group_id', groupId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  async createCustomTask(data: {
    groupId: string;
    createdBy: string;
    title: string;
    description: string;
    requiresPhoto?: boolean;
    requiresTimer?: boolean;
    intensity?: string;
  }): Promise<any> {
    try {
      const { data: task, error } = await supabase
        .from('custom_tasks')
        .insert([{
          group_id: data.groupId,
          created_by: data.createdBy,
          title: data.title,
          description: data.description,
          requires_photo: data.requiresPhoto || false,
          requires_timer: data.requiresTimer || false,
          intensity: data.intensity || 'wild',
        }])
        .select()
        .single();

      if (error) throw error;
      return task;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async deleteCustomTask(taskId: string): Promise<void> {
    try {
      await supabase
        .from('custom_tasks')
        .update({ active: false })
        .eq('id', taskId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // ============================================================
  // ACHIEVEMENT METHODS
  // ============================================================

  async getPlayerAchievements(playerId: string): Promise<any[]> {
    try {
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      const { data: playerProgress } = await supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', playerId);

      const progressMap = new Map((playerProgress || []).map((p: any) => [p.achievement_key, p]));

      return (allAchievements || []).map((a: any) => ({
        ...a,
        progress: progressMap.get(a.key)?.progress || 0,
        unlocked: progressMap.get(a.key)?.unlocked || false,
        unlocked_at: progressMap.get(a.key)?.unlocked_at,
      }));
    } catch {
      return [];
    }
  }

  async updateAchievementProgress(userId: string, key: string, increment: number = 1): Promise<void> {
    try {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('threshold')
        .eq('key', key)
        .single();

      if (!achievement) return;

      const { data: existing } = await supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', userId)
        .eq('achievement_key', key)
        .single();

      if (existing?.unlocked) return; // Already unlocked

      const newProgress = (existing?.progress || 0) + increment;
      const unlocked = newProgress >= achievement.threshold;

      await supabase
        .from('player_achievements')
        .upsert({
          player_id: userId,
          achievement_key: key,
          progress: newProgress,
          unlocked,
          unlocked_at: unlocked ? new Date().toISOString() : null,
        }, { onConflict: 'player_id,achievement_key' });

      // Create feed item when achievement is unlocked
      if (unlocked && !existing?.unlocked) {
        const { data: achInfo } = await supabase
          .from('achievements')
          .select('title, description')
          .eq('key', key)
          .single();
        if (achInfo) {
          await this.createFeedItem({
            userId,
            type: 'level_up',
            title: `Unlocked: ${achInfo.title}`,
            subtitle: achInfo.description,
          });
        }
      }
    } catch {
      // Non-critical
    }
  }

  // ============================================================
  // FEED METHODS
  // ============================================================

  // Get feed items for the user's friends
  async getFriendsFeed(userId: string, limit = 30, offset = 0): Promise<any[]> {
    try {
      const friends = await this.getFriends(userId);
      const friendIds = [userId, ...friends.map((f: any) => f.id)];

      const { data, error } = await supabase
        .from('feed_items')
        .select(`
          *,
          user:profiles!feed_items_user_id_fkey(id, username, name, profile_picture),
          group:groups(name),
          reactions(id, emoji, user_id)
        `)
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to load friends feed:', error);
      return [];
    }
  }

  // Get explore feed (all users, excluding friends)
  async getExploreFeed(userId: string, limit = 30, offset = 0): Promise<any[]> {
    try {
      const friends = await this.getFriends(userId);
      const excludeIds = [userId, ...friends.map((f: any) => f.id)];

      const { data, error } = await supabase
        .from('feed_items')
        .select(`
          *,
          user:profiles!feed_items_user_id_fkey(id, username, name, profile_picture),
          group:groups(name),
          reactions(id, emoji, user_id)
        `)
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to load explore feed:', error);
      return [];
    }
  }

  // Add a reaction to a feed item
  async addReaction(feedItemId: string, userId: string, emoji: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reactions')
        .upsert({
          feed_item_id: feedItemId,
          user_id: userId,
          emoji,
        }, { onConflict: 'feed_item_id,user_id' });

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to add reaction:', error);
      throw new Error(error.message);
    }
  }

  // Remove a reaction from a feed item
  async removeReaction(feedItemId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('feed_item_id', feedItemId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to remove reaction:', error);
      throw new Error(error.message);
    }
  }

  // Create a feed item (called after completing a task or earning a badge)
  async createFeedItem(data: {
    userId: string;
    type: string;
    title: string;
    subtitle?: string;
    photoUrl?: string;
    badgeName?: string;
    tierName?: string;
    groupId?: string;
    roundId?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('feed_items')
        .insert([{
          user_id: data.userId,
          type: data.type,
          title: data.title,
          subtitle: data.subtitle,
          photo_url: data.photoUrl,
          badge_name: data.badgeName,
          tier_name: data.tierName,
          group_id: data.groupId,
          round_id: data.roundId,
        }]);

      if (error) throw error;
    } catch {
      // Feed item creation is non-critical — don't throw
    }
  }
}

export const authService = new AuthService();
export default authService;
