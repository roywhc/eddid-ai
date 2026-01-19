import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ChevronLeft, Check, Zap, TrendingUp } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getSubscriptionProducts, type SubscriptionProduct } from '@/lib/subscriptionService';

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { subscriptions, aiSubscription, dataSubscriptions, loading: subsLoading } = useSubscription();
  const [aiProducts, setAIProducts] = useState<SubscriptionProduct[]>([]);
  const [dataProducts, setDataProducts] = useState<SubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'ai' | 'data'>('ai');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [ai, data] = await Promise.all([
        getSubscriptionProducts('ai_subscription'),
        getSubscriptionProducts('data_subscription'),
      ]);
      setAIProducts(ai);
      setDataProducts(data);
    } catch (error) {
      console.error('Error loading subscription products:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasSubscription = (productId: string) => {
    return subscriptions.some((sub) => sub.product_id === productId);
  };

  const getActiveSubscriptionForProduct = (productId: string) => {
    return subscriptions.find((sub) => sub.product_id === productId);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const renderProductCard = (product: SubscriptionProduct) => {
    const isSubscribed = hasSubscription(product.id);
    const activeSub = getActiveSubscriptionForProduct(product.id);
    const isFeatured = product.is_featured || product.slug === 'ai-premium' || product.slug === 'data-all-markets';

    return (
      <View
        key={product.id}
        style={[
          styles.productCard,
          {
            backgroundColor: colors.card,
            borderColor: isFeatured ? colors.primary : colors.border,
            borderWidth: isFeatured ? 2 : 1,
          },
        ]}>
        {isFeatured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.featuredText, { color: colors.secondary }]}>{t('subscriptions.popular')}</Text>
          </View>
        )}

        <View style={styles.productHeader}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
          {product.product_type === 'ai_subscription' && (
            <Zap size={24} color={colors.primary} style={styles.productIcon} />
          )}
          {product.product_type === 'data_subscription' && (
            <TrendingUp size={24} color={colors.primary} style={styles.productIcon} />
          )}
        </View>

        <Text style={[styles.productDescription, { color: colors.textSecondary }]}>
          {product.description}
        </Text>

        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('subscriptions.monthly')}</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {formatPrice(product.price_monthly)}/mo
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('subscriptions.yearly')}</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {formatPrice(product.price_yearly)}/yr
            </Text>
            <Text style={[styles.savingsBadge, { color: colors.success }]}>
              {t('subscriptions.save')} {Math.round((1 - product.price_yearly / (product.price_monthly * 12)) * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          {product.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSubscribed ? (
          <View style={styles.subscribedContainer}>
            <View style={[styles.subscribedBadge, { backgroundColor: colors.successBg }]}>
              <Check size={20} color={colors.success} />
              <Text style={[styles.subscribedText, { color: colors.success }]}>{t('subscriptions.active')}</Text>
            </View>
            {activeSub && (
              <Text style={[styles.subscriptionInfo, { color: colors.textSecondary }]}>
                {activeSub.billing_cycle === 'monthly' ? t('subscriptions.monthly') : t('subscriptions.yearly')} •{' '}
                {activeSub.is_trial ? t('subscriptions.trial') : t('subscriptions.active')}
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              {
                backgroundColor: isFeatured ? colors.primary : colors.secondary,
              },
            ]}
            onPress={() => {
              console.log('Subscribe to:', product.name);
            }}>
            <Text
              style={[
                styles.subscribeButtonText,
                {
                  color: isFeatured ? colors.secondary : colors.surface,
                },
              ]}>
              {t('subscriptions.subscribe')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading || subsLoading) {
    return (
      <SafeContainer edges={['top']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Subscriptions</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('subscriptions.title')}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'ai' && {
                backgroundColor: colors.primary,
                borderRadius: BorderRadius.md,
              },
            ]}
            onPress={() => setSelectedTab('ai')}>
            <Zap size={20} color={selectedTab === 'ai' ? colors.secondary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'ai' ? colors.secondary : colors.textSecondary,
                },
              ]}>
              {t('subscriptions.aiSubscriptions')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'data' && {
                backgroundColor: colors.primary,
                borderRadius: BorderRadius.md,
              },
            ]}
            onPress={() => setSelectedTab('data')}>
            <TrendingUp
              size={20}
              color={selectedTab === 'data' ? colors.secondary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'data' ? colors.secondary : colors.textSecondary,
                },
              ]}>
              {t('subscriptions.dataSubscriptions')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {!user && (
            <View style={[styles.signInPrompt, { backgroundColor: colors.infoBg }]}>
              <Text style={[styles.signInText, { color: colors.info }]}>
                {t('subscriptions.signInPrompt')}
              </Text>
              <TouchableOpacity
                style={[styles.signInButton, { backgroundColor: colors.info }]}
                onPress={() => router.push('/auth')}>
                <Text style={[styles.signInButtonText, { color: colors.surface }]}>{t('subscriptions.signIn')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedTab === 'ai' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('subscriptions.aiTradingAssistant')}</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                {t('subscriptions.aiTradingDesc')}
              </Text>
              {aiProducts.map(renderProductCard)}
            </>
          )}

          {selectedTab === 'data' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('subscriptions.marketDataAccess')}</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                {t('subscriptions.marketDataDesc')}
              </Text>
              {dataProducts.map(renderProductCard)}
            </>
          )}
        </ScrollView>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tabText: {
    ...Typography.bodyMedium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  signInPrompt: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  signInText: {
    ...Typography.body,
    textAlign: 'center',
  },
  signInButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  signInButtonText: {
    ...Typography.bodyMedium,
  },
  sectionTitle: {
    ...Typography.heading2,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  productCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    ...Typography.smallMedium,
    fontWeight: '700',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productIcon: {
    marginLeft: Spacing.sm,
  },
  productName: {
    ...Typography.heading3,
  },
  productDescription: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  priceContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    ...Typography.body,
  },
  priceValue: {
    ...Typography.bodySemibold,
  },
  savingsBadge: {
    ...Typography.smallMedium,
    fontWeight: '600',
  },
  featuresList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    flex: 1,
  },
  subscribedContainer: {
    gap: Spacing.sm,
  },
  subscribedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  subscribedText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  subscriptionInfo: {
    ...Typography.caption,
    textAlign: 'center',
  },
  subscribeButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...Typography.bodySemibold,
  },
});
