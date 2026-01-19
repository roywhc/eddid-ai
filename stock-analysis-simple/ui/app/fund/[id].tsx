import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Info, Languages, FileText, BarChart3, Clock, Briefcase } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'performance' | 'historical' | 'portfolio';

export default function FundDetailScreen() {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { id, name } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

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

  const fundSymbol = (id as string) || 'SPY';
  const fundName = (name as string) || 'Fund';

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  const tabs = [
    { id: 'overview', label: t('fundDetail.overview'), icon: FileText },
    { id: 'performance', label: t('fundDetail.performance'), icon: BarChart3 },
    { id: 'historical', label: t('fundDetail.historical'), icon: Clock },
    { id: 'portfolio', label: t('fundDetail.portfolio'), icon: Briefcase },
  ];

  useEffect(() => {
    if (user && fundSymbol && fundName) {
      const trackView = async () => {
        await supabase
          .from('recently_viewed_assets')
          .upsert(
            {
              user_id: user.id,
              asset_symbol: fundSymbol,
              asset_name: fundName,
              asset_type: 'fund',
              viewed_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,asset_symbol',
            }
          );
      };
      trackView();
    }
  }, [user, fundSymbol, fundName]);

  const chartData = useMemo(() => {
    const basePrice = 67.1;
    const dataPoints: { price: number; time: string }[] = [];
    const numPoints = selectedTimeframe === '1D' ? 24 : selectedTimeframe === '1W' ? 7 : 30;

    for (let i = 0; i < numPoints; i++) {
      const variation = (Math.random() - 0.5) * 2;
      const price = basePrice + variation + (i * 0.05);
      dataPoints.push({
        price: parseFloat(price.toFixed(2)),
        time: `${i}`,
      });
    }

    return dataPoints;
  }, [selectedTimeframe]);

  const mockFund = {
    symbol: fundSymbol,
    name: 'J.P. Morgan US Equity Fund',
    fullName: fundName,
    price: '67.10',
    change: '+0.85',
    changePercent: '+1.28',
    isUp: true,
    assetClass: 'Equity',
    launchDate: '16/11/1988',
    currency: 'USD',
    region: 'America',
    bloombergCode: 'JPAEAU LX',
    sedol: 'B1FMYB6',
    isin: 'LU0210528500',
    risk: 3,
    esgApproach: 'ESG Promote',
    totalSize: 'USD 8.3 B',
    nav: 'USD 67.1',
    ytdPerformance: '+8.5%',
    initialCharge: '5.0% of NAV',
    redemptionFee: '0%',
    managementFee: '1.5% p.a.',
  };

  const fundManagers = [
    {
      name: 'Felise Agranoff',
      role: 'Portfolio Manager',
      industry: 22,
      company: 22,
      fund: 3,
    },
    {
      name: 'Jack Caffrey',
      role: 'Portfolio Manager',
      industry: 34,
      company: 24,
      fund: 1,
    },
    {
      name: 'Eric Ghernati',
      role: 'Portfolio Manager',
      industry: 26,
      company: 6,
      fund: 1,
    },
    {
      name: 'Graham Spence',
      role: 'Portfolio Manager',
      industry: 24,
      company: 13,
      fund: 0.5,
    },
  ];

  const topHoldings = [
    { name: 'Apple Inc.', symbol: 'AAPL', weight: '7.2%', value: '$597M' },
    { name: 'Microsoft Corp.', symbol: 'MSFT', weight: '6.8%', value: '$564M' },
    { name: 'Amazon.com Inc.', symbol: 'AMZN', weight: '5.4%', value: '$448M' },
    { name: 'NVIDIA Corp.', symbol: 'NVDA', weight: '4.9%', value: '$407M' },
    { name: 'Alphabet Inc.', symbol: 'GOOGL', weight: '4.5%', value: '$374M' },
    { name: 'Meta Platforms', symbol: 'META', weight: '3.8%', value: '$315M' },
    { name: 'Tesla Inc.', symbol: 'TSLA', weight: '3.2%', value: '$266M' },
    { name: 'Berkshire Hathaway', symbol: 'BRK.B', weight: '2.9%', value: '$241M' },
  ];

  const sectorAllocation = [
    { sector: 'Technology', percentage: 28.5 },
    { sector: 'Healthcare', percentage: 15.2 },
    { sector: 'Financials', percentage: 13.8 },
    { sector: 'Consumer Discretionary', percentage: 12.1 },
    { sector: 'Industrials', percentage: 10.4 },
    { sector: 'Communication Services', percentage: 9.7 },
    { sector: 'Consumer Staples', percentage: 6.3 },
    { sector: 'Energy', percentage: 4.0 },
  ];

  const renderChart = () => {
    const chartWidth = width - Spacing.md * 2 - Spacing.md * 2;
    const chartHeight = 200;
    const padding = { top: 20, bottom: 20, left: 10, right: 10 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const points = chartData.map((point, index) => {
      const x = padding.left + (index / (chartData.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((point.price - minPrice) / priceRange) * innerHeight;
      return `${x},${y}`;
    }).join(' ');

    const lastPoint = chartData[chartData.length - 1];
    const lastX = padding.left + innerWidth;
    const lastY = padding.top + innerHeight - ((lastPoint.price - minPrice) / priceRange) * innerHeight;

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Polyline
          points={points}
          fill="none"
          stroke={mockFund.isUp ? colors.success : colors.error}
          strokeWidth="2"
        />
        <Circle
          cx={lastX}
          cy={lastY}
          r="4"
          fill={mockFund.isUp ? colors.success : colors.error}
        />
        <Line
          x1={padding.left}
          y1={lastY}
          x2={chartWidth - padding.right}
          y2={lastY}
          stroke={colors.border}
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <SvgText
          x={chartWidth - padding.right - 50}
          y={lastY - 10}
          fill={colors.text}
          fontSize="12"
          fontWeight="600">
          ${lastPoint.price}
        </SvgText>
      </Svg>
    );
  };

  const renderOverview = () => (
    <View style={{ paddingTop: 12 }}>
      <View style={[styles.section, { marginBottom: 0 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fundDetail.fundFacts')}</Text>
        <View style={[styles.factsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.factRow}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.assetClass')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.assetClass}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.fundLaunchDate')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.launchDate}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.denominatedCurrency')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.currency}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.region')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.region}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.bloombergCode')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.bloombergCode}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.sedolCode')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.sedol}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.isinCode')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.isin}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.risk')}</Text>
            <View style={styles.riskIndicator}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.riskDot,
                    {
                      backgroundColor: level <= mockFund.risk ? colors.warning : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.esgApproach')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.esgApproach}</Text>
          </View>
        </View>

        <View style={[styles.esgNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Info size={16} color={colors.textSecondary} />
          <Text style={[styles.esgNoticeText, { color: colors.textSecondary }]}>
            {t('fundDetail.esgNotice')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fundDetail.fundStatistics')}</Text>
        <View style={[styles.factsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.factRow}>
            <View>
              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.totalFundSize')}</Text>
              <Text style={[styles.factSubLabel, { color: colors.textTertiary }]}>{t('fundDetail.asOf')} 31/12/2025</Text>
            </View>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.totalSize}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.nav')}</Text>
              <Text style={[styles.factSubLabel, { color: colors.textTertiary }]}>{t('fundDetail.asOf')} 14/01/2026</Text>
            </View>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.nav}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.ytdPerformance')}</Text>
              <Text style={[styles.factSubLabel, { color: colors.textTertiary }]}>{t('fundDetail.shareClassCurrency')}, {t('fundDetail.asOf')} 14/01/2026</Text>
            </View>
            <Text style={[styles.factValue, { color: colors.success }]}>{mockFund.ytdPerformance}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fundDetail.fundManagers')}</Text>
        {fundManagers.map((manager, index) => (
          <View
            key={index}
            style={[styles.managerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.managerName, { color: colors.text }]}>{manager.name}</Text>
            <Text style={[styles.managerRole, { color: colors.textSecondary }]}>{t('fundDetail.portfolioManager')}</Text>
            <View style={styles.managerStats}>
              <View style={styles.managerStat}>
                <Text style={[styles.managerStatValue, { color: colors.text }]}>{manager.industry}</Text>
                <Text style={[styles.managerStatLabel, { color: colors.textSecondary }]}>{t('fundDetail.yearsInIndustry')}</Text>
              </View>
              <View style={styles.managerStat}>
                <Text style={[styles.managerStatValue, { color: colors.text }]}>{manager.company}</Text>
                <Text style={[styles.managerStatLabel, { color: colors.textSecondary }]}>{t('fundDetail.withCompany')}</Text>
              </View>
              <View style={styles.managerStat}>
                <Text style={[styles.managerStatValue, { color: colors.text }]}>{manager.fund}</Text>
                <Text style={[styles.managerStatLabel, { color: colors.textSecondary }]}>{t('fundDetail.managingThisFund')}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fundDetail.charges')}</Text>
        <View style={[styles.factsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.factRow}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.initialCharge')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.initialCharge}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.redemptionFee')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.redemptionFee}</Text>
          </View>
          <View style={[styles.factRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{t('fundDetail.managementFee')}</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{mockFund.managementFee}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPerformance = () => (
    <View style={[styles.section, { paddingTop: 12, marginBottom: 0 }]}>
      <View style={[styles.performanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.performanceTitle, { color: colors.text }]}>{t('fundDetail.returns')}</Text>
        <View style={styles.performanceRow}>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('fundDetail.oneMonth')}</Text>
          <Text style={[styles.performanceValue, { color: colors.success }]}>+3.2%</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('fundDetail.threeMonths')}</Text>
          <Text style={[styles.performanceValue, { color: colors.success }]}>+7.8%</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('fundDetail.ytd')}</Text>
          <Text style={[styles.performanceValue, { color: colors.success }]}>+8.5%</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('fundDetail.oneYear')}</Text>
          <Text style={[styles.performanceValue, { color: colors.success }]}>+25.3%</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('fundDetail.threeYears')}</Text>
          <Text style={[styles.performanceValue, { color: colors.success }]}>+15.7%</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={[styles.performanceLabel, { color: colors.textSecondary }]}>{t('fundDetail.fiveYears')}</Text>
          <Text style={[styles.performanceValue, { color: colors.success }]}>+18.2%</Text>
        </View>
      </View>
    </View>
  );

  const renderHistorical = () => (
    <View style={[styles.section, { paddingTop: 12, marginBottom: 0 }]}>
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chart}>
          {renderChart()}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeframes}>
          {timeframes.map(tf => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                {
                  backgroundColor: selectedTimeframe === tf ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setSelectedTimeframe(tf)}>
              <Text
                style={[
                  styles.timeframeText,
                  { color: selectedTimeframe === tf ? colors.secondary : colors.textSecondary },
                ]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderPortfolio = () => (
    <View style={{ paddingTop: 12 }}>
      <View style={[styles.section, { marginBottom: 0 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fundDetail.topHoldings')}</Text>
        {topHoldings.map((holding, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.holdingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.holdingLeft}>
              <Text style={[styles.holdingSymbol, { color: colors.text }]}>{holding.symbol}</Text>
              <Text style={[styles.holdingName, { color: colors.textSecondary }]} numberOfLines={1}>
                {holding.name}
              </Text>
            </View>
            <View style={styles.holdingRight}>
              <Text style={[styles.holdingWeight, { color: colors.text }]}>{holding.weight}</Text>
              <Text style={[styles.holdingValue, { color: colors.textSecondary }]}>{holding.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fundDetail.sectorAllocation')}</Text>
        <View style={[styles.sectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {sectorAllocation.map((sector, index) => (
            <View key={index} style={styles.sectorRow}>
              <Text style={[styles.sectorName, { color: colors.text }]}>{sector.sector}</Text>
              <View style={styles.sectorBarContainer}>
                <View
                  style={[
                    styles.sectorBar,
                    {
                      width: `${sector.percentage}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.sectorPercentage, { color: colors.text }]}>{sector.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderESG = () => (
    <View style={[styles.section, { paddingTop: 12, marginBottom: 0 }]}>
      <View style={[styles.esgCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.esgHeader, { backgroundColor: colors.success + '15' }]}>
          <Text style={[styles.esgTitle, { color: colors.success }]}>{t('fundDetail.esgPromote')}</Text>
        </View>
        <View style={styles.esgContent}>
          <Text style={[styles.esgDescription, { color: colors.text }]}>
            {t('fundDetail.esgPromoteDescription')}
          </Text>

          <View style={styles.esgSection}>
            <Text style={[styles.esgSectionTitle, { color: colors.text }]}>{t('fundDetail.environmentalFocus')}</Text>
            <Text style={[styles.esgSectionText, { color: colors.textSecondary }]}>
              {t('fundDetail.environmentalFocusDescription')}
            </Text>
          </View>

          <View style={styles.esgSection}>
            <Text style={[styles.esgSectionTitle, { color: colors.text }]}>{t('fundDetail.socialResponsibility')}</Text>
            <Text style={[styles.esgSectionText, { color: colors.textSecondary }]}>
              {t('fundDetail.socialResponsibilityDescription')}
            </Text>
          </View>

          <View style={styles.esgSection}>
            <Text style={[styles.esgSectionTitle, { color: colors.text }]}>{t('fundDetail.governanceStandards')}</Text>
            <Text style={[styles.esgSectionText, { color: colors.textSecondary }]}>
              {t('fundDetail.governanceStandardsDescription')}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.esgNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Info size={16} color={colors.textSecondary} />
        <Text style={[styles.esgNoticeText, { color: colors.textSecondary }]}>
          {t('fundDetail.esgLongNotice')}
        </Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'performance':
        return renderPerformance();
      case 'historical':
        return renderHistorical();
      case 'portfolio':
        return renderPortfolio();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeContainer edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerSymbol, { color: colors.text }]}>{mockFund.symbol}</Text>
          <Text style={[styles.headerExchange, { color: colors.textSecondary }]}>{mockFund.assetClass}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.languageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={cycleLanguage}>
            <Languages size={14} color={colors.text} />
            <Text style={[styles.languageText, { color: colors.text }]}>{getLanguageLabel()}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Star size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.priceSection}>
        <Text style={[styles.fundName, { color: colors.textSecondary }]}>{mockFund.name}</Text>
        <Text style={[styles.price, { color: colors.text }]}>${mockFund.price}</Text>
        <View style={styles.priceChange}>
          {mockFund.isUp ? (
            <TrendingUp size={20} color={colors.success} />
          ) : (
            <TrendingDown size={20} color={colors.error} />
          )}
          <Text style={[styles.changeText, { color: mockFund.isUp ? colors.success : colors.error }]}>
            ${mockFund.change} ({mockFund.changePercent})
          </Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Spacing.xs, paddingRight: 60 }}
          showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>

        <View style={[styles.floatingNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.floatingNavButton,
                  isActive && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => setSelectedTab(tab.id as TabType)}>
                <IconComponent
                  size={20}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={t('trade.subscribe')}
          variant="primary"
          onPress={() => router.push(`/trade-fund/${mockFund.symbol}?name=${encodeURIComponent(mockFund.name)}`)}
        />
      </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 3,
  },
  languageText: {
    ...Typography.captionMedium,
    fontSize: 11,
  },
  headerSymbol: {
    ...Typography.heading4,
  },
  headerExchange: {
    ...Typography.small,
  },
  priceSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  fundName: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  changeText: {
    ...Typography.body,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  floatingNav: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingNavButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  factsCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  factLabel: {
    ...Typography.body,
  },
  factSubLabel: {
    ...Typography.small,
    marginTop: 2,
  },
  factValue: {
    ...Typography.bodyMedium,
  },
  riskIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  esgNotice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  esgNoticeText: {
    ...Typography.caption,
    flex: 1,
  },
  managerCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  managerName: {
    ...Typography.bodyMedium,
    marginBottom: 4,
  },
  managerRole: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  managerStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  managerStat: {
    flex: 1,
  },
  managerStatValue: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  managerStatLabel: {
    ...Typography.small,
  },
  performanceCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  performanceTitle: {
    ...Typography.heading4,
    marginBottom: Spacing.md,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  performanceLabel: {
    ...Typography.body,
  },
  performanceValue: {
    ...Typography.bodyMedium,
  },
  chartContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  chart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  timeframes: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  timeframeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  timeframeText: {
    ...Typography.captionMedium,
  },
  holdingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  holdingLeft: {
    flex: 1,
  },
  holdingSymbol: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  holdingName: {
    ...Typography.caption,
  },
  holdingRight: {
    alignItems: 'flex-end',
  },
  holdingWeight: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  holdingValue: {
    ...Typography.caption,
  },
  sectorCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectorName: {
    ...Typography.caption,
    width: 120,
  },
  sectorBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectorBar: {
    height: '100%',
    borderRadius: 4,
  },
  sectorPercentage: {
    ...Typography.captionMedium,
    width: 45,
    textAlign: 'right',
  },
  esgCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  esgHeader: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  esgTitle: {
    ...Typography.heading4,
  },
  esgContent: {
    padding: Spacing.md,
  },
  esgDescription: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  esgSection: {
    marginBottom: Spacing.md,
  },
  esgSectionTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  esgSectionText: {
    ...Typography.caption,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
});
