import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS, LAYOUT, SHADOWS, SPACING, TEXT_STYLES } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { user, notificationCount, refreshNotificationCount } = useAuth();
    const [activeGameSession, setActiveGameSession] = useState<any>(null);
    const [timeUntilNext, setTimeUntilNext] = useState<string>('');
    const [gameTimeRemaining, setGameTimeRemaining] = useState<string>('');
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    const loadActiveGameSession = useCallback(async () => {
        if (!user) return;
        
        try {
            const activeSessions = await authService.getUserActiveGameSessions(user.id);
            if (activeSessions.length > 0) {
                setActiveGameSession(activeSessions[0]); // Take the first active session
            } else {
                setActiveGameSession(null);
            }
        } catch (error) {
            console.error('Failed to load active game sessions:', error);
            setActiveGameSession(null);
        }
    }, [user]);

    const updateTimeUntilNext = useCallback(() => {
        if (!activeGameSession) return;

        const now = new Date();
        
        // Calculate game end time
        const gameEndTime = new Date(activeGameSession.started_at);
        gameEndTime.setMinutes(gameEndTime.getMinutes() + activeGameSession.duration_minutes);
        
        // Check if game session has ended
        if (now > gameEndTime) {
            // Game has ended, remove the active game
            setActiveGameSession(null);
            return;
        }

        // Calculate remaining game time
        const gameTimeDiff = gameEndTime.getTime() - now.getTime();
        const gameHours = Math.floor(gameTimeDiff / 3600000);
        const gameMinutes = Math.floor((gameTimeDiff % 3600000) / 60000);
        const gameSeconds = Math.floor((gameTimeDiff % 60000) / 1000);
        
        if (gameHours > 0) {
            setGameTimeRemaining(`${gameHours}h ${gameMinutes}m remaining`);
        } else if (gameMinutes > 0) {
            setGameTimeRemaining(`${gameMinutes}m ${gameSeconds}s remaining`);
        } else {
            setGameTimeRemaining(`${gameSeconds}s remaining`);
        }

        // Calculate next task time
        const nextTaskTime = new Date(activeGameSession.next_task_at);
        const nextTaskDiff = nextTaskTime.getTime() - now.getTime();

        if (nextTaskDiff <= 0) {
            setTimeUntilNext('New task available!');
        } else {
            const minutes = Math.floor(nextTaskDiff / 60000);
            const seconds = Math.floor((nextTaskDiff % 60000) / 1000);
            setTimeUntilNext(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
    }, [activeGameSession]);

    const handleJoinActiveGame = async () => {
        if (!activeGameSession) return;
        
        try {
            // Verify the game is still active before navigating
            const currentSession = await authService.getGameSession(activeGameSession.id);
            if (currentSession && currentSession.status === 'active') {
                router.push(`/game-active?sessionId=${activeGameSession.id}`);
            } else {
                // Game is no longer active, refresh the state
                setActiveGameSession(null);
            }
        } catch (error) {
            console.error('Failed to verify game session:', error);
            // Try to navigate anyway, let the game screen handle it
            router.push(`/game-active?sessionId=${activeGameSession.id}`);
        }
    };
    
    const handleCafe = () => {
        if (activeGameSession) {
            Alert.alert(
                'Active Game in Progress',
                'You cannot create a new group while you have an active game. Please finish or leave the current game first.',
                [{ text: 'OK' }]
            );
            return;
        }
        router.push('/create-group?type=cafe');
    };

    const handleHome = () => {
        if (activeGameSession) {
            Alert.alert(
                'Active Game in Progress',
                'You cannot create a new group while you have an active game. Please finish or leave the current game first.',
                [{ text: 'OK' }]
            );
            return;
        }
        router.push('/create-group?type=home');
    };

    const handleNotifications = () => {
        router.push('/notifications');
    };

    useEffect(() => {
        if (user) {
            refreshNotificationCount();
            loadActiveGameSession();
        }
    }, [user, refreshNotificationCount, loadActiveGameSession]);

    useEffect(() => {
        if (activeGameSession) {
            updateTimeUntilNext();
            const interval = setInterval(updateTimeUntilNext, 1000);
            
            // Start pulse animation for active game button
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();
            
            return () => {
                clearInterval(interval);
                pulseAnimation.stop();
            };
        }
    }, [activeGameSession, updateTimeUntilNext, pulseAnim]);

    // Refresh active game session when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadActiveGameSession();
            }
        }, [user, loadActiveGameSession])
    );

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            {/* Header with notification bell */}
            <View style={styles.header}>
                <ThemedText style={TEXT_STYLES.title}>Welcome back!</ThemedText>
                <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
                    <Ionicons name="notifications" size={24} color={COLORS.text} />
                    {notificationCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>{notificationCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Active Game Button */}
            {activeGameSession && (
                <View style={styles.activeGameContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity style={styles.activeGameButton} onPress={handleJoinActiveGame}>
                            {/* Background gradient overlay */}
                            <View style={styles.activeGameOverlay} />
                        <View style={styles.activeGameContent}>
                            <View style={styles.activeGameHeader}>
                                <Ionicons name="game-controller" size={20} color={COLORS.white} style={styles.controllerIcon} />
                                <ThemedText style={styles.activeGameTitle}>{activeGameSession.group.name}</ThemedText>
                            </View>
                            <ThemedText style={styles.activeGameGroup}>
                                {activeGameSession.group.type}
                            </ThemedText>
                            
                            <View style={styles.activeGameTimers}>
                                <View style={styles.activeGameTimer}>
                                    <Ionicons name="timer" size={18} color={COLORS.white} />
                                    <ThemedText style={styles.activeGameTime}>
                                        {timeUntilNext}
                                    </ThemedText>
                                </View>
                                <View style={styles.activeGameTimer}>
                                    <Ionicons name="hourglass" size={18} color={COLORS.white} />
                                    <ThemedText style={styles.activeGameTime}>
                                        {gameTimeRemaining}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                        <View style={styles.activeGameArrow}>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                    </Animated.View>
                </View>
            )}

            <ThemedView style={LAYOUT.centeredSection}>
                <ThemedText style={TEXT_STYLES.subtitle}>
                    {activeGameSession ? 'Or start a new group:' : 'Where are you meeting?'}
                </ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonsContainer}>
                <TouchableOpacity 
                    style={[
                        styles.groupButton, 
                        styles.cafeButton,
                        activeGameSession && styles.disabledButton
                    ]} 
                    onPress={handleCafe}
                    disabled={!!activeGameSession}
                >
                    <Ionicons name="cafe" size={24} color={activeGameSession ? COLORS.textMuted : COLORS.white} style={styles.buttonIcon} />
                    <Text style={[styles.groupButtonText, activeGameSession && styles.disabledButtonText]}>Cafe</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.groupButton, 
                        styles.homeButton,
                        activeGameSession && styles.disabledButton
                    ]} 
                    onPress={handleHome}
                    disabled={!!activeGameSession}
                >
                    <Ionicons name="home" size={24} color={activeGameSession ? COLORS.textMuted : COLORS.white} style={styles.buttonIcon} />
                    <Text style={[styles.groupButtonText, activeGameSession && styles.disabledButtonText]}>Home</Text>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.lg,
    },
    notificationButton: {
        position: 'relative',
        padding: SPACING.xs,
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.partyPink, // Use party pink for notifications
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.massive,
        gap: SPACING.lg,
    },
    groupButton: {
        width: '80%',
        minWidth: 250,
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.lg,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cafeButton: {
        backgroundColor: COLORS.partyPurple, // Purple for cafe
        ...SHADOWS.partyPurple, // Add purple glow effect
    },
    homeButton: {
        backgroundColor: COLORS.partyOrange, // Orange for home
        ...SHADOWS.partyOrange, // Add orange glow effect
    },
    groupButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonIcon: {
        marginRight: SPACING.md,
    },
    activeGameContainer: {
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.lg,
    },
    activeGameButton: {
        backgroundColor: COLORS.partyGreen,
        borderRadius: 20,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.partyGreen,
        elevation: 12,
        borderWidth: 3,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        position: 'relative',
        overflow: 'hidden',
    },
    activeGameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
    },
    activeGameContent: {
        flex: 1,
    },
    activeGameHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    controllerIcon: {
        marginRight: SPACING.xs,
    },
    activeGameTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.white,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    activeGameGroup: {
        fontSize: 14,
        color: COLORS.white,
        opacity: 0.9,
        marginBottom: SPACING.sm,
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        textTransform: 'capitalize',
    },
    activeGameTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
        marginBottom: SPACING.xs,
    },
    activeGameTime: {
        fontSize: 13,
        color: COLORS.white,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    activeGameTimers: {
        gap: SPACING.xs,
    },
    activeGameArrow: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.lg,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: COLORS.surface,
    },
    disabledButtonText: {
        color: COLORS.textMuted,
    },
});