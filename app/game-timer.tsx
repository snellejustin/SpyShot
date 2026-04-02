import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GameTimerScreen() {
    const insets = useSafeAreaInsets();
    const { roundId } = useLocalSearchParams<{ roundId: string }>();
    
    const [timerState, setTimerState] = useState<'ready' | 'running' | 'stopped' | 'completed'>('ready');
    const [elapsedTime, setElapsedTime] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const formatTime = useCallback((timeInMs: number) => {
        const seconds = (timeInMs / 1000).toFixed(3);
        return `${seconds}s`;
    }, []);

    const startTimer = useCallback(() => {
        setTimerState('running');
        startTimeRef.current = Date.now();
        
        intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
                setElapsedTime(Date.now() - startTimeRef.current);
            }
        }, 10); // Update every 10ms for smooth display
    }, []);

    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setTimerState('stopped');
    }, []);

    const goToPhotoCapture = useCallback(() => {
        setTimerState('completed');
        router.push(`/game-photo?roundId=${roundId}&timerSeconds=${(elapsedTime / 1000).toFixed(3)}`);
    }, [roundId, elapsedTime]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>Timer Challenge</ThemedText>
            </View>
            
            <View style={styles.content}>
                <View style={styles.timerContainer}>
                    <ThemedText style={styles.timeDisplay}>
                        {formatTime(elapsedTime)}
                    </ThemedText>
                    
                    <ThemedText style={styles.instruction}>
                        {timerState === 'ready' && 'Press START when you begin drinking'}
                        {timerState === 'running' && 'Drinking in progress...'}
                        {timerState === 'stopped' && 'Great! Now take a photo with your empty glass'}
                    </ThemedText>
                </View>

                <View style={styles.buttonContainer}>
                    {timerState === 'ready' && (
                        <TouchableOpacity 
                            style={[styles.button, styles.startButton]} 
                            onPress={startTimer}
                        >
                            <Ionicons name="play" size={32} color={COLORS.white} />
                            <ThemedText style={styles.buttonText}>START</ThemedText>
                        </TouchableOpacity>
                    )}

                    {timerState === 'running' && (
                        <TouchableOpacity 
                            style={[styles.button, styles.stopButton]} 
                            onPress={stopTimer}
                        >
                            <Ionicons name="stop" size={32} color={COLORS.white} />
                            <ThemedText style={styles.buttonText}>STOP</ThemedText>
                        </TouchableOpacity>
                    )}

                    {timerState === 'stopped' && (
                        <TouchableOpacity 
                            style={[styles.button, styles.nextButton]} 
                            onPress={goToPhotoCapture}
                        >
                            <Ionicons name="camera" size={32} color={COLORS.white} />
                            <ThemedText style={styles.buttonText}>TAKE PHOTO</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
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
        gap: SPACING.md,
    },
    title: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xl,
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    timeDisplay: {
        fontSize: 64,
        fontWeight: TYPOGRAPHY.bold,
        paddingTop: SPACING.xxl * 3,
        color: COLORS.partyOrange,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        fontFamily: 'monospace',
    },
    instruction: {
        fontSize: TYPOGRAPHY.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.md,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: COLORS.partyOrange,
        borderRadius: 80,
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    startButton: {
        backgroundColor: COLORS.partyGreen,
    },
    stopButton: {
        backgroundColor: COLORS.partyPink,
    },
    nextButton: {
        backgroundColor: COLORS.partyOrange,
    },
    buttonText: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: TYPOGRAPHY.bold,
        color: COLORS.white,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
});
