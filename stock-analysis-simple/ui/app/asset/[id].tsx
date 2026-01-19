import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Sparkles, Send, X } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useRef, useEffect } from 'react';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { handleNewsArticleQuestion, type Message } from '@/lib/aiService';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function AssetDetailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { checkAILimit } = useSubscription();
  const { id, name } = useLocalSearchParams();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAIMessage] = useState('');
  const [aiResponse, setAIResponse] = useState<Message | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const assetSymbol = (id as string) || 'AAPL';
  const assetName = (name as string) || 'Asset';
  const assetExchange = assetSymbol.includes('.HK') ? 'HKEX' : 'NASDAQ';

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showAIChat ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showAIChat]);

  useEffect(() => {
    if (user && assetSymbol && assetName) {
      const trackView = async () => {
        await supabase
          .from('recently_viewed_assets')
          .upsert(
            {
              user_id: user.id,
              asset_symbol: assetSymbol,
              asset_name: assetName,
              asset_type: 'stock',
              viewed_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,asset_symbol',
            }
          );
      };
      trackView();
    }
  }, [user, assetSymbol, assetName]);

  const chartData = useMemo(() => {
    const basePrice = 185.5;
    const dataPoints: { price: number; time: string }[] = [];
    const numPoints = selectedTimeframe === '1D' ? 24 : selectedTimeframe === '1W' ? 7 : 30;

    for (let i = 0; i < numPoints; i++) {
      const variation = (Math.random() - 0.5) * 10;
      const price = basePrice + variation + (i * 0.2);
      dataPoints.push({
        price: parseFloat(price.toFixed(2)),
        time: `${i}`,
      });
    }

    return dataPoints;
  }, [selectedTimeframe]);

  const mockAsset = {
    symbol: assetSymbol,
    name: assetName,
    exchange: assetExchange,
    price: '185.50',
    change: '+2.45',
    changePercent: '+1.34',
    isUp: true,
    high24h: '187.20',
    low24h: '182.30',
    volume: '52.4M',
    marketCap: '$2.85T',
  };

  const mockIndicators = [
    { name: 'RSI(14)', value: '58.3', signal: t('asset.neutral'), color: colors.text },
    { name: 'MACD', value: '+0.45', signal: t('asset.buy'), color: colors.success },
    { name: 'SMA(50)', value: '178.20', signal: t('asset.above'), color: colors.success },
    { name: 'Bollinger Bands', value: 'Mid', signal: t('asset.neutral'), color: colors.text },
  ];

  const renderChart = () => {
    const chartWidth = width - Spacing.md * 4;
    const chartHeight = 200;
    const padding = { top: 20, bottom: 20, left: 15, right: 15 };
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

  const mockNews = [
    {
      title: 'Apple Announces New AI Features for iOS',
      source: 'TechCrunch',
      time: '2h ago',
      sentiment: 'positive',
    },
    {
      title: 'Analyst Raises AAPL Price Target to $200',
      source: 'Bloomberg',
      time: '5h ago',
      sentiment: 'positive',
    },
  ];

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
      const assetContext = `Asset: ${mockAsset.symbol} (${mockAsset.name})
Current Price: $${mockAsset.price}
Change: ${mockAsset.change} (${mockAsset.changePercent})
24h High: $${mockAsset.high24h}
24h Low: $${mockAsset.low24h}
Volume: ${mockAsset.volume}
Market Cap: ${mockAsset.marketCap}

Technical Indicators:
${mockIndicators.map(ind => `${ind.name}: ${ind.value} - ${ind.signal}`).join('\n')}

Recent News:
${mockNews.map(news => `- ${news.title} (${news.source})`).join('\n')}`;

      const response = await handleNewsArticleQuestion(
        `${mockAsset.symbol} Stock Analysis`,
        assetContext,
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
          <Text style={[styles.headerSymbol, { color: colors.text }]}>{mockAsset.symbol}</Text>
          <Text style={[styles.headerExchange, { color: colors.textSecondary }]}>{mockAsset.exchange}</Text>
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
        <View style={styles.priceSection}>
          <Text style={[styles.assetName, { color: colors.textSecondary }]}>{mockAsset.name}</Text>
          <Text style={[styles.price, { color: colors.text }]}>${mockAsset.price}</Text>
          <View style={styles.priceChange}>
            {mockAsset.isUp ? (
              <TrendingUp size={20} color={colors.success} />
            ) : (
              <TrendingDown size={20} color={colors.error} />
            )}
            <Text style={[styles.changeText, { color: mockAsset.isUp ? colors.success : colors.error }]}>
              ${mockAsset.change} ({mockAsset.changePercent})
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

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('asset.high24h')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>${mockAsset.high24h}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('asset.low24h')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>${mockAsset.low24h}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('asset.volume')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{mockAsset.volume}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('asset.marketCap')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{mockAsset.marketCap}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('asset.technicalIndicators')}</Text>
          <View style={[styles.indicatorsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {mockIndicators.map((indicator, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorRow,
                  index < mockIndicators.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}>
                <Text style={[styles.indicatorName, { color: colors.text }]}>{indicator.name}</Text>
                <View style={styles.indicatorRight}>
                  <Text style={[styles.indicatorValue, { color: colors.textSecondary }]}>{indicator.value}</Text>
                  <Text style={[styles.indicatorSignal, { color: indicator.color }]}>{indicator.signal}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('asset.latestNews')}</Text>
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
        <Button title={t('trade.buy')} variant="primary" style={styles.tradeButton} onPress={() => router.push(`/trade-asset/${id}?name=${mockAsset.name}&side=buy`)} />
        <Button title={t('trade.sell')} variant="danger" style={styles.tradeButton} onPress={() => router.push(`/trade-asset/${id}?name=${mockAsset.name}&side=sell`)} />
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
              <Text style={[styles.aiChatTitle, { color: colors.text }]}>AI Asset Analysis</Text>
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
                  Analyzing {mockAsset.symbol}...
                </Text>
              </View>
            )}

            {!aiResponse && !isAILoading && (
              <View style={styles.aiPromptContainer}>
                <Text style={[styles.aiPromptTitle, { color: colors.text }]}>
                  Ask AI about {mockAsset.symbol}
                </Text>
                <Text style={[styles.aiPromptSubtitle, { color: colors.textSecondary }]}>
                  Get instant analysis and insights about this asset
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.aiChatInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.aiChatInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={aiMessage}
              onChangeText={setAIMessage}
              placeholder={`Ask about ${mockAsset.symbol}...`}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statLabel: {
    ...Typography.small,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.bodyMedium,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  indicatorsCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  indicatorName: {
    ...Typography.body,
  },
  indicatorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  indicatorValue: {
    ...Typography.caption,
  },
  indicatorSignal: {
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
