import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

interface GroupInvitation {
    id: string;
    name: string;
    description: string;
    type: string;
    creator: {
        name: string;
        username: string;
    };
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshNotificationCount, refreshUserData } = useAuth();
  const [friendRequests, setFriendRequests] = useState<UserProfile[]>([]);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const [friendRequestsData, groupInvitationsData] = await Promise.all([
        authService.getPendingFriendRequests(user.id),
        authService.getPendingGroupInvitations(user.id)
      ]);
      
      setFriendRequests(friendRequestsData);
      setGroupInvitations(groupInvitationsData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;

    try {
      await authService.acceptFriendRequest(user.id, requesterId);
      Alert.alert('Success', 'Friend request accepted!');
      loadNotifications();
      refreshNotificationCount(); // Update the badge count
      refreshUserData(); // Trigger any other refreshes needed
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!user) return;

    try {
      await authService.declineFriendRequest(user.id, requesterId);
      Alert.alert('Success', 'Friend request declined');
      loadNotifications();
      refreshNotificationCount(); // Update the badge count
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
      console.error('Failed to decline friend request:', error);
    }
  };

  const handleAcceptGroupInvitation = async (groupId: string) => {
    if (!user) return;

    try {
      await authService.acceptGroupInvitation(groupId, user.id);
      Alert.alert('Success', 'Group invitation accepted!');
      loadNotifications();
      refreshNotificationCount(); // Update the badge count
    } catch (error) {
      Alert.alert('Error', 'Failed to accept group invitation');
      console.error('Failed to accept group invitation:', error);
    }
  };

  const handleDeclineGroupInvitation = async (groupId: string) => {
    if (!user) return;

    try {
      await authService.declineGroupInvitation(groupId, user.id);
      Alert.alert('Success', 'Group invitation declined');
      loadNotifications();
      refreshNotificationCount(); // Update the badge count
    } catch (error) {
      Alert.alert('Error', 'Failed to decline group invitation');
      console.error('Failed to decline group invitation:', error);
    }
  };

  const getGroupTypeDetails = (type: string) => {
    switch (type) {
      case 'cafe':
        return { icon: 'cafe' as const, color: COLORS.partyPurple, label: 'Cafe' };
      case 'home':
        return { icon: 'home' as const, color: COLORS.partyOrange, label: 'Home' };
      default:
        return { icon: 'people' as const, color: COLORS.primary, label: 'Group' };
    }
  };

  const renderFriendRequest = ({ item }: { item: UserProfile }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <TouchableOpacity
          style={styles.profilePictureContainer}
          onPress={() => router.push(`/user-profile?userId=${item.id}`)}
        >
          {item.profile_picture ? (
            <Image
              source={{ uri: item.profile_picture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.defaultProfilePicture}>
              <Ionicons name="person" size={32} color={COLORS.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>@{item.username}</Text>
          <Text style={styles.requestText}>wants to be your friend</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGroupInvitation = ({ item }: { item: GroupInvitation }) => {
    const typeDetails = getGroupTypeDetails(item.type);
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.userInfo}>
          <View style={[styles.groupIconContainer, { backgroundColor: typeDetails.color }]}>
            <Ionicons name={typeDetails.icon} size={24} color={COLORS.white} />
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.groupType}>{typeDetails.label}</Text>
            <Text style={styles.requestText}>
              @{item.creator.username} invited you to join
            </Text>
            {item.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptGroupInvitation(item.id)}
          >
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineGroupInvitation(item.id)}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const headerStyle = [styles.header, { paddingTop: insets.top + SPACING.md }];

  return (
    <View style={styles.container}>
      <View style={headerStyle}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : friendRequests.length === 0 && groupInvitations.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="notifications-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>All caught up!</Text>
          <Text style={styles.emptySubtext}>Friend requests and group invitations will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...groupInvitations.map(item => ({ ...item, notificationType: 'group' as const })),
            ...friendRequests.map(item => ({ ...item, notificationType: 'friend' as const }))
          ]}
          renderItem={({ item }) => {
            if (item.notificationType === 'group') {
              return renderGroupInvitation({ item: item as GroupInvitation });
            } else {
              return renderFriendRequest({ item: item as UserProfile });
            }
          }}
          keyExtractor={(item) => `${item.notificationType}-${item.id}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
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
    textAlign: 'center',
  },
  listContainer: {
    padding: SPACING.md,
  },
  requestItem: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePictureContainer: {
    marginRight: SPACING.md,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  requestText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.partyGreen, // Use forest green for accept
  },
  declineButton: {
    backgroundColor: COLORS.error, // Use error red for decline
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  groupType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
