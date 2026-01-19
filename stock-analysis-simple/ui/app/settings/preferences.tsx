import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Bell, Mail, Smartphone, TrendingUp, DollarSign, AlertCircle, Info } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const [priceAlerts, setPriceAlerts] = useState(true);
  const [tradeConfirmations, setTradeConfirmations] = useState(true);
  const [marketNews, setMarketNews] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  const [soundEffects, setSoundEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

  const notificationChannels = [
    {
      icon: Bell,
      title: t('preferences.pushNotifications'),
      description: t('preferences.pushNotificationsDesc'),
      value: pushNotifications,
      onValueChange: setPushNotifications,
    },
    {
      icon: Mail,
      title: t('preferences.emailNotifications'),
      description: t('preferences.emailNotificationsDesc'),
      value: emailNotifications,
      onValueChange: setEmailNotifications,
    },
    {
      icon: Smartphone,
      title: t('preferences.smsNotifications'),
      description: t('preferences.smsNotificationsDesc'),
      value: smsNotifications,
      onValueChange: setSmsNotifications,
    },
  ];

  const notificationTypes = [
    {
      icon: TrendingUp,
      title: t('preferences.priceAlerts'),
      description: t('preferences.priceAlertsDesc'),
      value: priceAlerts,
      onValueChange: setPriceAlerts,
    },
    {
      icon: DollarSign,
      title: t('preferences.tradeConfirmations'),
      description: t('preferences.tradeConfirmationsDesc'),
      value: tradeConfirmations,
      onValueChange: setTradeConfirmations,
    },
    {
      icon: Info,
      title: t('preferences.marketNews'),
      description: t('preferences.marketNewsDesc'),
      value: marketNews,
      onValueChange: setMarketNews,
    },
    {
      icon: AlertCircle,
      title: t('preferences.portfolioUpdates'),
      description: t('preferences.portfolioUpdatesDesc'),
      value: portfolioUpdates,
      onValueChange: setPortfolioUpdates,
    },
    {
      icon: Bell,
      title: t('preferences.promotions'),
      description: t('preferences.promotionsDesc'),
      value: promotions,
      onValueChange: setPromotions,
    },
  ];

  const appPreferences = [
    {
      title: t('preferences.soundEffects'),
      description: t('preferences.soundEffectsDesc'),
      value: soundEffects,
      onValueChange: setSoundEffects,
    },
    {
      title: t('preferences.vibration'),
      description: t('preferences.vibrationDesc'),
      value: vibration,
      onValueChange: setVibration,
    },
    {
      title: t('preferences.autoRefresh'),
      description: t('preferences.autoRefreshDesc'),
      value: autoRefresh,
      onValueChange: setAutoRefresh,
    },
    {
      title: t('preferences.biometricLock'),
      description: t('preferences.biometricLockDesc'),
      value: biometricLock,
      onValueChange: setBiometricLock,
    },
  ];

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('preferences.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('preferences.notificationChannels')}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('preferences.chooseNotifications')}
          </Text>

          {notificationChannels.map((channel, index) => (
            <View
              key={index}
              style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                <channel.icon size={24} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{channel.title}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {channel.description}
                </Text>
              </View>
              <Switch
                value={channel.value}
                onValueChange={channel.onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('preferences.notificationTypes')}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('preferences.selectNotificationTypes')}
          </Text>

          {notificationTypes.map((type, index) => (
            <View
              key={index}
              style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.optionIconSmall, { backgroundColor: colors.surface }]}>
                <type.icon size={20} color={colors.text} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{type.title}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{type.description}</Text>
              </View>
              <Switch
                value={type.value}
                onValueChange={type.onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('preferences.appPreferences')}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('preferences.customizeExperience')}
          </Text>

          {appPreferences.map((pref, index) => (
            <View
              key={index}
              style={[styles.prefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.prefContent}>
                <Text style={[styles.prefTitle, { color: colors.text }]}>{pref.title}</Text>
                <Text style={[styles.prefDescription, { color: colors.textSecondary }]}>{pref.description}</Text>
              </View>
              <Switch
                value={pref.value}
                onValueChange={pref.onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.infoBg, borderColor: colors.info }]}>
          <Info size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.info }]}>
            {t('preferences.securityNotice')}
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
  optionIconSmall: {
    width: 40,
    height: 40,
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
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  prefContent: {
    flex: 1,
  },
  prefTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  prefDescription: {
    ...Typography.caption,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  infoText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
