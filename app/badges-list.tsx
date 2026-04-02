import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatBadgeCount, getBadgeIcon, getBadgeProgress, getBadgeTier, getNextTierInfo } from '@/constants/badges';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export default function BadgesListScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [badges, setBadges] = useState<any[]>([]);
    const [badgesLoading, setBadgesLoading] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);

    const handleFavoriteBadge = async (badge: any) => {
        if (!user?.id) return;
        
        try {
            if (badge.is_favorite) {
                await authService.removeFavoriteBadge(user.id);
            } else {
                await authService.setFavoriteBadge(user.id, badge.id);
            }
            
            // Reload badges to get fresh data
            await loadBadges();
        } catch (error) {
            console.error('Failed to update favorite badge:', error);
            Alert.alert('Error', 'Failed to update favorite badge');
        }
    };

    const handleBadgePress = (badge: any) => {
        if (badge.photo_url || badge.timer_seconds || (badge.photos && badge.photos.length > 0)) {
            setSelectedBadge(badge);
            setPhotoModalVisible(true);
        }
    };

    const loadBadges = useCallback(async () => {
        if (!user?.id) return;
        
        setBadgesLoading(true);
        try {
            const badgesList = await authService.getPlayerBadges(user.id);
            setBadges(badgesList);
        } catch (error) {
            console.error('Failed to load badges:', error);
        } finally {
            setBadgesLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            loadBadges();
        }, [loadBadges])
    );

    return (
        <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
            {/* Header */}
            <ThemedView style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>My Badges</ThemedText>
                <ThemedView style={{ width: 24 }} />
            </ThemedView>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {badgesLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : badges.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="medal-outline" size={64} color={COLORS.textMuted} />
                        <ThemedText style={styles.emptyTitle}>No badges yet</ThemedText>
                        <ThemedText style={styles.emptySubtitle}>
                            Complete tasks during a game to earn your first badge
                        </ThemedText>
                    </View>
                ) : (
                    <ThemedView style={styles.badgeGrid}>
                        {badges.map((badge, index) => {
                            const completionCount = badge.completion_count || badge.photos?.length || 1;
                            const tier = getBadgeTier(completionCount);
                            const progress = getBadgeProgress(completionCount, tier);
                            const nextTierInfo = getNextTierInfo(completionCount);
                            
                            return (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[
                                        styles.badgeItem,
                                        { borderColor: tier.borderColor, borderWidth: 2 },
                                        (badge.photo_url || badge.timer_seconds || (badge.photos && badge.photos.length > 0)) && styles.clickableBadge
                                    ]}
                                    onPress={() => handleBadgePress(badge)}
                                    disabled={!badge.photo_url && !badge.timer_seconds && (!badge.photos || badge.photos.length === 0)}
                                >
                                    <ThemedView style={[styles.badgeIcon, { backgroundColor: tier.color }]}>
                                        <Ionicons 
                                            name={getBadgeIcon(badge.badge_name) as any} 
                                            size={32} 
                                            color={tier.textColor} 
                                        />
                                        {badge.is_favorite && (
                                            <ThemedView style={styles.favoriteIndicator}>
                                                <Ionicons name="star" size={12} color="#FFD700" />
                                            </ThemedView>
                                        )}
                                    </ThemedView>
                                    
                                    <ThemedText style={[styles.badgeName, { color: tier.name === 'Locked' ? tier.textColor : COLORS.text }]}>
                                        {badge.badge_name}
                                    </ThemedText>
                                    
                                    <ThemedView style={styles.badgeTierInfo}>
                                        <ThemedText style={[styles.badgeTier, { color: tier.color }]}>
                                            {tier.name}
                                        </ThemedText>
                                        <ThemedText style={styles.badgeCount}>
                                            {formatBadgeCount(completionCount)}
                                        </ThemedText>
                                    </ThemedView>
                                    
                                    {/* Progress Bar */}
                                    <ThemedView style={styles.progressBarContainer}>
                                        <ThemedView style={[styles.progressBarBackground, { backgroundColor: tier.borderColor + '30' }]}>
                                            <ThemedView 
                                                style={[
                                                    styles.progressBarFill, 
                                                    { 
                                                        width: `${progress * 100}%`, 
                                                        backgroundColor: tier.progressColor 
                                                    }
                                                ]} 
                                            />
                                        </ThemedView>
                                        {nextTierInfo.nextTier && (
                                            <ThemedText style={styles.nextTierText}>
                                                {nextTierInfo.completionsNeeded} to {nextTierInfo.nextTier.name}
                                            </ThemedText>
                                        )}
                                    </ThemedView>
                                </TouchableOpacity>
                            );
                        })}
                    </ThemedView>
                )}
            </ScrollView>

            {/* Photo Modal */}
            <Modal
                visible={photoModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPhotoModalVisible(false)}
            >
                <ThemedView style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setPhotoModalVisible(false)}
                    />
                    <ThemedView style={styles.modalContent}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setPhotoModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        
                        {selectedBadge && (
                            <>
                                <ThemedView style={styles.modalHeader}>
                                    <ThemedView style={styles.modalBadgeIcon}>
                                        <Ionicons 
                                            name={getBadgeIcon(selectedBadge.badge_name) as any} 
                                            size={40} 
                                            color={COLORS.partyOrange} 
                                        />
                                    </ThemedView>
                                    <ThemedText style={styles.modalBadgeName}>{selectedBadge.badge_name}</ThemedText>
                                    
                                    {selectedBadge.photos && selectedBadge.photos.length > 0 && (
                                        <ThemedText style={styles.photoCount}>
                                            {selectedBadge.photos.length} photo{selectedBadge.photos.length > 1 ? 's' : ''} collected
                                        </ThemedText>
                                    )}

                                    <TouchableOpacity 
                                        style={[styles.favoriteButton, selectedBadge.is_favorite && styles.favoriteButtonActive]}
                                        onPress={() => handleFavoriteBadge(selectedBadge)}
                                    >
                                        <Ionicons 
                                            name={selectedBadge.is_favorite ? "star" : "star-outline"} 
                                            size={20} 
                                            color={selectedBadge.is_favorite ? "#FFD700" : COLORS.textMuted} 
                                        />
                                        <ThemedText style={[styles.favoriteButtonText, selectedBadge.is_favorite && styles.favoriteButtonTextActive]}>
                                            {selectedBadge.is_favorite ? "Remove Favorite" : "Set as Favorite"}
                                        </ThemedText>
                                    </TouchableOpacity>

                                </ThemedView>
                                
                                <ScrollView 
                                    style={styles.photosContainer} 
                                    contentContainerStyle={styles.photosContentContainer}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {selectedBadge.photos && selectedBadge.photos.length > 0 ? (
                                        selectedBadge.photos.map((photoData: any, index: number) => (
                                            <ThemedView key={index} style={styles.photoItem}>
                                                {photoData.photo_url && (
                                                    <Image 
                                                        source={{ uri: photoData.photo_url }} 
                                                        style={styles.modalPhoto}
                                                        resizeMode="cover"
                                                    />
                                                )}
                                                <ThemedView style={styles.photoMetadata}>
                                                    {photoData.timer_seconds && (
                                                        <ThemedView style={styles.timerInfo}>
                                                            <Ionicons name="timer" size={14} color={COLORS.partyGreen} />
                                                            <ThemedText style={styles.timerText}>
                                                                {(photoData.timer_seconds / 1000).toFixed(3)}s
                                                            </ThemedText>
                                                        </ThemedView>
                                                    )}
                                                </ThemedView>
                                            </ThemedView>
                                        ))
                                    ) : (selectedBadge.photo_url || selectedBadge.timer_seconds) && (
                                        <ThemedView style={styles.photoItem}>
                                            {selectedBadge.photo_url && (
                                                <Image 
                                                    source={{ uri: selectedBadge.photo_url }} 
                                                    style={styles.modalPhoto}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <ThemedView style={styles.photoMetadata}>
                                                {selectedBadge.timer_seconds && (
                                                    <ThemedView style={styles.timerInfo}>
                                                        <Ionicons name="timer" size={14} color={COLORS.partyGreen} />
                                                        <ThemedText style={styles.timerText}>
                                                            {(selectedBadge.timer_seconds / 1000).toFixed(3)}s
                                                        </ThemedText>
                                                    </ThemedView>
                                                )}
                                            </ThemedView>
                                        </ThemedView>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </ThemedView>
                </ThemedView>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
    },
    container: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SPACING.xxl,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.base,
        color: COLORS.textSecondary,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    badgeItem: {
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SPACING.md,
        padding: SPACING.md,
        width: '47%',
        minHeight: 140,
        position: 'relative',
    },
    clickableBadge: {
        borderWidth: 1,
        borderColor: COLORS.partyOrange + '40',
        shadowColor: COLORS.partyOrange,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    badgeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.partyOrange + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    badgeName: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    badgeDate: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    badgeGroup: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    photoIndicator: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 4,
        gap: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SPACING.xxl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
        lineHeight: 22,
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
        lineHeight: TYPOGRAPHY.sm * 1.5,
        marginTop: SPACING.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderRadius: SPACING.lg,
        padding: SPACING.lg,
        maxWidth: '90%',
        maxHeight: '80%',
        width: 350,
        flex: 1,
        flexDirection: 'column',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        zIndex: 1,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalBadgeIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.partyOrange + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    modalBadgeName: {
        fontSize: TYPOGRAPHY.lg,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    modalBadgeDate: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    modalPhoto: {
        width: '100%',
        height: 300,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.surface,
    },
    timerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.partyGreen + '20',
        borderRadius: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        marginTop: SPACING.sm,
        gap: SPACING.xs,
    },
    timerText: {
        fontSize: TYPOGRAPHY.sm,
        fontWeight: TYPOGRAPHY.semibold,
        color: COLORS.partyGreen,
        fontFamily: 'monospace',
    },
    photoCount: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.partyGreen,
        textAlign: 'center',
        fontWeight: TYPOGRAPHY.medium,
        marginTop: SPACING.xs,
    },
    photosContainer: {
        flex: 1,
        marginTop: SPACING.sm,
        minHeight: 200,
    },
    photosContentContainer: {
        paddingBottom: SPACING.md,
    },

    photoItem: {
        marginBottom: SPACING.md,
    },
    photoMetadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    photoDate: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
    },
    photoIndicatorCount: {
        fontSize: 8,
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.bold,
        backgroundColor: COLORS.partyPink,
        borderRadius: 6,
        minWidth: 12,
        height: 12,
        textAlign: 'center',
        lineHeight: 12,
        marginLeft: 2,
    },
    favoriteIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgeTierInfo: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: SPACING.xs,
        backgroundColor: COLORS.surface,
    },
    badgeTier: {
        fontSize: TYPOGRAPHY.xs,
        fontWeight: TYPOGRAPHY.bold,
        textTransform: 'uppercase',
        backgroundColor: COLORS.surface,
    },
    badgeCount: {
        fontSize: TYPOGRAPHY.xs,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.medium,
        backgroundColor: COLORS.surface,
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: SPACING.xs,
        backgroundColor: COLORS.surface,
    },
    progressBarBackground: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    nextTierText: {
        fontSize: TYPOGRAPHY.xs - 1,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 2,
        backgroundColor: COLORS.surface,
    },
    favoriteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginTop: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.xs,
    },
    favoriteButtonActive: {
        backgroundColor: '#FFD700' + '20',
        borderColor: '#FFD700',
    },
    favoriteButtonText: {
        fontSize: TYPOGRAPHY.sm,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.medium,
    },
    favoriteButtonTextActive: {
        color: '#FFD700',
        fontWeight: TYPOGRAPHY.semibold,
    },

});
