import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TrendingUp, TrendingDown, ChevronRight, Star, ChevronDown, ChevronUp, Activity, Calendar, DollarSign, BarChart2, Award, Grid3x3, LineChart, Wallet, Sparkles } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface RecentlyViewedAsset {
  id: string;
  asset_symbol: string;
  asset_name: string;
  asset_type: string;
}

interface FavoriteAsset {
  id: string;
  asset_symbol: string;
  asset_name: string;
  asset_type: string;
}

const MOCK_RECENTLY_VIEWED = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, change: 1.34, type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.80, change: -2.15, type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: 3.42, type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.15, change: 0.89, type: 'stock' },
];

const MOCK_FAVORITES = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, change: 1.34, volume: '52.3M' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.30, change: 2.15, volume: '31.2M' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.90, change: -0.85, volume: '48.5M' },
  { symbol: 'META', name: 'Meta Platforms', price: 485.20, change: 1.92, volume: '15.8M' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: 3.42, volume: '62.1M' },
];

const TOOLBOX_ITEMS = [
  { id: 'screener', titleKey: 'marketScreener', icon: Activity, descKey: 'marketScreenerDesc' },
  { id: 'payment', titleKey: 'monthlyPaymentPlan', icon: DollarSign, descKey: 'monthlyPaymentPlanDesc' },
  { id: 'broker', titleKey: 'brokerRanking', icon: Award, descKey: 'brokerRankingDesc' },
  { id: 'ipo', titleKey: 'ipoSubscription', icon: Calendar, descKey: 'ipoSubscriptionDesc' },
  { id: 'calendar', titleKey: 'eventCalendar', icon: Calendar, descKey: 'eventCalendarDesc' },
  { id: 'heatmap', titleKey: 'heatmap', icon: Grid3x3, descKey: 'heatmapDesc' },
];

