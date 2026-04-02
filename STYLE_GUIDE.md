# SpyShot Style Guide

All design tokens live in `constants/design.ts` and `constants/badges.ts`.
Always import from there — never hardcode color values or spacing numbers inline.

---

## Color System

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `COLORS.primary` | `#fbbf24` | Primary actions, CTAs, highlights, stat numbers |
| `COLORS.primaryDark` | `#f59e0b` | Pressed state of primary, warnings |
| `COLORS.accent` | `#10b981` | Active games, success states, Mythic badges |

### Party Colors (vibrant accents)
| Token | Value | Usage |
|-------|-------|-------|
| `COLORS.partyPurple` | `#a855f7` | Cafe/night-out group type |
| `COLORS.partyOrange` | `#f97316` | Home/day-drinking group type |
| `COLORS.partyBlue` | `#3b82f6` | Holiday/special occasions |
| `COLORS.partyGreen` | `#10b981` | Active game widgets |
| `COLORS.partyPink` | `#ec4899` | Notification badges, urgent actions |

**Rule:** Each context owns one party color. Don't mix party colors within the same component.

### Neutral Palette (Dark Theme)
| Token | Value | Usage |
|-------|-------|-------|
| `COLORS.background` | `#1f2937` | Screen backgrounds |
| `COLORS.surface` | `#374151` | Cards, modals, input backgrounds |
| `COLORS.border` | `#4b5563` | Input borders, dividers, tab bar borders |
| `COLORS.text` | `#f9fafb` | Primary text |
| `COLORS.textSecondary` | `#d1d5db` | Subtitles, descriptions |
| `COLORS.textMuted` | `#9ca3af` | Placeholder text, disabled states, metadata |

### Semantic Colors
| Token | Usage |
|-------|-------|
| `COLORS.error` | `#ef4444` | Validation errors, destructive actions |
| `COLORS.warning` | `#f59e0b` | Warnings (same as primaryDark — intentional) |

---

## Typography

Defined in `TYPOGRAPHY` from `constants/design.ts`.

### Size Scale
| Token | px | Usage |
|-------|----|-------|
| `xs` | 12 | Metadata, timestamps, badge counts |
| `sm` | 14 | Secondary labels, helper text |
| `base` | 16 | Body text, inputs, buttons |
| `lg` | 18 | Section headers, card titles |
| `xl` | 20 | Screen sub-headers |
| `xxl` | 24 | Section titles |
| `xxxl` | 28 | Stat numbers |
| `huge` | 32 | Screen titles, hero text |

### Weight Scale
| Token | Value | Usage |
|-------|-------|-------|
| `regular` | 400 | Body text |
| `medium` | 500 | Labels, list items |
| `semibold` | 600 | Button labels, card titles, emphasized body |
| `bold` | 700 | Screen titles, hero numbers |

### Pre-built Text Styles (`TEXT_STYLES`)
Use these composites instead of combining size + weight manually:

```tsx
// Screen title
<ThemedText style={TEXT_STYLES.title}>Welcome back!</ThemedText>

// Descriptive text below a title
<ThemedText style={TEXT_STYLES.subtitle}>Sign in to sync your profile</ThemedText>

// Body paragraph
<ThemedText style={TEXT_STYLES.body}>Some explanation text here.</ThemedText>

// Large stat number (scores, counts)
<ThemedText style={TEXT_STYLES.statNumber}>42</ThemedText>
<ThemedText style={TEXT_STYLES.statLabel}>tasks completed</ThemedText>

// Form field label
<ThemedText style={TEXT_STYLES.label}>Email</ThemedText>
```

---

## Spacing System

All from `SPACING` in `constants/design.ts`. Never use raw numbers for margin/padding.

| Token | px | Usage |
|-------|----|-------|
| `xs` | 4 | Icon gaps, badge padding, tight spacing |
| `sm` | 8 | Between related elements (icon + label) |
| `md` | 12 | Inner card padding, list item gaps |
| `lg` | 16 | Standard padding, button vertical padding |
| `xl` | 20 | Screen horizontal padding (standard) |
| `xxl` | 24 | Section gaps, form field margins |
| `xxxl` | 32 | Large section separators |
| `huge` | 40 | Between major sections |
| `massive` | 60 | Hero spacing, top-of-screen padding |

**Rule:** Screen horizontal padding is always `SPACING.xl` (20px).

---

## Border Radius

From `BORDER_RADIUS` in `constants/design.ts`.

| Token | px | Usage |
|-------|----|-------|
| `sm` | 8 | Small chips, tags, inner elements |
| `md` | 12 | Standard cards, inputs, buttons |
| `lg` | 16 | Large cards, modals |
| `xl` | 20 | Hero cards, active game widget |
| `xxl` | 24 | Pill-shaped large elements |
| `full` | 9999 | Avatars, circular badges, notification dots |

