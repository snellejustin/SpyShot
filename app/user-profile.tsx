import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatBadgeCount, getBadgeIcon, getBadgeProgress, getBadgeTier, getNextTierInfo } from '@/constants/badges';
import { BORDER_RADIUS, COLORS, COMMON_STYLES, SPACING, TYPOGRAPHY } from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { authService, UserProfile } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [badges, setBadges] = useState<any[]>([]);
    const [badgesLoading, setBadgesLoading] = useState(false);
    const [isFriend, setIsFriend] = useState(false);

    const loadFriends = useCallback(async () => {
        if (!userId) return;
        
        setFriendsLoading(true);
        try {
            const friendsList = await authService.getFriends(userId);
            setFriends(friendsList);
        } catch (error) {
            console.error('Failed to load friends:', error);
        } finally {
            setFriendsLoading(false);
        }
    }, [userId]);

    const loadBadges = useCallback(async () => {
        if (!userId) return;
        
        setBadgesLoading(true);
        try {
            const badgesList = await authService.getPlayerBadges(userId);
            setBadges(badgesList);
        } catch (error) {
            console.error('Failed to load badges:', error);
        } finally {
            setBadgesLoading(false);
        }
    }, [userId]);

    const toggleFriend = async () => {
        if (!userProfile || !user?.id) return;
        
        try {
            const newFriendStatus = !isFriend;
            
            if (newFriendStatus) {
                await authService.addFriend(user.id, userProfile.id);
            } else {
                await authService.removeFriend(user.id, userProfile.id);
            }
            
            setIsFriend(newFriendStatus);

            // Refresh friends list if they are now friends or no longer friends
            if (!newFriendStatus) {
                // If removing friend, clear the friends and badges lists since we can't see them anymore
                setFriends([]);
                setBadges([]);
            } else if (newFriendStatus && userId) {
                // If becoming friends, load their friends and badges lists
                loadFriends();
                loadBadges();
            }
             
            Alert.alert(
                'Success', 
                newFriendStatus ? 'Friend request sent!' : 'Friend removed'
            );
        } catch (error) {
            console.error('Failed to toggle friend status:', error);
            Alert.alert('Error', 'Failed to update friend status');
        }
    };

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                if (!userId || !user?.id) return;
                
                try {
                    // Fetch user profile
                    const profile = await authService.getOtherUserProfile(userId);
                    if (!profile) {
                        Alert.alert('Error', 'User not found');
                        router.back();
                        return;
                    }
                    
                    // Check if they are friends
                    const friendStatus = await authService.areFriends(user.id, userId);
                    setIsFriend(friendStatus);
                    setUserProfile(profile);
                    
                    // Load friends and badges if they are friends or viewing own profile
                    if (friendStatus || userId === user.id) {
                        loadFriends();
                        loadBadges();
                    }
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                    Alert.alert('Error', 'Failed to load user profile');
                }
            };
            
            fetchData();
        }, [userId, user?.id, loadFriends, loadBadges])
    );

    if (!userProfile) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <ThemedView style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>Profile</ThemedText>
                    <ThemedView style={styles.headerSpacer} />
                </ThemedView>
                <ThemedView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </ThemedView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            <ThemedView style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>@{userProfile.username}</ThemedText>
                <TouchableOpacity 
                    style={styles.friendActionButton}
                    onPress={toggleFriend}
                >
                    <Ionicons 
                        name={isFriend ? 'person-remove' : 'person-add'} 
                        size={20} 
                        color={isFriend ? COLORS.error : COLORS.primary} 
                    />
                </TouchableOpacity>
            </ThemedView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <ThemedView style={styles.profileHeader}>
                    <ThemedView style={styles.profilePictureContainer}>
                        {userProfile.profile_picture ? (
                            <Image source={{ uri: userProfile.profile_picture }} style={styles.profilePicture} />
                        ) : (
                            <ThemedView style={styles.profilePicturePlaceholder}>
                                <Ionicons name="person" size={80} color={COLORS.textMuted} />
                            </ThemedView>
                        )}
                    </ThemedView>

                    <ThemedView style={styles.profileInfo}>
                        <ThemedText style={styles.displayName}>{userProfile.name}</ThemedText>
                        <ThemedText style={styles.username}>@{userProfile.username}</ThemedText>
                        <ThemedText style={styles.displayBio}>
                            {userProfile.bio || 'No bio available'}
                        </ThemedText>
                    </ThemedView>

                    <TouchableOpacity 
                        style={[
                            styles.actionButton,
                            isFriend && styles.removeFriendButton
                        ]}
                        onPress={toggleFriend}
                    >
                        <Ionicons 
                            name={isFriend ? 'person-remove' : 'person-add'} 
                            size={20} 
                            color={COLORS.white} 
                            style={styles.buttonIcon}
                        />
                        <ThemedText style={styles.actionButtonText}>
                            {isFriend ? 'Remove Friend' : 'Add Friend'}
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                {/* Sections - Only visible when friends or own profile */}
                {(isFriend || userId === user?.id) && (
                    <>
                        {/* Badges Section */}
                        <ThemedView style={styles.section}>
                            <ThemedView style={styles.sectionHeader}>
                                <ThemedView style={styles.sectionTitleContainer}>
                                    <Ionicons name="trophy" size={20} color={COLORS.partyOrange} />
                                    <ThemedText style={styles.sectionTitle}>Badges</ThemedText>
                                </ThemedView>
                            </ThemedView>
                            <ThemedView style={styles.sectionContent}>
                                {badgesLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
                                ) : badges.length > 0 ? (
                                    <ThemedView style={styles.badgeGrid}>
                                        {badges.slice(0, 3).map((badge, index) => {
                                            const completionCount = badge.completion_count || badge.photos?.length || 1;
                                            const tier = getBadgeTier(completionCount);
                                            const progress = getBadgeProgress(completionCount, tier);
                                            const nextTierInfo = getNextTierInfo(completionCount);
                                            
                                            return (
                                                <ThemedView 
                                                    key={index} 
                                                    style={[
                                                        styles.badgeItem,
                                                        { borderColor: tier.borderColor, borderWidth: 2 }
                                                    ]}
                                                >
                                                    <ThemedView style={[styles.badgeIcon, { backgroundColor: tier.color }]}>
                                                        <Ionicons 
                                                            name={getBadgeIcon(badge.badge_name) as any} 
                                                            size={24} 
                                                            color={tier.textColor} 
                                                        />
                                                        {badge.is_favorite && (
                                                            <ThemedView style={styles.favoriteIndicator}>
                                                                <Ionicons name="star" size={10} color="#FFD700" />
                                                            </ThemedView>
                                                        )}
                                                    </ThemedView>
                                                    
                                                    <ThemedText 
                                                        style={[styles.badgeName, { color: tier.name === 'Locked' ? tier.textColor : COLORS.text }]}
                                                        numberOfLines={1}
                                                    >
                                                        {badge.badge_name}
                                                    </ThemedText>
                                                    
                                                    <ThemedView style={styles.badgeTierInfo}>
                                                        <ThemedText style={[styles.badgeTier, { color: tier.color }]}>
                                                            {tier.name}
                                                        </ThemedText>
                                                        <ThemedText style={styles.badgeCount}>
                                                            {formatBadgeCount(completionCount)}
                                                        </ThemedText>
                                                    </ThemedView>
                                                    
                                                    {/* Progress Bar */}
                                                    <ThemedView style={styles.progressBarContainer}>
                                                        <ThemedView style={[styles.progressBarBackground, { backgroundColor: tier.borderColor + '30' }]}>
                                                            <ThemedView 
                                                                style={[
                                                                    styles.progressBarFill, 
                                                                    { 
                                                                        width: `${progress * 100}%`, 
                                                                        backgroundColor: tier.progressColor 
                                                                    }
                                                                ]} 
                                                            />
                                                        </ThemedView>
                                                        {nextTierInfo.nextTier && (
                                                            <ThemedText style={styles.nextTierText}>
                                                                {nextTierInfo.completionsNeeded} to {nextTierInfo.nextTier.name}
                                                            </ThemedText>
                                                        )}
                                                    </ThemedView>
                                                </ThemedView>
                                            );
                                        })}
                                    </ThemedView>
                                ) : (
                                    <ThemedText style={styles.placeholderText}>No badges earned yet</ThemedText>
                                )}
                            </ThemedView>
                        </ThemedView>

                        {/* Friends Section */}
                        <ThemedView style={styles.section}>
                            <ThemedView style={styles.sectionHeader}>
                                <ThemedView style={styles.sectionTitleContainer}>
                                    <Ionicons name="person-add" size={20} color={COLORS.partyPink} />
                                    <ThemedText style={styles.sectionTitle}>Friends ({friends.length})</ThemedText>
                                </ThemedView>
                            </ThemedView>
                            <ThemedView style={styles.sectionContent}>
                                {friendsLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
                                ) : friends.length === 0 ? (
                                    <ThemedView style={styles.emptyFriendsContainer}>
                                        <Ionicons name="people" size={48} color={COLORS.textMuted} />
                                        <ThemedText style={styles.placeholderText}>No friends yet</ThemedText>
                                        <ThemedText style={styles.emptySubtext}>
                                            Find friends to see them here
                                        </ThemedText>
                                    </ThemedView>
                                ) : (
                                    <ThemedView style={styles.friendsGrid}>
                                        {friends.slice(0, 6).map((friend) => (
                                            <TouchableOpacity
                                                key={friend.id}
                                                style={styles.friendItem}
                                                onPress={() => router.push(`/user-profile?userId=${friend.id}`)}
                                            >
                                                {friend.profile_picture ? (
                                                    <Image
                                                        source={{ uri: friend.profile_picture }}
                                                        style={styles.friendProfilePicture}
                                                    />
                                                ) : (
                                                    <ThemedView style={styles.friendProfilePlaceholder}>
                                                        <Ionicons name="person" size={20} color={COLORS.textMuted} />
                                                    </ThemedView>
                                                )}
                                                <ThemedText style={styles.friendName} numberOfLines={1}>
                                                    @{friend.username}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </ThemedView>
                                )}
                            </ThemedView>
                        </ThemedView>
                    </>
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.sm,
    },
    backButton: {
        padding: SPACING.sm,
        marginLeft: -SPACING.sm,
    },
    title: {
        ...COMMON_STYLES.title,
        marginBottom: 0,
        marginTop: 0,
    },
    headerSpacer: {
        width: 44, // Same width as back button
    },
    friendActionButton: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        marginBottom: SPACING.lg,
    },
    profilePictureContainer: {
        marginBottom: SPACING.lg,
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: BORDER_RADIUS.full,
    },
    profilePicturePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    displayName: {
        fontSize: TYPOGRAPHY.xl,
        fontWeight: TYPOGRAPHY.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    username: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.primary,
        marginBottom: SPACING.sm,
    },
    displayBio: {
        fontSize: TYPOGRAPHY.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: SPACING.lg,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
    },
    removeFriendButton: {
        backgroundColor: COLORS.error,
    },
    buttonIcon: {
        marginRight: SPACING.sm,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
    },
    section: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    sectionHeader: {
        backgroundColor: COLORS.surface,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginBottom: SPACING.sm,
    },
    sectionTitleContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    sectionContent: {
        minHeight: 40,
        backgroundColor: COLORS.surface,
    },
    placeholderText: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    badgeItem: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
        width: '30%',
        flex: 1,
        maxWidth: 110,
    },
    badgeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.partyOrange + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
        position: 'relative',
    },
    favoriteIndicator: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgeName: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: TYPOGRAPHY.medium,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 1,
    },
    badgeTierInfo: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 2,
        backgroundColor: COLORS.surface,
    },
    badgeTier: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: TYPOGRAPHY.bold,
        textTransform: 'uppercase',
        backgroundColor: COLORS.surface,
    },
    badgeCount: {
        fontSize: TYPOGRAPHY.xs - 1,
        color: COLORS.textMuted,
        backgroundColor: COLORS.surface,
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: SPACING.xs,
        backgroundColor: COLORS.surface,
    },
    progressBarBackground: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: COLORS.surface,
    },
    nextTierText: {
        fontSize: TYPOGRAPHY.xs - 2,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 2,
        backgroundColor: COLORS.surface,
    },
    emptyFriendsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xl,
    },
    emptySubtext: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    friendsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    friendItem: {
        alignItems: 'center',
        width: 80,
    },
    friendProfilePicture: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: SPACING.xs,
    },
    friendProfilePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    friendName: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.text,
        textAlign: 'center',
    },
});
