import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Sparkles, Send, X, AlertCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useRef, useEffect } from 'react';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { handleNewsArticleQuestion, type Message } from '@/lib/aiService';

const { width } = Dimensions.get('window');

export default function FutureDetailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { checkAILimit } = useSubscription();
  const { id } = useLocalSearchParams();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAIMessage] = useState('');
  const [aiResponse, setAIResponse] = useState<Message | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showAIChat ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showAIChat]);

  const chartData = useMemo(() => {
    const basePrice = 4825.5;
    const dataPoints: { price: number; time: string }[] = [];
    const numPoints = selectedTimeframe === '1D' ? 24 : selectedTimeframe === '1W' ? 7 : 30;

    for (let i = 0; i < numPoints; i++) {
      const variation = (Math.random() - 0.5) * 50;
      const price = basePrice + variation + (i * 2);
      dataPoints.push({
        price: parseFloat(price.toFixed(2)),
        time: `${i}`,
      });
    }

    return dataPoints;
  }, [selectedTimeframe]);

  const futuresData: Record<string, any> = {
    ES: {
      symbol: 'ES',
      name: 'S&P 500 Futures',
      exchange: 'CME',
      price: '4,825.50',
      change: '+15.25',
      changePercent: '+0.32',
      isUp: true,
      contractSize: '50',
      expiryDate: 'Mar 15, 2026',
      initialMargin: '$12,650',
      maintenanceMargin: '$11,500',
      tickSize: '0.25',
      tickValue: '$12.50',
    },
    NQ: {
      symbol: 'NQ',
      name: 'NASDAQ 100 Futures',
      exchange: 'CME',
      price: '17,245.00',
      change: '+42.50',
      changePercent: '+0.25',
      isUp: true,
      contractSize: '20',
      expiryDate: 'Mar 15, 2026',
      initialMargin: '$18,200',
      maintenanceMargin: '$16,500',
      tickSize: '0.25',
      tickValue: '$5.00',
    },
    CL: {
      symbol: 'CL',
      name: 'Crude Oil Futures',
      exchange: 'NYMEX',
      price: '78.45',
      change: '+1.25',
      changePercent: '+1.62',
      isUp: true,
      contractSize: '1,000 barrels',
      expiryDate: 'Feb 20, 2026',
      initialMargin: '$6,500',
      maintenanceMargin: '$5,900',
      tickSize: '0.01',
      tickValue: '$10.00',
    },
    GC: {
      symbol: 'GC',
      name: 'Gold Futures',
      exchange: 'COMEX',
      price: '2,085.50',
      change: '+12.80',
      changePercent: '+0.62',
      isUp: true,
      contractSize: '100 troy oz',
      expiryDate: 'Apr 27, 2026',
      initialMargin: '$9,350',
      maintenanceMargin: '$8,500',
      tickSize: '0.10',
      tickValue: '$10.00',
    },
    HSI: {
      symbol: 'HSI',
      name: 'Hang Seng Index Futures',
      exchange: 'HKEX',
      price: '16,850.00',
      change: '-85.00',
      changePercent: '-0.50',
      isUp: false,
      contractSize: 'HK$50',
      expiryDate: 'Jan 29, 2026',
      initialMargin: 'HK$85,000',
      maintenanceMargin: 'HK$68,000',
      tickSize: '1',
      tickValue: 'HK$50',
    },
    NK: {
      symbol: 'NK',
      name: 'Nikkei 225 Futures',
      exchange: 'OSE',
      price: '33,420.00',
      change: '+120.00',
      changePercent: '+0.36',
      isUp: true,
      contractSize: '¥1,000',
      expiryDate: 'Mar 12, 2026',
      initialMargin: '¥1,250,000',
      maintenanceMargin: '¥1,000,000',
      tickSize: '5',
      tickValue: '¥5,000',
    },
    SI: {
      symbol: 'SI',
      name: 'Silver Futures',
      exchange: 'COMEX',
      price: '24.35',
      change: '-0.15',
      changePercent: '-0.61',
      isUp: false,
      contractSize: '5,000 troy oz',
      expiryDate: 'May 27, 2026',
      initialMargin: '$8,250',
      maintenanceMargin: '$7,500',
      tickSize: '0.005',
      tickValue: '$25.00',
    },
    NG: {
      symbol: 'NG',
      name: 'Natural Gas Futures',
      exchange: 'NYMEX',
      price: '2.85',
      change: '+0.08',
      changePercent: '+2.89',
      isUp: true,
      contractSize: '10,000 MMBtu',
      expiryDate: 'Jan 28, 2026',
      initialMargin: '$2,500',
      maintenanceMargin: '$2,275',
      tickSize: '0.001',
      tickValue: '$10.00',
    },
  };

  const mockFuture = futuresData[id as string] || futuresData.ES;

  const mockNews = [
    {
      title: `${mockFuture.name} Rally on Strong Economic Data`,
      source: 'Bloomberg',
      time: '2h ago',
      sentiment: 'positive',
    },
    {
      title: `Analyst Sees Upside Potential for ${mockFuture.symbol}`,
      source: 'Reuters',
      time: '5h ago',
      sentiment: 'positive',
    },
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
          stroke={colors.success}
          strokeWidth="2"
        />
        <Circle
          cx={lastX}
          cy={lastY}
          r="4"
          fill={colors.success}
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

  const handleToggleAIChat = () => {
    setShowAIChat(!showAIChat);
  };

  const handleAskAI = async () => {
    if (!aiMessage.trim()) return;

    if (user) {
      const limit = await checkAILimit();
      if (!limit.hasAccess && !limit.isUnlimited) {
        setAIResponse({
          id: 'limit',
          role: 'assistant',
          content: 'You have reached your AI message limit. Please upgrade your subscription to continue.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    setIsAILoading(true);
    const questionToAsk = aiMessage;
    setAIMessage('');

    try {
      const futureContext = `Future Contract: ${mockFuture.symbol} (${mockFuture.name})
Current Price: $${mockFuture.price}
Change: ${mockFuture.change} (${mockFuture.changePercent})
Exchange: ${mockFuture.exchange}
Contract Size: ${mockFuture.contractSize}
Expiry Date: ${mockFuture.expiryDate}
Initial Margin: ${mockFuture.initialMargin}
Maintenance Margin: ${mockFuture.maintenanceMargin}
Tick Size: ${mockFuture.tickSize}
Tick Value: ${mockFuture.tickValue}

Recent News:
${mockNews.map(news => `- ${news.title} (${news.source})`).join('\n')}`;

      const response = await handleNewsArticleQuestion(
        `${mockFuture.symbol} Futures Analysis`,
        futureContext,
        questionToAsk
      );
      setAIResponse(response);
    } catch (error) {
      console.error('Error asking AI:', error);
      setAIResponse({
        id: 'error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <SafeContainer edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerSymbol, { color: colors.text }]}>{mockFuture.symbol}</Text>
          <Text style={[styles.headerExchange, { color: colors.textSecondary }]}>{mockFuture.exchange}</Text>
        </View>
        <TouchableOpacity>
          <Star size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.warningBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
            <AlertCircle size={20} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              {t('futuresDetail.warningMessage')}
            </Text>
          </View>

          <View style={styles.priceSection}>
            <Text style={[styles.assetName, { color: colors.textSecondary }]}>{mockFuture.name}</Text>
            <Text style={[styles.price, { color: colors.text }]}>${mockFuture.price}</Text>
            <View style={styles.priceChange}>
              {mockFuture.isUp ? (
                <TrendingUp size={20} color={colors.success} />
              ) : (
                <TrendingDown size={20} color={colors.error} />
              )}
              <Text style={[styles.changeText, { color: mockFuture.isUp ? colors.success : colors.error }]}>
                ${mockFuture.change} ({mockFuture.changePercent})
              </Text>
            </View>
          </View>

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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('futuresDetail.contractSpecifications')}</Text>
            <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.specRow}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{t('futuresDetail.contractSize')}</Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{mockFuture.contractSize}</Text>
              </View>
              <View style={[styles.specRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{t('futuresDetail.expiryDate')}</Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{mockFuture.expiryDate}</Text>
              </View>
              <View style={[styles.specRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{t('futuresDetail.initialMargin')}</Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{mockFuture.initialMargin}</Text>
              </View>
              <View style={[styles.specRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{t('futuresDetail.maintenanceMargin')}</Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{mockFuture.maintenanceMargin}</Text>
              </View>
              <View style={[styles.specRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{t('futuresDetail.tickSize')}</Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{mockFuture.tickSize}</Text>
              </View>
              <View style={[styles.specRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{t('futuresDetail.tickValue')}</Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{mockFuture.tickValue}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('futuresDetail.latestNews')}</Text>
            {mockNews.map((news, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/news/${index + 1}`)}>
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

          <View style={styles.aiSection}>
            <Button
              title={t('asset.askAiAboutAsset')}
              variant="outline"
              fullWidth
              onPress={handleToggleAIChat}
              style={styles.aiButton}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={t('trade.buy')}
            variant="primary"
            style={styles.tradeButton}
            onPress={() => router.push(`/trade-futures/${id}`)}
          />
          <Button
            title={t('trade.sell')}
            variant="danger"
            style={styles.tradeButton}
            onPress={() => router.push(`/trade-futures/${id}`)}
          />
        </View>
      </KeyboardAvoidingView>

      {showAIChat && (
        <Animated.View
          style={[
            styles.aiChatContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              height: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '50%'],
              }),
            },
          ]}>
          <View style={[styles.aiChatHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.aiChatHeaderLeft}>
              <Sparkles size={20} color={colors.primary} />
              <Text style={[styles.aiChatTitle, { color: colors.text }]}>{t('futuresDetail.aiFuturesAnalysis')}</Text>
            </View>
            <TouchableOpacity onPress={handleToggleAIChat} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.aiChatContent} contentContainerStyle={styles.aiChatContentContainer}>
            {aiResponse && (
              <View style={[styles.aiResponseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.aiResponseHeader}>
                  <Sparkles size={16} color={colors.primary} />
                  <Text style={[styles.aiResponseLabel, { color: colors.primary }]}>AI Assistant</Text>
                </View>
                <Text style={[styles.aiResponseText, { color: colors.text }]}>{aiResponse.content}</Text>
              </View>
            )}

            {isAILoading && (
              <View style={[styles.aiLoadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.aiLoadingText, { color: colors.textSecondary }]}>
                  Analyzing {mockFuture.symbol}...
                </Text>
              </View>
            )}

            {!aiResponse && !isAILoading && (
              <View style={styles.aiPromptContainer}>
                <Text style={[styles.aiPromptTitle, { color: colors.text }]}>
                  {t('futuresDetail.askAiAbout')} {mockFuture.symbol}
                </Text>
                <Text style={[styles.aiPromptSubtitle, { color: colors.textSecondary }]}>
                  {t('futuresDetail.aiPromptSubtitle')}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.aiChatInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.aiChatInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={aiMessage}
              onChangeText={setAIMessage}
              placeholder={`Ask about ${mockFuture.symbol}...`}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.aiSendButton,
                {
                  backgroundColor: !aiMessage.trim() || isAILoading ? colors.border : colors.primary,
                },
              ]}
              disabled={!aiMessage.trim() || isAILoading}
              onPress={handleAskAI}>
              <Send size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
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
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSymbol: {
    ...Typography.heading4,
  },
  headerExchange: {
    ...Typography.small,
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  warningText: {
    ...Typography.caption,
    flex: 1,
  },
  priceSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  assetName: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 48,
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
  chartContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
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
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  specsCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  specLabel: {
    ...Typography.body,
  },
  specValue: {
    ...Typography.bodyMedium,
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
  aiSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  aiButton: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  tradeButton: {
    flex: 1,
  },
  aiChatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    overflow: 'hidden',
  },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  aiChatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiChatTitle: {
    ...Typography.heading4,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  aiChatContent: {
    flex: 1,
  },
  aiChatContentContainer: {
    padding: Spacing.md,
  },
  aiResponseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  aiResponseLabel: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiResponseText: {
    ...Typography.body,
    lineHeight: 22,
  },
  aiLoadingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiLoadingText: {
    ...Typography.body,
  },
  aiPromptContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  aiPromptTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.sm,
  },
  aiPromptSubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  aiChatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  aiChatInput: {
    flex: 1,
    ...Typography.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 80,
  },
  aiSendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
