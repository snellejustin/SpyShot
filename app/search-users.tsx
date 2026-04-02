import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, COMMON_STYLES, SPACING, TYPOGRAPHY } from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { authService, UserProfile } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SearchedUser extends UserProfile {
    friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

export default function SearchUsersScreen() {
    const insets = useSafeAreaInsets();
    const { user, refreshNotificationCount, refreshUserData } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchUsers = async (query: string) => {
        if (!query.trim() || !user?.id) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const users = await authService.searchUsers(query, user.id);
            const usersWithFriendStatus = await Promise.all(
                users.map(async (searchUser) => {
                    const friendshipStatus = await authService.getFriendshipStatus(user.id, searchUser.id);
                    return { ...searchUser, friendshipStatus };
                })
            );
            setSearchResults(usersWithFriendStatus);
        } catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Error', 'Failed to search users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        debounceRef.current = setTimeout(() => searchUsers(searchQuery), 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    const addFriend = async (friendId: string) => {
        if (!user) return;
        
        try {
            await authService.addFriend(user.id, friendId);
            
            // Update the search results to mark this user's status as pending_sent
            setSearchResults(prevResults => 
                prevResults.map(result => 
                    result.id === friendId 
                        ? { ...result, friendshipStatus: 'pending_sent' }
                        : result
                )
            );
            
            // Refresh user data to ensure consistency
            refreshNotificationCount();
            refreshUserData();
            
            Alert.alert('Success', 'Friend request sent!');
        } catch (error) {
            console.error('Failed to add friend:', error);
            Alert.alert('Error', 'Failed to send friend request');
        }
    };

    const goToUserProfile = (userId: string) => {
        router.push(`/user-profile?userId=${userId}`);
    };

    const renderUserItem = ({ item }: { item: SearchedUser }) => (
        <TouchableOpacity 
            style={styles.userItem}
            onPress={() => goToUserProfile(item.id)}
        >
            <TouchableOpacity 
                style={styles.profilePictureContainer}
                onPress={() => goToUserProfile(item.id)}
            >
                {item.profile_picture ? (
                    <Image source={{ uri: item.profile_picture }} style={styles.profilePicture} />
                ) : (
                    <ThemedView style={styles.profilePicturePlaceholder}>
                        <Ionicons name="person" size={24} color={COLORS.textMuted} />
                    </ThemedView>
                )}
            </TouchableOpacity>
            
            <ThemedView style={styles.userInfo}>
                <ThemedText style={styles.name}>@{item.username}</ThemedText>
            </ThemedView>
            
            <TouchableOpacity 
                style={[
                    styles.actionButton,
                    (item.friendshipStatus === 'friends' || item.friendshipStatus === 'pending_sent') && styles.friendButton
                ]}
                onPress={() => item.friendshipStatus === 'none' && addFriend(item.id)}
                disabled={item.friendshipStatus !== 'none'}
            >
                <Ionicons 
                    name={
                        item.friendshipStatus === 'friends' ? 'checkmark' :
                        item.friendshipStatus === 'pending_sent' ? 'time' :
                        'person-add'
                    } 
                    size={20} 
                    color={
                        item.friendshipStatus === 'friends' ? COLORS.partyGreen :
                        item.friendshipStatus === 'pending_sent' ? COLORS.partyOrange :
                        COLORS.partyOrange
                    } 
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
            {/* Header */}
            <ThemedView style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>Search Users</ThemedText>
                <ThemedView style={styles.spacer} />
            </ThemedView>

            {/* Search Input */}
            <ThemedView style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
            </ThemedView>

            {/* Results */}
            <ThemedView style={styles.resultsContainer}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
                ) : searchResults.length > 0 ? (
                    <FlatList
                        data={searchResults}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                    />
                ) : searchQuery.trim() ? (
                    <ThemedText style={styles.noResultsText}>No users found</ThemedText>
                ) : (
                    <ThemedText style={styles.instructionText}>
                        Enter a username to search for friends
                    </ThemedText>
                )}
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    backButton: {
        padding: SPACING.sm,
        marginLeft: -SPACING.sm,
    },
    title: {
        ...COMMON_STYLES.title,
        flex: 1,
        textAlign: 'center',
        marginBottom: 0,
    },
    spacer: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.lg,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.base,
        color: COLORS.text,
        paddingVertical: SPACING.md,
    },
    resultsContainer: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    profilePictureContainer: {
        marginRight: SPACING.md,
    },
    profilePicture: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.full,
    },
    profilePicturePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    name: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textSecondary,
    },
    actionButton: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.partyOrange, // Use party blue for add friend border
    },
    friendButton: {
        borderColor: COLORS.partyGreen, // Use party green for friends border
        backgroundColor: COLORS.surface,
    },
    noResultsText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        marginTop: SPACING.xxl,
    },
    instructionText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        marginTop: SPACING.xxl,
        fontSize: TYPOGRAPHY.sm,
    },
});
