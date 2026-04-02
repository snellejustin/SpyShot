import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/design';
import { useAuth } from '../contexts/AuthContext';
import { authService, UserProfile } from '../services/authService';

export default function FriendsListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    try {
      const friendsList = await authService.getFriends(user.id);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user, loadFriends]);

  const renderFriend = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => router.push(`/user-profile?userId=${item.id}`)}
    >
      <View style={styles.friendInfo}>
        {item.profile_picture ? (
          <Image
            source={{ uri: item.profile_picture }}
            style={styles.profilePicture}
          />
        ) : (
          <View style={styles.defaultProfilePicture}>
            <Ionicons name="person" size={24} color={COLORS.textSecondary} />
          </View>
        )}
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>@{item.username}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const headerStyle = [styles.header, { paddingTop: insets.top + SPACING.md }];

  return (
    <View style={styles.container}>
      <View style={headerStyle}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {loading ? 'Friends' : `Friends (${friends.length})`}
        </Text>
        <TouchableOpacity style={styles.leaderboardButton} onPress={() => router.push('/leaderboard')}>
          <Ionicons name="trophy-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="people" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>Add friends to see them here</Text>
          <TouchableOpacity 
            style={styles.addFriendsButton}
            onPress={() => router.push('/search-users')}
          >
            <Text style={styles.addFriendsButtonText}>Find Friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFriends();
              }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    bottom: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  leaderboardButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    padding: SPACING.xs,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  addFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  addFriendsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: SPACING.md,
  },
  friendItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  defaultProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
