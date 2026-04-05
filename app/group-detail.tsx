import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, LAYOUT, SHADOWS, SPACING } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

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

interface GroupMember {
    id: string;
    user_id: string;
    status: string;
    joined_at: string;
    profile: {
        id: string;
        username: string;
        name: string;
        profile_picture: string | null;
    };
}

export default function GroupDetailScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeGameSession, setActiveGameSession] = useState<any>(null);
    const [userHasActiveGame, setUserHasActiveGame] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [invitableFriends, setInvitableFriends] = useState<any[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
    const [inviting, setInviting] = useState(false);

    const getGroupTypeDetails = (type: string) => {
        switch (type) {
            case 'cafe':
                return {
                    icon: 'cafe' as const,
                    color: COLORS.partyPurple,
                    label: 'Cafe',
                    gradient: ['rgba(139, 69, 19, 0.1)', 'rgba(139, 69, 19, 0.05)']
                };
            case 'home':
                return {
                    icon: 'home' as const,
                    color: COLORS.partyOrange,
                    label: 'Home',
                    gradient: ['rgba(70, 130, 180, 0.1)', 'rgba(70, 130, 180, 0.05)']
                };
            default:
                return {
                    icon: 'people' as const,
                    color: COLORS.primary,
                    label: 'Group',
                    gradient: ['rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.05)']
                };
        }
    };

    const loadGroupDetails = useCallback(async () => {
        if (!groupId || !user) return;
        
        try {
            setLoading(true);
            
            // Get group details, members, and check for active games
            const [groupDetails, groupMembers, activeSession, userActiveGames] = await Promise.all([
                authService.getGroupDetails(groupId),
                authService.getGroupMembers(groupId),
                authService.getActiveGameSession(groupId),
                authService.getUserActiveGameSessions(user.id)
            ]);
            
            setGroup(groupDetails);
            setMembers(groupMembers);
            setActiveGameSession(activeSession);
            setUserHasActiveGame(userActiveGames.length > 0);
        } catch (error) {
            console.error('Failed to load group details:', error);
            Alert.alert('Error', 'Failed to load group details');
        } finally {
            setLoading(false);
        }
    }, [groupId, user]);

    useEffect(() => {
        loadGroupDetails();
    }, [loadGroupDetails]);

    const openInviteModal = async () => {
        if (!user?.id || !groupId) return;
        try {
            const friends = await authService.getFriends(user.id);
            const memberUserIds = new Set(members.map(m => m.user_id));
            const available = friends.filter((f: any) => !memberUserIds.has(f.id));
            setInvitableFriends(available);
            setSelectedFriendIds(new Set());
            setInviteModalVisible(true);
        } catch {
            Alert.alert('Error', 'Could not load friends');
        }
    };

    const toggleFriendSelection = (id: string) => {
        setSelectedFriendIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSendInvites = async () => {
        if (selectedFriendIds.size === 0 || !groupId) return;
        setInviting(true);
        try {
            await authService.sendGroupInvitations(groupId, Array.from(selectedFriendIds));
            setInviteModalVisible(false);
            Alert.alert('Invites Sent', `${selectedFriendIds.size} invite(s) sent!`);
            // Refresh members to show pending invites
            const updatedMembers = await authService.getGroupMembers(groupId);
            setMembers(updatedMembers);
        } catch {
            Alert.alert('Error', 'Could not send invites');
        } finally {
            setInviting(false);
        }
    };

    const handleStartGroup = async () => {
        if (!groupId || !user) return;

        try {
            // Check if user has any active games across all groups
            const userActiveGames = await authService.getUserActiveGameSessions(user.id);
            
            if (userActiveGames.length > 0) {
                const activeGame = userActiveGames[0];
                Alert.alert(
                    'Active Game Found',
                    `You already have an active game in "${activeGame.group.name}". You can only have one active game at a time. Please finish or leave the current game first.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                            text: 'Join Active Game', 
                            onPress: () => router.push(`/game-active?sessionId=${activeGame.id}`)
                        }
                    ]
                );
                return;
            }

            // No active games found, proceed to game setup
            router.push(`/game-setup?groupId=${groupId}`);
        } catch (error) {
            console.error('Failed to check for active games:', error);
            Alert.alert('Error', 'Could not check for active games. Please try again.');
        }
    };

    const handleJoinActiveGame = () => {
        if (activeGameSession) {
            router.push(`/game-active?sessionId=${activeGameSession.id}`);
        }
    };

    const handleDeleteGroup = () => {
        Alert.alert(
            'Delete Group',
            `Are you sure you want to delete "${group?.name}"? This action cannot be undone and will remove all members from the group.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: confirmDeleteGroup
                }
            ]
        );
    };

    const confirmDeleteGroup = async () => {
        if (!group || !user) return;

        try {
            await authService.deleteGroup(group.id);
            Alert.alert(
                'Group Deleted',
                'The group has been successfully deleted.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Failed to delete group:', error);
            Alert.alert('Error', 'Failed to delete group. Please try again.');
        }
    };

    const handleLeaveGroup = () => {
        Alert.alert(
            'Leave Group',
            `Are you sure you want to leave "${group?.name}"? You'll need to be re-invited to rejoin.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Leave', 
                    style: 'destructive',
                    onPress: confirmLeaveGroup
                }
            ]
        );
    };

    const confirmLeaveGroup = async () => {
        if (!group || !user) return;

        try {
            await authService.leaveGroup(group.id, user.id);
            Alert.alert(
                'Left Group',
                'You have successfully left the group.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Failed to leave group:', error);
            Alert.alert('Error', 'Failed to leave group. Please try again.');
        }
    };

    if (loading) {
        return (
            <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Group</ThemedText>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ThemedView>
        );
    }

    if (!group) {
        return (
            <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Group</ThemedText>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={COLORS.error} />
                    <ThemedText style={styles.errorTitle}>Group not found</ThemedText>
                    <ThemedText style={styles.errorMessage}>This group may have been deleted</ThemedText>
                </View>
            </ThemedView>
        );
    }

    const typeDetails = getGroupTypeDetails(group.type);
    const isCreator = group.creator_id === user?.id;

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Group Details</ThemedText>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Group Header */}
                <View style={[styles.groupHeader, { backgroundColor: typeDetails.color }]}>
                    <View style={[
                        styles.modeBadge, 
                        styles.topRightBadge,
                        group.mode === 'party' ? styles.partyModeBadge : styles.classicModeBadge
                    ]}>
                        <Ionicons 
                            name={group.mode === 'party' ? 'musical-notes' : 'people'} 
                            size={12} 
                            color={COLORS.white} 
                        />
                        <ThemedText style={styles.modeText}>
                            {group.mode.charAt(0).toUpperCase() + group.mode.slice(1)}
                        </ThemedText>
                    </View>
                    <View style={styles.groupHeaderContent}>
                        <View style={styles.groupIconLarge}>
                            <Ionicons name={typeDetails.icon} size={32} color={COLORS.white} />
                        </View>
                        <ThemedText style={styles.groupName}>{group.name}</ThemedText>
                        <ThemedText style={styles.groupType}>{typeDetails.label}</ThemedText>
                        {isCreator && (
                            <View style={styles.creatorBadge}>
                                <Ionicons name="star" size={12} color={COLORS.primary} />
                                <ThemedText style={styles.creatorBadgeText}>Creator</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Group Info */}
                <View style={styles.infoSection}>
                    {group.description && (
                        <View style={styles.descriptionContainer}>
                            <ThemedText style={styles.sectionTitle}>Description</ThemedText>
                            <ThemedText style={styles.description}>{group.description}</ThemedText>
                        </View>
                    )}

                    <View style={styles.metaInfo}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
                            <ThemedText style={styles.metaText}>
                                Created {new Date(group.created_at).toLocaleDateString()}
                            </ThemedText>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="person" size={16} color={COLORS.textSecondary} />
                            <ThemedText style={styles.metaText}>
                                By {isCreator ? 'You' : `@${group.creator.username}`}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Members Section */}
                <View style={styles.membersSection}>
                    <ThemedText style={styles.sectionTitle}>
                        Members ({members.length})
                    </ThemedText>
                    <View style={styles.membersList}>
                        {members.map((member) => (
                            <View key={member.id} style={styles.memberItem}>
                                <View style={styles.memberAvatar}>
                                    {member.profile.profile_picture ? (
                                        <Image
                                            source={{ uri: member.profile.profile_picture }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <Ionicons name="person" size={20} color={COLORS.textSecondary} />
                                    )}
                                </View>
                                <View style={styles.memberInfo}>
                                    <ThemedText style={styles.memberName}>
                                        @{member.profile.username}
                                        {member.profile.id === group.creator_id && (
                                            <ThemedText style={styles.creatorLabel}> (Creator)</ThemedText>
                                        )}
                                    </ThemedText>
                                </View>
                                <View style={styles.memberStatus}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: member.status === 'accepted' ? COLORS.partyGreen : COLORS.partyOrange }
                                    ]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    {activeGameSession ? (
                        /* This Group Has Active Game */
                        <>
                            <View style={styles.activeGameHeader}>
                                <Ionicons name="game-controller" size={24} color={COLORS.partyGreen} />
                                <ThemedText style={styles.activeGameTitle}>Game in Progress</ThemedText>
                            </View>
                            <TouchableOpacity
                                style={styles.joinActiveGameButton}
                                onPress={handleJoinActiveGame}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="enter" size={20} color={COLORS.white} />
                                <ThemedText style={styles.joinActiveGameText}>Join Active Game</ThemedText>
                            </TouchableOpacity>
                            <ThemedText style={styles.gameInProgressNote}>
                                Game actions (leave/delete) are disabled during active games
                            </ThemedText>
                        </>
                    ) : userHasActiveGame ? (
                        /* User Has Active Game in Another Group */
                        <>
                            <View style={styles.activeGameHeader}>
                                <Ionicons name="game-controller" size={24} color={COLORS.partyOrange} />
                                <ThemedText style={[styles.activeGameTitle, { color: COLORS.partyOrange }]}>
                                    Active Game in Another Group
                                </ThemedText>
                            </View>
                            <ThemedText style={styles.gameInProgressNote}>
                                You have an active game in another group. Finish that game before starting a new one.
                            </ThemedText>
                            <View style={styles.disabledActionsContainer}>
                                <View style={[styles.startButton, styles.disabledButton, { backgroundColor: COLORS.textMuted }]}>
                                    <Ionicons name="play" size={20} color={COLORS.white} />
                                    <ThemedText style={styles.startButtonText}>Start Game (Disabled)</ThemedText>
                                </View>
                                {!isCreator && (
                                    <View style={[styles.leaveButton, styles.disabledButton]}>
                                        <Ionicons name="exit" size={18} color={COLORS.textMuted} />
                                        <ThemedText style={[styles.leaveButtonText, { color: COLORS.textMuted }]}>
                                            Leave Group (Disabled)
                                        </ThemedText>
                                    </View>
                                )}
                                {isCreator && (
                                    <View style={[styles.deleteButton, styles.disabledButton]}>
                                        <Ionicons name="trash" size={18} color={COLORS.textMuted} />
                                        <ThemedText style={[styles.deleteButtonText, { color: COLORS.textMuted }]}>
                                            Delete Group (Disabled)
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        </>
                    ) : (
                        /* Normal Action Buttons */
                        <>
                            {isCreator ? (
                                <>
                                    {/* Start Button for Creator */}
                                    <TouchableOpacity
                                        style={[styles.startButton, { backgroundColor: typeDetails.color }]}
                                        onPress={handleStartGroup}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="play" size={20} color={COLORS.white} />
                                        <ThemedText style={styles.startButtonText}>Start {typeDetails.label}</ThemedText>
                                    </TouchableOpacity>

                                    {/* Invite Friends Button */}
                                    <TouchableOpacity
                                        style={styles.inviteButton}
                                        onPress={openInviteModal}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="person-add" size={18} color={COLORS.primary} />
                                        <ThemedText style={styles.inviteButtonText}>Invite Friends</ThemedText>
                                    </TouchableOpacity>

                                    {/* Delete Group Button for Creator */}
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={handleDeleteGroup}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="trash" size={18} color={COLORS.error} />
                                        <ThemedText style={styles.deleteButtonText}>Delete Group</ThemedText>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* Leave Group Button for Members */
                                <TouchableOpacity
                                    style={styles.leaveButton}
                                    onPress={handleLeaveGroup}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="exit" size={18} color={COLORS.error} />
                                    <ThemedText style={styles.leaveButtonText}>Leave Group</ThemedText>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Invite Friends Modal */}
            <Modal
                visible={inviteModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Invite Friends</ThemedText>
                            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {invitableFriends.length === 0 ? (
                            <View style={styles.modalEmpty}>
                                <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                                <ThemedText style={styles.modalEmptyText}>
                                    All your friends are already in this group!
                                </ThemedText>
                            </View>
                        ) : (
                            <>
                                <FlatList
                                    data={invitableFriends}
                                    keyExtractor={(item) => item.id}
                                    style={styles.modalList}
                                    renderItem={({ item }) => {
                                        const selected = selectedFriendIds.has(item.id);
                                        return (
                                            <TouchableOpacity
                                                style={[styles.friendRow, selected && styles.friendRowSelected]}
                                                onPress={() => toggleFriendSelection(item.id)}
                                            >
                                                <View style={styles.friendAvatar}>
                                                    {item.profile_picture ? (
                                                        <Image source={{ uri: item.profile_picture }} style={styles.friendAvatarImage} />
                                                    ) : (
                                                        <Ionicons name="person" size={20} color={COLORS.textMuted} />
                                                    )}
                                                </View>
                                                <ThemedText style={styles.friendRowName}>@{item.username}</ThemedText>
                                                {selected && (
                                                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                                <TouchableOpacity
                                    style={[styles.sendInvitesButton, (selectedFriendIds.size === 0 || inviting) && { opacity: 0.5 }]}
                                    onPress={handleSendInvites}
                                    disabled={selectedFriendIds.size === 0 || inviting}
                                >
                                    {inviting ? (
                                        <ActivityIndicator size="small" color={COLORS.gray900} />
                                    ) : (
                                        <>
                                            <Ionicons name="send" size={18} color={COLORS.gray900} />
                                            <ThemedText style={styles.sendInvitesText}>
                                                Send {selectedFriendIds.size > 0 ? `${selectedFriendIds.size} ` : ''}Invite{selectedFriendIds.size !== 1 ? 's' : ''}
                                            </ThemedText>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.error,
        marginTop: SPACING.lg,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    groupHeader: {
        paddingVertical: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
    },
    groupHeaderContent: {
        alignItems: 'center',
    },
    groupIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    groupName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    groupType: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    creatorBadgeText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    infoSection: {
        padding: SPACING.lg,
    },
    descriptionContainer: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    metaInfo: {
        gap: SPACING.sm,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    metaText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    membersSection: {
        padding: SPACING.lg,
        paddingTop: 0,
    },
    membersList: {
        gap: SPACING.sm,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    creatorLabel: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    memberUsername: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    memberStatus: {
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    actionSection: {
        padding: SPACING.lg,
        paddingTop: SPACING.md,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
        ...SHADOWS.md,
    },
    startButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.error,
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    deleteButtonText: {
        color: COLORS.error,
        fontSize: 14,
        fontWeight: '500',
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.error,
        gap: SPACING.sm,
    },
    leaveButtonText: {
        color: COLORS.error,
        fontSize: 16,
        fontWeight: '600',
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    partyModeBadge: {
        backgroundColor: 'rgba(236, 72, 153, 0.9)', // Semi-transparent party pink
    },
    classicModeBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.9)', // Semi-transparent party green
    },
    modeText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.white,
    },
    topRightBadge: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        zIndex: 1,
    },
    activeGameHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    activeGameTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.partyGreen,
    },
    joinActiveGameButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.partyGreen,
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
        ...SHADOWS.md,
    },
    joinActiveGameText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    gameInProgressNote: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    disabledActionsContainer: {
        opacity: 0.6,
        gap: SPACING.sm,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: COLORS.surface,
        borderColor: COLORS.textMuted,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    inviteButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay60,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        maxHeight: '70%',
        padding: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalEmpty: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        gap: SPACING.md,
    },
    modalEmptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    modalList: {
        maxHeight: 300,
        marginBottom: SPACING.md,
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SPACING.md,
    },
    friendRowSelected: {
        backgroundColor: `${COLORS.primary}11`,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: SPACING.sm,
    },
    friendAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    friendAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    friendRowName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
    },
    sendInvitesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    sendInvitesText: {
        color: COLORS.gray900,
        fontSize: 16,
        fontWeight: '700',
    },
});
