import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, LAYOUT, SHADOWS, SPACING } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { supabase } from '../config/supabase';

interface GameSession {
    id: string;
    group_id: string;
    creator_id: string;
    duration_minutes: number;
    interval_minutes: number;
    status: string;
    started_at: string;
    next_task_at: string;
    current_round: number;
    group?: {
        id: string;
        name: string;
        creator: {
            id: string;
            name: string;
            username: string;
        };
    };
}

interface GameRound {
    id: string;
    session_id: string;
    round_number: number;
    status: string;
    started_at: string;
    task: {
        id: string;
        title: string;
        description: string;
        requires_photo: boolean;
        requires_timer: boolean;
        badge_name?: string;
    };
    player: {
        id: string;
        username: string;
        name: string;
        profile_picture: string;
    };
}

interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    status: string;
    profile: {
        id: string;
        username: string;
        name: string;
        profile_picture: string | null;
    };
}

export default function GameActiveScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
    
    const [gameSession, setGameSession] = useState<GameSession | null>(null);
    const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
    const [timeUntilNext, setTimeUntilNext] = useState<string>('');
    const [showShuffle, setShowShuffle] = useState(false);
    const [loading, setLoading] = useState(true);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [shufflingProfiles, setShufflingProfiles] = useState<GroupMember[]>([]);
    const [shuffleAnimations, setShuffleAnimations] = useState<Animated.Value[]>([]);
    const [chosenPlayer, setChosenPlayer] = useState<GroupMember | null>(null);
    const [isStartingShuffle, setIsStartingShuffle] = useState(false);
    const [justCompletedTask, setJustCompletedTask] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [gameTimeRemaining, setGameTimeRemaining] = useState<string>('');

    const loadGameData = useCallback(async () => {
        if (!sessionId) return;

        try {
            const [session, round] = await Promise.all([
                authService.getGameSession(sessionId),
                authService.getCurrentRound(sessionId)
            ]);
            
            // Get group details including creator info and members
            if (session.group_id) {
                const [groupDetails, members] = await Promise.all([
                    authService.getGroupDetails(session.group_id),
                    authService.getGroupMembers(session.group_id)
                ]);
                session.group = groupDetails;
                setGroupMembers(members);
            }
            
            setGameSession(session);
            setCurrentRound(round);

            // If game is already completed, show leaderboard
            if (session.status === 'completed') {
                const leaderboard = await authService.getGameLeaderboard(sessionId);
                setLeaderboardData(leaderboard);
                setShowLeaderboard(true);
            }
        } catch (error) {
            console.error('Failed to load game data:', error);
            Alert.alert('Error', 'Could not load game data');
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    const startShuffle = useCallback(async () => {
        if (!sessionId || !gameSession || groupMembers.length === 0 || isStartingShuffle) return;

        setIsStartingShuffle(true);
        setShowShuffle(true);
        
        // Create shuffling effect with profile pictures
        const shuffleProfiles = [...groupMembers];
        setShufflingProfiles(shuffleProfiles);
        
        // Create individual animation values for each profile
        const animations = shuffleProfiles.map(() => new Animated.Value(0));
        setShuffleAnimations(animations);

        try {
            // Create new round to get the chosen player
            const newRound = await authService.createGameRound(sessionId, gameSession.group_id);
            
            // Find the chosen player in our group members
            const chosen = shuffleProfiles.find(member => member.profile.id === newRound.player.id);
            setChosenPlayer(chosen || shuffleProfiles[0]);
            
            // Start the smooth shuffling animation
            const shuffleDuration = 2000; // 2 seconds of shuffling
            const settleDuration = 1000; // 1 second to settle
            
            // Create continuous circular motion for each profile
            const shuffleAnimations = animations.map((anim) => {
                return Animated.loop(
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000, // 2 seconds per full rotation
                        useNativeDriver: true,
                    })
                );
            });
            
            // Start all shuffle animations
            Animated.parallel(shuffleAnimations).start();
            
            // After shuffling, settle the chosen player on top
            setTimeout(() => {
                // Stop all shuffle animations
                shuffleAnimations.forEach(anim => anim.stop());
                
                // Smooth settle animation - bring chosen player to center, fade others
                const settleAnimations = animations.map((anim) => {
                    return Animated.timing(anim, {
                        toValue: -1, // All go to settle position
                        duration: settleDuration,
                        useNativeDriver: true,
                    });
                });
                
                Animated.parallel(settleAnimations).start();
                
                // After settling animation, show the result
                setTimeout(() => {
                    setShowShuffle(false);
                    setCurrentRound(newRound);
                    setChosenPlayer(null);
                    setShuffleAnimations([]);
                    setIsStartingShuffle(false);
                }, settleDuration + 300);
                
            }, shuffleDuration);
            
        } catch (error) {
            console.error('Failed to start new round:', error);
            Alert.alert('Error', 'Could not start new round');
            setShowShuffle(false);
            setChosenPlayer(null);
            setShuffleAnimations([]);
            setIsStartingShuffle(false);
        }
    }, [sessionId, gameSession, groupMembers, isStartingShuffle]);

    const handleCompleteTask = async () => {
        if (!currentRound) return;

        // For tasks requiring photo or timer, navigate to appropriate screen
        if (currentRound.task.requires_photo) {
            router.push(`/game-photo?roundId=${currentRound.id}`);
        } else if (currentRound.task.requires_timer) {
            router.push(`/game-timer?roundId=${currentRound.id}`);
        } else {
            // Simple completion
            try {
                await authService.completeGameRound(currentRound.id);
                Alert.alert('Task Completed! ✅', 'Well done! Wait for the next task.');
                setCurrentRound(null);
                setJustCompletedTask(true);
                // Reload game data to get updated session with new timer
                loadGameData();
                // Reset the flag after a short delay to allow for proper timer setup
                setTimeout(() => setJustCompletedTask(false), 2000);
            } catch {
                Alert.alert('Error', 'Could not complete task');
            }
        }
    };

    const handlePassTask = async () => {
        if (!currentRound) return;

        Alert.alert(
            'Pass Task',
            'Are you sure you want to pass this task? You won\'t get points for it.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Pass', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.passGameRound(currentRound.id);
                            Alert.alert('Task Passed', 'Task skipped. Wait for the next task.');
                            setCurrentRound(null);
                            setJustCompletedTask(true);
                            // Reload game data to get updated session with new timer
                            loadGameData();
                            // Reset the flag after a short delay to allow for proper timer setup
                            setTimeout(() => setJustCompletedTask(false), 2000);
                        } catch {
                            Alert.alert('Error', 'Could not pass task');
                        }
                    }
                }
            ]
        );
    };

    const checkGameExpiration = useCallback(async () => {
        if (!gameSession || gameSession.status !== 'active') return;

        const gameStartTime = new Date(gameSession.started_at);
        const gameEndTime = new Date(gameStartTime.getTime() + gameSession.duration_minutes * 60000);
        const now = new Date();

        if (now >= gameEndTime) {
            // Game has expired, end it and show leaderboard
            try {
                await authService.endGameSession(gameSession.id);
                const leaderboard = await authService.getGameLeaderboard(gameSession.id);
                setLeaderboardData(leaderboard);
                setShowLeaderboard(true);
            } catch (error) {
                console.error('Failed to end game and load leaderboard:', error);
                Alert.alert('Game Ended', 'The game time has expired!');
            }
        }
    }, [gameSession]);

    const updateTimeUntilNext = useCallback(() => {
        if (!gameSession) return;

        const now = new Date();

        // Check if game has expired first
        checkGameExpiration();

        // Calculate remaining game time
        const gameEndTime = new Date(gameSession.started_at);
        gameEndTime.setMinutes(gameEndTime.getMinutes() + gameSession.duration_minutes);
        const gameTimeDiff = gameEndTime.getTime() - now.getTime();
        
        if (gameTimeDiff > 0) {
            const gameHours = Math.floor(gameTimeDiff / 3600000);
            const gameMinutes = Math.floor((gameTimeDiff % 3600000) / 60000);
            const gameSeconds = Math.floor((gameTimeDiff % 60000) / 1000);
            
            if (gameHours > 0) {
                setGameTimeRemaining(`${gameHours}h ${gameMinutes}m left`);
            } else if (gameMinutes > 0) {
                setGameTimeRemaining(`${gameMinutes}m ${gameSeconds}s left`);
            } else {
                setGameTimeRemaining(`${gameSeconds}s left`);
            }
        } else {
            setGameTimeRemaining('Time expired');
        }

        // Calculate next task time
        const nextTaskTime = new Date(gameSession.next_task_at);
        const diff = nextTaskTime.getTime() - now.getTime();

        if (diff <= 0) {
            setTimeUntilNext('New task available!');
            // Auto-start shuffle when time is up and no current round
            if (!currentRound && !showShuffle && !isStartingShuffle && !justCompletedTask && gameSession.status === 'active') {
                startShuffle();
            }
        } else {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeUntilNext(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
    }, [gameSession, currentRound, showShuffle, isStartingShuffle, justCompletedTask, startShuffle, checkGameExpiration]);

    useEffect(() => {
        loadGameData();
    }, [loadGameData]);

    // Real-time subscriptions — keeps all players in sync without manual polling
    useEffect(() => {
        if (!sessionId) return;

        const channel = supabase
            .channel(`game-session-${sessionId}`)
            // When the session status changes (e.g. game ended by creator)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                async (payload) => {
                    const updated = payload.new as any;
                    setGameSession((prev: any) => prev ? { ...prev, ...updated } : prev);
                    if (updated.status === 'completed') {
                        setShowLeaderboard(true);
                    }
                }
            )
            // When a new round is created (another player started the shuffle)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_rounds',
                    filter: `session_id=eq.${sessionId}`,
                },
                async () => {
                    // Reload current round to pick up the newly created round
                    if (!isStartingShuffle) {
                        const round = await authService.getCurrentRound(sessionId);
                        setCurrentRound(round);
                        setShowShuffle(false);
                    }
                }
            )
            // When a round is completed or passed
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_rounds',
                    filter: `session_id=eq.${sessionId}`,
                },
                async (payload) => {
                    const updated = payload.new as any;
                    if (updated.status === 'completed' || updated.status === 'passed') {
                        setCurrentRound(null);
                        // Reload full session to get updated next_task_at timer
                        const session = await authService.getGameSession(sessionId);
                        setGameSession((prev: any) => prev ? { ...prev, ...session } : prev);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, isStartingShuffle]);

    // Refresh data when screen comes into focus (e.g., after completing photo task)
    useFocusEffect(
        useCallback(() => {
            loadGameData();
        }, [loadGameData])
    );

    useEffect(() => {
        if (gameSession) {
            const interval = setInterval(updateTimeUntilNext, 1000);
            return () => clearInterval(interval);
        }
    }, [gameSession, updateTimeUntilNext]);

    // Navigate to summary when game ends — never call router inside render
    useEffect(() => {
        if (showLeaderboard && sessionId) {
            router.replace(`/game-summary?sessionId=${sessionId}`);
        }
    }, [showLeaderboard, sessionId]);

    const isCurrentPlayer = currentRound && user && currentRound.player.id === user.id;
    const canStartNewRound = !currentRound && gameSession?.status === 'active';

    if (loading) {
        return (
            <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Ionicons name="game-controller" size={20} color={COLORS.text} style={styles.headerIcon} />
                    <ThemedText style={styles.title}>{gameSession?.group?.name || 'Active Game'}</ThemedText>
                </View>
                {gameSession && user && gameSession.creator_id === user.id ? (
                    <TouchableOpacity style={styles.endButton} onPress={() => {
                        Alert.alert(
                            'End Game?',
                            'Are you sure you want to end the game? This will end the game for all players.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'End Game', 
                                    style: 'destructive',
                                    onPress: async () => {
                                        if (sessionId) {
                                            try {
                                                await authService.endGameSession(sessionId);
                                                const leaderboard = await authService.getGameLeaderboard(sessionId);
                                                setLeaderboardData(leaderboard);
                                                setShowLeaderboard(true);
                                            } catch (error) {
                                                console.error('Failed to end game and load leaderboard:', error);
                                                Alert.alert('Error', 'Failed to end game');
                                            }
                                        }
                                    }
                                }
                            ]
                        );
                    }}>
                        <Ionicons name="stop" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.infoButton} onPress={() => {
                        const creatorUsername = gameSession?.group?.creator?.username || 'the group creator';
                        Alert.alert(
                            'Cannot End Game',
                            `Only @${creatorUsername} can end this game.`,
                            [{ text: 'OK' }]
                        );
                    }}>
                        <Ionicons name="information-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Game Status */}
            <View style={styles.statusContainer}>
                <View style={styles.statusCard}>
                    <View style={styles.statusLeft}>
                        <View style={styles.statusItem}>
                            <Ionicons name="timer" size={16} color={COLORS.partyOrange} />
                            <ThemedText style={styles.statusText}>
                                Next task: {timeUntilNext}
                            </ThemedText>
                        </View>
                        <View style={styles.statusItem}>
                            <Ionicons name="trophy" size={16} color={COLORS.partyBlue} />
                            <ThemedText style={styles.roundText}>
                                Round {gameSession?.current_round || 1}
                            </ThemedText>
                        </View>
                        <View style={styles.statusItem}>
                            <Ionicons name="hourglass" size={16} color={COLORS.partyGreen} />
                            <ThemedText style={styles.gameTimeText}>
                                {gameTimeRemaining}
                            </ThemedText>
                        </View>
                    </View>
                    {gameSession && user && gameSession.creator_id !== user.id && (
                        <View style={styles.statusRight}>
                            <View style={styles.creatorCard}>
                                <Ionicons name="person" size={14} color={COLORS.textSecondary} />
                                <ThemedText style={styles.creatorInfo}>
                                    @{gameSession.group?.creator?.username || 'Creator'}
                                </ThemedText>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.content}>
                {showShuffle ? (
                    /* Shuffle Animation */
                    <View style={styles.shuffleContainer}>
                        <View style={styles.shuffleArea}>
                            {/* Center indicator */}
                            <View style={styles.centerIndicator} />
                            {shufflingProfiles.map((member, index) => {
                                const animationValue = shuffleAnimations[index] || new Animated.Value(0);
                                const isChosenPlayer = chosenPlayer && member.profile.id === chosenPlayer.profile.id;
                                
                                return (
                                    <Animated.View
                                        key={member.id}
                                        style={[
                                            styles.shuffleProfileContainer,
                                            {
                                                transform: [
                                                    {
                                                        translateX: animationValue.interpolate({
                                                            inputRange: [-1, 0, 1],
                                                            outputRange: [
                                                                0, // Final position (center)
                                                                Math.cos((index * 2 * Math.PI) / shufflingProfiles.length) * 60, // Starting position on circle
                                                                Math.cos(((index * 2 * Math.PI) / shufflingProfiles.length) + (2 * Math.PI)) * 60, // Full rotation
                                                            ],
                                                        })
                                                    },
                                                    {
                                                        translateY: animationValue.interpolate({
                                                            inputRange: [-1, 0, 1],
                                                            outputRange: [
                                                                0, // Final position (center)
                                                                Math.sin((index * 2 * Math.PI) / shufflingProfiles.length) * 60, // Starting position on circle
                                                                Math.sin(((index * 2 * Math.PI) / shufflingProfiles.length) + (2 * Math.PI)) * 60, // Full rotation
                                                            ],
                                                        })
                                                    },
                                                    {
                                                        scale: animationValue.interpolate({
                                                            inputRange: [-1, 0, 0.25, 0.5, 0.75, 1],
                                                            outputRange: [
                                                                isChosenPlayer ? 1.3 : 0.2, // Final scale (chosen player larger)
                                                                0.8,                          // Start scale
                                                                1.0,                          // Quarter rotation
                                                                0.8,                          // Half rotation
                                                                1.0,                          // Three-quarter rotation
                                                                0.8                           // Full rotation
                                                            ],
                                                        })
                                                    }
                                                ],
                                                zIndex: isChosenPlayer ? 100 : 10 + index,
                                                opacity: animationValue.interpolate({
                                                    inputRange: [-1, 0, 1],
                                                    outputRange: [
                                                        isChosenPlayer ? 1 : 0.1, // Final opacity (chosen player visible, others fade)
                                                        0.8,                       // Start opacity
                                                        0.8                        // Rotation opacity
                                                    ],
                                                }),

                                            }
                                        ]}
                                    >
                                        {member.profile.profile_picture ? (
                                            <Image 
                                                source={{ uri: member.profile.profile_picture }} 
                                                style={[
                                                    styles.shuffleProfilePicture,
                                                    isChosenPlayer && styles.chosenProfilePicture
                                                ]} 
                                            />
                                        ) : (
                                            <View style={[
                                                styles.shuffleProfilePlaceholder,
                                                isChosenPlayer && styles.chosenProfilePlaceholder
                                            ]}>
                                                <ThemedText style={styles.shuffleProfileInitial}>
                                                    {member.profile.username.charAt(0).toUpperCase()}
                                                </ThemedText>
                                            </View>
                                        )}
                                    </Animated.View>
                                );
                            })}
                        </View>
                        <ThemedText style={styles.shuffleText}>
                            {chosenPlayer ? `${chosenPlayer.profile.username} is chosen!` : 'Choosing player...'}
                        </ThemedText>
                    </View>
                ) : currentRound ? (
                    /* Current Task */
                    <View style={styles.taskContainer}>
                        <View style={styles.playerSection}>
                            <ThemedText style={styles.playerTitle}>
                                {isCurrentPlayer ? 'Your turn!' : `@${currentRound.player.username} is up`}
                            </ThemedText>
                            <View style={styles.playerInfo}>
                                <View style={styles.playerAvatar}>
                                    {currentRound.player.profile_picture ? (
                                        <Image 
                                            source={{ uri: currentRound.player.profile_picture }} 
                                            style={styles.playerProfilePicture} 
                                        />
                                    ) : (
                                        <ThemedText style={styles.playerInitial}>
                                            {currentRound.player.username.charAt(0).toUpperCase()}
                                        </ThemedText>
                                    )}
                                </View>
                                <ThemedText style={styles.playerName}>
                                    @{currentRound.player.username}
                                </ThemedText>
                            </View>
                        </View>

                        {isCurrentPlayer && (
                            <View style={styles.taskCard}>
                                <ThemedText style={styles.taskTitle}>
                                    {currentRound.task.title}
                                </ThemedText>
                                <ThemedText style={styles.taskDescription}>
                                    {currentRound.task.description}
                                </ThemedText>
                                
                                {currentRound.task.requires_photo && (
                                    <View style={styles.taskRequirement}>
                                        <Ionicons name="camera" size={16} color={COLORS.partyOrange} />
                                        <ThemedText style={styles.requirementText}>Photo required</ThemedText>
                                    </View>
                                )}
                                
                                {currentRound.task.requires_timer && (
                                    <View style={styles.taskRequirement}>
                                        <Ionicons name="timer" size={16} color={COLORS.partyOrange} />
                                        <ThemedText style={styles.requirementText}>Timer required</ThemedText>
                                    </View>
                                )}

                                {currentRound.task.badge_name && (
                                    <View style={styles.badgeInfo}>
                                        <Ionicons name="medal" size={16} color={COLORS.partyGreen} />
                                        <ThemedText style={styles.badgeText}>
                                            Badge: {currentRound.task.badge_name}
                                        </ThemedText>
                                    </View>
                                )}

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.completeButton}
                                        onPress={handleCompleteTask}
                                    >
                                        <ThemedText style={styles.completeButtonText}>
                                            {currentRound.task.requires_photo || currentRound.task.requires_timer 
                                                ? 'Start Task' 
                                                : 'Task Completed'
                                            }
                                        </ThemedText>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={styles.passButton}
                                        onPress={handlePassTask}
                                    >
                                        <ThemedText style={styles.passButtonText}>
                                            Pass
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {!isCurrentPlayer && (
                            <View style={styles.waitingCard}>
                                <Ionicons name="hourglass" size={48} color={COLORS.textMuted} />
                                <ThemedText style={styles.waitingText}>
                                    Wait until @{currentRound.player.username} is done...
                                </ThemedText>
                            </View>
                        )}
                    </View>
                ) : canStartNewRound ? (
                    /* Waiting for automatic task start */
                    <View style={styles.waitingContainer}>
                        <Ionicons name="hourglass" size={48} color={COLORS.partyOrange} />
                        <ThemedText style={styles.waitingTitle}>
                            {gameSession?.current_round === 0 ? 'Starting first challenge...' : 'Get ready! Next task starting soon...'}
                        </ThemedText>
                    </View>
                ) : (
                    /* Waiting */
                    <View style={styles.waitingContainer}>
                        <Ionicons name="time" size={48} color={COLORS.textMuted} />
                        <ThemedText style={styles.waitingTitle}>
                            Waiting for next task...
                        </ThemedText>
                    </View>
                )}
            </View>

            {/* Navigation to game summary is handled by useEffect above */}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    headerIcon: {
        marginRight: SPACING.xs,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    endButton: {
        padding: SPACING.sm,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
    },
    infoButton: {
        padding: SPACING.sm,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
    },
    statusContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    statusCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
    statusLeft: {
        flex: 1,
        gap: SPACING.sm,
    },
    statusRight: {
        alignItems: 'flex-end',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    creatorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
    },
    creatorInfo: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    roundText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    gameTimeText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shuffleContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.massive,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        marginHorizontal: SPACING.md,
        ...SHADOWS.sm,
    },
    shuffleArea: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        position: 'relative',
    },
    centerIndicator: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.partyOrange + '40',
        borderStyle: 'dashed',
        position: 'absolute',
        zIndex: 1,
    },
    shuffleProfileContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shuffleProfilePicture: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: COLORS.partyOrange,
    },
    chosenProfilePicture: {
        borderColor: COLORS.partyGreen,
        borderWidth: 4,
        ...SHADOWS.lg,
    },
    shuffleProfilePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.partyOrange,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.partyOrange,
    },
    chosenProfilePlaceholder: {
        backgroundColor: COLORS.partyGreen,
        borderColor: COLORS.partyGreen,
        borderWidth: 4,
        ...SHADOWS.lg,
    },
    shuffleProfileInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
    },

    shuffleText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    taskContainer: {
        gap: SPACING.lg,
    },
    playerSection: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    playerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    playerInfo: {
        alignItems: 'center',
        gap: SPACING.sm,
    },
    playerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.partyOrange,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerProfilePicture: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    playerInitial: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    taskCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.xl,
        borderWidth: 2,
        borderColor: COLORS.partyOrange + '40',
        ...SHADOWS.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    taskDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: SPACING.md,
    },
    taskRequirement: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    requirementText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    badgeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
        marginBottom: SPACING.md,
        padding: SPACING.sm,
        backgroundColor: COLORS.partyGreen + '20',
        borderRadius: BORDER_RADIUS.sm,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.partyGreen,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.lg,
    },
    completeButton: {
        flex: 1,
        backgroundColor: COLORS.partyOrange,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.partyOrange,
        elevation: 8,
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    passButton: {
        flex: 1,
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.textSecondary + '40',
        ...SHADOWS.sm,
        elevation: 4,
    },
    passButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    waitingCard: {
        alignItems: 'center',
        paddingVertical: SPACING.massive,
        gap: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        marginHorizontal: SPACING.md,
        ...SHADOWS.sm,
    },
    waitingText: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
    },

    waitingContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.massive,
        gap: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        marginHorizontal: SPACING.md,
        ...SHADOWS.sm,
    },
    waitingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textMuted,
        textAlign: 'center',
    },

    // Leaderboard styles
    leaderboardOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    leaderboardModal: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        margin: SPACING.lg,
        maxWidth: '90%',
        width: '100%',
        maxHeight: '80%',
        ...SHADOWS.lg,
    },
    leaderboardHeader: {
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    leaderboardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: SPACING.sm,
    },
    leaderboardSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    leaderboardList: {
        padding: SPACING.md,
        maxHeight: 400,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '40',
    },
    leaderboardRank: {
        width: 40,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    firstPlaceRank: {
        color: COLORS.partyOrange,
    },
    leaderboardPlayer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.md,
    },
    leaderboardAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    leaderboardAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.partyOrange,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leaderboardAvatarInitial: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    leaderboardPlayerInfo: {
        marginLeft: SPACING.sm,
        flex: 1,
    },
    leaderboardPlayerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    leaderboardPlayerStats: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    leaderboardScore: {
        alignItems: 'center',
        minWidth: 60,
    },
    scoreText: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    firstPlaceScore: {
        color: COLORS.partyOrange,
    },
    scoreLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    leaderboardCloseButton: {
        backgroundColor: COLORS.partyOrange,
        margin: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    leaderboardCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
