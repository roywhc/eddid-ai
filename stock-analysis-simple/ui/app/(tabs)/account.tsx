import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { router } from 'expo-router';
import {
  User,
  Settings,
  Shield,
  CreditCard,
  FileText,
  Bell,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react-native';

export default function AccountScreen() {
  const { colors, theme, setTheme, colorScheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const profileItems = [
    { icon: User, label: t('account.profile'), screen: '/settings/profile' },
    { icon: Shield, label: t('account.kyc'), screen: 'kyc', badge: t('account.verified') },
    { icon: CreditCard, label: t('account.subscription'), screen: '/settings/subscriptions', badge: 'Pro' },
  ];

  const settingsItems = [
    { icon: Bell, label: t('account.preferences'), screen: '/settings/preferences' },
    { icon: Shield, label: t('account.security'), screen: '/settings/security' },
    { icon: Settings, label: t('account.settings'), screen: '/settings/general' },
  ];

  const financialItems = [
    { icon: CreditCard, label: t('account.deposit'), screen: '/settings/deposit' },
    { icon: CreditCard, label: t('account.withdraw'), screen: '/settings/withdraw' },
    { icon: ArrowLeftRight, label: t('account.transactions'), screen: '/settings/transactions' },
  ];

  return (
    <SafeContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerGradient, { backgroundColor: colors.background }]}>
          <View style={styles.headerContent}>
            <EddidLogo width={120} height={30} color={colorScheme === 'dark' ? '#FFFFFF' : '#0D1647'} />
            <View style={styles.glowEffect} />
          </View>
        </View>

        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('account.title')}</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.secondary }]}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>john.doe@example.com</Text>
          </View>
          <View style={[styles.verifiedBadge, { backgroundColor: colors.successBg }]}>
            <CheckCircle2 size={14} color={colors.success} />
            <Text style={[styles.verifiedText, { color: colors.success }]}>{t('account.verified')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account.sectionProfile')}</Text>
          {profileItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(item.screen as any)}>
              <item.icon size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              {item.badge && (
                <View style={[
                  styles.badge,
                  { backgroundColor: item.badge === t('account.verified') ? colors.successBg : colors.infoBg }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: item.badge === t('account.verified') ? colors.success : colors.info }
                  ]}>
                    {item.badge}
                  </Text>
                </View>
              )}
              <ChevronRight size={20} color={colors.textTertiary} style={styles.chevron} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account.sectionAppearance')}</Text>

          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Globe size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('account.language')}</Text>
            <View style={styles.languageButtons}>
              {(['en', 'zh-HK', 'zh-CN'] as const).map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageButton,
                    {
                      backgroundColor: language === lang ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setLanguage(lang)}>
                  <Text style={[
                    styles.languageButtonText,
                    { color: language === lang ? colors.secondary : colors.textSecondary }
                  ]}>
                    {lang === 'en' ? 'EN' : lang === 'zh-HK' ? '繁' : '简'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {colorScheme === 'dark' ? (
              <Moon size={20} color={colors.text} />
            ) : (
              <Sun size={20} color={colors.text} />
            )}
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('account.theme')}</Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: theme === 'light' ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setTheme('light')}>
                <Sun size={16} color={theme === 'light' ? colors.secondary : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: theme === 'dark' ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setTheme('dark')}>
                <Moon size={16} color={theme === 'dark' ? colors.secondary : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: theme === 'auto' ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setTheme('auto')}>
                <Text style={[
                  styles.themeButtonText,
                  { color: theme === 'auto' ? colors.secondary : colors.textSecondary }
                ]}>
                  {t('account.themeAuto')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account.sectionSettings')}</Text>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(item.screen as any)}>
              <item.icon size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              <ChevronRight size={20} color={colors.textTertiary} style={styles.chevron} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account.sectionFinancial')}</Text>
          {financialItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(item.screen as any)}>
              <item.icon size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              <ChevronRight size={20} color={colors.textTertiary} style={styles.chevron} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>{t('account.signOut')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Version 1.0.0</Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>© 2026 Eddid Financial</Text>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    right: -20,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F8D000',
    opacity: 0.08,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.heading1,
  },
  profileCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    ...Typography.heading2,
  },
  profileInfo: {
    marginBottom: Spacing.sm,
  },
  profileName: {
    ...Typography.heading3,
    marginBottom: 2,
  },
  profileEmail: {
    ...Typography.body,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    ...Typography.smallMedium,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.captionMedium,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.body,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.smallMedium,
  },
  chevron: {
    marginLeft: 'auto',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  languageButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  languageButtonText: {
    ...Typography.smallMedium,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  themeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonText: {
    ...Typography.smallMedium,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  signOutText: {
    ...Typography.bodyMedium,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.small,
  },
});
