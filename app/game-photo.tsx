import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS, LAYOUT, SHADOWS, SPACING } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

export default function GamePhotoScreen() {
    const insets = useSafeAreaInsets();
    const { roundId, timerSeconds } = useLocalSearchParams<{ roundId: string; timerSeconds?: string }>();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [photo, setPhoto] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    if (!permission) {
        // Camera permissions are still loading
        return (
            <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
                <View style={styles.loadingContainer}>
                    <ThemedText>Loading camera permissions...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>Photo Task</ThemedText>
                </View>
                
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera" size={64} color={COLORS.textMuted} />
                    <ThemedText style={styles.permissionTitle}>Camera Access Needed</ThemedText>
                    <ThemedText style={styles.permissionText}>
                        We need access to your camera to complete photo challenges.
                    </ThemedText>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <ThemedText style={styles.permissionButtonText}>Grant Permission</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photoData = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    base64: false,
                    exif: false,   // skip EXIF metadata — saves ~20KB per photo
                    skipProcessing: false,
                });
                setPhoto(photoData.uri);
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to take picture. Please try again.');
            }
        }
    };

    const retakePicture = () => {
        setPhoto(null);
    };

    const confirmPhoto = async () => {
        if (!roundId) {
            Alert.alert('Error', 'No round ID found');
            return;
        }

        try {
            // Complete the game round with the photo and optional timer data
            // Convert seconds to milliseconds for integer storage
            const timerValue = timerSeconds ? Math.round(parseFloat(timerSeconds) * 1000) : undefined;
            await authService.completeGameRound(roundId, photo || undefined, timerValue);
            
            Alert.alert(
                'Challenge Complete! 🏆📸',
                'Excellent work! Your photo has been submitted and any earned badges have been added to your account.',
                [
                    {
                        text: 'Awesome!',
                        onPress: () => {
                            // Check if we came from timer (has timerSeconds) or directly from game-active
                            if (timerSeconds) {
                                // Came from timer, go back twice
                                router.back(); // Back to timer
                                router.back(); // Back to game-active
                            } else {
                                // Came directly from game-active, go back once
                                router.back();
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error completing photo task:', error);
            Alert.alert(
                'Error',
                'Failed to complete the task. Please try again.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Use same navigation logic as success case
                            if (timerSeconds) {
                                router.back(); // Back to timer
                                router.back(); // Back to game-active
                            } else {
                                router.back();
                            }
                        }
                    }
                ]
            );
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (photo) {
        // Show photo preview
        return (
            <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={retakePicture}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>Photo Preview</ThemedText>
                </View>
                
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                    
                    <View style={styles.previewButtons}>
                        <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                            <Ionicons name="refresh" size={20} color={COLORS.white} />
                            <ThemedText style={styles.retakeButtonText}>Retake</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
                            <Ionicons name="checkmark" size={20} color={COLORS.white} />
                            <ThemedText style={styles.confirmButtonText}>Use Photo</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>Photo Task</ThemedText>
                <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
                    <Ionicons name="camera-reverse" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                />
                
                <View style={styles.cameraOverlay}>
                    <View style={styles.cameraControls}>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        textAlign: 'center',
    },
    flipButton: {
        padding: SPACING.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.lg,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    permissionButton: {
        backgroundColor: COLORS.partyOrange,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 16,
        ...SHADOWS.sm,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.partyOrange,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.partyOrange,
    },
    previewContainer: {
        flex: 1,
    },
    previewImage: {
        flex: 1,
        width: '100%',
    },
    previewButtons: {
        flexDirection: 'row',
        padding: SPACING.lg,
        gap: SPACING.md,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.textSecondary,
        paddingVertical: SPACING.md,
        borderRadius: 16,
        gap: SPACING.sm,
    },
    retakeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.partyGreen,
        paddingVertical: SPACING.md,
        borderRadius: 16,
        gap: SPACING.sm,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
