import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Shield, Smartphone, Key, Lock, Eye, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function SecuritySettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const securityOptions = [
    {
      icon: Smartphone,
      title: t('security.biometricAuth'),
      description: t('security.biometricAuthDesc'),
      value: biometricEnabled,
      onValueChange: setBiometricEnabled,
    },
    {
      icon: Shield,
      title: t('security.twoFactorAuth'),
      description: t('security.twoFactorAuthDesc'),
      value: twoFactorEnabled,
      onValueChange: setTwoFactorEnabled,
    },
    {
      icon: AlertCircle,
      title: t('security.loginAlerts'),
      description: t('security.loginAlertsDesc'),
      value: loginAlerts,
      onValueChange: setLoginAlerts,
    },
  ];

  const sessions = [
    { id: '1', device: 'iPhone 15 Pro', location: 'Hong Kong', active: true, lastActive: t('security.active') + ' now' },
    { id: '2', device: 'iPad Pro', location: 'Hong Kong', active: false, lastActive: '2 days ago' },
    { id: '3', device: 'MacBook Pro', location: 'Hong Kong', active: false, lastActive: '1 week ago' },
  ];

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('security.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('security.authentication')}</Text>

          {securityOptions.map((option, index) => (
            <View
              key={index}
              style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                <option.icon size={24} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <Switch
                value={option.value}
                onValueChange={option.onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('security.password')}</Text>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Key size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t('security.changePassword')}</Text>
            <Text style={[styles.actionHint, { color: colors.textSecondary }]}>{t('security.lastChanged')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('security.activeSessions')}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('security.activeSessionsDesc')}
          </Text>

          {sessions.map((session) => (
            <View
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionDevice, { color: colors.text }]}>{session.device}</Text>
                  {session.active && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.successBg }]}>
                      <Text style={[styles.activeBadgeText, { color: colors.success }]}>{t('security.active')}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sessionLocation, { color: colors.textSecondary }]}>{session.location}</Text>
                <Text style={[styles.sessionTime, { color: colors.textTertiary }]}>{session.lastActive}</Text>
              </View>
              {!session.active && (
                <TouchableOpacity style={[styles.revokeButton, { backgroundColor: colors.errorBg }]}>
                  <Text style={[styles.revokeButtonText, { color: colors.error }]}>{t('security.revoke')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.warningCard, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
          <AlertCircle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            {t('security.securityWarning')}
          </Text>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading4,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  optionDescription: {
    ...Typography.caption,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  actionText: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  actionHint: {
    ...Typography.caption,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.sm,
  },
  sessionDevice: {
    ...Typography.bodyMedium,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: {
    ...Typography.smallMedium,
  },
  sessionLocation: {
    ...Typography.caption,
    marginBottom: 2,
  },
  sessionTime: {
    ...Typography.small,
  },
  revokeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  revokeButtonText: {
    ...Typography.captionMedium,
  },
  warningCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  warningText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
