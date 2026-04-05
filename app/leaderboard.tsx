import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BORDER_RADIUS,
  COLORS,
  LAYOUT,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LeaderboardEntry {
  profile: {
    id: string;
    username: string;
    name: string;
    profile_picture: string | null;
  };
  totalCompletions: number;
  isCurrentUser: boolean;
}

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    try {
      const result = await authService.getFriendsLeaderboard(user.id);
      setData(result);
    } catch {
      // fail silently — empty state handles it
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [loadLeaderboard])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isTop3 = index < 3;
    const rankColor = index === 0 ? COLORS.primary : index === 1 ? COLORS.textMuted : COLORS.bronze;

    return (
      <TouchableOpacity
        style={[
          styles.row,
          item.isCurrentUser && styles.rowHighlighted,
          index < data.length - 1 && styles.rowBorder,
        ]}
        onPress={() => {
          if (!item.isCurrentUser) {
            router.push(`/user-profile?userId=${item.profile.id}`);
          }
        }}
        activeOpacity={item.isCurrentUser ? 1 : 0.7}
      >
        {/* Rank */}
        <View style={styles.rankContainer}>
          {isTop3 ? (
            <Text style={styles.rankEmoji}>{RANK_EMOJIS[index]}</Text>
          ) : (
            <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
          )}
        </View>

        {/* Avatar */}
        {item.profile.profile_picture ? (
          <Image source={{ uri: item.profile.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarInitial}>
              {item.profile.username.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}

        {/* Name */}
        <View style={styles.playerInfo}>
          <ThemedText style={[styles.playerName, item.isCurrentUser && { color: COLORS.primary }]}>
            {item.isCurrentUser ? 'You' : `@${item.profile.username}`}
          </ThemedText>
          {item.profile.name && !item.isCurrentUser ? (
            <ThemedText style={styles.playerRealName}>{item.profile.name}</ThemedText>
          ) : null}
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <ThemedText style={[styles.score, isTop3 && { color: rankColor }]}>
            {item.totalCompletions}
          </ThemedText>
          <ThemedText style={styles.scoreLabel}>tasks</ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[LAYOUT.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Leaderboard</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color={COLORS.textMuted} />
          <ThemedText style={styles.emptyTitle}>No data yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Add friends and play games to see who's on top.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.profile.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <ThemedText style={styles.listHeaderText}>
                Friends · {data.length} players
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
  headerSpacer: {
    width: 32,
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
    paddingHorizontal: SPACING.xl,
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
  listContent: {
    paddingBottom: SPACING.xxxl,
  },
  listHeader: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  listHeaderText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowHighlighted: {
    backgroundColor: `${COLORS.primary}11`,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 22,
  },
  rankNumber: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  avatar: {
    width: 44,
    height: 44,
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
  playerRealName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 44,
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
});
