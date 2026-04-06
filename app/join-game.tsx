import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, LAYOUT, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGameScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [code, setCode] = useState(['', '', '', '']);
    const [joining, setJoining] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const handleCodeChange = (text: string, index: number) => {
        const char = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const newCode = [...code];
        newCode[index] = char;
        setCode(newCode);

        if (char && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 4 chars entered
        if (index === 3 && char) {
            handleJoin(newCode.join(''));
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleJoin = async (roomCode?: string) => {
        const finalCode = roomCode || code.join('');
        if (finalCode.length !== 4 || !user) return;

        setJoining(true);
        try {
            const session = await authService.joinByRoomCode(finalCode, user.id);
            router.replace(`/game-active?sessionId=${session.id}`);
        } catch (error: any) {
            Alert.alert('Not Found', 'No active game with that code. Check the code and try again.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Join Game</ThemedText>
                <View style={{ width: 32 }} />
            </View>

            <View style={styles.content}>
                <Ionicons name="qr-code-outline" size={64} color={COLORS.primary} />
                <ThemedText style={styles.title}>Enter Room Code</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Ask the game host for the 4-character code
                </ThemedText>

                <View style={styles.codeInputContainer}>
                    {code.map((char, i) => (
                        <TextInput
                            key={i}
                            ref={ref => inputRefs.current[i] = ref}
                            style={[styles.codeInput, char ? styles.codeInputFilled : null]}
                            value={char}
                            onChangeText={text => handleCodeChange(text, i)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                            maxLength={1}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            textAlign="center"
                            keyboardType="default"
                            placeholderTextColor={COLORS.textMuted}
                            placeholder="-"
                        />
                    ))}
                </View>

                {joining && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />}

                <TouchableOpacity
                    style={[styles.joinButton, (code.join('').length !== 4 || joining) && { opacity: 0.5 }]}
                    onPress={() => handleJoin()}
                    disabled={code.join('').length !== 4 || joining}
                >
                    <Ionicons name="enter" size={20} color={COLORS.gray900} />
                    <ThemedText style={styles.joinButtonText}>Join Game</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.xl,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        gap: SPACING.md,
        marginBottom: SPACING.massive,
    },
    title: {
        fontSize: TYPOGRAPHY.xxl,
        fontWeight: '800',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    codeInputContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    codeInput: {
        width: 60,
        height: 70,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
    },
    codeInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
        marginTop: SPACING.xl,
        ...SHADOWS.primary,
    },
    joinButtonText: {
        fontSize: TYPOGRAPHY.base,
        fontWeight: '700',
        color: COLORS.gray900,
    },
});
