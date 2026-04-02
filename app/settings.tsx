import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BORDER_RADIUS,
  COLORS,
  INTERACTIVE,
  LAYOUT,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuth();

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/login');
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await authService.updatePassword(newPassword);
      if (error) throw error;

      Alert.alert('Success', 'Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data — badges, friends, groups, and game history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (user) {
                        await authService.deleteAccount(user.id);
                      }
                      await logout();
                      router.replace('/login');
                    } catch (err: any) {
                      Alert.alert('Error', err.message ?? 'Could not delete account. Please contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account section */}
        <ThemedText style={styles.sectionLabel}>ACCOUNT</ThemedText>
        <View style={styles.card}>
          {/* Email (read-only) */}
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
            </View>
            <View style={styles.rowContent}>
              <ThemedText style={styles.rowLabel}>Email</ThemedText>
              <ThemedText style={styles.rowValue}>{user?.email}</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Change Password toggle */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowPasswordSection(prev => !prev)}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
            </View>
            <View style={styles.rowContent}>
              <ThemedText style={styles.rowLabel}>Change Password</ThemedText>
            </View>
            <Ionicons
              name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordSection}>
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={COLORS.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { marginTop: SPACING.sm }]}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.passwordButton, passwordLoading && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                <ThemedText style={styles.passwordButtonText}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* About section */}
        <ThemedText style={styles.sectionLabel}>ABOUT</ThemedText>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
            </View>
            <View style={styles.rowContent}>
              <ThemedText style={styles.rowLabel}>App Version</ThemedText>
              <ThemedText style={styles.rowValue}>{appVersion}</ThemedText>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <ThemedText style={[styles.sectionLabel, { color: COLORS.error }]}>DANGER ZONE</ThemedText>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity style={styles.row} onPress={handleLogout} disabled={isLoading}>
            <View style={styles.rowIcon}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            </View>
            <ThemedText style={[styles.rowLabel, { color: COLORS.error }]}>
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
            <View style={styles.rowIcon}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </View>
            <ThemedText style={[styles.rowLabel, { color: COLORS.error }]}>
              Delete Account
            </ThemedText>
          </TouchableOpacity>
        </View>

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
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32, // balances the back button
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.xl + 28, // indent past the icon
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    minHeight: 52,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  passwordSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    ...INTERACTIVE.input,
    marginTop: SPACING.md,
  },
  passwordButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.primary,
  },
  passwordButtonText: {
    color: COLORS.gray900,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.base,
  },
});
