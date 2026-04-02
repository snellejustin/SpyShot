import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatBadgeCount, getBadgeIcon, getBadgeProgress, getBadgeTier, getNextTierInfo } from '@/constants/badges';
import { BORDER_RADIUS, COLORS, COMMON_STYLES, SPACING, TYPOGRAPHY } from '@/constants/design';
import { validateName, validateUsername } from '@/constants/validation';
import { useAuth } from '@/contexts/AuthContext';
import { authService, UserProfile } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Group {
    id: string;
    name: string;
    description: string;
    type: string;
    mode: 'classic' | 'party';
    creator_id: string;
    created_at: string;
    creator: {
        name: string;
        username: string;
    };
}

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, userProfile, updateProfile, uploadProfilePicture, logout, createProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [badges, setBadges] = useState<any[]>([]);
    const [badgesLoading, setBadgesLoading] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [favoriteBadge, setFavoriteBadge] = useState<any>(null);
    const [tempProfile, setTempProfile] = useState({
        name: userProfile?.name || '',
        username: userProfile?.username || '',
        bio: userProfile?.bio || '',
    });

    const getGroupTypeDetails = (type: string) => {
        switch (type) {
            case 'cafe':
                return {
                    icon: 'cafe' as const,
                    color: COLORS.partyPurple,
                    label: 'Cafe'
                };
            case 'home':
                return {
                    icon: 'home' as const,
                    color: COLORS.partyOrange,
                    label: 'Home'
                };
            default:
                return {
                    icon: 'people' as const,
                    color: COLORS.primary,
                    label: 'Group'
                };
        }
    };

    const loadFriends = useCallback(async () => {
        if (!user?.id) return;
        
        setFriendsLoading(true);
        try {
            const friendsList = await authService.getFriends(user.id);
            setFriends(friendsList);
        } catch (error) {
            console.error('Failed to load friends:', error);
        } finally {
            setFriendsLoading(false);
        }
    }, [user?.id]);

    const loadGroups = useCallback(async () => {
        if (!user?.id) return;
        
        setGroupsLoading(true);
        try {
            const groupsList = await authService.getUserGroups(user.id);
            setGroups(groupsList);
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setGroupsLoading(false);
        }
    }, [user?.id]);

    const loadBadges = useCallback(async () => {
        if (!user?.id) return;
        
        setBadgesLoading(true);
        try {
            const badgesList = await authService.getPlayerBadges(user.id);
            setBadges(badgesList);
            
            // Find favorite badge from the loaded badges list
            const favorite = badgesList.find(badge => badge.is_favorite);
            // Only update favorite badge if we don't have one set, or if the new one is different
            // Set favorite badge from the badges list
            setFavoriteBadge(favorite || null);
        } catch (error) {
            console.error('Failed to load badges:', error);
        } finally {
            setBadgesLoading(false);
        }
    }, [user?.id]);

    const handleFavoriteBadge = async (badge: any) => {
        if (!user?.id) return;
        
        // Immediately update UI for better UX
        setSelectedBadge((prev: any) => ({ ...prev, is_favorite: !badge.is_favorite }));
        
        if (badge.is_favorite) {
            setFavoriteBadge(null);
        } else {
            setFavoriteBadge(badge); // Use the original badge with correct completion count
        }
        
        try {
            if (badge.is_favorite) {
                await authService.removeFavoriteBadge(user.id);
            } else {
                await authService.setFavoriteBadge(user.id, badge.id);
            }
        } catch (error) {
            console.error('Failed to update favorite badge:', error);
            Alert.alert('Error', 'Failed to update favorite badge');
            // Revert on error
            setSelectedBadge((prev: any) => ({ ...prev, is_favorite: badge.is_favorite }));
            if (badge.is_favorite) {
                setFavoriteBadge(badge);
            } else {
                setFavoriteBadge(null);
            }
        }
    };

    const handleBadgePress = (badge: any) => {
        if (badge.photo_url || badge.timer_seconds || (badge.photos && badge.photos.length > 0)) {
            setSelectedBadge(badge);
            setPhotoModalVisible(true);
        }
    };

    useEffect(() => {
        if (user?.id && userProfile) {
            loadFriends();
            loadGroups();
            loadBadges();
        }
    }, [user?.id, userProfile, loadFriends, loadGroups, loadBadges]);

    // Auto-refresh friends and groups when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user?.id && userProfile) {
                loadFriends();
                loadGroups();
                loadBadges();
            }
        }, [user?.id, userProfile, loadFriends, loadGroups, loadBadges])
    );

    if (!userProfile) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
                <ThemedText style={styles.createTitle}>Create Your Profile</ThemedText>
                <ThemedText style={styles.createSubtitle}>
                    Welcome! Let&apos;s set up your profile.
                </ThemedText>
                
                <TouchableOpacity
                    style={styles.createProfileButton}
                    onPress={async () => {
                        try {
                            await createProfile();
                            Alert.alert('Success', 'Profile created successfully!');
                        } catch (error) {
                            console.error('Failed to create profile:', error);
                            Alert.alert('Error', 'Failed to create profile. Please try again.');
                        }
                    }}
                >
                    <ThemedText style={styles.createProfileButtonText}>Create Profile</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.createProfileButton, { backgroundColor: COLORS.error, marginTop: SPACING.md }]}
                    onPress={async () => {
                        try {
                            await logout();
                            router.replace('/login');
                        } catch {
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    }}
                >
                    <ThemedText style={styles.createProfileButtonText}>Logout</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    const saveProfile = async () => {
        const nameError = validateName(tempProfile.name);
        if (nameError) {
            Alert.alert('Invalid Name', nameError);
            return;
        }

        const usernameError = validateUsername(tempProfile.username);
        if (usernameError) {
            Alert.alert('Invalid Username', usernameError);
            return;
        }

        try {
            await updateProfile({
                name: tempProfile.name.trim(),
                username: tempProfile.username.trim(),
                bio: tempProfile.bio.trim(),
            });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            saveProfile();
        } else {
            setTempProfile({
                name: userProfile.name,
                username: userProfile.username,
                bio: userProfile.bio,
            });
            setIsEditing(true);
        }
    };

    const handleProfilePicturePress = () => {
        if (!isEditing) return;

        Alert.alert(
            'Profile Picture',
            'Choose an option',
            [
                { text: 'Camera', onPress: () => openImagePicker('camera') },
                { text: 'Photo Library', onPress: () => openImagePicker('library') },
                { text: 'Remove Photo', onPress: removeProfilePicture, style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const openImagePicker = async (source: 'camera' | 'library') => {
        try {
            // Request permissions
            const { status } = source === 'camera' 
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Required', `Please grant ${source} permissions to continue`);
                return;
            }

            // Launch image picker
            const pickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1] as [number, number],
                quality: 0.75,    // 75% quality is visually indistinguishable and ~30% smaller
                exif: false,
            };
            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync(pickerOptions)
                : await ImagePicker.launchImageLibraryAsync(pickerOptions);

            if (!result.canceled && result.assets[0]) {
                try {
                    await uploadProfilePicture(result.assets[0].uri);
                    Alert.alert('Success', 'Profile picture updated!');
                } catch (uploadError) {
                    console.error('Upload failed:', uploadError);
                    Alert.alert('Error', `Failed to upload: ${uploadError}`);
                }
            }
        } catch (error) {
            console.error('Error opening image picker:', error);
            Alert.alert('Error', 'Failed to update profile picture');
        }
    };

    const removeProfilePicture = async () => {
        try {
            await updateProfile({ profile_picture: null });
            Alert.alert('Success', 'Profile picture removed');
        } catch (error) {
            console.error('Error removing profile picture:', error);
            Alert.alert('Error', 'Failed to remove profile picture');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Sign Out', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/login');
                        } catch {
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    }
                },
            ]
        );
    };

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
            {/* Header with Title, Edit Button and Logout Button */}
            <ThemedView style={styles.header}>
                <ThemedText style={styles.title}>Profile</ThemedText>
                <ThemedView style={styles.headerButtons}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleEditToggle}>
                        <Ionicons 
                            name={isEditing ? 'checkmark' : 'pencil'} 
                            size={20} 
                            color={COLORS.surface} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/leaderboard')}>
                        <Ionicons name="trophy-outline" size={20} color={COLORS.surface} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerLogoutButton} onPress={() => router.push('/settings')}>
                        <Ionicons name="settings-outline" size={20} color={COLORS.surface} />
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>
            
            {/* Profile Picture with Favorite Badge */}
            <ThemedView style={styles.profilePictureWrapper}>
                <TouchableOpacity 
                    style={[
                        styles.profilePictureContainer,
                        isEditing && styles.profilePictureEditable
                    ]}
                    onPress={handleProfilePicturePress}
                    disabled={!isEditing}
                    activeOpacity={isEditing ? 0.7 : 1}
                >
                    {userProfile.profile_picture ? (
                        <Image source={{ uri: userProfile.profile_picture }} style={styles.profilePicture} />
                    ) : (
                        <ThemedView style={styles.profilePicturePlaceholder}>
                            <Ionicons name="person" size={60} color={COLORS.textMuted} />
                        </ThemedView>
                    )}
                    {isEditing && (
                        <ThemedView style={styles.editIcon}>
                            <Ionicons name="camera" size={20} color={COLORS.white} />
                        </ThemedView>
                    )}

                    {/* Favorite Badge - Bottom Right of Profile Picture */}
                    {favoriteBadge && !isEditing && (
                        <ThemedView style={styles.profileFavoriteBadge}>
                            <ThemedView style={[styles.profileBadgeIcon, { backgroundColor: getBadgeTier(favoriteBadge.completion_count || 1).color }]}>
                                <Ionicons 
                                    name={getBadgeIcon(favoriteBadge.badge_name) as any} 
                                    size={20} 
                                    color={getBadgeTier(favoriteBadge.completion_count || 1).textColor} 
                                />
                                <ThemedView style={styles.profileBadgeStarIndicator}>
                                    <Ionicons name="star" size={8} color="#FFD700" />
                                </ThemedView>
                            </ThemedView>
                        </ThemedView>
                    )}
                </TouchableOpacity>

                {/* Badge Details Below Profile Picture */}
                {favoriteBadge && !isEditing && (
                    <ThemedView style={styles.favoriteBadgeDetails}>
                        <ThemedText style={styles.favoriteBadgeText} numberOfLines={1}>
                            {favoriteBadge.badge_name}
                        </ThemedText>
                        <ThemedText style={[styles.favoriteBadgeTier, { color: getBadgeTier(favoriteBadge.completion_count || 1).color }]}>
                            {getBadgeTier(favoriteBadge.completion_count || 1).name} • {formatBadgeCount(favoriteBadge.completion_count || 1)}
                        </ThemedText>
                    </ThemedView>
                )}
            </ThemedView>

            {/* User Info */}
            <ThemedView style={styles.userInfo}>
                <ThemedText style={styles.username}>@{userProfile.username}</ThemedText>
            </ThemedView>

            {/* Name, Username and Bio Display */}
            <ThemedView style={styles.profileInfo}>
                {isEditing ? (
                    <>
                        <ThemedView style={styles.field}>
                            <ThemedText style={styles.label}>Name</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={tempProfile.name}
                                onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
                                placeholder="Enter your name"
                                placeholderTextColor={COLORS.textMuted}
                                maxLength={50}
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </ThemedView>

                        <ThemedView style={styles.field}>
                            <ThemedText style={styles.label}>Username</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={tempProfile.username}
                                onChangeText={(text) => setTempProfile({ ...tempProfile, username: text })}
                                placeholder="Enter your username"
                                placeholderTextColor={COLORS.textMuted}
                                maxLength={20}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </ThemedView>

                        <ThemedView style={styles.field}>
                            <ThemedText style={styles.label}>Bio</ThemedText>
                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={tempProfile.bio}
                                onChangeText={(text) => setTempProfile({ ...tempProfile, bio: text })}
                                placeholder="Tell us about yourself"
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                                maxLength={200}
                                autoCorrect={true}
                                returnKeyType="done"
                            />
                        </ThemedView>
                    </>
                ) : (
                    <ThemedText style={styles.displayBio}>
                        {userProfile.bio || 'Add a bio to tell others about yourself'}
                    </ThemedText>
                )}
            </ThemedView>

            {/* Sections - Only visible when not editing */}
            {!isEditing && (
                <>
                    {/* Badges Section */}
                    <ThemedView style={styles.section}>
                        <ThemedView style={styles.sectionHeader}>
                            <ThemedView style={styles.sectionTitleContainer}>
                                <Ionicons name="trophy" size={20} color={COLORS.partyOrange} />
                                <ThemedText style={styles.sectionTitle}>Badges</ThemedText>
                            </ThemedView>
                            <TouchableOpacity 
                                style={styles.seeAllHeaderButton}
                                onPress={() => router.push('/badges-list')}
                            >
                                <ThemedText style={styles.seeAllHeaderText}>See All</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                        <ThemedView style={styles.sectionContent}>
                            {badgesLoading ? (
                                <ThemedText style={styles.placeholderText}>Loading badges...</ThemedText>
                            ) : badges.length > 0 ? (
                                <>
                                    <ThemedView style={styles.badgeGrid}>
                                        {badges.slice(0, 3).map((badge, index) => {
                                            const completionCount = badge.completion_count || badge.photos?.length || 1;
                                            const tier = getBadgeTier(completionCount);
                                            const progress = getBadgeProgress(completionCount, tier);
                                            const nextTierInfo = getNextTierInfo(completionCount);
                                            
                                            return (
                                                <TouchableOpacity 
                                                    key={index} 
                                                    style={[
                                                        styles.badgeItem,
                                                        { borderColor: tier.borderColor, borderWidth: 2 },
                                                        (badge.photo_url || badge.timer_seconds || (badge.photos && badge.photos.length > 0)) && styles.clickableBadge
                                                    ]}
                                                    onPress={() => handleBadgePress(badge)}
                                                    disabled={!badge.photo_url && !badge.timer_seconds && (!badge.photos || badge.photos.length === 0)}
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
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ThemedView>
                                </>
                            ) : (
                                <ThemedText style={styles.placeholderText}>No badges earned yet</ThemedText>
                            )}
                        </ThemedView>
                    </ThemedView>

                    {/* Groups Section */}
                    <ThemedView style={styles.section}>
                        <ThemedView style={styles.sectionHeader}>
                            <ThemedView style={styles.sectionTitleContainer}>
                                <Ionicons name="people" size={20} color={COLORS.partyOrange} />
                                <ThemedText style={styles.sectionTitle}>Groups ({groups.length})</ThemedText>
                            </ThemedView>
                            {groups.length > 0 && (
                                <TouchableOpacity 
                                    style={styles.seeAllHeaderButton}
                                    onPress={() => router.push('/(tabs)/groups')}
                                >
                                    <ThemedText style={styles.seeAllHeaderText}>See All</ThemedText>
                                </TouchableOpacity>
                            )}
                        </ThemedView>
                        <ThemedView style={styles.sectionContent}>
                            {groupsLoading ? (
                                <ThemedText style={styles.placeholderText}>Loading groups...</ThemedText>
                            ) : groups.length === 0 ? (
                                <ThemedView style={styles.emptyFriendsContainer}>
                                    <Ionicons name="people" size={48} color={COLORS.textMuted} />
                                    <ThemedText style={styles.placeholderText}>No groups yet</ThemedText>
                                    <ThemedText style={styles.emptySubtext}>
                                        Create a group from the home screen
                                    </ThemedText>
                                </ThemedView>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.groupsPreview}
                                    onPress={() => {
                                        if (groups.length === 1) {
                                            router.push(`/group-detail?groupId=${groups[0].id}`);
                                        } else {
                                            router.push('/(tabs)/groups');
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <ThemedView style={styles.groupsRow}>
                                        {groups.slice(0, 4).map((group, index) => {
                                            const typeDetails = getGroupTypeDetails(group.type);
                                            
                                            return (
                                                <ThemedView 
                                                    key={group.id} 
                                                    style={[
                                                        styles.groupCircle, 
                                                        { backgroundColor: typeDetails.color },
                                                        index > 0 && { marginLeft: -8 } // Overlap circles
                                                    ]}
                                                >
                                                    <Ionicons name={typeDetails.icon} size={16} color={COLORS.white} />
                                                    {/* Mode indicator dot */}
                                                    <ThemedView style={[
                                                        styles.modeIndicator,
                                                        group.mode === 'party' ? styles.partyIndicator : styles.classicIndicator
                                                    ]}>
                                                        <Ionicons 
                                                            name={group.mode === 'party' ? 'musical-note' : 'person'} 
                                                            size={6} 
                                                            color={COLORS.white} 
                                                        />
                                                    </ThemedView>
                                                </ThemedView>
                                            );
                                        })}
                                        {groups.length > 4 && (
                                            <ThemedView style={[styles.groupCircle, styles.moreGroupsCircle]}>
                                                <ThemedText style={styles.moreGroupsText}>+{groups.length - 4}</ThemedText>
                                            </ThemedView>
                                        )}
                                    </ThemedView>
                                    
                                    <ThemedView style={styles.groupsPreviewInfo}>
                                        <ThemedText style={styles.groupsPreviewTitle}>
                                            {groups.length === 1 ? groups[0].name : `${groups.length} active groups`}
                                        </ThemedText>
                                        <ThemedView style={styles.groupsPreviewSubtitle}>
                                            <ThemedText style={styles.groupsPreviewTypes}>
                                                {Array.from(new Set(groups.map(g => getGroupTypeDetails(g.type).label)))
                                                    .slice(0, 2)
                                                    .join(', ')}
                                                {groups.length > 2 && groups.map(g => getGroupTypeDetails(g.type).label).length > 2 && ' +more'}
                                            </ThemedText>
                                            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                                        </ThemedView>
                                    </ThemedView>
                                </TouchableOpacity>
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
                            <ThemedView style={styles.headerActions}>
                                {friends.length > 6 && (
                                    <TouchableOpacity 
                                        style={styles.seeAllHeaderButton}
                                        onPress={() => router.push('/friends-list')}
                                    >
                                        <ThemedText style={styles.seeAllHeaderText}>See All</ThemedText>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    style={styles.addButton}
                                    onPress={() => router.push('/search-users')}
                                >
                                    <Ionicons name="add" size={16} color={COLORS.surface} />
                                </TouchableOpacity>
                            </ThemedView>
                        </ThemedView>
                        <ThemedView style={styles.sectionContent}>
                            {friendsLoading ? (
                                <ThemedText style={styles.placeholderText}>Loading friends...</ThemedText>
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

            {/* Photo Modal */}
            <Modal
                visible={photoModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPhotoModalVisible(false)}
            >
                <ThemedView style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setPhotoModalVisible(false)}
                    />
                    <ThemedView style={styles.modalContent}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setPhotoModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        
                        {selectedBadge && (
                            <>
                                <ThemedView style={styles.modalHeader}>
                                    <ThemedView style={styles.modalBadgeIcon}>
                                        <Ionicons 
                                            name={getBadgeIcon(selectedBadge.badge_name) as any} 
                                            size={32} 
                                            color={COLORS.partyOrange} 
                                        />
                                    </ThemedView>
                                    <ThemedText style={styles.modalBadgeName}>{selectedBadge.badge_name}</ThemedText>
                                    <ThemedText style={styles.modalBadgeDate}>
                                        Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                                    </ThemedText>
                                    
                                    {selectedBadge.photos && selectedBadge.photos.length > 0 && (
                                        <ThemedText style={styles.photoCount}>
                                            {selectedBadge.photos.length} photo{selectedBadge.photos.length > 1 ? 's' : ''} collected
                                        </ThemedText>
                                    )}

                                    <TouchableOpacity 
                                        style={[styles.favoriteButton, selectedBadge.is_favorite && styles.favoriteButtonActive]}
                                        onPress={() => handleFavoriteBadge(selectedBadge)}
                                    >
                                        <Ionicons 
                                            name={selectedBadge.is_favorite ? "star" : "star-outline"} 
                                            size={20} 
                                            color={selectedBadge.is_favorite ? "#FFD700" : COLORS.textMuted} 
                                        />
                                        <ThemedText style={[styles.favoriteButtonText, selectedBadge.is_favorite && styles.favoriteButtonTextActive]}>
                                            {selectedBadge.is_favorite ? "Remove Favorite" : "Set as Favorite"}
                                        </ThemedText>
                                    </TouchableOpacity>

                                </ThemedView>
                                
                                <ScrollView 
                                    style={styles.photosContainer} 
                                    contentContainerStyle={styles.photosContentContainer}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {selectedBadge.photos && selectedBadge.photos.length > 0 ? (
                                        selectedBadge.photos.map((photoData: any, index: number) => (
                                            <ThemedView key={index} style={styles.photoItem}>
                                                {photoData.photo_url && (
                                                    <Image 
                                                        source={{ uri: photoData.photo_url }} 
                                                        style={styles.modalPhoto}
                                                        resizeMode="cover"
                                                    />
                                                )}
                                                <ThemedView style={styles.photoMetadata}>
                                                    <ThemedText style={styles.photoDate}>
                                                        {new Date(photoData.taken_at).toLocaleDateString()}
                                                    </ThemedText>
                                                    {photoData.timer_seconds && (
                                                        <ThemedView style={styles.timerInfo}>
                                                            <Ionicons name="timer" size={14} color={COLORS.partyGreen} />
                                                            <ThemedText style={styles.timerText}>
                                                                {(photoData.timer_seconds / 1000).toFixed(3)}s
                                                            </ThemedText>
                                                        </ThemedView>
                                                    )}
                                                </ThemedView>
                                            </ThemedView>
                                        ))
                                    ) : (selectedBadge.photo_url || selectedBadge.timer_seconds) && (
                                        <ThemedView style={styles.photoItem}>
                                            {selectedBadge.photo_url && (
                                                <Image 
                                                    source={{ uri: selectedBadge.photo_url }} 
                                                    style={styles.modalPhoto}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <ThemedView style={styles.photoMetadata}>
                                                <ThemedText style={styles.photoDate}>
                                                    {new Date(selectedBadge.earned_at).toLocaleDateString()}
                                                </ThemedText>
                                                {selectedBadge.timer_seconds && (
                                                    <ThemedView style={styles.timerInfo}>
                                                        <Ionicons name="timer" size={14} color={COLORS.partyGreen} />
                                                        <ThemedText style={styles.timerText}>
                                                            {(selectedBadge.timer_seconds / 1000).toFixed(3)}s
                                                        </ThemedText>
                                                    </ThemedView>
                                                )}
                                            </ThemedView>
                                        </ThemedView>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </ThemedView>
                </ThemedView>
            </Modal>
        </ThemedView>
    
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
    },
    header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        width: '100%',
        marginBottom: SPACING.lg,
    },
    title: {
        ...COMMON_STYLES.title,
        marginBottom: 0,
        marginTop: 0,
    },
    headerEditButton: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerButtons: {
        flexDirection: 'row' as const,
        gap: SPACING.sm,
    },
    headerButton: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.partyBlue, // Use party blue for edit button
        borderWidth: 1,
        borderColor: COLORS.partyBlue,
    },
    headerLogoutButton: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.partyPink, // Use party pink for logout button
        borderWidth: 1,
        borderColor: COLORS.partyPink,
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        alignItems: 'center' as const,
        paddingBottom: SPACING.xl,
    },
    profilePictureContainer: {
        position: 'relative' as const,
        marginBottom: SPACING.lg,
        marginTop: SPACING.lg,
    },
    profilePictureEditable: {
        opacity: 0.8,
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
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    editIcon: {
        position: 'absolute' as const,
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.partyBlue, // Use party blue for edit icon
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    userInfo: {
        alignItems: 'center' as const,
        marginBottom: SPACING.lg,
    },
    username: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },

    profileInfo: {
        width: '100%',
        alignItems: 'center' as const,
        marginBottom: SPACING.xxl,
    },

    displayBio: {
        fontSize: TYPOGRAPHY.base,
        color: COLORS.textSecondary,
        textAlign: 'center' as const,
        lineHeight: 22,
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.sm,
    },
    field: {
        width: '100%',
        marginBottom: SPACING.lg,
    },
    label: {
        ...COMMON_STYLES.label,
    },
    input: {
        ...COMMON_STYLES.input,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top' as const,
    },
    value: {
        fontSize: TYPOGRAPHY.base,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 50,
        color: COLORS.textSecondary,
    },



    section: {
        width: '100%',
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
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
        backgroundColor: COLORS.surface,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    seeAllHeaderButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        marginLeft: SPACING.sm,
        backgroundColor: COLORS.surface,
    },
    seeAllHeaderText: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.partyOrange,
        fontWeight: TYPOGRAPHY.medium,
        backgroundColor: COLORS.surface,
    },
    headerActions: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: SPACING.sm,
        backgroundColor: COLORS.surface,
    },
    sectionContent: {
        minHeight: 40,
        backgroundColor: COLORS.surface,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    placeholderText: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center' as const,
    },
    createTitle: {
        ...COMMON_STYLES.title,
        marginBottom: SPACING.md,
    },
    createSubtitle: {
        fontSize: TYPOGRAPHY.base,
        color: COLORS.textSecondary,
        textAlign: 'center' as const,
        marginBottom: SPACING.lg,
    },
    createProfileButton: {
        ...COMMON_STYLES.button,
    },
    createProfileButtonText: {
        ...COMMON_STYLES.buttonText,
    },
    addButton: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.partyGreen, // Use party green for add friend button
        borderWidth: 1,
        borderColor: COLORS.partyGreen,
    },

    friendsList: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
        gap: SPACING.sm,
    },
    emptyFriendsContainer: {
        alignItems: 'center' as const,
        paddingVertical: SPACING.lg,
    },
    emptySubtext: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
        textAlign: 'center' as const,
        marginTop: SPACING.xs,
    },
    friendsGrid: {
        backgroundColor: COLORS.surface,
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
        gap: SPACING.md,
        width: '100%',
    },
    friendItem: {
        alignItems: 'center' as const,
        width: 70,
        marginBottom: SPACING.sm,
    },
    friendProfilePicture: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginBottom: SPACING.xs,
    },
    friendProfilePlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.surface,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        marginBottom: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    friendName: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.text,
        textAlign: 'center' as const,
    },
    seeAllFriendsButton: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        width: 70,
        height: 65,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    seeAllText: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textAlign: 'center' as const,
    },
    
    // Clean Groups Preview Styles
    groupsPreview: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    groupsRow: {
        backgroundColor: COLORS.surface,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginRight: SPACING.md,
    },
    groupCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: 2,
        borderColor: COLORS.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    moreGroupsCircle: {
        backgroundColor: COLORS.gray300,
        marginLeft: -8,
    },
    moreGroupsText: {
        fontSize: 10,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.textSecondary,
    },
    groupsPreviewInfo: {
        backgroundColor: COLORS.surface,
        flex: 1,
    },
    groupsPreviewTitle: {
        backgroundColor: COLORS.surface,
        fontSize: TYPOGRAPHY.sm,
        fontWeight: TYPOGRAPHY.medium,
        color: COLORS.text,
        marginBottom: 2,
    },
    groupsPreviewSubtitle: {
        backgroundColor: COLORS.surface,    
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
    },
    groupsPreviewTypes: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textSecondary,
        flex: 1,
    },
    modeIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    partyIndicator: {
        backgroundColor: COLORS.partyPink,
    },
    classicIndicator: {
        backgroundColor: COLORS.partyGreen,
    },
    badgeGrid: {
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
    },
    badgeItem: {
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SPACING.sm,
        padding: SPACING.sm,
        width: '30%',
        minWidth: 80,
    },
    badgeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.partyOrange + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    badgeName: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: TYPOGRAPHY.medium,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 1,
    },
    badgeDate: {
        fontSize: TYPOGRAPHY.xs - 1,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    photoIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 2,
        gap: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderRadius: SPACING.lg,
        padding: SPACING.lg,
        maxWidth: '90%',
        maxHeight: '80%',
        width: 350,
        flex: 1,
        flexDirection: 'column',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        zIndex: 1,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalBadgeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.partyOrange + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    modalBadgeName: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    modalBadgeDate: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    modalPhoto: {
        width: '100%',
        height: 300,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.surface,
    },
    timerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.partyGreen + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: SPACING.sm,
        marginTop: SPACING.sm,
        gap: SPACING.xs,
    },
    timerText: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.partyGreen,
        fontFamily: 'monospace',
    },
    seeAllBadgesButton: {
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SPACING.sm,
        padding: SPACING.sm,
        width: '30%',
        minWidth: 80,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    seeAllBadgesText: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: TYPOGRAPHY.medium,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 2,
    },
    badgeCount: {
        fontSize: TYPOGRAPHY.xs - 1,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    clickableBadge: {
        borderWidth: 1,
        borderColor: COLORS.partyOrange + '40',
        shadowColor: COLORS.partyOrange,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    photoCount: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.partyGreen,
        textAlign: 'center',
        fontWeight: TYPOGRAPHY.medium,
        marginTop: SPACING.xs,
    },
    photosContainer: {
        flex: 1,
        marginTop: SPACING.sm,
        minHeight: 200,
    },
    photosContentContainer: {
        paddingBottom: SPACING.md,
    },
    photoItem: {
        marginBottom: SPACING.md,
    },
    photoMetadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    photoDate: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
    },
    photoIndicatorCount: {
        fontSize: 8,
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.bold,
        backgroundColor: COLORS.partyPink,
        borderRadius: 6,
        minWidth: 12,
        height: 12,
        textAlign: 'center',
        lineHeight: 12,
        marginLeft: 2,
    },
    photoContainer: {
        position: 'relative',
    },
    favoriteIndicator: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
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
    },
    nextTierText: {
        fontSize: TYPOGRAPHY.xs - 1,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 2,
        backgroundColor: COLORS.surface,
    },
    favoriteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginTop: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.xs,
    },
    favoriteButtonActive: {
        backgroundColor: '#FFD700' + '20',
        borderColor: '#FFD700',
    },
    favoriteButtonText: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.medium,
    },
    favoriteButtonTextActive: {
        color: '#FFD700',
        fontWeight: TYPOGRAPHY.semibold,
    },
    profilePictureWrapper: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
        position: 'relative',
    },
    profileFavoriteBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        zIndex: 2,
    },
    profileBadgeIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
        shadowColor: COLORS.textMuted,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    profileBadgeStarIndicator: {
        position: 'absolute',
        top: -3,
        right: -3,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    favoriteBadgeDetails: {
        alignItems: 'center',
        marginTop: SPACING.xs,
        maxWidth: 200,
    },
    favoriteBadgeText: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    favoriteBadgeTier: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: TYPOGRAPHY.medium,
        textAlign: 'center',
        opacity: 0.8,
    },

});
