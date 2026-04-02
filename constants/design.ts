// Design System Constants
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 60,
};

export const COLORS = {
  primary: '#fbbf24', // Light yellow
  primaryDark: '#f59e0b', // Darker yellow
  secondary: '#374151', // Dark grey
  accent: '#10b981', // Keep green accent
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Party colors - vibrant but cohesive
  partyPink: '#ec4899', // Bright pink
  partyPurple: '#a855f7', // Vibrant purple
  partyBlue: '#3b82f6', // Electric blue
  partyGreen: '#10b981', // Bright green
  partyOrange: '#f97316', // Vibrant orange
  
  // Neutral colors - Dark theme
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Semantic colors - Dark theme
  background: '#1f2937', // Dark grey background
  surface: '#374151', // Slightly lighter grey for cards/surfaces
  border: '#4b5563', // Medium grey for borders
  text: '#f9fafb', // Light text on dark background
  textSecondary: '#d1d5db', // Secondary text
  textMuted: '#9ca3af', // Muted text
};

export const TYPOGRAPHY = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  
  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primary: {
    shadowColor: '#fbbf24', // Yellow shadow for primary elements
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Party color glows for buttons
  partyPurple: {
    shadowColor: '#a855f7', // Purple glow for night out
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  
  partyOrange: {
    shadowColor: '#f97316', // Orange glow for day drinking
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  
  partyBlue: {
    shadowColor: '#3b82f6', // Blue glow for holiday
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  
  partyGreen: {
    shadowColor: '#10b981', // Green glow for active games
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  
  warmOrange: {
    shadowColor: '#ff8c00', // Warm orange glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  
  creamBeige: {
    shadowColor: '#d2b48c', // Cream beige glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Layout system - handles containers and spacing
export const LAYOUT = {
  // Screen containers
  screen: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  
  screenCentered: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  // Content sections
  section: {
    marginBottom: SPACING.xxl,
  },
  
  centeredSection: {
    alignItems: 'center' as const,
    marginBottom: SPACING.xxl,
  },
  
  // Cards and surfaces
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
};

// Text system - handles all typography with consistent spacing
export const TEXT_STYLES = {
  // Headers with built-in spacing
  title: {
    fontSize: TYPOGRAPHY.huge,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    textAlign: 'center' as const,
    paddingTop: SPACING.sm, // Consistent text padding
    paddingHorizontal: SPACING.xl,
    lineHeight: TYPOGRAPHY.huge * 1.2, // Better line height
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    paddingTop: SPACING.sm,
    lineHeight: TYPOGRAPHY.base * 1.4,
  },
  
  // Body text
  body: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    paddingTop: SPACING.sm,
    lineHeight: TYPOGRAPHY.base * 1.4,
  },
  
  // Numbers and stats
  statNumber: {
    fontSize: TYPOGRAPHY.xxxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    paddingTop: SPACING.sm,
    textAlign: 'center' as const,
    lineHeight: TYPOGRAPHY.xxxl * 1.1,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    paddingTop: SPACING.xs,
    textAlign: 'center' as const,
    lineHeight: TYPOGRAPHY.sm * 1.3,
  },
  
  // Form elements
  label: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
    lineHeight: TYPOGRAPHY.base * 1.3,
  },
};

// Interactive elements
export const INTERACTIVE = {
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg, // More generous vertical padding
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48, // Minimum touch target
    ...SHADOWS.primary,
  },
  
  buttonText: {
    color: COLORS.gray900, // Dark text on light yellow background for better contrast
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'center' as const,
    lineHeight: TYPOGRAPHY.base * 1.2,
  },
  
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.base,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    minHeight: 48,
    lineHeight: TYPOGRAPHY.base * 1.3,
  },
};

// Legacy support - gradually migrate from this
export const COMMON_STYLES = {
  // Containers
  container: LAYOUT.screen,
  safeContainer: LAYOUT.screen, // Remove fixed padding, use safe area in components
  centeredContainer: LAYOUT.screenCentered,
  card: LAYOUT.card,
  
  // Interactive
  button: INTERACTIVE.button,
  buttonText: INTERACTIVE.buttonText,
  input: INTERACTIVE.input,
  
  // Text (legacy - use TEXT_STYLES instead)
  title: TEXT_STYLES.title,
  subtitle: TEXT_STYLES.subtitle,
  label: TEXT_STYLES.label,
};
