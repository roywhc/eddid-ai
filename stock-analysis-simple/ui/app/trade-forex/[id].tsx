import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated, Dimensions } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, Check, X, ChevronUp } from 'lucide-react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

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

export default function TradeForexScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { id, pair: pairParam, name, side: initialSide } = useLocalSearchParams();

  const [side, setSide] = useState<'buy' | 'sell'>((initialSide as 'buy' | 'sell') || 'buy');
  const [orderType, setOrderType] = useState('market');
  const [lotSize, setLotSize] = useState('');
  const [price, setPrice] = useState('149.25');
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [leverage, setLeverage] = useState('1:100');
  const [showLeverageDropdown, setShowLeverageDropdown] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');

  const forexPair = (pairParam as string) || 'USD/JPY';
  const forexName = (name as string) || 'US Dollar / Japanese Yen';
  const currentPrice = 149.25;
  const pipChange = 0.45;
  const percentChange = 0.30;
  const isUp = pipChange > 0;
  const availableBalance = 48205.50;

  const timeframes = ['5M', '15M', '1H', '4H', '1D', '1W'];

  const orderTypes = [
    { key: 'market', label: t('trade.market') },
    { key: 'limit', label: t('trade.limit') },
    { key: 'stop', label: t('trade.stop') },
    { key: 'stop_limit', label: t('trade.stopLimit') },
  ];

  const leverageOptions = [
    { key: '1:1', label: '1:1' },
    { key: '1:10', label: '1:10' },
    { key: '1:50', label: '1:50' },
    { key: '1:100', label: '1:100' },
    { key: '1:200', label: '1:200' },
    { key: '1:500', label: '1:500' },
  ];

  const lotSizeButtons = ['0.01', '0.1', '1', '10'];

  const chartData = useMemo(() => {
    const basePrice = currentPrice;
    const dataPoints: { price: number; time: string }[] = [];
    const numPoints = selectedTimeframe === '5M' ? 12 : selectedTimeframe === '1H' ? 24 : 30;

    for (let i = 0; i < numPoints; i++) {
      const variation = (Math.random() - 0.5) * 0.5;
      const trend = isUp ? i * 0.02 : -i * 0.02;
      const price = basePrice + variation + trend;
      dataPoints.push({
        price: parseFloat(price.toFixed(2)),
        time: `${i}`,
      });
    }

    return dataPoints;
  }, [selectedTimeframe, isUp]);

  const renderChart = () => {
    const chartWidth = width - Spacing.md * 4 - Spacing.sm * 2;
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
          stroke={isUp ? colors.success : colors.error}
          strokeWidth="2"
        />
        <Circle
          cx={lastX}
          cy={lastY}
          r="4"
          fill={isUp ? colors.success : colors.error}
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
          {lastPoint.price.toFixed(2)}
        </SvgText>
      </Svg>
    );
  };

  const handleSelectOrderType = (type: string) => {
    setOrderType(type);
    setShowOrderTypeDropdown(false);
  };

  const calculateContractSize = () => {
    const lot = parseFloat(lotSize) || 0;
    return lot * 100000;
  };

  const calculateMargin = () => {
    const lot = parseFloat(lotSize) || 0;
    const leverageValue = parseInt(leverage.split(':')[1]);
    const contractValue = lot * 100000 * currentPrice;
    return contractValue / leverageValue;
  };

  const calculateTotal = () => {
    const lot = parseFloat(lotSize) || 0;
    const effectivePrice = orderType === 'market' ? currentPrice : parseFloat(price) || currentPrice;
    return lot * 100000 * effectivePrice;
  };

  const calculateFees = () => {
    return calculateTotal() * 0.0001;
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
    if (!lotSize || parseFloat(lotSize) <= 0) return;

    triggerConfetti();
    setShowSummaryModal(true);
  };

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trade {forexPair}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{forexName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.assetPreview, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.assetPreviewLeft}>
            <Text style={[styles.assetSymbol, { color: colors.text }]}>{forexPair}</Text>
            <Text style={[styles.assetName, { color: colors.textSecondary }]}>{forexName}</Text>
          </View>
          <View style={styles.assetPreviewRight}>
            <Text style={[styles.assetPrice, { color: colors.text }]}>{currentPrice.toFixed(2)}</Text>
            <View style={styles.assetChange}>
              {isUp ? (
                <TrendingUp size={14} color={colors.success} />
              ) : (
                <TrendingDown size={14} color={colors.error} />
              )}
              <Text style={[styles.assetChangeText, { color: isUp ? colors.success : colors.error }]}>
                {isUp ? '+' : ''}{pipChange.toFixed(2)} pips ({isUp ? '+' : ''}{percentChange.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartPrice, { color: colors.text }]}>{currentPrice.toFixed(2)}</Text>
              <View style={styles.chartChange}>
                {isUp ? (
                  <TrendingUp size={16} color={colors.success} />
                ) : (
                  <TrendingDown size={16} color={colors.error} />
                )}
                <Text style={[styles.chartChangeText, { color: isUp ? colors.success : colors.error }]}>
                  {isUp ? '+' : ''}{pipChange.toFixed(2)} ({isUp ? '+' : ''}{percentChange.toFixed(2)}%)
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
            {renderChart()}
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>Lot Size</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={lotSize}
              onChangeText={setLotSize}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <View style={styles.percentageButtons}>
              {lotSizeButtons.map(lot => (
                <TouchableOpacity
                  key={lot}
                  style={[styles.percentageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setLotSize(lot)}>
                  <Text style={[styles.percentageButtonText, { color: colors.textSecondary }]}>{lot}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              Contract Size: {calculateContractSize().toLocaleString()} units
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Leverage</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowLeverageDropdown(!showLeverageDropdown)}>
              <Text style={[styles.selectText, { color: colors.text }]}>{leverage}</Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showLeverageDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {leverageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setLeverage(option.key);
                      setShowLeverageDropdown(false);
                    }}>
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{option.label}</Text>
                    {leverage === option.key && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
            <Text style={[styles.advancedToggleText, { color: colors.text }]}>Advanced</Text>
            {showAdvanced ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedSection}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Take Profit (pips)</Text>
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Stop Loss (pips)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Margin Required</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${calculateMargin().toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('trade.estimatedFees')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${calculateFees().toFixed(2)}</Text>
          </View>

          <View style={styles.availableBalance}>
            <Text style={[styles.availableText, { color: colors.textSecondary }]}>Available:</Text>
            <Text style={[styles.availableAmount, { color: colors.text }]}>${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              {
                backgroundColor: side === 'buy' ? colors.success : colors.error,
                opacity: !lotSize || parseFloat(lotSize) <= 0 ? 0.5 : 1,
              },
            ]}
            disabled={!lotSize || parseFloat(lotSize) <= 0}
            onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderButtonText}>
              {side === 'buy' ? t('trade.buy') : t('trade.sell')} {forexPair}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.infoBg, marginHorizontal: Spacing.md }]}>
          <Text style={[styles.infoText, { color: colors.info }]}>
            Forex trading involves substantial risk. Leverage can magnify both gains and losses. Always use stop loss orders to manage risk.
          </Text>
        </View>
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
                Forex Order {side === 'buy' ? 'Buy' : 'Sell'}
              </Text>
              <Text style={[styles.summaryModalSubtitle, { color: colors.textSecondary }]}>
                {t('trade.orderPlacedSuccessfully')}
              </Text>
            </View>

            <View style={styles.summaryModalContent}>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Pair</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{forexPair}</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.side')}</Text>
                <Text style={[styles.summaryModalValue, { color: side === 'buy' ? colors.success : colors.error }]}>
                  {side === 'buy' ? t('trade.buy').toUpperCase() : t('trade.sell').toUpperCase()}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.orderType')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  {orderTypes.find(o => o.key === orderType)?.label}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Lot Size</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{lotSize} lots</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Contract Size</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{calculateContractSize().toLocaleString()} units</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Leverage</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{leverage}</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.price')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  {orderType === 'market' ? currentPrice.toFixed(2) : parseFloat(price).toFixed(2)}
                </Text>
              </View>
              {takeProfit && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Take Profit</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.success }]}>{takeProfit} pips</Text>
                </View>
              )}
              {stopLoss && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Stop Loss</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.error }]}>{stopLoss} pips</Text>
                </View>
              )}
              <View style={[styles.summaryModalRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm }]}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Margin Required</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>${calculateMargin().toFixed(2)}</Text>
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
  headerTitle: {
    ...Typography.heading4,
  },
  headerSubtitle: {
    ...Typography.caption,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.md,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  label: {
    ...Typography.captionMedium,
    marginBottom: Spacing.xs,
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
  percentageButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  percentageButtonText: {
    ...Typography.captionMedium,
  },
  helperText: {
    ...Typography.small,
    marginTop: Spacing.xs,
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
