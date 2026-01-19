import { View, Text, StyleSheet } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Sparkles, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ComingSoonScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <SafeContainer>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Sparkles size={64} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('comingSoon.title')}</Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('comingSoon.description')}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title={t('comingSoon.goBack')}
              onPress={() => router.back()}
              icon={<ArrowLeft size={20} color={colors.secondary} />}
            />
          </View>
        </View>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading1,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
