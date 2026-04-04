import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS, INTERACTIVE, SPACING, TEXT_STYLES, TYPOGRAPHY } from '@/constants/design';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
  validateUsername,
} from '@/constants/validation';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FieldErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    const nameErr = validateName(name);
    const usernameErr = validateUsername(username);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const matchErr = validatePasswordMatch(password, confirmPassword);

    if (nameErr) newErrors.name = nameErr;
    if (usernameErr) newErrors.username = usernameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;
    if (matchErr) newErrors.confirmPassword = matchErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      const needsEmailConfirmation = await register(email.trim(), password, username.trim(), name.trim());

      if (needsEmailConfirmation) {
        Alert.alert(
          'Check Your Email',
          'We sent a confirmation link to your email. Please confirm to activate your account, then come back and log in.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        router.replace('/onboarding');
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.header}>
          <ThemedText style={TEXT_STYLES.title}>Create Account</ThemedText>
          <ThemedText style={TEXT_STYLES.subtitle}>Join to sync your profile across devices</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          {/* Full Name */}
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); if (errors.name) setErrors(e => ({ ...e, name: undefined })); }}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </ThemedView>

          {/* Username */}
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={username}
              onChangeText={(v) => { setUsername(v); if (errors.username) setErrors(e => ({ ...e, username: undefined })); }}
              placeholder="Letters, numbers, underscores (3–20)"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
          </ThemedView>

          {/* Email */}
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(v) => { setEmail(v); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </ThemedView>

          {/* Password */}
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={password}
              onChangeText={(v) => { setPassword(v); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </ThemedView>

          {/* Confirm Password */}
          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); if (errors.confirmPassword) setErrors(e => ({ ...e, confirmPassword: undefined })); }}
              placeholder="Confirm your password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </ThemedView>

          <TouchableOpacity
            style={[INTERACTIVE.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <ThemedText style={INTERACTIVE.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>Already have an account?</ThemedText>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.linkText}>Sign In</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.massive,
  },
  form: {
    marginBottom: SPACING.massive,
  },
  field: {
    marginBottom: SPACING.xxl,
  },
  label: {
    ...TEXT_STYLES.label,
  },
  input: {
    ...INTERACTIVE.input,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sm,
    marginTop: SPACING.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    ...TEXT_STYLES.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  linkText: {
    ...TEXT_STYLES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
