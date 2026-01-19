import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import {
  ArrowLeft,
  Settings,
  Database,
  Download,
  Trash2,
  FileText,
  Shield,
  HelpCircle,
  Mail,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function GeneralSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(true);

  const dataAndPrivacy = [
    {
      icon: Database,
      title: t('general.dataUsage'),
      description: t('general.dataUsageDesc'),
      action: () => {},
    },
    {
      icon: Download,
      title: t('general.exportData'),
      description: t('general.exportDataDesc'),
      action: () => {},
    },
    {
      icon: Shield,
      title: t('general.privacyPolicy'),
      description: t('general.privacyPolicyDesc'),
      action: () => {},
    },
    {
      icon: FileText,
      title: t('general.termsOfService'),
      description: t('general.termsOfServiceDesc'),
      action: () => {},
    },
  ];

  const support = [
    {
      icon: HelpCircle,
      title: t('general.helpCenter'),
      description: t('general.helpCenterDesc'),
      action: () => {},
    },
    {
      icon: Mail,
      title: t('general.contactSupport'),
      description: t('general.contactSupportDesc'),
      action: () => {},
    },
    {
      icon: ExternalLink,
      title: t('general.communityForum'),
      description: t('general.communityForumDesc'),
      action: () => {},
    },
  ];

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear the app cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          // Implement cache clearing logic
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion logic
          },
        },
      ]
    );
  };

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('general.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general.dataCollection')}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('general.dataCollectionDesc')}
          </Text>

          <View style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{t('general.analytics')}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                {t('general.analyticsDesc')}
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{t('general.crashReports')}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                {t('general.crashReportsDesc')}
              </Text>
            </View>
            <Switch
              value={crashReportsEnabled}
              onValueChange={setCrashReportsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general.dataPrivacy')}</Text>

          {dataAndPrivacy.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={item.action}>
              <View style={[styles.actionIcon, { backgroundColor: colors.surface }]}>
                <item.icon size={20} color={colors.text} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <ExternalLink size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general.support')}</Text>

          {support.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={item.action}>
              <View style={[styles.actionIcon, { backgroundColor: colors.surface }]}>
                <item.icon size={20} color={colors.text} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <ExternalLink size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general.storage')}</Text>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleClearCache}>
            <View style={[styles.actionIcon, { backgroundColor: colors.surface }]}>
              <Database size={20} color={colors.text} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{t('general.clearCache')}</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                {t('general.clearCacheDesc')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.storageInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>{t('general.cacheSize')}</Text>
            <Text style={[styles.storageValue, { color: colors.text }]}>24.5 MB</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general.account')}</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.infoBg }]}>
            <Text style={[styles.infoLabel, { color: colors.info }]}>{t('general.accountEmail')}</Text>
            <Text style={[styles.infoValue, { color: colors.info }]}>{user?.email}</Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.infoBg }]}>
            <Text style={[styles.infoLabel, { color: colors.info }]}>{t('general.accountId')}</Text>
            <Text style={[styles.infoValue, { color: colors.info }]}>{user?.id.substring(0, 16)}...</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general.dangerZone')}</Text>

          <TouchableOpacity
            style={[styles.dangerCard, { backgroundColor: colors.errorBg, borderColor: colors.error }]}
            onPress={handleDeleteAccount}>
            <View style={styles.dangerContent}>
              <View style={styles.dangerHeader}>
                <AlertTriangle size={20} color={colors.error} />
                <Text style={[styles.dangerTitle, { color: colors.error }]}>{t('general.deleteAccount')}</Text>
              </View>
              <Text style={[styles.dangerDescription, { color: colors.error }]}>
                {t('general.deleteAccountDesc')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.version}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>Version 1.0.0 (Build 100)</Text>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>© 2026 Eddid Financial</Text>
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
    marginBottom: Spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  actionDescription: {
    ...Typography.caption,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  storageLabel: {
    ...Typography.body,
  },
  storageValue: {
    ...Typography.bodySemibold,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.bodyMedium,
  },
  dangerCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dangerContent: {
    gap: Spacing.sm,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dangerTitle: {
    ...Typography.bodySemibold,
  },
  dangerDescription: {
    ...Typography.caption,
    lineHeight: 18,
  },
  version: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  versionText: {
    ...Typography.small,
  },
});
