import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, LAYOUT, SHADOWS, SPACING } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export default function GameSetupScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    
    const [selectedDuration, setSelectedDuration] = useState<number>(60);
    const [selectedInterval, setSelectedInterval] = useState<number>(5);
    const [selectedIntensity, setSelectedIntensity] = useState<'chill' | 'wild' | 'extreme'>('wild');
    const [starting, setStarting] = useState(false);

    // Check for active games when screen loads
    useEffect(() => {
        const checkForActiveGames = async () => {
            if (!user) return;

            try {
                const userActiveGames = await authService.getUserActiveGameSessions(user.id);
                
                if (userActiveGames.length > 0) {
                    const activeGame = userActiveGames[0];
                    Alert.alert(
                        'Active Game Found',
                        `You already have an active game in "${activeGame.group.name}". You can only have one active game at a time.`,
                        [
                            { 
                                text: 'Join Active Game', 
                                onPress: () => router.replace(`/game-active?sessionId=${activeGame.id}`)
                            },
                            { 
                                text: 'Go Back', 
                                style: 'cancel',
                                onPress: () => router.back()
                            }
                        ]
                    );
                }
            } catch (error) {
                console.error('Failed to check for active games:', error);
            }
        };

        checkForActiveGames();
    }, [user]);

    const durationOptions = [
        { label: '30 minutes', value: 30 },
        { label: '1 hour', value: 60 },
        { label: '1.5 hours', value: 90 },
        { label: '2 hours', value: 120 },
        { label: '3 hours', value: 180 }
    ];

    const intervalOptions = [
        { label: 'instant', value: 0 },
        { label: '1 minute', value: 1 },
        { label: '3 minute', value: 3 },
        { label: '5 minutes', value: 5 },
        { label: '10 minutes', value: 10 },
        { label: '20 minutes', value: 20 },
        { label: '30 minutes', value: 30 }
    ];

    const intensityOptions: { label: string; value: 'chill' | 'wild' | 'extreme'; icon: string; color: string; desc: string }[] = [
        { label: 'Chill', value: 'chill', icon: 'happy-outline', color: COLORS.partyBlue, desc: 'Icebreakers & light fun' },
        { label: 'Wild', value: 'wild', icon: 'flame-outline', color: COLORS.partyOrange, desc: 'Classic party mode' },
        { label: 'Extreme', value: 'extreme', icon: 'skull-outline', color: COLORS.partyPink, desc: 'Late night chaos' },
    ];

    const handleStartGame = async () => {
        if (!user || !groupId) return;

        try {
            setStarting(true);
            
            // Final check for active games before starting
            const userActiveGames = await authService.getUserActiveGameSessions(user.id);
            if (userActiveGames.length > 0) {
                const activeGame = userActiveGames[0];
                Alert.alert(
                    'Active Game Found',
                    `You already have an active game in "${activeGame.group.name}". Please finish that game first.`,
                    [{ text: 'OK' }]
                );
                return;
            }
            
            // Start the game session
            const gameSession = await authService.startGameSession(
                groupId,
                user.id,
                selectedDuration,
                selectedInterval,
                selectedIntensity
            );

            Alert.alert(
                'Game Started! 🎉',
                `The game will run for ${selectedDuration} minutes with tasks every ${selectedInterval} minutes. All group members will now receive a notification!`,
                [
                    {
                        text: 'Ok',
                        onPress: () => {
                            // Navigate to the active game screen
                            router.replace(`/game-active?sessionId=${gameSession.id}`);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Failed to start game:', error);
            Alert.alert('Error', 'Could not start the game. Please try again.');
        } finally {
            setStarting(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>Game Setup</ThemedText>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Duration Selection */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>How long will you play?</ThemedText>
                    <View style={styles.optionsContainer}>
                        {durationOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionButton,
                                    styles.durationButton,
                                    selectedDuration === option.value && styles.optionButtonSelected
                                ]}
                                onPress={() => setSelectedDuration(option.value)}
                            >
                                <ThemedText style={[
                                    styles.optionText,
                                    selectedDuration === option.value && styles.optionTextSelected
                                ]}>
                                    {option.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Interval Selection */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>How often do tasks appear?</ThemedText>
                    <View style={styles.optionsContainer}>
                        {intervalOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionButton,
                                    styles.intervalButton,
                                    selectedInterval === option.value && styles.optionButtonSelected
                                ]}
                                onPress={() => setSelectedInterval(option.value)}
                            >
                                <ThemedText style={[
                                    styles.optionText,
                                    styles.intervalText,
                                    selectedInterval === option.value && styles.optionTextSelected
                                ]}>
                                    {option.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Intensity */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Intensity</ThemedText>
                    <View style={styles.intensityContainer}>
                        {intensityOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.intensityOption,
                                    selectedIntensity === option.value && { borderColor: option.color, backgroundColor: option.color + '15' }
                                ]}
                                onPress={() => setSelectedIntensity(option.value)}
                            >
                                <Ionicons name={option.icon as any} size={24} color={selectedIntensity === option.value ? option.color : COLORS.textMuted} />
                                <ThemedText style={[
                                    styles.intensityLabel,
                                    selectedIntensity === option.value && { color: option.color }
                                ]}>
                                    {option.label}
                                </ThemedText>
                                <ThemedText style={styles.intensityDesc}>{option.desc}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Game Info */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color={COLORS.partyOrange} />
                    <View style={styles.infoContent}>
                        <ThemedText style={styles.infoTitle}>How does it work?</ThemedText>
                        <ThemedText style={styles.infoText}>
                            • All group members get a notification at the same time{'\n'}
                            • The app randomly chooses who does the task{'\n'}
                            • Only that person sees the task{'\n'}
                            • Photos and timers are saved for badges{'\n'}
                            • Special tasks give unique badges
                        </ThemedText>
                    </View>
                </View>
                
                {/* Add some bottom padding for scroll */}
                <View style={{ height: SPACING.xl }} />
            </ScrollView>

            {/* Start Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.startButton, starting && styles.startButtonDisabled]}
                    onPress={handleStartGame}
                    disabled={starting}
                >
                    <Ionicons 
                        name="play" 
                        size={20} 
                        color={COLORS.white} 
                    />
                    <ThemedText style={styles.startButtonText}>
                        {starting ? 'Starting Game...' : 'Start the Game!'}
                    </ThemedText>
                </TouchableOpacity>
            </View>
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
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'space-between',
    },
    optionButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        minWidth: '30%',
        flex: 1,
        maxWidth: '48%',
    },
    durationButton: {
        maxWidth: '100%', // Duration buttons can be full width
        minWidth: '48%',
    },
    intervalButton: {
        maxWidth: '31%', // 3 buttons per row for intervals
        minWidth: '31%',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    optionButtonSelected: {
        borderColor: COLORS.partyOrange,
        backgroundColor: COLORS.partyOrange,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    intervalText: {
        fontSize: 12,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: COLORS.white,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: SPACING.md,
    },
    infoContent: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    buttonContainer: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.partyOrange,
        gap: SPACING.sm,
        ...SHADOWS.md,
    },
    startButtonDisabled: {
        opacity: 0.6,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    intensityContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    intensityOption: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        gap: SPACING.xs,
    },
    intensityLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    intensityDesc: {
        fontSize: 10,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
