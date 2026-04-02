import { BORDER_RADIUS, COLORS, INTERACTIVE, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/design';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const ONBOARDING_KEY = 'spyshot_onboarding_seen';

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🎯',
    title: 'Welcome to SpyShot',
    subtitle:
      'The drinking game that brings your group together. Random tasks, timed sessions, epic moments — all tracked with photos and badges.',
    accentColor: COLORS.primary,
  },
  {
    id: '2',
    emoji: '👥',
    title: 'Create a Group',
    subtitle:
      'Tap Cafe or Home on the home screen to create your first group. Invite friends, then kick off a game session with a custom timer.',
    accentColor: COLORS.partyPurple,
  },
  {
    id: '3',
    emoji: '🏆',
    title: 'Earn Badges',
    subtitle:
      'Complete tasks to earn badges. The more you play, the higher your tier — from Bronze all the way up to Mythic. Are you legendary?',
    accentColor: COLORS.partyOrange,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)/(index)');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}>
      {/* Skip */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + SPACING.md }]}
        onPress={finish}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.emojiCircle, { backgroundColor: item.accentColor + '22', borderColor: item.accentColor + '55' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? { backgroundColor: COLORS.primary, width: 20 }
                : { backgroundColor: COLORS.border },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: SLIDES[currentIndex].accentColor },
          currentIndex === 0 && SHADOWS.primary,
          currentIndex === 1 && SHADOWS.partyPurple,
          currentIndex === 2 && SHADOWS.partyOrange,
        ]}
        onPress={isLast ? finish : goNext}
      >
        <Text style={styles.buttonText}>{isLast ? "Let's Play 🎉" : 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    right: SPACING.xl,
    zIndex: 10,
    padding: SPACING.sm,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl * 2,
    paddingTop: 60,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: TYPOGRAPHY.xxxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.base * 1.6,
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  dot: {
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    transition: 'width 0.2s',
  } as any,
  button: {
    width: SCREEN_WIDTH - SPACING.xl * 4,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.gray900,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
});
