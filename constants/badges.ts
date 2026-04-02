
export interface BadgeTier {
  name: string;
  minCount: number;
  maxCount: number | null;
  color: string;
  textColor: string;
  borderColor: string;
  progressColor: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  {
    name: 'Locked',
    minCount: 0,
    maxCount: 0,
    color: '#2A2A2A',
    textColor: '#666666',
    borderColor: '#404040',
    progressColor: '#404040'
  },
  {
    name: 'Bronze',
    minCount: 1,
    maxCount: 2,
    color: '#CD7F32',
    textColor: '#FFFFFF',
    borderColor: '#B8671F',
    progressColor: '#E8A756'
  },
  {
    name: 'Silver',
    minCount: 3,
    maxCount: 9,
    color: '#C0C0C0',
    textColor: '#FFFFFF',
    borderColor: '#A8A8A8',
    progressColor: '#D4D4D4'
  },
  {
    name: 'Gold',
    minCount: 10,
    maxCount: 19,
    color: '#FFD700',
    textColor: '#FFFFFF',
    borderColor: '#E6C200',
    progressColor: '#FFED4E'
  },
  {
    name: 'Diamond',
    minCount: 20,
    maxCount: 49,
    color: '#B9F2FF',
    textColor: '#003F52',
    borderColor: '#7DD3FC',
    progressColor: '#E0F6FF'
  },
  {
    name: 'Elite',
    minCount: 50,
    maxCount: 99,
    color: '#9333EA',
    textColor: '#FFFFFF',
    borderColor: '#7C3AED',
    progressColor: '#A855F7'
  },
  {
    name: 'Master',
    minCount: 100,
    maxCount: 299,
    color: '#DC2626',
    textColor: '#FFFFFF',
    borderColor: '#B91C1C',
    progressColor: '#EF4444'
  },
  {
    name: 'Legend',
    minCount: 300,
    maxCount: 499,
    color: '#EA580C',
    textColor: '#FFFFFF',
    borderColor: '#C2410C',
    progressColor: '#FB923C'
  },
  {
    name: 'Mythic',
    minCount: 500,
    maxCount: null,
    color: '#10B981',
    textColor: '#FFFFFF',
    borderColor: '#059669',
    progressColor: '#34D399'
  }
];

export interface BadgeTypeIcon {
  name: string;
  icon: string;
}

export const BADGE_TYPE_ICONS: { [key: string]: string } = {
  // Photo-related badges
  'First Photo': 'camera-outline',
  'Photo Master': 'images-outline',
  'Selfie King': 'person-circle-outline',
  'Group Shot': 'people-outline',
  'Night Photography': 'moon-outline',
  'Golden Hour': 'sunny-outline',
  'Action Shot': 'flash-outline',
  'Portrait Pro': 'person-outline',

  // Speed/Timer badges
  'Speed Demon': 'flash',
  'Speed Drinker': 'wine',
  'Lightning Fast': 'thunderstorm-outline',
  'Quick Draw': 'stopwatch-outline',
  'Time Master': 'time-outline',
  'Rush Hour': 'speedometer-outline',

  // Social badges
  'Social Butterfly': 'sparkles-outline',
  'Party Animal': 'musical-notes-outline',
  'Bad Influence': 'skull-outline',
  'Team Player': 'people-outline',
  'Crowd Pleaser': 'heart-outline',
  'Life of Party': 'wine-outline',

  // Achievement badges
  'Early Bird': 'sunrise-outline',
  'Night Owl': 'moon-outline',
  'Weekend Warrior': 'calendar-outline',
  'Daily Grind': 'checkmark-circle-outline',
  'Streak Master': 'flame-outline',

  // Challenge badges
  'Task Crusher': 'hammer-outline',
  'Challenge Accepted': 'trophy-outline',
  'Dare Devil': 'warning-outline',
  'Risk Taker': 'dice-outline',
  'Thrill Seeker': 'bicycle-outline',

  // Location badges
  'Explorer': 'compass-outline',
  'Wanderer': 'walk-outline',
  'City Explorer': 'business-outline',
  'Nature Lover': 'leaf-outline',
  'Adventure Seeker': 'mountain-outline',

  // Competition badges
  'Winner': 'trophy',
  'Champion': 'medal-outline',
  'Competitor': 'ribbon-outline',
  'Victory Lap': 'flag-outline',
  'Top Performer': 'star-outline',

  // Drinking/Party badges
  'Bartender': 'wine-outline',
  'Bar Buddy': 'people-circle',
  'Shot Master': 'flask-outline',
  'Beer Pong Champion': 'basketball-outline',
  'Mixer': 'shuffle-outline',
  'Designated Driver': 'car-outline',
  'Toast Master': 'chatbubbles-outline',
  'Party Host': 'home-outline',
  'Wild Night': 'moon',
  'Hangover Hero': 'medical-outline',
  'Liquid Courage': 'shield-outline',

  // Fun/Silly badges
  'Class Clown': 'happy-outline',
  'Drama Queen': 'mask-outline',
  'Rebel': 'flame',
  'Troublemaker': 'warning',
  'Daredevil': 'skull',
  'Influencer': 'megaphone-outline',
  'Storyteller': 'book-outline',
  'Joker': 'happy',

  // Special badges
  'Creative': 'color-palette-outline',
  'Innovator': 'bulb-outline',
  'Trendsetter': 'trending-up-outline',
  'Pioneer': 'rocket-outline',
  'Legend': 'diamond-outline',
  'VIP': 'star',
  'MVP': 'trophy',

  // Default fallback
  'default': 'medal-outline'
};

export function getBadgeTier(completionCount: number): BadgeTier {
  for (const tier of BADGE_TIERS) {
    if (tier.maxCount === null) {
      if (completionCount >= tier.minCount) {
        return tier;
      }
    } else {
      if (completionCount >= tier.minCount && completionCount <= tier.maxCount) {
        return tier;
      }
    }
  }
  return BADGE_TIERS[0]; // Return locked tier as fallback
}

export function getBadgeIcon(badgeName: string): string {
  return BADGE_TYPE_ICONS[badgeName] || BADGE_TYPE_ICONS['default'];
}

export function getBadgeProgress(completionCount: number, tier: BadgeTier): number {
  if (tier.name === 'Locked') {
    return 0;
  }
  
  if (tier.maxCount === null) {
    // For mythic tier (no max), show full progress
    return 1;
  }
  
  const tierRange = tier.maxCount - tier.minCount + 1;
  const progressInTier = completionCount - tier.minCount + 1;
  return Math.min(progressInTier / tierRange, 1);
}

export function getNextTierInfo(completionCount: number): { nextTier: BadgeTier | null; completionsNeeded: number } {
  const currentTier = getBadgeTier(completionCount);
  const currentTierIndex = BADGE_TIERS.findIndex(tier => tier.name === currentTier.name);
  
  if (currentTierIndex === BADGE_TIERS.length - 1) {
    // Already at highest tier
    return { nextTier: null, completionsNeeded: 0 };
  }
  
  const nextTier = BADGE_TIERS[currentTierIndex + 1];
  const completionsNeeded = nextTier.minCount - completionCount;
  
  return { nextTier, completionsNeeded };
}

export function formatBadgeCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}

export interface BadgeWithProgress {
  id: string;
  badge_name: string;
  badge_description: string;
  completion_count: number;
  tier: BadgeTier;
  progress: number;
  photos: any[];
  earned_at: string;
  is_favorite?: boolean;
}
