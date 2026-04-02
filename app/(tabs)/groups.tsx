import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

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
    hasActiveGame?: boolean;
}

export default function GroupsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadGroups = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const userGroups = await authService.getUserGroups(user.id);
            
            // Check for active games for each group
            const groupsWithActiveStatus = await Promise.all(
                userGroups.map(async (group: Group) => {
                    try {
                        const activeSession = await authService.getActiveGameSession(group.id);
                        return {
                            ...group,
                            hasActiveGame: !!activeSession
                        };
                    } catch (error) {
                        console.error(`Failed to check active game for group ${group.id}:`, error);
                        return {
                            ...group,
                            hasActiveGame: false
                        };
                    }
                })
            );
            
            setGroups(groupsWithActiveStatus);
        } catch (error) {
            console.error('Failed to load groups:', error);
            Alert.alert('Error', 'Failed to load groups');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadGroups();
        setRefreshing(false);
    }, [loadGroups]);

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [loadGroups])
    );

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

    const renderGroup = ({ item }: { item: Group }) => {
        const typeDetails = getGroupTypeDetails(item.type);
        const isCreator = item.creator_id === user?.id;

        return (
            <TouchableOpacity 
                style={styles.groupItem}
                onPress={() => router.push(`/group-detail?groupId=${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.groupHeader}>
                    <View style={styles.groupTitleContainer}>
                        <View style={[styles.groupIcon, { backgroundColor: typeDetails.color }]}>
                            <Ionicons name={typeDetails.icon} size={20} color={COLORS.white} />
                        </View>
                        <View style={styles.groupInfo}>
                            <ThemedText style={styles.groupName}>{item.name}</ThemedText>
                            <ThemedText style={styles.groupType}>{typeDetails.label}</ThemedText>
                        </View>
                    </View>
                    <View style={styles.badgesContainer}>
                        {item.hasActiveGame && (
                            <View style={styles.activeGameBadge}>
                                <Ionicons name="game-controller" size={10} color={COLORS.white} />
                                <ThemedText style={styles.activeGameText}>Active Game</ThemedText>
                            </View>
                        )}
                        <View style={[
                            styles.modeBadge, 
                            item.mode === 'party' ? styles.partyBadge : styles.classicBadge
                        ]}>
                            <Ionicons 
                                name={item.mode === 'party' ? 'musical-notes' : 'people'} 
                                size={10} 
                                color={COLORS.white} 
                            />
                            <ThemedText style={styles.modeText}>
                                {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                            </ThemedText>
                        </View>
                        {isCreator && (
                            <View style={styles.creatorBadge}>
                                <Ionicons name="star" size={12} color={COLORS.primary} />
                                <ThemedText style={styles.creatorText}>Creator</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {item.description && (
                    <ThemedText style={styles.groupDescription} numberOfLines={2}>
                        {item.description}
                    </ThemedText>
                )}

                <View style={styles.groupFooter}>
                    <ThemedText style={styles.createdBy}>
                        Created by {isCreator ? 'You' : `@${item.creator.username}`}
                    </ThemedText>
                    <ThemedText style={styles.createdDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            <ThemedText style={styles.title}>Groups</ThemedText>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : groups.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={COLORS.textMuted} />
                    <ThemedText style={styles.emptyTitle}>No groups yet</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>
                        Create a group from the home screen to get started
                    </ThemedText>
                </View>
            ) : (
                <>
                    <ThemedText style={styles.groupCount}>
                        {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                    </ThemedText>
                    <FlatList
                        data={groups}
                        renderItem={renderGroup}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.groupsList}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={COLORS.primary}
                                colors={[COLORS.primary]}
                            />
                        }
                    />
                </>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.lg,
    },
    groupCount: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginTop: SPACING.lg,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    groupsList: {
        paddingBottom: SPACING.xxl,
    },
    groupItem: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    groupTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    groupType: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    creatorText: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '500',
    },
    groupDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        lineHeight: 20,
    },
    groupFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.sm,
        marginTop: SPACING.sm,
    },
    createdBy: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    createdDate: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    partyBadge: {
        backgroundColor: COLORS.partyOrange,
    },
    classicBadge: {
        backgroundColor: COLORS.partyGreen,
    },
    modeText: {
        fontSize: 9,
        fontWeight: '500',
        color: COLORS.white,
    },
    badgesContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: SPACING.xs,
    },
    activeGameBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
        backgroundColor: COLORS.partyGreen,
    },
    activeGameText: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.white,
    },
});
