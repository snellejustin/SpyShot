/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#fbbf24'; // Light yellow
const tintColorDark = '#fbbf24'; // Light yellow

export const Colors = {
  light: {
    text: '#f9fafb', // Light text for dark theme
    background: '#1f2937', // Dark grey background
    tint: tintColorLight,
    icon: '#d1d5db', // Light grey icons
    tabIconDefault: '#9ca3af', // Muted grey for inactive tabs
    tabIconSelected: tintColorLight, // Yellow for active tabs
  },
  dark: {
    text: '#f9fafb', // Light text
    background: '#1f2937', // Dark grey background  
    tint: tintColorDark,
    icon: '#d1d5db', // Light grey icons
    tabIconDefault: '#9ca3af', // Muted grey for inactive tabs
    tabIconSelected: tintColorDark, // Yellow for active tabs
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

