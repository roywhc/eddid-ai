import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Search, Filter, TrendingUp, TrendingDown, Languages } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import Svg, { Polyline } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface MiniChartProps {
  isUp: boolean;
  color: string;
}

function MiniChart({ isUp, color }: MiniChartProps) {
  const chartData = useMemo(() => {
    const points = [];
    const numPoints = 8;
    const baseValue = 50;

    for (let i = 0; i < numPoints; i++) {
      const trend = isUp ? i * 3 : -i * 3;
      const variation = (Math.random() - 0.5) * 15;
      points.push(baseValue + trend + variation);
    }
    return points;
  }, [isUp]);

  const maxValue = Math.max(...chartData);
  const minValue = Math.min(...chartData);
  const range = maxValue - minValue || 1;

  const chartWidth = 60;
  const chartHeight = 30;
  const pointSpacing = chartWidth / (chartData.length - 1);

  const pathPoints = chartData.map((value, index) => {
    const x = index * pointSpacing;
    const y = chartHeight - ((value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Polyline
        points={pathPoints}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function MarketsScreen() {
  const { colors, colorScheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('stocks');
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'HK'>('US');

  const getLanguageLabel = () => {
    switch (language) {
      case 'en':
        return 'EN';
      case 'zh-HK':
        return '繁';
      case 'zh-CN':
        return '简';
      default:
        return 'EN';
    }
  };

  const cycleLanguage = () => {
    const languages = ['en', 'zh-HK', 'zh-CN'] as const;
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const tabs = [
    { key: 'stocks', label: t('markets.stocks') },
    { key: 'futures', label: t('markets.futures') },
    { key: 'forex', label: t('markets.forex') },
    { key: 'funds', label: t('markets.funds') },
  ];

  const mockAssets = [
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: '185.50', change: '+2.45', changePercent: '+1.34', isUp: true, market: 'US' },
    { id: '2', symbol: '0700.HK', name: 'Tencent Holdings', price: '328.60', change: '-4.20', changePercent: '-1.26', isUp: false, market: 'HK' },
    { id: '3', symbol: 'TSLA', name: 'Tesla Inc.', price: '242.80', change: '+8.15', changePercent: '+3.47', isUp: true, market: 'US' },
    { id: '4', symbol: 'MSFT', name: 'Microsoft Corp.', price: '378.90', change: '+1.20', changePercent: '+0.32', isUp: true, market: 'US' },
    { id: '5', symbol: '0941.HK', name: 'China Mobile', price: '76.85', change: '+1.85', changePercent: '+2.47', isUp: true, market: 'HK' },
    { id: '6', symbol: '9988.HK', name: 'Alibaba Group', price: '98.50', change: '+3.20', changePercent: '+3.36', isUp: true, market: 'HK' },
    { id: '7', symbol: 'NVDA', name: 'NVIDIA Corp.', price: '875.20', change: '+12.40', changePercent: '+1.44', isUp: true, market: 'US' },
    { id: '8', symbol: '0388.HK', name: 'Hong Kong Exchanges', price: '285.40', change: '-2.60', changePercent: '-0.90', isUp: false, market: 'HK' },
  ];

  const filteredAssets = mockAssets.filter(asset => asset.market === selectedMarket);

  const mockNews = [
    { id: '1', title: 'Fed Signals Rate Cuts Could Begin in Q2 2026', source: 'Reuters', time: '1h ago' },
    { id: '2', title: 'Tech Stocks Rally on Strong Earnings Reports', source: 'Bloomberg', time: '2h ago' },
    { id: '3', title: 'Hong Kong Markets Close Higher on China Stimulus', source: 'SCMP', time: '3h ago' },
  ];

  const mockFuturesNews = [
    { id: '1', title: 'S&P 500 Futures Rise Ahead of Fed Decision', source: 'Bloomberg', time: '30m ago' },
    { id: '2', title: 'Oil Futures Surge on Supply Concerns', source: 'Reuters', time: '1h ago' },
    { id: '3', title: 'Gold Futures Hit 6-Month High', source: 'WSJ', time: '2h ago' },
  ];

  const mockIndexFutures = [
    { id: 'ES', symbol: 'ES', nameKey: 'ES' as const, price: '4,825.50', change: '+15.25', changePercent: '+0.32', isUp: true },
    { id: 'NQ', symbol: 'NQ', nameKey: 'NQ' as const, price: '17,245.00', change: '+42.50', changePercent: '+0.25', isUp: true },
    { id: 'HSI', symbol: 'HSI', nameKey: 'HSI' as const, price: '16,850.00', change: '-85.00', changePercent: '-0.50', isUp: false },
    { id: 'NK', symbol: 'NK', nameKey: 'NK' as const, price: '33,420.00', change: '+120.00', changePercent: '+0.36', isUp: true },
  ];

  const mockCommodityFutures = [
    { id: 'CL', symbol: 'CL', nameKey: 'CL' as const, price: '78.45', change: '+1.25', changePercent: '+1.62', isUp: true },
    { id: 'GC', symbol: 'GC', nameKey: 'GC' as const, price: '2,085.50', change: '+12.80', changePercent: '+0.62', isUp: true },
    { id: 'SI', symbol: 'SI', nameKey: 'SI' as const, price: '24.35', change: '-0.15', changePercent: '-0.61', isUp: false },
    { id: 'NG', symbol: 'NG', nameKey: 'NG' as const, price: '2.85', change: '+0.08', changePercent: '+2.89', isUp: true },
  ];

  const mockForexNews = [
    { id: '1', title: 'US Dollar Strengthens on Fed Rate Decision', source: 'Reuters', time: '20m ago' },
    { id: '2', title: 'Euro Gains Against Major Currencies on ECB Data', source: 'Bloomberg', time: '1h ago' },
    { id: '3', title: 'Japanese Yen Volatility Increases Amid BoJ Policy', source: 'FT', time: '2h ago' },
  ];

  const mockForexPairs = [
    { id: '1', pair: 'USD/JPY', nameKey: 'usdJpy' as const, price: '149.25', change: '+0.45', changePercent: '+0.30', isUp: true },
    { id: '2', pair: 'EUR/USD', nameKey: 'eurUsd' as const, price: '1.0875', change: '-0.0023', changePercent: '-0.21', isUp: false },
    { id: '3', pair: 'GBP/USD', nameKey: 'gbpUsd' as const, price: '1.2634', change: '+0.0042', changePercent: '+0.33', isUp: true },
    { id: '4', pair: 'AUD/NZD', nameKey: 'audNzd' as const, price: '1.0921', change: '-0.0015', changePercent: '-0.14', isUp: false },
    { id: '5', pair: 'USD/CAD', nameKey: 'usdCad' as const, price: '1.3542', change: '+0.0028', changePercent: '+0.21', isUp: true },
    { id: '6', pair: 'EUR/JPY', nameKey: 'eurJpy' as const, price: '162.34', change: '+0.82', changePercent: '+0.51', isUp: true },
    { id: '7', pair: 'GBP/JPY', nameKey: 'gbpJpy' as const, price: '188.52', change: '+1.15', changePercent: '+0.61', isUp: true },
    { id: '8', pair: 'AUD/USD', nameKey: 'audUsd' as const, price: '0.6234', change: '-0.0018', changePercent: '-0.29', isUp: false },
  ];

  const forexHeatMapData = [
    { code: 'USD', nameKey: 'usDollar' as const, change: '+0.45', changePercent: '+0.35', flag: '🇺🇸' },
    { code: 'EUR', nameKey: 'euro' as const, change: '-0.23', changePercent: '-0.18', flag: '🇪🇺' },
    { code: 'GBP', nameKey: 'britishPound' as const, change: '+0.52', changePercent: '+0.42', flag: '🇬🇧' },
    { code: 'JPY', nameKey: 'japaneseYen' as const, change: '-0.38', changePercent: '-0.25', flag: '🇯🇵' },
    { code: 'CHF', nameKey: 'swissFranc' as const, change: '+0.12', changePercent: '+0.09', flag: '🇨🇭' },
    { code: 'AUD', nameKey: 'australianDollar' as const, change: '-0.28', changePercent: '-0.21', flag: '🇦🇺' },
    { code: 'CAD', nameKey: 'canadianDollar' as const, change: '-0.18', changePercent: '-0.14', flag: '🇨🇦' },
    { code: 'NZD', nameKey: 'newZealandDollar' as const, change: '-0.15', changePercent: '-0.11', flag: '🇳🇿' },
  ];

  const fundInsights = [
    { titleKey: 'marketOverview' as const, value: '8.3B', labelKey: 'totalAum' as const, isUp: true, change: '+12.5%' },
    { titleKey: 'topPerformer' as const, value: '28.5%', labelKey: 'ytdReturn' as const, isUp: true, change: 'Tech Fund' },
    { titleKey: 'mostPopular' as const, value: '2.4B', labelKey: 'newInflows' as const, isUp: true, changeKey: 'thisMonth' as const },
  ];

  const topGainerFunds = [
    { id: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF', nav: '458.32', change: '+5.84', changePercent: '+1.29', ytd: '+8.5%', aum: '$420B', isUp: true },
    { id: 'QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust', nav: '389.45', change: '+8.21', changePercent: '+2.15', ytd: '+12.3%', aum: '$215B', isUp: true },
    { id: 'VTI', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', nav: '241.67', change: '+3.45', changePercent: '+1.45', ytd: '+9.2%', aum: '$1.3T', isUp: true },
    { id: 'IVV', symbol: 'IVV', name: 'iShares Core S&P 500 ETF', nav: '502.34', change: '+6.12', changePercent: '+1.23', ytd: '+8.7%', aum: '$380B', isUp: true },
    { id: 'VOO', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', nav: '421.89', change: '+5.32', changePercent: '+1.28', ytd: '+8.6%', aum: '$960B', isUp: true },
    { id: 'ARKK', symbol: 'ARKK', name: 'ARK Innovation ETF', nav: '45.23', change: '+2.15', changePercent: '+4.98', ytd: '+18.4%', aum: '$7.2B', isUp: true },
  ];

  return (
    <SafeContainer>
      <View style={[styles.headerGradient, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <EddidLogo width={120} height={30} color={colorScheme === 'dark' ? '#FFFFFF' : '#0D1647'} />
          <TouchableOpacity
            style={[styles.languageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={cycleLanguage}>
            <Languages size={16} color={colors.text} />
            <Text style={[styles.languageText, { color: colors.text }]}>{getLanguageLabel()}</Text>
          </TouchableOpacity>
          <View style={styles.glowEffect} />
        </View>
      </View>

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('markets.title')}</Text>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('common.search')}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedTab(tab.key)}
              style={[
                styles.tab,
                { backgroundColor: selectedTab === tab.key ? colors.primary : colors.surface },
              ]}>
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.key ? colors.secondary : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedTab === 'futures' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.indexFutures')}</Text>
              <View style={styles.tilesGrid}>
                {mockIndexFutures.map((future) => (
                  <TouchableOpacity
                    key={future.id}
                    style={[styles.futuresTile, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/futures/${future.id}`)}>
                    <View style={styles.tileHeader}>
                      <Text style={[styles.tileSymbol, { color: colors.text }]}>{future.symbol}</Text>
                      {future.isUp ? (
                        <TrendingUp size={16} color={colors.success} />
                      ) : (
                        <TrendingDown size={16} color={colors.error} />
                      )}
                    </View>
                    <Text style={[styles.tileName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t(`futures.${future.nameKey}`)}
                    </Text>
                    <View style={styles.tileChart}>
                      <MiniChart
                        isUp={future.isUp}
                        color={future.isUp ? colors.success : colors.error}
                      />
                    </View>
                    <Text style={[styles.tilePrice, { color: colors.text }]}>${future.price}</Text>
                    <Text style={[
                      styles.tileChange,
                      { color: future.isUp ? colors.success : colors.error }
                    ]}>
                      {future.changePercent}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.commodityFutures')}</Text>
              <View style={styles.tilesGrid}>
                {mockCommodityFutures.map((future) => (
                  <TouchableOpacity
                    key={future.id}
                    style={[styles.futuresTile, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/futures/${future.id}`)}>
                    <View style={styles.tileHeader}>
                      <Text style={[styles.tileSymbol, { color: colors.text }]}>{future.symbol}</Text>
                      {future.isUp ? (
                        <TrendingUp size={16} color={colors.success} />
                      ) : (
                        <TrendingDown size={16} color={colors.error} />
                      )}
                    </View>
                    <Text style={[styles.tileName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t(`futures.${future.nameKey}`)}
                    </Text>
                    <View style={styles.tileChart}>
                      <MiniChart
                        isUp={future.isUp}
                        color={future.isUp ? colors.success : colors.error}
                      />
                    </View>
                    <Text style={[styles.tilePrice, { color: colors.text }]}>${future.price}</Text>
                    <Text style={[
                      styles.tileChange,
                      { color: future.isUp ? colors.success : colors.error }
                    ]}>
                      {future.changePercent}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {selectedTab === 'forex' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.forexNews')}</Text>
              {mockForexNews.map((news) => (
                <TouchableOpacity
                  key={news.id}
                  style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/news/${news.id}`)}>
                  <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>
                    {news.title}
                  </Text>
                  <View style={styles.newsFooter}>
                    <Text style={[styles.newsSource, { color: colors.textSecondary }]}>{news.source}</Text>
                    <Text style={[styles.newsTime, { color: colors.textTertiary }]}>{news.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.topMovers')}</Text>
              {mockForexPairs.map((pair) => (
                <TouchableOpacity
                  key={pair.id}
                  style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/trade-forex/${pair.id}?pair=${pair.pair}&name=${encodeURIComponent(t(`forex.${pair.nameKey}`))}`)}>
                  <View style={styles.assetLeft}>
                    <Text style={[styles.assetSymbol, { color: colors.text }]}>{pair.pair}</Text>
                    <Text style={[styles.assetName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t(`forex.${pair.nameKey}`)}
                    </Text>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={[styles.assetPrice, { color: colors.text }]}>{pair.price}</Text>
                    <View style={styles.assetChange}>
                      {pair.isUp ? (
                        <TrendingUp size={14} color={colors.success} />
                      ) : (
                        <TrendingDown size={14} color={colors.error} />
                      )}
                      <Text style={[
                        styles.assetChangeText,
                        { color: pair.isUp ? colors.success : colors.error }
                      ]}>
                        {pair.changePercent}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.majorCurrenciesHeatMap')}</Text>
              <View style={styles.heatMapGrid}>
                {forexHeatMapData.map((currency, index) => {
                  const isPositive = currency.changePercent.startsWith('+');
                  const forexPair = index === 0 ? 'USD/JPY' : index === 1 ? 'EUR/USD' : index === 2 ? 'GBP/USD' : index === 3 ? 'USD/JPY' : index === 4 ? 'USD/CHF' : index === 5 ? 'AUD/USD' : index === 6 ? 'USD/CAD' : 'NZD/USD';
                  return (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.heatMapTile,
                        {
                          backgroundColor: isPositive
                            ? colors.success + '15'
                            : colors.error + '15',
                          borderColor: isPositive ? colors.success : colors.error,
                        },
                      ]}
                      onPress={() => router.push(`/trade-forex/${currency.code}?pair=${forexPair}&name=${encodeURIComponent(t(`forex.${currency.nameKey}`))}`)}>
                      <View style={[styles.flagCircle, { backgroundColor: colors.card }]}>
                        <Text style={styles.flagEmoji}>{currency.flag}</Text>
                      </View>
                      <Text style={[styles.currencyCode, { color: colors.text }]}>{currency.code}</Text>
                      <Text style={[styles.currencyName, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t(`forex.${currency.nameKey}`)}
                      </Text>
                      <Text
                        style={[
                          styles.currencyChange,
                          { color: isPositive ? colors.success : colors.error },
                        ]}>
                        {currency.changePercent}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {selectedTab === 'funds' && (
          <>
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.fundsBanner, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/funds')}>
                <View style={styles.fundsBannerContent}>
                  <Text style={[styles.fundsBannerTitle, { color: colors.secondary }]}>{t('markets.globalFunds')}</Text>
                  <Text style={[styles.fundsBannerSubtitle, { color: colors.secondary }]}>
                    {t('markets.globalFundsDesc')}
                  </Text>
                </View>
                <View style={[styles.fundsBannerIcon, { backgroundColor: colors.secondary + '20' }]}>
                  <Text style={styles.fundsBannerIconText}>🌍</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.marketInsights')}</Text>
              <View style={styles.insightsGrid}>
                {fundInsights.map((insight, index) => (
                  <View
                    key={index}
                    style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.insightTitle, { color: colors.textSecondary }]}>{t(`funds.${insight.titleKey}`)}</Text>
                    <Text style={[styles.insightValue, { color: colors.text }]}>{insight.value}</Text>
                    <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>{t(`funds.${insight.labelKey}`)}</Text>
                    <Text style={[styles.insightChange, { color: colors.success }]}>{insight.changeKey ? t(`funds.${insight.changeKey}`) : insight.change}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.topGainers')}</Text>
              {topGainerFunds.map((fund) => (
                <TouchableOpacity
                  key={fund.id}
                  style={[styles.fundCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/fund/${fund.id}?name=${encodeURIComponent(fund.name)}`)}>
                  <View style={styles.fundLeft}>
                    <Text style={[styles.fundSymbol, { color: colors.text }]}>{fund.symbol}</Text>
                    <Text style={[styles.fundName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {fund.name}
                    </Text>
                    <Text style={[styles.fundAum, { color: colors.textTertiary }]}>{t('funds.aum')}: {fund.aum}</Text>
                  </View>
                  <View style={styles.fundRight}>
                    <Text style={[styles.fundNav, { color: colors.text }]}>${fund.nav}</Text>
                    <View style={styles.fundChange}>
                      <TrendingUp size={14} color={colors.success} />
                      <Text style={[styles.fundChangeText, { color: colors.success }]}>
                        {fund.changePercent}
                      </Text>
                    </View>
                    <Text style={[styles.fundYtd, { color: colors.success }]}>YTD: {fund.ytd}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedTab !== 'futures' && selectedTab !== 'forex' && selectedTab !== 'funds' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.trending')}</Text>

              {mockNews.map((news) => (
                <TouchableOpacity
                  key={news.id}
                  style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/news/${news.id}`)}>
                  <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>
                    {news.title}
                  </Text>
                  <View style={styles.newsFooter}>
                    <Text style={[styles.newsSource, { color: colors.textSecondary }]}>{news.source}</Text>
                    <Text style={[styles.newsTime, { color: colors.textTertiary }]}>{news.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderWithFilter}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('markets.topMovers')}</Text>
                <View style={styles.marketFilter}>
                  <TouchableOpacity
                    style={[
                      styles.marketFilterButton,
                      {
                        backgroundColor: selectedMarket === 'US' ? colors.primary : colors.surface,
                        borderColor: selectedMarket === 'US' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedMarket('US')}>
                    <Text
                      style={[
                        styles.marketFilterText,
                        { color: selectedMarket === 'US' ? colors.secondary : colors.textSecondary },
                      ]}>
                      US
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.marketFilterButton,
                      {
                        backgroundColor: selectedMarket === 'HK' ? colors.primary : colors.surface,
                        borderColor: selectedMarket === 'HK' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedMarket('HK')}>
                    <Text
                      style={[
                        styles.marketFilterText,
                        { color: selectedMarket === 'HK' ? colors.secondary : colors.textSecondary },
                      ]}>
                      HK
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {filteredAssets.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/asset/${asset.symbol}?name=${encodeURIComponent(asset.name)}`)}>
                  <View style={styles.assetLeft}>
                    <Text style={[styles.assetSymbol, { color: colors.text }]}>{asset.symbol}</Text>
                    <Text style={[styles.assetName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {asset.name}
                    </Text>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={[styles.assetPrice, { color: colors.text }]}>${asset.price}</Text>
                    <View style={styles.assetChange}>
                      {asset.isUp ? (
                        <TrendingUp size={14} color={colors.success} />
                      ) : (
                        <TrendingDown size={14} color={colors.error} />
                      )}
                      <Text style={[
                        styles.assetChangeText,
                        { color: asset.isUp ? colors.success : colors.error }
                      ]}>
                        {asset.changePercent}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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
    alignItems: 'center',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
    zIndex: 2,
  },
  languageText: {
    ...Typography.captionMedium,
    fontSize: 12,
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
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
  },
  content: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    ...Typography.captionMedium,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  sectionHeaderWithFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  marketFilter: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  marketFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  marketFilterText: {
    ...Typography.captionMedium,
  },
  newsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  newsTitle: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    ...Typography.small,
  },
  newsTime: {
    ...Typography.small,
  },
  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  assetLeft: {
    flex: 1,
  },
  assetSymbol: {
    ...Typography.bodySemibold,
    marginBottom: 2,
  },
  assetName: {
    ...Typography.caption,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    ...Typography.bodySemibold,
    marginBottom: 2,
  },
  assetChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetChangeText: {
    ...Typography.caption,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginHorizontal: -2,
  },
  futuresTile: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minHeight: 160,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tileSymbol: {
    ...Typography.heading3,
  },
  tileName: {
    ...Typography.small,
    marginBottom: Spacing.sm,
    minHeight: 32,
  },
  tileChart: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  tilePrice: {
    ...Typography.bodySemibold,
    marginTop: Spacing.xs,
  },
  tileChange: {
    ...Typography.caption,
    marginTop: 2,
  },
  heatMapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginHorizontal: -2,
  },
  heatMapTile: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  flagCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  flagEmoji: {
    fontSize: 32,
  },
  currencyCode: {
    ...Typography.heading4,
    marginBottom: 2,
  },
  currencyName: {
    ...Typography.small,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  currencyChange: {
    ...Typography.bodyMedium,
    marginTop: Spacing.xs,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  insightCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  insightTitle: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  insightValue: {
    ...Typography.heading3,
    marginBottom: 2,
  },
  insightLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  insightChange: {
    ...Typography.captionMedium,
  },
  fundCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  fundLeft: {
    flex: 1,
  },
  fundSymbol: {
    ...Typography.heading4,
    marginBottom: 2,
  },
  fundName: {
    ...Typography.caption,
    marginBottom: 4,
  },
  fundAum: {
    ...Typography.small,
  },
  fundRight: {
    alignItems: 'flex-end',
  },
  fundNav: {
    ...Typography.bodySemibold,
    marginBottom: 2,
  },
  fundChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fundChangeText: {
    ...Typography.caption,
  },
  fundYtd: {
    ...Typography.small,
  },
  fundsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  fundsBannerContent: {
    flex: 1,
  },
  fundsBannerTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
  },
  fundsBannerSubtitle: {
    ...Typography.caption,
    opacity: 0.9,
  },
  fundsBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  fundsBannerIconText: {
    fontSize: 28,
  },
});
