import { useAuth } from '@/contexts/AuthContext';
import { COLORS, TYPOGRAPHY } from '@/constants/design';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { user, isInitialized } = useAuth();

  // Wait for the session check to complete before redirecting
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>SpyShot</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/(index)" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: TYPOGRAPHY.huge,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 8,
  },
});