---

## Shadows & Glows

From `SHADOWS` in `constants/design.ts`.

### Standard shadows
| Token | Elevation | Usage |
|-------|-----------|-------|
| `SHADOWS.sm` | 1 | Subtle lift for list items |
| `SHADOWS.md` | 2 | Standard card shadow |
| `SHADOWS.lg` | 4 | Modals, elevated surfaces |

### Colored glows (party theme)
Each party color has a matching glow shadow. Use it on the button/card that uses that color.

```tsx
// Cafe button uses purple — add purple glow
style={[styles.cafeButton, SHADOWS.partyPurple]}

// Active game widget uses green — add green glow
style={[styles.activeGameButton, SHADOWS.partyGreen]}

// Primary (yellow) CTA
style={[INTERACTIVE.button, SHADOWS.primary]}
```

**Rule:** Always pair a colored glow with its matching background color. Never put a purple glow on an orange button.

---

## Layout Patterns

### Screen container
```tsx
// Standard scrollable screen
<ThemedView style={[LAYOUT.screen, { paddingTop: insets.top + SPACING.xl }]}>
  <ScrollView>...</ScrollView>
</ThemedView>

// Centered (auth screens, empty states)
<ThemedView style={[LAYOUT.screenCentered, { paddingTop: insets.top + SPACING.xl }]}>
  ...
</ThemedView>
```

### Cards
```tsx
// Use LAYOUT.card for standard surfaces
<ThemedView style={LAYOUT.card}>
  <ThemedText style={TEXT_STYLES.label}>Title</ThemedText>
  <ThemedText style={TEXT_STYLES.body}>Content</ThemedText>
</ThemedView>
```

---

## Component Patterns

### Buttons

**Primary CTA** (yellow, dark text):
```tsx
<TouchableOpacity style={[INTERACTIVE.button, isLoading && { opacity: 0.6 }]} onPress={...} disabled={isLoading}>
  <ThemedText style={INTERACTIVE.buttonText}>
    {isLoading ? 'Loading...' : 'Action'}
  </ThemedText>
</TouchableOpacity>
```

**Colored group buttons** (white text, party colors):
```tsx
<TouchableOpacity style={[styles.groupButton, { backgroundColor: COLORS.partyPurple }, SHADOWS.partyPurple]}>
  <Ionicons name="cafe" size={24} color={COLORS.white} />
  <Text style={{ color: COLORS.white, fontWeight: '600' }}>Cafe</Text>
</TouchableOpacity>
```

**Destructive button** (used in settings/delete flows):
```tsx
<TouchableOpacity style={[INTERACTIVE.button, { backgroundColor: COLORS.error }]}>
  <ThemedText style={[INTERACTIVE.buttonText, { color: COLORS.white }]}>Delete Account</ThemedText>
</TouchableOpacity>
```

**Text link button**:
```tsx
<TouchableOpacity onPress={...}>
  <ThemedText style={{ color: COLORS.primary, fontWeight: '600', fontSize: TYPOGRAPHY.base }}>
    Link Text
  </ThemedText>
</TouchableOpacity>
```

### Inputs
```tsx
<TextInput
  style={INTERACTIVE.input}
  placeholder="Placeholder text"
  placeholderTextColor={COLORS.textMuted}
  ...
/>
```
Always set `placeholderTextColor={COLORS.textMuted}` — React Native does not inherit it.

### Empty States
Every list screen needs an empty state. Pattern:
```tsx
{data.length === 0 && !loading && (
  <View style={styles.emptyState}>
    <Ionicons name="icon-outline" size={48} color={COLORS.textMuted} />
    <ThemedText style={styles.emptyTitle}>Nothing here yet</ThemedText>
    <ThemedText style={styles.emptySubtitle}>A helpful action suggestion.</ThemedText>
    <TouchableOpacity style={[INTERACTIVE.button, { marginTop: SPACING.lg }]} onPress={...}>
      <ThemedText style={INTERACTIVE.buttonText}>Primary CTA</ThemedText>
    </TouchableOpacity>
  </View>
)}

// Styles:
emptyState: {
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
```

### Loading States
Use `ActivityIndicator` from React Native:
```tsx
{loading && (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
)}
```

For inline list loading (skeleton feel):
```tsx
{loading ? (
  <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
) : (
  <FlatList ... />
)}
```

