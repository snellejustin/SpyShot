import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getBadgeIcon, getBadgeTier } from '@/constants/badges';
import { BORDER_RADIUS, COLORS, LAYOUT, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import { haptic } from '../../../utils/haptics';

const REACTION_EMOJIS = [
    { key: 'fire', label: '\u{1F525}' },
    { key: 'clap', label: '\u{1F44F}' },
    { key: 'laugh', label: '\u{1F602}' },
    { key: 'heart', label: '\u{2764}\u{FE0F}' },
    { key: 'skull', label: '\u{1F480}' },
];

const BADGE_TYPE_ICONS: Record<string, string> = {
    badge_earned: 'medal',
    task_completed: 'checkmark-circle',
    level_up: 'arrow-up-circle',
    group_joined: 'people',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
}

interface FeedItem {
    id: string;
    user_id: string;
    type: string;
    title: string;
    subtitle: string | null;
    photo_url: string | null;
    badge_name: string | null;
    tier_name: string | null;
    group: { name: string } | null;
    created_at: string;
    user: {
        id: string;
        username: string;
        name: string;
        profile_picture: string | null;
    };
    reactions: { id: string; emoji: string; user_id: string }[];
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { user, notificationCount, refreshNotificationCount } = useAuth();
    const [tab, setTab] = useState<'friends' | 'explore'>('friends');
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeGameSession, setActiveGameSession] = useState<any>(null);
    const [timeUntilNext, setTimeUntilNext] = useState('');
    const [gameTimeRemaining, setGameTimeRemaining] = useState('');
    const [openReactionId, setOpenReactionId] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [readyFriends, setReadyFriends] = useState<any[]>([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const loadFeed = useCallback(async () => {
        if (!user) return;
        try {
            const data = tab === 'friends'
                ? await authService.getFriendsFeed(user.id)
                : await authService.getExploreFeed(user.id);
            setFeed(data);
        } catch {
            // fail silently
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, tab]);

    const loadActiveGame = useCallback(async () => {
        if (!user) return;
        try {
            const sessions = await authService.getUserActiveGameSessions(user.id);
            setActiveGameSession(sessions.length > 0 ? sessions[0] : null);
        } catch {
            setActiveGameSession(null);
        }
    }, [user]);

    const loadReadyFriends = useCallback(async () => {
        if (!user) return;
        const ready = await authService.getReadyFriends(user.id);
        setReadyFriends(ready);
    }, [user]);

    const toggleReady = async () => {
        if (!user) return;
        haptic.medium();
        const newReady = !isReady;
        setIsReady(newReady);
        try {
            await authService.setReadyToPlay(user.id, newReady);
            if (newReady) loadReadyFriends();
        } catch {
            setIsReady(!newReady); // revert
        }
    };

    useEffect(() => {
        if (user) {
            refreshNotificationCount();
            loadActiveGame();
            loadReadyFriends();
        }
    }, [user, refreshNotificationCount, loadActiveGame, loadReadyFriends]);

    useEffect(() => {
        setLoading(true);
        loadFeed();
    }, [tab, loadFeed]);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadFeed();
                loadActiveGame();
            }
        }, [user, loadFeed, loadActiveGame])
    );

    // Active game timer
    useEffect(() => {
        if (!activeGameSession) return;
        const update = () => {
            const now = new Date();
            const end = new Date(activeGameSession.started_at);
            end.setMinutes(end.getMinutes() + activeGameSession.duration_minutes);
            const diff = end.getTime() - now.getTime();
            if (diff <= 0) { setActiveGameSession(null); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setGameTimeRemaining(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
            const nextDiff = new Date(activeGameSession.next_task_at).getTime() - now.getTime();
            setTimeUntilNext(nextDiff <= 0 ? 'Now!' : `${Math.floor(nextDiff / 60000)}:${String(Math.floor((nextDiff % 60000) / 1000)).padStart(2, '0')}`);
        };
        update();
        const interval = setInterval(update, 1000);
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => { clearInterval(interval); pulse.stop(); };
    }, [activeGameSession, pulseAnim]);

    const handleReaction = async (feedItemId: string, emoji: string) => {
        if (!user) return;
        haptic.light();
        const item = feed.find(f => f.id === feedItemId);
        const existing = item?.reactions.find(r => r.user_id === user.id);

        // Optimistic update
        setFeed(prev => prev.map(f => {
            if (f.id !== feedItemId) return f;
            const filtered = f.reactions.filter(r => r.user_id !== user.id);
            if (existing?.emoji === emoji) {
                return { ...f, reactions: filtered };
            }
            return { ...f, reactions: [...filtered, { id: 'temp', emoji, user_id: user.id }] };
        }));
        setOpenReactionId(null);

        try {
            if (existing?.emoji === emoji) {
                await authService.removeReaction(feedItemId, user.id);
            } else {
                await authService.addReaction(feedItemId, user.id, emoji);
            }
        } catch {
            loadFeed(); // revert on error
        }
    };

    const renderFeedItem = ({ item }: { item: FeedItem }) => {
        const iconName = BADGE_TYPE_ICONS[item.type] || 'star';
        const reactionCounts: Record<string, number> = {};
        const myReaction = item.reactions.find(r => r.user_id === user?.id);
        item.reactions.forEach(r => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });

        return (
            <View style={styles.feedCard}>
                {/* User row */}
                <TouchableOpacity
                    style={styles.feedUserRow}
                    onPress={() => {
                        if (item.user.id !== user?.id) {
                            router.push(`/user-profile?userId=${item.user.id}`);
                        }
                    }}
                    activeOpacity={item.user.id === user?.id ? 1 : 0.7}
                >
                    {item.user.profile_picture ? (
                        <Image source={{ uri: item.user.profile_picture }} style={styles.feedAvatar} />
                    ) : (
                        <View style={[styles.feedAvatar, styles.feedAvatarPlaceholder]}>
                            <Text style={styles.feedAvatarInitial}>
                                {item.user.username.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={styles.feedUserInfo}>
                        <ThemedText style={styles.feedUsername}>
                            {item.user.id === user?.id ? 'You' : `@${item.user.username}`}
                        </ThemedText>
                        <ThemedText style={styles.feedTime}>{timeAgo(item.created_at)}</ThemedText>
                    </View>
                    {item.group && (
                        <View style={styles.feedGroupBadge}>
                            <ThemedText style={styles.feedGroupText}>{item.group.name}</ThemedText>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.feedContent}>
                    <View style={styles.feedTitleRow}>
                        <Ionicons name={iconName as any} size={18} color={COLORS.primary} />
                        <ThemedText style={styles.feedTitle}>{item.title}</ThemedText>
                    </View>
                    {item.subtitle && (
                        <ThemedText style={styles.feedSubtitle}>{item.subtitle}</ThemedText>
                    )}
                </View>

                {/* Photo */}
                {item.photo_url && (
                    <Image source={{ uri: item.photo_url }} style={styles.feedPhoto} />
                )}

                {/* Badge visual */}
                {item.badge_name && (
                    <View style={styles.feedBadgeRow}>
                        <View style={[styles.feedBadgeIcon, { backgroundColor: COLORS.primary + '20' }]}>
                            <Ionicons
                                name={getBadgeIcon(item.badge_name) as any}
                                size={20}
                                color={COLORS.primary}
                            />
                        </View>
                        <ThemedText style={styles.feedBadgeName}>{item.badge_name}</ThemedText>
                    </View>
                )}

                {/* Reactions */}
                <View style={styles.feedReactions}>
                    {/* Existing reactions */}
                    {Object.entries(reactionCounts).map(([emoji, count]) => {
                        const emojiObj = REACTION_EMOJIS.find(e => e.key === emoji);
                        const isMyReaction = myReaction?.emoji === emoji;
                        return (
                            <TouchableOpacity
                                key={emoji}
                                style={[styles.reactionChip, isMyReaction && styles.reactionChipActive]}
                                onPress={() => handleReaction(item.id, emoji)}
                            >
                                <Text style={styles.reactionEmoji}>{emojiObj?.label || emoji}</Text>
                                <ThemedText style={[styles.reactionCount, isMyReaction && styles.reactionCountActive]}>
                                    {count}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Add reaction button */}
                    <TouchableOpacity
                        style={styles.addReactionButton}
                        onPress={() => setOpenReactionId(openReactionId === item.id ? null : item.id)}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Reaction picker */}
                {openReactionId === item.id && (
                    <View style={styles.reactionPicker}>
                        {REACTION_EMOJIS.map(e => (
                            <TouchableOpacity
                                key={e.key}
                                style={[
                                    styles.reactionPickerItem,
                                    myReaction?.emoji === e.key && styles.reactionPickerItemActive,
                                ]}
                                onPress={() => handleReaction(item.id, e.key)}
                            >
                                <Text style={styles.reactionPickerEmoji}>{e.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const handleJoinActiveGame = async () => {
        if (!activeGameSession) return;
        try {
            const session = await authService.getGameSession(activeGameSession.id);
            if (session?.status === 'active') {
                router.push(`/game-active?sessionId=${activeGameSession.id}`);
            } else {
                setActiveGameSession(null);
            }
        } catch {
            router.push(`/game-active?sessionId=${activeGameSession.id}`);
        }
    };

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.md }]}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText style={styles.headerTitle}>SpyShot</ThemedText>
                <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/notifications')}>
                    <Ionicons name="notifications" size={22} color={COLORS.text} />
                    {notificationCount > 0 && (
                        <View style={styles.notifBadge}>
                            <Text style={styles.notifBadgeText}>{notificationCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Tab switcher */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'friends' && styles.tabActive]}
                    onPress={() => setTab('friends')}
                >
                    <ThemedText style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
                        Friends
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'explore' && styles.tabActive]}
                    onPress={() => setTab('explore')}
                >
                    <ThemedText style={[styles.tabText, tab === 'explore' && styles.tabTextActive]}>
                        Explore
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {/* Feed */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={feed}
                    keyExtractor={item => item.id}
                    renderItem={renderFeedItem}
                    contentContainerStyle={styles.feedList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadFeed(); }}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                    ListHeaderComponent={
                        <View>
                            {/* Active game card */}
                            {activeGameSession && (
                                <Animated.View style={[styles.activeGameContainer, { transform: [{ scale: pulseAnim }] }]}>
                                    <TouchableOpacity style={styles.activeGameCard} onPress={handleJoinActiveGame}>
                                        <View style={styles.activeGameContent}>
                                            <View style={styles.activeGameRow}>
                                                <Ionicons name="game-controller" size={18} color={COLORS.white} />
                                                <ThemedText style={styles.activeGameTitle}>
                                                    {activeGameSession.group?.name || 'Active Game'}
                                                </ThemedText>
                                            </View>
                                            <View style={styles.activeGameTimers}>
                                                <View style={styles.timerChip}>
                                                    <Ionicons name="timer" size={14} color={COLORS.white} />
                                                    <ThemedText style={styles.timerText}>{timeUntilNext}</ThemedText>
                                                </View>
                                                <View style={styles.timerChip}>
                                                    <Ionicons name="hourglass" size={14} color={COLORS.white} />
                                                    <ThemedText style={styles.timerText}>{gameTimeRemaining}</ThemedText>
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
                                    </TouchableOpacity>
                                </Animated.View>
                            )}

                            {/* Who's Down? */}
                            {tab === 'friends' && (
                                <View style={styles.readySection}>
                                    <TouchableOpacity
                                        style={[styles.readyToggle, isReady && styles.readyToggleActive]}
                                        onPress={toggleReady}
                                    >
                                        <Ionicons name={isReady ? 'flash' : 'flash-outline'} size={16} color={isReady ? COLORS.gray900 : COLORS.partyGreen} />
                                        <ThemedText style={[styles.readyToggleText, isReady && styles.readyToggleTextActive]}>
                                            {isReady ? "You're down!" : "I'm down to play"}
                                        </ThemedText>
                                    </TouchableOpacity>
                                    {readyFriends.length > 0 && (
                                        <View style={styles.readyFriends}>
                                            {readyFriends.slice(0, 5).map((f: any) => (
                                                <View key={f.id} style={styles.readyFriendChip}>
                                                    {f.profile_picture ? (
                                                        <Image source={{ uri: f.profile_picture }} style={styles.readyAvatar} />
                                                    ) : (
                                                        <View style={[styles.readyAvatar, styles.readyAvatarPlaceholder]}>
                                                            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.text }}>
                                                                {f.username?.charAt(0).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    <ThemedText style={styles.readyFriendName}>@{f.username}</ThemedText>
                                                </View>
                                            ))}
                                            {readyFriends.length > 5 && (
                                                <ThemedText style={styles.readyMore}>+{readyFriends.length - 5} more</ThemedText>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={tab === 'friends' ? 'people-outline' : 'compass-outline'}
                                size={64}
                                color={COLORS.textMuted}
                            />
                            <ThemedText style={styles.emptyTitle}>
                                {tab === 'friends' ? 'No activity yet' : 'Nothing to explore yet'}
                            </ThemedText>
                            <ThemedText style={styles.emptySubtitle}>
                                {tab === 'friends'
                                    ? 'Add friends and play games to see their activity here'
                                    : 'As more people join SpyShot, their activity will show up here'}
                            </ThemedText>
                        </View>
                    }
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.xxl,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    notifButton: {
        position: 'relative',
        padding: SPACING.xs,
    },
    notifBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.partyPink,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedList: {
        paddingBottom: SPACING.xxxl,
    },
    // Active game card
    activeGameContainer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    activeGameCard: {
        backgroundColor: COLORS.partyGreen,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.partyGreen,
    },
    activeGameContent: {
        flex: 1,
    },
    activeGameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    activeGameTitle: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: '700',
        color: COLORS.white,
    },
    activeGameTimers: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    timerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    timerText: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Who's Down
    readySection: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    readyToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.partyGreen,
        gap: SPACING.sm,
    },
    readyToggleActive: {
        backgroundColor: COLORS.partyGreen,
        borderColor: COLORS.partyGreen,
    },
    readyToggleText: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: '600',
        color: COLORS.partyGreen,
    },
    readyToggleTextActive: {
        color: COLORS.gray900,
    },
    readyFriends: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: SPACING.sm,
        flexWrap: 'wrap',
    },
    readyFriendChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.xl,
        gap: 4,
    },
    readyAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    readyAvatarPlaceholder: {
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    readyFriendName: {
        fontSize: 11,
        color: COLORS.text,
        fontWeight: '500',
    },
    readyMore: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    // Feed item
    feedCard: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    feedUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    feedAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    feedAvatarPlaceholder: {
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedAvatarInitial: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: '700',
        color: COLORS.text,
    },
    feedUserInfo: {
        flex: 1,
    },
    feedUsername: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    feedTime: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
    },
    feedGroupBadge: {
        backgroundColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    feedGroupText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    feedContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    feedTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    feedTitle: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    feedSubtitle: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
        marginLeft: SPACING.sm + 18, // align with title text
    },
    feedPhoto: {
        width: '100%',
        height: 250,
    },
    feedBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    feedBadgeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedBadgeName: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // Reactions
    feedReactions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        gap: SPACING.sm,
        flexWrap: 'wrap',
    },
    reactionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.xl,
        gap: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    reactionChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '15',
    },
    reactionEmoji: {
        fontSize: 14,
    },
    reactionCount: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    reactionCountActive: {
        color: COLORS.primary,
    },
    addReactionButton: {
        padding: 4,
    },
    reactionPicker: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: SPACING.md,
        gap: SPACING.md,
    },
    reactionPickerItem: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.background,
    },
    reactionPickerItemActive: {
        backgroundColor: COLORS.primary + '25',
    },
    reactionPickerEmoji: {
        fontSize: 22,
    },
    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.massive,
        gap: SPACING.md,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: TYPOGRAPHY.sm * 1.5,
    },
});
