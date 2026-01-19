import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Modal, Animated } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TrendingUp, ChevronDown, TrendingDown, Check, X, AlertCircle, Trash2, ChevronUp } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { OptionsChain, OptionContract } from '@/components/OptionsChain';
import { ProfitLossChart } from '@/components/ProfitLossChart';
import { StrategyBuilder, Strategy } from '@/components/StrategyBuilder';

const { width } = Dimensions.get('window');

interface ConfettiPieceProps {
  piece: { id: number; x: number; y: number; color: string; rotation: number };
}

function ConfettiPiece({ piece }: ConfettiPieceProps) {
  const fallAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fallAnim, {
      toValue: 1,
      duration: 2000 + Math.random() * 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: piece.x,
          backgroundColor: piece.color,
          transform: [
            {
              translateY: fallAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [piece.y, -1000],
              })
            },
            { rotate: `${piece.rotation}deg` },
            {
              translateX: fallAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, (Math.random() - 0.5) * 100],
              })
            }
          ],
        },
      ]}
    />
  );
}

interface SelectedOption {
  option: OptionContract;
  position: 'long' | 'short';
  quantity: number;
}

export default function TradeFuturesScreen() {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'futures' | 'options'>('futures');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState('limit');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('4825.50');
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [selectedOptionsDetails, setSelectedOptionsDetails] = useState<SelectedOption[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeInForce, setTimeInForce] = useState('GTC');
  const [showTimeInForceDropdown, setShowTimeInForceDropdown] = useState(false);

  const futuresData: Record<string, any> = {
    ES: {
      symbol: 'ES',
      name: 'S&P 500 Futures',
      price: 4825.50,
      change: '+15.25',
      changePercent: '+0.32',
      isUp: true,
      contractSize: 50,
      initialMargin: 12650,
      maintenanceMargin: 11500,
      tickSize: 0.25,
      tickValue: 12.50,
    },
    NQ: {
      symbol: 'NQ',
      name: 'NASDAQ 100 Futures',
      price: 17245.00,
      change: '+42.50',
      changePercent: '+0.25',
      isUp: true,
      contractSize: 20,
      initialMargin: 18200,
      maintenanceMargin: 16500,
      tickSize: 0.25,
      tickValue: 5.00,
    },
    CL: {
      symbol: 'CL',
      name: 'Crude Oil Futures',
      price: 78.45,
      change: '+1.25',
      changePercent: '+1.62',
      isUp: true,
      contractSize: 1000,
      initialMargin: 6500,
      maintenanceMargin: 5900,
      tickSize: 0.01,
      tickValue: 10.00,
    },
    GC: {
      symbol: 'GC',
      name: 'Gold Futures',
      price: 2085.50,
      change: '+12.80',
      changePercent: '+0.62',
      isUp: true,
      contractSize: 100,
      initialMargin: 9350,
      maintenanceMargin: 8500,
      tickSize: 0.10,
      tickValue: 10.00,
    },
    HSI: {
      symbol: 'HSI',
      name: 'Hang Seng Index Futures',
      price: 16850.00,
      change: '-85.00',
      changePercent: '-0.50',
      isUp: false,
      contractSize: 50,
      initialMargin: 85000,
      maintenanceMargin: 68000,
      tickSize: 1,
      tickValue: 50,
    },
    NK: {
      symbol: 'NK',
      name: 'Nikkei 225 Futures',
      price: 33420.00,
      change: '+120.00',
      changePercent: '+0.36',
      isUp: true,
      contractSize: 1000,
      initialMargin: 1250000,
      maintenanceMargin: 1000000,
      tickSize: 5,
      tickValue: 5000,
    },
    SI: {
      symbol: 'SI',
      name: 'Silver Futures',
      price: 24.35,
      change: '-0.15',
      changePercent: '-0.61',
      isUp: false,
      contractSize: 5000,
      initialMargin: 8250,
      maintenanceMargin: 7500,
      tickSize: 0.005,
      tickValue: 25.00,
    },
    NG: {
      symbol: 'NG',
      name: 'Natural Gas Futures',
      price: 2.85,
      change: '+0.08',
      changePercent: '+2.89',
      isUp: true,
      contractSize: 10000,
      initialMargin: 2500,
      maintenanceMargin: 2275,
      tickSize: 0.001,
      tickValue: 10.00,
    },
  };

  const mockFuture = futuresData[id as string] || futuresData.ES;
  const currentFuturePrice = mockFuture.price;
  const availableBalance = 3000000;

  const generateMockOptions = (): OptionContract[] => {
    const options: OptionContract[] = [];
    const atmStrike = Math.round(currentFuturePrice / 50) * 50;
    const strikes = [];

    for (let i = -5; i <= 5; i++) {
      strikes.push(atmStrike + i * 50);
    }

    strikes.forEach((strike, index) => {
      const distanceFromATM = Math.abs(strike - currentFuturePrice);
      const isITM_Call = currentFuturePrice > strike;
      const isITM_Put = currentFuturePrice < strike;

      const callPremium = isITM_Call
        ? currentFuturePrice - strike + (50 - distanceFromATM * 0.3)
        : Math.max(10, 50 - distanceFromATM * 0.5);

      const putPremium = isITM_Put
        ? strike - currentFuturePrice + (50 - distanceFromATM * 0.3)
        : Math.max(10, 50 - distanceFromATM * 0.5);

      options.push({
        id: `call-${strike}`,
        strike,
        type: 'call',
        premium: callPremium,
        bid: callPremium - 0.5,
        ask: callPremium + 0.5,
        volume: Math.floor(Math.random() * 1000) + 100,
        openInterest: Math.floor(Math.random() * 5000) + 500,
        impliedVolatility: 0.15 + Math.random() * 0.2,
        delta: isITM_Call ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3,
        gamma: 0.01 + Math.random() * 0.02,
        theta: -(0.05 + Math.random() * 0.1),
        vega: 0.1 + Math.random() * 0.2,
      });

      options.push({
        id: `put-${strike}`,
        strike,
        type: 'put',
        premium: putPremium,
        bid: putPremium - 0.5,
        ask: putPremium + 0.5,
        volume: Math.floor(Math.random() * 1000) + 100,
        openInterest: Math.floor(Math.random() * 5000) + 500,
        impliedVolatility: 0.15 + Math.random() * 0.2,
        delta: isITM_Put ? -(0.6 + Math.random() * 0.3) : -(0.1 + Math.random() * 0.3),
        gamma: 0.01 + Math.random() * 0.02,
        theta: -(0.05 + Math.random() * 0.1),
        vega: 0.1 + Math.random() * 0.2,
      });
    });

    return options;
  };

  const mockOptions = generateMockOptions();
  const expirationDate = '2026-02-20';

  const orderTypes = [
    { key: 'market', label: t('trade.market') },
    { key: 'limit', label: t('trade.limit') },
    { key: 'stop', label: t('trade.stop') },
    { key: 'stop_limit', label: t('trade.stopLimit') },
  ];

  const timeInForceOptions = [
    { key: 'GTC', label: 'Good Till Canceled (GTC)' },
    { key: 'DAY', label: 'Same Day' },
  ];

  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

  const mockChartData = [
    { time: '09:30', price: currentFuturePrice - 50 },
    { time: '10:00', price: currentFuturePrice - 40 },
    { time: '10:30', price: currentFuturePrice - 30 },
    { time: '11:00', price: currentFuturePrice - 35 },
    { time: '11:30', price: currentFuturePrice - 20 },
    { time: '12:00', price: currentFuturePrice - 10 },
    { time: '12:30', price: currentFuturePrice - 15 },
    { time: '13:00', price: currentFuturePrice },
    { time: '13:30', price: currentFuturePrice + 5 },
    { time: '14:00', price: currentFuturePrice + 15 },
    { time: '14:30', price: currentFuturePrice + 10 },
    { time: '15:00', price: currentFuturePrice + 20 },
  ];

  const minPrice = Math.min(...mockChartData.map(d => d.price));
  const maxPrice = Math.max(...mockChartData.map(d => d.price));
  const chartHeight = 160;
  const padding = 10;

  const normalizePrice = (price: number) => {
    return ((price - minPrice) / (maxPrice - minPrice)) * (chartHeight - padding * 2);
  };

  const handleSelectOrderType = (type: string) => {
    setOrderType(type);
    setShowOrderTypeDropdown(false);
  };

  const calculateNotionalValue = () => {
    const qty = parseFloat(quantity) || 0;
    return qty * currentFuturePrice * mockFuture.contractSize;
  };

  const calculateInitialMargin = () => {
    const qty = parseFloat(quantity) || 0;
    return qty * mockFuture.initialMargin;
  };

  const calculateMaintenanceMargin = () => {
    const qty = parseFloat(quantity) || 0;
    return qty * mockFuture.maintenanceMargin;
  };

  const calculateFees = () => {
    const qty = parseFloat(quantity) || 0;
    return qty * 2.50;
  };

  const getMaxContracts = () => {
    return Math.floor(availableBalance / mockFuture.initialMargin);
  };

  useEffect(() => {
    if (confetti.length > 0) {
      const animations = confetti.map((_, index) => {
        return setTimeout(() => {
          setConfetti(prev => prev.filter((_, i) => i !== index));
        }, 2000 + index * 50);
      });

      return () => {
        animations.forEach(clearTimeout);
      };
    }
  }, [confetti]);

  const triggerConfetti = () => {
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * width,
      y: 800,
      color: ['#F8D000', '#0D1647', '#00C853', '#FF3B30', '#007AFF'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
    }));
    setConfetti(newConfetti);
  };

  const handlePlaceOrder = () => {
    if (!quantity || parseFloat(quantity) <= 0) return;

    const requiredMargin = calculateInitialMargin();
    if (requiredMargin > availableBalance) {
      return;
    }

    triggerConfetti();
    setShowSummaryModal(true);
  };

  const handleSelectOption = (optionId: string) => {
    if (selectedOptionIds.includes(optionId)) {
      setSelectedOptionIds(selectedOptionIds.filter(id => id !== optionId));
      setSelectedOptionsDetails(selectedOptionsDetails.filter(s => s.option.id !== optionId));
    } else {
      const option = mockOptions.find(o => o.id === optionId);
      if (option) {
        setSelectedOptionIds([...selectedOptionIds, optionId]);
        setSelectedOptionsDetails([
          ...selectedOptionsDetails,
          { option, position: 'long', quantity: 1 },
        ]);
      }
    }
    setCurrentStrategy(null);
  };

  const handleTogglePosition = (optionId: string) => {
    setSelectedOptionsDetails(
      selectedOptionsDetails.map(s =>
        s.option.id === optionId
          ? { ...s, position: s.position === 'long' ? 'short' : 'long' }
          : s
      )
    );
  };

  const handleBuildStrategy = (strategy: Strategy) => {
    const atmStrike = Math.round(currentFuturePrice / 50) * 50;
    const strikes = [...new Set(mockOptions.map(o => o.strike))].sort((a, b) => a - b);
    const atmIndex = strikes.findIndex(s => s === atmStrike);

    const newSelectedOptions: SelectedOption[] = [];
    const newSelectedIds: string[] = [];

    strategy.legs.forEach(leg => {
      const targetStrikeIndex = atmIndex + leg.strikeOffset;
      if (targetStrikeIndex >= 0 && targetStrikeIndex < strikes.length) {
        const strike = strikes[targetStrikeIndex];
        const option = mockOptions.find(
          o => o.strike === strike && o.type === leg.type
        );

        if (option) {
          newSelectedOptions.push({
            option,
            position: leg.position,
            quantity: 1,
          });
          newSelectedIds.push(option.id);
        }
      }
    });

    setSelectedOptionsDetails(newSelectedOptions);
    setSelectedOptionIds(newSelectedIds);
    setCurrentStrategy(strategy.name);
  };

  const handleClearSelections = () => {
    setSelectedOptionIds([]);
    setSelectedOptionsDetails([]);
    setCurrentStrategy(null);
  };

  return (
    <SafeContainer>
      <View style={[styles.headerGradient, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>← {t('tradeFutures.back')}</Text>
          </TouchableOpacity>
          <EddidLogo width={120} height={30} color={colorScheme === 'dark' ? '#FFFFFF' : '#0D1647'} />
          <View style={styles.glowEffect} />
        </View>
      </View>

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tradeFutures.title')} {mockFuture.symbol}</Text>

        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              styles.tabButtonLeft,
              {
                backgroundColor: activeTab === 'futures' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setActiveTab('futures')}>
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'futures' ? colors.secondary : colors.textSecondary }
            ]}>
              {t('tradeFutures.futures')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              styles.tabButtonRight,
              {
                backgroundColor: activeTab === 'options' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setActiveTab('options')}>
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'options' ? colors.secondary : colors.textSecondary }
            ]}>
              {t('tradeFutures.options')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.warningBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning, marginHorizontal: Spacing.md }]}>
          <AlertCircle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            {activeTab === 'futures'
              ? t('tradeFutures.futuresWarning')
              : t('tradeFutures.optionsWarning')}
          </Text>
        </View>

        {activeTab === 'options' && (
          <>
            <View style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md }}>
              <StrategyBuilder
                options={mockOptions}
                underlyingPrice={currentFuturePrice}
                onBuildStrategy={handleBuildStrategy}
              />
            </View>

            {selectedOptionsDetails.length > 0 && (
              <View style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md }}>
                <View style={styles.selectedHeader}>
                  <Text style={[styles.selectedTitle, { color: colors.text }]}>
                    {t('tradeFutures.selectedPositions')} ({selectedOptionsDetails.length})
                  </Text>
                  <TouchableOpacity onPress={handleClearSelections}>
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {selectedOptionsDetails.map(({ option, position, quantity }) => (
                  <View
                    key={option.id}
                    style={[styles.selectedOption, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.selectedOptionLeft}>
                      <Text style={[styles.selectedOptionType, {
                        color: option.type === 'call' ? colors.success : colors.error
                      }]}>
                        {option.type.toUpperCase()}
                      </Text>
                      <Text style={[styles.selectedOptionStrike, { color: colors.text }]}>
                        ${option.strike}
                      </Text>
                      <Text style={[styles.selectedOptionPremium, { color: colors.textSecondary }]}>
                        @${option.premium.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.selectedOptionRight}>
                      <TouchableOpacity
                        style={[styles.positionBadge, {
                          backgroundColor: position === 'long' ? colors.successBg : colors.errorBg
                        }]}
                        onPress={() => handleTogglePosition(option.id)}>
                        <Text style={[styles.positionBadgeText, {
                          color: position === 'long' ? colors.success : colors.error
                        }]}>
                          {position.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.quantityText, { color: colors.textSecondary }]}>
                        x{quantity}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={{ marginTop: Spacing.md }}>
                  <ProfitLossChart
                    underlyingPrice={currentFuturePrice}
                    selectedOptions={selectedOptionsDetails}
                    strategyName={currentStrategy || undefined}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.reviewOrderButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const optionsData = {
                      options: selectedOptionsDetails,
                      underlyingPrice: currentFuturePrice,
                    };
                    const encoded = encodeURIComponent(JSON.stringify(optionsData));
                    router.push(`/trade-options/${id}?options=${encoded}&strategy=${encodeURIComponent(currentStrategy || 'Custom Strategy')}`);
                  }}>
                  <Text style={[styles.reviewOrderButtonText, { color: colors.secondary }]}>
                    {t('tradeFutures.reviewPlaceOrder')} →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.optionsChainContainer, { marginHorizontal: Spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.md }]}>
                {t('tradeFutures.optionsChain')}
              </Text>
              <OptionsChain
                underlyingPrice={currentFuturePrice}
                expirationDate={expirationDate}
                options={mockOptions}
                selectedOptions={selectedOptionIds}
                onSelectOption={handleSelectOption}
              />
            </View>
          </>
        )}

        {activeTab === 'futures' && (
          <>

        <View style={[styles.assetPreview, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.assetPreviewLeft}>
            <Text style={[styles.assetSymbol, { color: colors.text }]}>{mockFuture.symbol}</Text>
            <Text style={[styles.assetName, { color: colors.textSecondary }]}>{mockFuture.name}</Text>
          </View>
          <View style={styles.assetPreviewRight}>
            <Text style={[styles.assetPrice, { color: colors.text }]}>${currentFuturePrice.toFixed(2)}</Text>
            <View style={styles.assetChange}>
              {mockFuture.isUp ? (
                <TrendingUp size={14} color={colors.success} />
              ) : (
                <TrendingDown size={14} color={colors.error} />
              )}
              <Text style={[styles.assetChangeText, { color: mockFuture.isUp ? colors.success : colors.error }]}>
                {mockFuture.changePercent}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartPrice, { color: colors.text }]}>${currentFuturePrice.toFixed(2)}</Text>
              <View style={styles.chartChange}>
                {mockFuture.isUp ? (
                  <TrendingUp size={16} color={colors.success} />
                ) : (
                  <TrendingDown size={16} color={colors.error} />
                )}
                <Text style={[styles.chartChangeText, { color: mockFuture.isUp ? colors.success : colors.error }]}>
                  {mockFuture.change} ({mockFuture.changePercent})
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeframeScroll}>
              {timeframes.map(tf => (
                <TouchableOpacity
                  key={tf}
                  style={[
                    styles.timeframeButton,
                    { backgroundColor: selectedTimeframe === tf ? colors.primary : colors.surface }
                  ]}
                  onPress={() => setSelectedTimeframe(tf)}>
                  <Text style={[
                    styles.timeframeText,
                    { color: selectedTimeframe === tf ? colors.secondary : colors.textSecondary }
                  ]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.chartArea, { backgroundColor: colors.surface }]}>
            <View style={styles.chartLines}>
              {mockChartData.map((point, index) => {
                const nextPoint = mockChartData[index + 1];
                if (!nextPoint) return null;

                const startY = chartHeight - normalizePrice(point.price) - padding;
                const endY = chartHeight - normalizePrice(nextPoint.price) - padding;
                const startX = (index / (mockChartData.length - 1)) * (width - 80) + padding;
                const endX = ((index + 1) / (mockChartData.length - 1)) * (width - 80) + padding;

                const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

                return (
                  <View
                    key={index}
                    style={[
                      styles.chartLine,
                      {
                        backgroundColor: colors.success,
                        width: length,
                        left: startX + 10,
                        top: startY,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              {mockChartData.map((point, index) => {
                const y = chartHeight - normalizePrice(point.price) - padding;
                const x = (index / (mockChartData.length - 1)) * (width - 80) + padding;

                return (
                  <View
                    key={`point-${index}`}
                    style={[
                      styles.chartPoint,
                      {
                        backgroundColor: colors.success,
                        left: x + 8,
                        top: y - 2,
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.chartXAxis}>
              <Text style={[styles.chartAxisLabel, { color: colors.textTertiary }]}>
                {mockChartData[0].time}
              </Text>
              <Text style={[styles.chartAxisLabel, { color: colors.textTertiary }]}>
                {mockChartData[Math.floor(mockChartData.length / 2)].time}
              </Text>
              <Text style={[styles.chartAxisLabel, { color: colors.textTertiary }]}>
                {mockChartData[mockChartData.length - 1].time}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.sideToggle}>
            <TouchableOpacity
              style={[
                styles.sideButton,
                styles.sideButtonLeft,
                {
                  backgroundColor: side === 'buy' ? colors.success : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSide('buy')}>
              <Text style={[
                styles.sideButtonText,
                { color: side === 'buy' ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {t('trade.buy')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sideButton,
                styles.sideButtonRight,
                {
                  backgroundColor: side === 'sell' ? colors.error : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSide('sell')}>
              <Text style={[
                styles.sideButtonText,
                { color: side === 'sell' ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {t('trade.sell')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('trade.orderType')}</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowOrderTypeDropdown(!showOrderTypeDropdown)}>
              <Text style={[styles.selectText, { color: colors.text }]}>
                {orderTypes.find(o => o.key === orderType)?.label}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showOrderTypeDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {orderTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectOrderType(type.key)}>
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{type.label}</Text>
                    {orderType === type.key && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('tradeFutures.contracts')}</Text>
              <Text style={[styles.labelHint, { color: colors.textTertiary }]}>
                {t('tradeFutures.max')}: {getMaxContracts()}
              </Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>

          {orderType === 'limit' && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('trade.price')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.advancedToggle, { borderColor: colors.border }]}
            onPress={() => setShowAdvanced(!showAdvanced)}>
            <Text style={[styles.advancedToggleText, { color: colors.text }]}>{t('tradeFutures.advanced')}</Text>
            {showAdvanced ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedSection}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('tradeFutures.takeProfit')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={takeProfit}
                  onChangeText={setTakeProfit}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('tradeFutures.stopLoss')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('tradeFutures.timeInForce')}</Text>
                <TouchableOpacity
                  style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowTimeInForceDropdown(!showTimeInForceDropdown)}>
                  <Text style={[styles.selectText, { color: colors.text }]}>
                    {timeInForceOptions.find(o => o.key === timeInForce)?.label}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {showTimeInForceDropdown && (
                  <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {timeInForceOptions.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          setTimeInForce(option.key);
                          setShowTimeInForceDropdown(false);
                        }}>
                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>{option.label}</Text>
                        {timeInForce === option.key && <Check size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={[styles.marginInfo, { backgroundColor: colors.infoBg, borderColor: colors.info }]}>
            <Text style={[styles.marginInfoTitle, { color: colors.info }]}>{t('tradeFutures.marginRequirements')}</Text>
            <View style={styles.marginInfoRow}>
              <Text style={[styles.marginInfoLabel, { color: colors.info }]}>{t('futuresDetail.initialMargin')}:</Text>
              <Text style={[styles.marginInfoValue, { color: colors.info }]}>
                ${calculateInitialMargin().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.marginInfoRow}>
              <Text style={[styles.marginInfoLabel, { color: colors.info }]}>{t('futuresDetail.maintenanceMargin')}:</Text>
              <Text style={[styles.marginInfoValue, { color: colors.info }]}>
                ${calculateMaintenanceMargin().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFutures.notionalValue')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${calculateNotionalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('trade.estimatedFees')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${calculateFees().toFixed(2)}</Text>
          </View>

          <View style={styles.availableBalance}>
            <Text style={[styles.availableText, { color: colors.textSecondary }]}>{t('tradeFutures.availableBalance')}:</Text>
            <Text style={[styles.availableAmount, { color: colors.text }]}>
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              {
                backgroundColor: !quantity || parseFloat(quantity) <= 0 || calculateInitialMargin() > availableBalance
                  ? colors.border
                  : side === 'buy'
                  ? colors.success
                  : colors.error,
                opacity: !quantity || parseFloat(quantity) <= 0 || calculateInitialMargin() > availableBalance ? 0.5 : 1,
              },
            ]}
            disabled={!quantity || parseFloat(quantity) <= 0 || calculateInitialMargin() > availableBalance}
            onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderButtonText}>
              {side === 'buy' ? t('trade.buy') : t('trade.sell')} {mockFuture.symbol}
            </Text>
          </TouchableOpacity>

          {calculateInitialMargin() > availableBalance && parseFloat(quantity) > 0 && (
            <View style={styles.errorMessage}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('tradeFutures.insufficientMargin')} ${calculateInitialMargin().toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.infoBg, marginHorizontal: Spacing.md }]}>
          <Text style={[styles.infoText, { color: colors.info }]}>
            {t('tradeFutures.marginInfo')}
          </Text>
        </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummaryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.summaryModal, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryModalHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.successBadge, { backgroundColor: side === 'buy' ? colors.successBg : colors.errorBg }]}>
                <Check size={32} color={side === 'buy' ? colors.success : colors.error} />
              </View>
              <Text style={[styles.summaryModalTitle, { color: colors.text }]}>
                {t('tradeFutures.futuresOrderPlaced')}
              </Text>
              <Text style={[styles.summaryModalSubtitle, { color: colors.textSecondary }]}>
                {t('trade.orderPlacedSuccessfully')}
              </Text>
            </View>

            <View style={styles.summaryModalContent}>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.contract')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{mockFuture.symbol}</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.side')}</Text>
                <Text style={[styles.summaryModalValue, { color: side === 'buy' ? colors.success : colors.error }]}>
                  {side === 'buy' ? t('tradeFutures.long') : t('tradeFutures.short')}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.orderType')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  {orderTypes.find(o => o.key === orderType)?.label}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.contracts')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{quantity}</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.price')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  ${orderType === 'market' ? currentFuturePrice.toFixed(2) : parseFloat(price).toFixed(2)}
                </Text>
              </View>
              {takeProfit && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.takeProfit')}</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.success }]}>${parseFloat(takeProfit).toFixed(2)}</Text>
                </View>
              )}
              {stopLoss && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.stopLoss')}</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.error }]}>${parseFloat(stopLoss).toFixed(2)}</Text>
                </View>
              )}
              {(takeProfit || stopLoss || timeInForce !== 'GTC') && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.timeInForce')}</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                    {timeInForceOptions.find(o => o.key === timeInForce)?.label}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryModalRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm }]}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('futuresDetail.initialMargin')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  ${calculateInitialMargin().toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.notionalValue')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  ${calculateNotionalValue().toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.fees')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>${calculateFees().toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.summaryModalActions}>
              <TouchableOpacity
                style={[styles.summaryModalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowSummaryModal(false);
                  router.push('/(tabs)');
                }}>
                <Text style={[styles.summaryModalButtonText, { color: colors.secondary }]}>{t('common.done')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowSummaryModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {confetti.length > 0 && (
            <View style={styles.confettiContainer} pointerEvents="none">
              {confetti.map((piece) => (
                <ConfettiPiece key={piece.id} piece={piece} />
              ))}
            </View>
          )}
        </View>
      </Modal>
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
  backButton: {
    padding: Spacing.xs,
  },
  backText: {
    ...Typography.body,
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
  tabSwitcher: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabButtonLeft: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  tabButtonRight: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  tabButtonText: {
    ...Typography.captionMedium,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading3,
  },
  optionsChainContainer: {
    marginBottom: Spacing.xl,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedTitle: {
    ...Typography.heading4,
  },
  selectedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  selectedOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  selectedOptionType: {
    ...Typography.captionMedium,
    fontSize: 10,
  },
  selectedOptionStrike: {
    ...Typography.bodySemibold,
  },
  selectedOptionPremium: {
    ...Typography.caption,
  },
  selectedOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  positionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  positionBadgeText: {
    ...Typography.small,
    fontSize: 10,
    fontWeight: '600',
  },
  quantityText: {
    ...Typography.caption,
  },
  reviewOrderButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  reviewOrderButtonText: {
    ...Typography.bodySemibold,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningText: {
    ...Typography.caption,
    flex: 1,
  },
  assetPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  assetPreviewLeft: {},
  assetSymbol: {
    ...Typography.heading4,
    marginBottom: 2,
  },
  assetName: {
    ...Typography.caption,
  },
  assetPreviewRight: {
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
  chartContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  chartPrice: {
    ...Typography.heading2,
    marginBottom: 4,
  },
  chartChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartChangeText: {
    ...Typography.body,
  },
  timeframeScroll: {
    flexDirection: 'row',
    maxWidth: '50%',
  },
  timeframeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginLeft: 4,
  },
  timeframeText: {
    ...Typography.small,
  },
  chartArea: {
    height: 200,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    position: 'relative',
  },
  chartLines: {
    position: 'relative',
    height: 160,
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  chartPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  chartAxisLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sideToggle: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sideButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  sideButtonLeft: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  sideButtonRight: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  sideButtonText: {
    ...Typography.bodySemibold,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.captionMedium,
  },
  labelHint: {
    ...Typography.caption,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Typography.body,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectText: {
    ...Typography.body,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.md,
  },
  advancedToggleText: {
    ...Typography.bodySemibold,
  },
  advancedSection: {
    marginTop: Spacing.sm,
  },
  marginInfo: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  marginInfoTitle: {
    ...Typography.captionMedium,
    marginBottom: Spacing.sm,
  },
  marginInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  marginInfoLabel: {
    ...Typography.caption,
  },
  marginInfoValue: {
    ...Typography.captionMedium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
  },
  availableBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  availableText: {
    ...Typography.caption,
  },
  availableAmount: {
    ...Typography.captionMedium,
  },
  placeOrderButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    ...Typography.bodySemibold,
    color: '#FFFFFF',
  },
  errorMessage: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.caption,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.caption,
  },
  dropdown: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    ...Typography.body,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  summaryModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  summaryModalHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  summaryModalTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
  },
  summaryModalSubtitle: {
    ...Typography.caption,
    textAlign: 'center',
  },
  summaryModalContent: {
    padding: Spacing.lg,
  },
  summaryModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryModalLabel: {
    ...Typography.body,
  },
  summaryModalValue: {
    ...Typography.body,
  },
  summaryModalActions: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  summaryModalButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  summaryModalButtonText: {
    ...Typography.bodySemibold,
  },
  closeModalButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
  },
});
