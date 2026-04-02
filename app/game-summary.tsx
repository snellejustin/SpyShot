import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getBadgeIcon, getBadgeTier } from '@/constants/badges';
import {
  BORDER_RADIUS,
  COLORS,
  INTERACTIVE,
  LAYOUT,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

interface LeaderboardEntry {
  profile: {
    id: string;
    username: string;
    name: string;
    profile_picture: string | null;
  };
  completedTasks: number;
  passedTasks: number;
  totalAssigned: number;
  score: number;
}

interface EarnedBadge {
  id: string;
  badge_name: string;
  badge_description: string;
  player_id: string;
  profile?: {
    username: string;
  };
}

const RANK_COLORS = [COLORS.primary, COLORS.textMuted, '#CD7F32']; // gold, silver, bronze
const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function GameSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalRounds, setTotalRounds] = useState(0);
  const [groupName, setGroupName] = useState('');

  const loadSummary = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [session, leaderboardData] = await Promise.all([
        authService.getGameSession(sessionId),
        authService.getGameLeaderboard(sessionId),
      ]);

      if (session?.group_id) {
        const group = await authService.getGroupDetails(session.group_id);
        setGroupName(group?.name ?? '');
      }

      setLeaderboard(leaderboardData);
      const total = leaderboardData.reduce(
        (sum: number, p: LeaderboardEntry) => sum + p.totalAssigned,
        0
      );
      setTotalRounds(total);
    } catch {
      // Keep empty state
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const mvp = leaderboard[0];
  const completionRate =
    totalRounds > 0
      ? Math.round(
          (leaderboard.reduce((s, p) => s + p.completedTasks, 0) / totalRounds) * 100
        )
      : 0;

  if (loading) {
    return (
      <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <ThemedText style={styles.loadingText}>Loading results...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          <Text style={styles.trophy}>🏆</Text>
          <ThemedText style={styles.heroTitle}>Game Over!</ThemedText>
          {groupName ? (
            <ThemedText style={styles.heroSubtitle}>{groupName}</ThemedText>
          ) : null}
        </View>

        {/* Stats bar */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{totalRounds}</ThemedText>
            <ThemedText style={styles.statLabel}>Rounds played</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{completionRate}%</ThemedText>
            <ThemedText style={styles.statLabel}>Completion rate</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{leaderboard.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Players</ThemedText>
          </View>
        </View>

        {/* MVP */}
        {mvp && (
          <View style={styles.mvpCard}>
            <View style={styles.mvpBadge}>
              <ThemedText style={styles.mvpBadgeText}>MVP</ThemedText>
            </View>
            {mvp.profile.profile_picture ? (
              <Image source={{ uri: mvp.profile.profile_picture }} style={styles.mvpAvatar} />
            ) : (
              <View style={[styles.mvpAvatar, styles.mvpAvatarPlaceholder]}>
                <ThemedText style={styles.mvpAvatarInitial}>
                  {mvp.profile.username.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
            <ThemedText style={styles.mvpName}>@{mvp.profile.username}</ThemedText>
            <ThemedText style={styles.mvpScore}>
              {mvp.completedTasks} tasks completed
            </ThemedText>
          </View>
        )}

        {/* Leaderboard */}
        <ThemedText style={styles.sectionTitle}>Final Standings</ThemedText>
        <View style={styles.leaderboardCard}>
          {leaderboard.map((player, index) => (
            <View key={player.profile.id} style={[styles.row, index < leaderboard.length - 1 && styles.rowBorder]}>
              {/* Rank */}
              <View style={styles.rankContainer}>
                {index < 3 ? (
                  <Text style={styles.rankEmoji}>{RANK_EMOJIS[index]}</Text>
                ) : (
                  <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                )}
              </View>

              {/* Avatar */}
              {player.profile.profile_picture ? (
                <Image source={{ uri: player.profile.profile_picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <ThemedText style={styles.avatarInitial}>
                    {player.profile.username.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
              )}

              {/* Name + stats */}
              <View style={styles.playerInfo}>
                <ThemedText style={styles.playerName}>@{player.profile.username}</ThemedText>
                <ThemedText style={styles.playerStats}>
                  {player.completedTasks} done · {player.passedTasks} passed
                </ThemedText>
              </View>

              {/* Score */}
              <View style={styles.scoreContainer}>
                <ThemedText style={[styles.score, index === 0 && { color: COLORS.primary }]}>
                  {player.score}
                </ThemedText>
                <ThemedText style={styles.scoreLabel}>pts</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[INTERACTIVE.button, styles.ctaButton]}
          onPress={() => router.replace('/(tabs)/(index)')}
        >
          <Ionicons name="home" size={20} color={COLORS.gray900} style={{ marginRight: SPACING.sm }} />
          <Text style={[INTERACTIVE.buttonText]}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + SPACING.xl }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.base,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  trophy: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.huge,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textMuted,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  // MVP
  mvpCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  mvpBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  mvpBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.gray900,
    letterSpacing: 1,
  },
  mvpAvatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  mvpAvatarPlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mvpAvatarInitial: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  mvpName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  mvpScore: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Leaderboard
  sectionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  leaderboardCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  playerStats: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  // CTA
  ctaButton: {
    marginBottom: SPACING.md,
  },
});