### List Items
```tsx
// Standard list row
<TouchableOpacity style={styles.listItem} onPress={...}>
  {/* Leading: avatar or icon */}
  <View style={styles.listItemLeading}>
    <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
  </View>
  {/* Content */}
  <View style={styles.listItemContent}>
    <ThemedText style={styles.listItemTitle}>{item.name}</ThemedText>
    <ThemedText style={styles.listItemSubtitle}>@{item.username}</ThemedText>
  </View>
  {/* Trailing: action or chevron */}
  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
</TouchableOpacity>

// Styles:
listItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: SPACING.md,
  paddingHorizontal: SPACING.xl,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
  gap: SPACING.md,
},
avatar: {
  width: 44,
  height: 44,
  borderRadius: BORDER_RADIUS.full,
  backgroundColor: COLORS.surface,
},
listItemContent: { flex: 1 },
listItemTitle: { fontSize: TYPOGRAPHY.base, fontWeight: '600', color: COLORS.text },
listItemSubtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted, marginTop: 2 },
```

### Notification / Count Badges
```tsx
// On top of an icon
{count > 0 && (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
  </View>
)}

badge: {
  position: 'absolute',
  top: 0,
  right: 0,
  backgroundColor: COLORS.partyPink,
  borderRadius: BORDER_RADIUS.full,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
},
badgeText: {
  color: COLORS.white,
  fontSize: TYPOGRAPHY.xs,
  fontWeight: 'bold',
},
```

---

## Badge Tier Colors

Defined in `constants/badges.ts`. Use `getBadgeTier(count)` to get the right colors.

| Tier | Color | Range |
|------|-------|-------|
| Locked | `#2A2A2A` | 0 |
| Bronze | `#CD7F32` | 1–2 |
| Silver | `#C0C0C0` | 3–9 |
| Gold | `#FFD700` | 10–19 |
| Diamond | `#B9F2FF` | 20–49 |
| Elite | `#9333EA` | 50–99 |
| Master | `#DC2626` | 100–299 |
| Legend | `#EA580C` | 300–499 |
| Mythic | `#10B981` | 500+ |

Usage:
```tsx
import { getBadgeTier } from '@/constants/badges';

const tier = getBadgeTier(badge.completion_count);
<View style={{ backgroundColor: tier.color, borderColor: tier.borderColor }}>
  <Text style={{ color: tier.textColor }}>{tier.name}</Text>
</View>
```

---

## Icons

Use `@expo/vector-icons/Ionicons` exclusively. Use outline variants (`-outline` suffix) for inactive/secondary states, filled for active/selected.

### Size conventions
| Context | Size |
|---------|------|
| Tab bar icons | 28 |
| Navigation header icons | 24 |
| In-line with text | 20 |
| Large decorative / empty state | 48 |
| Micro (inside chips) | 16 |

### Semantic icon map
| Meaning | Icon name |
|---------|-----------|
| Home screen | `home` / `home-outline` |
| Groups | `people` / `people-outline` |
| Profile | `person` / `person-outline` |
| Notifications | `notifications` / `notifications-outline` |
| Settings | `settings` / `settings-outline` |
| Friends | `person-add` / `person-add-outline` |
| Active game | `game-controller` |
| Task timer | `timer` |
| Task photo | `camera` / `camera-outline` |
| Badge / award | `medal-outline` |
| Cafe | `cafe` |
| Home party | `home` |
| Back/close | `chevron-back` / `close` |
| Forward/more | `chevron-forward` |
| Success | `checkmark-circle` |
| Error | `close-circle` |
| Search | `search-outline` |
| Trash / delete | `trash-outline` |
| Edit | `pencil-outline` |

---

## Animations

### Pulse (for live/active elements)
```tsx
const pulseAnim = useRef(new Animated.Value(1)).current;

Animated.loop(
  Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
    Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
  ])
).start();

// Apply:
<Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
```

### Fade In (for screen transitions)
```tsx
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1, duration: 300, useNativeDriver: true,
  }).start();
}, []);

<Animated.View style={{ opacity: fadeAnim }}>
```

---

## Screen Structure Checklist

Every screen should have:
- [ ] `useSafeAreaInsets()` for top/bottom padding
- [ ] `KeyboardAvoidingView` if there are text inputs
- [ ] Loading state (spinner or skeleton)
- [ ] Empty state if it shows a list
- [ ] `RefreshControl` if it shows a list
- [ ] Error feedback via `Alert.alert` or inline error text
- [ ] `headerShown: false` (we build custom headers)

---

## What NOT to do

- Don't hardcode hex colors — always use `COLORS.*`
- Don't hardcode pixel values — always use `SPACING.*` / `TYPOGRAPHY.*`
- Don't mix party colors (e.g. purple glow on an orange button)
- Don't use `fontWeight: 'bold'` directly — use `TYPOGRAPHY.bold`
- Don't use `<Text>` directly — use `<ThemedText>` for all user-visible text
- Don't skip `placeholderTextColor` on `<TextInput>`
- Don't leave screens without empty states or loading indicators