export default function TradeScreen() {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tradesCount, setTradesCount] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<typeof MOCK_RECENTLY_VIEWED>([]);
  const [favorites, setFavorites] = useState<typeof MOCK_FAVORITES>([]);
  const [showToolbox, setShowToolbox] = useState(false);

  useEffect(() => {
    if (user) {
      loadTradesCount();
      loadRecentlyViewed();
      loadFavorites();
    } else {
      setRecentlyViewed(MOCK_RECENTLY_VIEWED);
      setFavorites(MOCK_FAVORITES);
    }
  }, [user]);

  const loadTradesCount = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('user_trades')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    if (!error && data !== null) {
      setTradesCount(data as unknown as number);
    }
  };

  const loadRecentlyViewed = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('recently_viewed_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(6);

    if (!error && data) {
      const formatted = data.map(item => ({
        symbol: item.asset_symbol,
        name: item.asset_name,
        price: 185.50 + Math.random() * 100,
        change: (Math.random() - 0.5) * 5,
        type: item.asset_type,
      }));
      setRecentlyViewed(formatted);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('favorite_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      const formatted = data.map(item => ({
        symbol: item.asset_symbol,
        name: item.asset_name,
        price: 185.50 + Math.random() * 100,
        change: (Math.random() - 0.5) * 5,
        volume: `${(Math.random() * 100).toFixed(1)}M`,
      }));
      setFavorites(formatted);
    }
  };

  const handleAssetClick = (symbol: string, name: string) => {
    router.push(`/asset/${symbol}?name=${encodeURIComponent(name)}`);
  };

  return (
    <SafeContainer>
      <View style={[styles.headerGradient, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <View>
            <EddidLogo width={120} height={30} color={colorScheme === 'dark' ? '#FFFFFF' : '#0D1647'} />
            <Text style={[styles.tradesCount, { color: colors.textSecondary }]}>
              {tradesCount} {t('trade.tradesCount')} {t('trade.tradesCountToday')}
            </Text>
          </View>
          <View style={styles.glowEffect} />
        </View>
      </View>

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('trade.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/coming-soon')}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
                <LineChart size={24} color={colors.primary} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{t('trade.stocks')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/coming-soon')}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.success + '15' }]}>
                <Activity size={24} color={colors.success} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{t('trade.options')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/coming-soon')}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.warning + '15' }]}>
                <TrendingUp size={24} color={colors.warning} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{t('trade.futures')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/coming-soon')}>
              <View style={[styles.categoryIcon, { backgroundColor: '#9333ea' + '15' }]}>
                <Wallet size={24} color="#9333ea" />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{t('trade.funds')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('trade.recentlyViewed')}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}>
            {recentlyViewed.map((asset, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleAssetClick(asset.symbol, asset.name)}>
                <View style={styles.assetCardHeader}>
                  <Text style={[styles.assetSymbol, { color: colors.text }]}>{asset.symbol}</Text>
                  {asset.change >= 0 ? (
                    <TrendingUp size={16} color={colors.success} />
                  ) : (
                    <TrendingDown size={16} color={colors.error} />
                  )}
                </View>
                <Text style={[styles.assetName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {asset.name}
                </Text>
                <Text style={[styles.assetPrice, { color: colors.text }]}>
                  ${asset.price.toFixed(2)}
                </Text>
                <Text style={[styles.assetChange, { color: asset.change >= 0 ? colors.success : colors.error }]}>
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('trade.favorites')}</Text>
          </View>
          <View style={[styles.favoritesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.favoritesHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.columnHeader, styles.symbolColumn, { color: colors.textSecondary }]}>{t('trade.symbol')}</Text>
              <Text style={[styles.columnHeader, styles.priceColumn, { color: colors.textSecondary }]}>{t('trade.price')}</Text>
              <Text style={[styles.columnHeader, styles.changeColumn, { color: colors.textSecondary }]}>24h</Text>
              <Text style={[styles.columnHeader, styles.volumeColumn, { color: colors.textSecondary }]}>{t('trade.volume')}</Text>
            </View>
            {favorites.map((asset, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.favoriteRow, { borderBottomColor: colors.border }]}
                onPress={() => handleAssetClick(asset.symbol, asset.name)}>
                <View style={styles.symbolColumn}>
                  <View style={styles.favoriteSymbol}>
                    <Star size={14} color={colors.primary} fill={colors.primary} />
                    <View>
                      <Text style={[styles.favoriteSymbolText, { color: colors.text }]}>{asset.symbol}</Text>
                      <Text style={[styles.favoriteNameText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {asset.name}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.priceColumn, styles.favoritePrice, { color: colors.text }]}>
                  ${asset.price.toFixed(2)}
                </Text>
                <View style={[styles.changeColumn, styles.favoriteChange]}>
                  <Text style={[styles.favoriteChangeText, { color: asset.change >= 0 ? colors.success : colors.error }]}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                  </Text>
                </View>
                <Text style={[styles.volumeColumn, styles.favoriteVolume, { color: colors.textSecondary }]}>
                  {asset.volume}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: Spacing.xl }]}>
          <TouchableOpacity
            style={[styles.toolboxHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowToolbox(!showToolbox)}>
            <View style={styles.toolboxHeaderLeft}>
              <BarChart2 size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('trade.toolbox')}</Text>
            </View>
            {showToolbox ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showToolbox && (
            <View style={[styles.toolboxContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {TOOLBOX_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.toolboxItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    // Handle toolbox item click
                  }}>
                  <View style={styles.toolboxItemLeft}>
                    <View style={[styles.toolboxIcon, { backgroundColor: colors.surface }]}>
                      <item.icon size={20} color={colors.primary} />
                    </View>
                    <View style={styles.toolboxText}>
                      <Text style={[styles.toolboxTitle, { color: colors.text }]}>{t(`trade.${item.titleKey}`)}</Text>
                      <Text style={[styles.toolboxDescription, { color: colors.textSecondary }]}>
                        {t(`trade.${item.descKey}`)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tradesCount: {
    ...Typography.caption,
    marginTop: 4,
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
  content: {
    flex: 1,
  },
  categoriesSection: {
    marginBottom: Spacing.lg,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  categoryButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    ...Typography.captionMedium,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading4,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  assetCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  assetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  assetSymbol: {
    ...Typography.bodySemibold,
  },
  assetName: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  assetPrice: {
    ...Typography.body,
    marginBottom: 2,
  },
  assetChange: {
    ...Typography.captionMedium,
  },
  favoritesContainer: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  favoritesHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  columnHeader: {
    ...Typography.captionMedium,
  },
  symbolColumn: {
    flex: 2,
  },
  priceColumn: {
    flex: 1,
    textAlign: 'right',
  },
  changeColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  volumeColumn: {
    flex: 1,
    textAlign: 'right',
  },
  favoriteRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  favoriteSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  favoriteSymbolText: {
    ...Typography.bodySemibold,
  },
  favoriteNameText: {
    ...Typography.caption,
    fontSize: 10,
  },
  favoritePrice: {
    ...Typography.body,
  },
  favoriteChange: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  favoriteChangeText: {
    ...Typography.captionMedium,
  },
  favoriteVolume: {
    ...Typography.caption,
  },
  toolboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  toolboxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toolboxContent: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolboxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  toolboxItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  toolboxIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolboxText: {
    flex: 1,
  },
  toolboxTitle: {
    ...Typography.body,
    marginBottom: 2,
  },
  toolboxDescription: {
    ...Typography.caption,
  },
});
