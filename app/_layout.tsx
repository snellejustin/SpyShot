import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="game-setup" />
        <Stack.Screen name="game-active" />
        <Stack.Screen name="game-photo" />
        <Stack.Screen name="game-timer" />
        <Stack.Screen name="game-summary" />
        <Stack.Screen name="create-group" />
        <Stack.Screen name="group-detail" />
        <Stack.Screen name="friends-list" />
        <Stack.Screen name="search-users" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="badges-list" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="join-game" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
