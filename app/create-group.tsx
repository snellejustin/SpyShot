import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, LAYOUT, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/design';
import { validateGroupName } from '@/constants/validation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface Friend {
    id: string;
    username: string;
    name: string;
    bio?: string;
    profile_picture?: string | null;
}

interface SelectedFriend extends Friend {
    selected: boolean;
}

export default function CreateGroupScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { type } = useLocalSearchParams<{ type: string }>();
    
    const [friends, setFriends] = useState<SelectedFriend[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('');
    const [groupNameError, setGroupNameError] = useState<string | null>(null);
    const [groupMode, setGroupMode] = useState<'classic' | 'party'>('classic');
    const [creating, setCreating] = useState(false);

    // Get group type details for UI
    const getGroupTypeDetails = () => {
        switch (type) {
            case 'cafe':
                return {
                    title: 'Cafe',
                    icon: 'cafe' as const,
                    color: COLORS.partyPurple,
                    placeholder: 'Coffee shop meetup, study session, etc.'
                };
            case 'home':
                return {
                    title: 'Home',
                    icon: 'home' as const,
                    color: COLORS.partyOrange,
                    placeholder: 'House party, dinner, movie night, etc.'
                };
            default:
                return {
                    title: 'Group',
                    icon: 'people' as const,
                    color: COLORS.primary,
                    placeholder: 'Describe your group...'
                };
        }
    };

    const groupDetails = getGroupTypeDetails();

    const loadFriendsCallback = useCallback(async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const friendsList = await authService.getFriends(user.id);
            setFriends(friendsList.map(friend => ({ ...friend, selected: false })));
        } catch (error) {
            console.error('Failed to load friends:', error);
            Alert.alert('Error', 'Failed to load friends');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadFriendsCallback();
    }, [loadFriendsCallback]);



    const toggleFriendSelection = (friendId: string) => {
        setFriends(prev => 
            prev.map(friend => 
                friend.id === friendId 
                    ? { ...friend, selected: !friend.selected }
                    : friend
            )
        );
    };

    const getSelectedFriends = () => friends.filter(friend => friend.selected);

    const createGroup = async () => {
        if (!user) return;

        const nameErr = validateGroupName(groupName);
        if (nameErr) {
            setGroupNameError(nameErr);
            return;
        }
        setGroupNameError(null);

        const selectedFriends = getSelectedFriends();

        try {
            setCreating(true);

            const groupData = {
                name: groupName.trim(),
                type: type || 'general',
                mode: groupMode,
                creator_id: user.id
            };

            const group = await authService.createGroup(groupData);

            if (selectedFriends.length > 0) {
                await authService.sendGroupInvitations(group.id, selectedFriends.map(f => f.id));
            }

            Alert.alert(
                'Group Created!',
                selectedFriends.length > 0
                    ? `${groupDetails.title} group created and ${selectedFriends.length} invite(s) sent!`
                    : `${groupDetails.title} group created! Invite friends from the group details.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
            
        } catch (error) {
            console.error('Failed to create group:', error);
            Alert.alert('Error', 'Failed to create group. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const selectedCount = getSelectedFriends().length;

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Ionicons name={groupDetails.icon} size={24} color={groupDetails.color} />
                    <ThemedText style={[styles.title, { color: groupDetails.color }]}>
                        Create {groupDetails.title}
                    </ThemedText>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Group Details Form */}
                <View style={styles.formSection}>
                    <ThemedText style={styles.sectionTitle}>Group Details</ThemedText>
                    
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Group Name *</ThemedText>
                        <TextInput
                            style={[styles.textInput, groupNameError && styles.textInputError]}
                            value={groupName}
                            onChangeText={(v) => { setGroupName(v); if (groupNameError) setGroupNameError(null); }}
                            placeholder={`${groupDetails.title} group name`}
                            placeholderTextColor={COLORS.textMuted}
                            maxLength={50}
                        />
                        {groupNameError ? (
                            <Text style={styles.errorText}>{groupNameError}</Text>
                        ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Group Mode</ThemedText>
                        <View style={styles.modeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.modeOption,
                                    groupMode === 'classic' && styles.modeOptionSelected
                                ]}
                                onPress={() => setGroupMode('classic')}
                            >
                                <Ionicons 
                                    name="people" 
                                    size={20} 
                                    color={groupMode === 'classic' ? COLORS.white : COLORS.text} 
                                />
                                <ThemedText style={[
                                    styles.modeText,
                                    groupMode === 'classic' && styles.modeTextSelected
                                ]}>
                                    Classic
                                </ThemedText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.modeOption,
                                    groupMode === 'party' && styles.modeOptionSelected
                                ]}
                                onPress={() => setGroupMode('party')}
                            >
                                <Ionicons 
                                    name="musical-notes" 
                                    size={20} 
                                    color={groupMode === 'party' ? COLORS.white : COLORS.text} 
                                />
                                <ThemedText style={[
                                    styles.modeText,
                                    groupMode === 'party' && styles.modeTextSelected
                                ]}>
                                    Party
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Friends Selection */}
                <View style={styles.formSection}>
                    <ThemedText style={styles.sectionTitle}>
                        Select Friends ({selectedCount} selected)
                    </ThemedText>
                    
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : friends.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people" size={48} color={COLORS.textMuted} />
                            <ThemedText style={styles.emptyText}>No friends to invite</ThemedText>
                            <ThemedText style={styles.emptySubtext}>
                                Add friends first to create groups
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.friendsList}>
                            {friends.map((friend) => (
                                <TouchableOpacity
                                    key={friend.id}
                                    style={[
                                        styles.friendItem,
                                        friend.selected && styles.friendItemSelected
                                    ]}
                                    onPress={() => toggleFriendSelection(friend.id)}
                                >
                                    <View style={styles.friendInfo}>
                                        <View style={styles.friendAvatar}>
                                            {friend.profile_picture ? (
                                                <Image 
                                                    source={{ uri: friend.profile_picture }} 
                                                    style={styles.friendProfilePicture} 
                                                />
                                            ) : (
                                                <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                                            )}
                                        </View>
                                        <View style={styles.friendDetails}>
                                            <ThemedText style={styles.friendName}>@{friend.username}</ThemedText>
                                        </View>
                                    </View>
                                    
                                    <View style={[
                                        styles.checkbox,
                                        friend.selected && { backgroundColor: groupDetails.color }
                                    ]}>
                                        {friend.selected && (
                                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Create Button */}
                <View style={styles.createButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            { backgroundColor: groupDetails.color },
                            (!groupName.trim() || creating) && styles.createButtonDisabled
                        ]}
                        onPress={createGroup}
                        disabled={!groupName.trim() || creating}
                    >
                        <Ionicons 
                            name={creating ? "hourglass" : "add"} 
                            size={20} 
                            color={COLORS.white} 
                        />
                        <ThemedText style={styles.createButtonText}>
                            {creating ? 'Creating...' : `Create ${groupDetails.title}`}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    headerSpacer: {
        width: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    formSection: {
        marginBottom: SPACING.xxl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    textInput: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: 16,
        color: COLORS.text,
        minHeight: 44,
    },
    textInputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: TYPOGRAPHY.sm,
        marginTop: SPACING.xs,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    loadingContainer: {
        padding: SPACING.xxl,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: SPACING.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: SPACING.md,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    friendsList: {
        gap: SPACING.sm,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
    },
    friendItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.gray100,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    friendAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    friendProfilePicture: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    friendDetails: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
    friendUsername: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButtonContainer: {
        marginTop: SPACING.lg,
        marginBottom: SPACING.xxl,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
        ...SHADOWS.md,
    },
    createButtonDisabled: {
        opacity: 0.5,
    },
    createButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    modeContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    modeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        gap: SPACING.xs,
    },
    modeOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    modeTextSelected: {
        color: COLORS.white,
    },
});
