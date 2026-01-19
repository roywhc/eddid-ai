import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useState } from 'react';
import { router } from 'expo-router';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        router.back();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <EddidLogo width={180} height={45} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {mode === 'signin'
                ? 'Sign in to access your trading account'
                : 'Start trading with Eddid Financial'}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <Button
              title={mode === 'signin' ? 'Sign In' : 'Sign Up'}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />

            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <Button
                title={mode === 'signin' ? 'Sign Up' : 'Sign In'}
                variant="ghost"
                onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              />
            </View>
          </View>

          <View style={[styles.disclaimer, { backgroundColor: colors.infoBg }]}>
            <Text style={[styles.disclaimerText, { color: colors.info }]}>
              By continuing, you agree to Eddid Financial's Terms of Service and Privacy Policy.
              Investment involves risk. Past performance is not indicative of future results.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...Typography.heading1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  toggleText: {
    ...Typography.body,
  },
  disclaimer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: 'auto',
  },
  disclaimerText: {
    ...Typography.small,
    textAlign: 'center',
    lineHeight: 18,
  },
});
