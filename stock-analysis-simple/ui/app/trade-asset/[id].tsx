import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated, Dimensions } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, TrendingUp, ChevronDown, Check, X, ChevronUp } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

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

export default function TradeAssetScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { id, name, side: initialSide } = useLocalSearchParams();

  const [side, setSide] = useState<'buy' | 'sell'>((initialSide as 'buy' | 'sell') || 'buy');
  const [orderType, setOrderType] = useState('limit');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('185.50');
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeInForce, setTimeInForce] = useState('GTC');
  const [showTimeInForceDropdown, setShowTimeInForceDropdown] = useState(false);

  const currentAssetPrice = 185.50;
  const availableBalance = 48205.50;
  const assetSymbol = id;
  const assetName = (name as string) || 'Asset';

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

  const percentageButtons = ['25%', '50%', '75%', '100%'];

  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

  const mockChartData = [
    { time: '09:30', price: 182.5 },
    { time: '10:00', price: 183.2 },
    { time: '10:30', price: 184.1 },
    { time: '11:00', price: 183.8 },
    { time: '11:30', price: 185.5 },
    { time: '12:00', price: 186.2 },
    { time: '12:30', price: 185.8 },
    { time: '13:00', price: 187.1 },
    { time: '13:30', price: 186.5 },
    { time: '14:00', price: 188.0 },
    { time: '14:30', price: 187.5 },
    { time: '15:00', price: 189.2 },
  ];

  const minPrice = Math.min(...mockChartData.map(d => d.price));
  const maxPrice = Math.max(...mockChartData.map(d => d.price));
  const chartHeight = 200;
  const chartWidth = width - (Spacing.md * 4) - (Spacing.sm * 2);

  const normalizePrice = (price: number) => {
    return ((price - minPrice) / (maxPrice - minPrice)) * (chartHeight - 40);
  };

  const handlePercentageClick = (percent: string) => {
    const percentage = parseInt(percent) / 100;
    const effectivePrice = orderType === 'market' ? currentAssetPrice : parseFloat(price) || currentAssetPrice;
    const maxQuantity = Math.floor((availableBalance * percentage) / effectivePrice);
    setQuantity(maxQuantity.toString());
  };

  const handleSelectOrderType = (type: string) => {
    setOrderType(type);
    setShowOrderTypeDropdown(false);
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const effectivePrice = orderType === 'market' ? currentAssetPrice : parseFloat(price) || currentAssetPrice;
    return qty * effectivePrice;
  };

  const calculateFees = () => {
    return calculateTotal() * 0.001;
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trade {assetSymbol}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{assetName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.assetPreview, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.assetPreviewLeft}>
            <Text style={[styles.assetSymbol, { color: colors.text }]}>{assetSymbol}</Text>
            <Text style={[styles.assetName, { color: colors.textSecondary }]}>{assetName}</Text>
          </View>
          <View style={styles.assetPreviewRight}>
            <Text style={[styles.assetPrice, { color: colors.text }]}>${currentAssetPrice.toFixed(2)}</Text>
            <View style={styles.assetChange}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={[styles.assetChangeText, { color: colors.success }]}>+1.34%</Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartPrice, { color: colors.text }]}>${currentAssetPrice.toFixed(2)}</Text>
              <View style={styles.chartChange}>
                <TrendingUp size={16} color={colors.success} />
                <Text style={[styles.chartChangeText, { color: colors.success }]}>+2.45 (+1.34%)</Text>
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

                const startY = chartHeight - normalizePrice(point.price) - 20;
                const endY = chartHeight - normalizePrice(nextPoint.price) - 20;
                const startX = (index / (mockChartData.length - 1)) * chartWidth;
                const endX = ((index + 1) / (mockChartData.length - 1)) * chartWidth;

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
                        left: startX + Spacing.sm,
                        top: startY,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              {mockChartData.map((point, index) => {
                const y = chartHeight - normalizePrice(point.price) - 20;
                const x = (index / (mockChartData.length - 1)) * chartWidth;

                return (
                  <View
                    key={`point-${index}`}
                    style={[
                      styles.chartPoint,
                      {
                        backgroundColor: colors.success,
                        left: x + Spacing.sm - 3,
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('trade.quantity')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <View style={styles.percentageButtons}>
              {percentageButtons.map(percent => (
                <TouchableOpacity
                  key={percent}
                  style={[styles.percentageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handlePercentageClick(percent)}>
                  <Text style={[styles.percentageButtonText, { color: colors.textSecondary }]}>{percent}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Take Profit</Text>
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Stop Loss</Text>
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Time-In-Force</Text>
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

          <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('trade.estimatedFees')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${calculateFees().toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>{t('trade.estimatedTotal')}</Text>
            <Text style={[styles.summaryValueBold, { color: colors.text }]}>${(calculateTotal() + calculateFees()).toFixed(2)}</Text>
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
                opacity: !quantity || parseFloat(quantity) <= 0 ? 0.5 : 1,
              },
            ]}
            disabled={!quantity || parseFloat(quantity) <= 0}
            onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderButtonText}>
              {side === 'buy' ? t('trade.buy') : t('trade.sell')} {assetSymbol}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.infoBg, marginHorizontal: Spacing.md }]}>
          <Text style={[styles.infoText, { color: colors.info }]}>
            Market orders execute immediately at the best available price. Limit orders will only execute at your specified price or better.
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
                {side === 'buy' ? t('trade.orderPurchaseSummary') : t('trade.orderSaleSummary')}
              </Text>
              <Text style={[styles.summaryModalSubtitle, { color: colors.textSecondary }]}>
                {t('trade.orderPlacedSuccessfully')}
              </Text>
            </View>

            <View style={styles.summaryModalContent}>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.asset')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{assetSymbol}</Text>
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
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.quantity')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>{quantity} {t('trade.shares')}</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.price')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  ${orderType === 'market' ? currentAssetPrice.toFixed(2) : parseFloat(price).toFixed(2)}
                </Text>
              </View>
              {takeProfit && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Take Profit</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.success }]}>${parseFloat(takeProfit).toFixed(2)}</Text>
                </View>
              )}
              {stopLoss && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Stop Loss</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.error }]}>${parseFloat(stopLoss).toFixed(2)}</Text>
                </View>
              )}
              {(takeProfit || stopLoss || timeInForce !== 'GTC') && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>Time-In-Force</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                    {timeInForceOptions.find(o => o.key === timeInForce)?.label}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryModalRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm }]}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.fees')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>${calculateFees().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabelBold, { color: colors.text }]}>{t('trade.total')}</Text>
                <Text style={[styles.summaryModalValueBold, { color: colors.text }]}>
                  ${(calculateTotal() + calculateFees()).toFixed(2)}
                </Text>
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
  summaryValueBold: {
    ...Typography.bodySemibold,
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
  summaryModalLabelBold: {
    ...Typography.bodySemibold,
  },
  summaryModalValueBold: {
    ...Typography.bodySemibold,
    fontSize: 18,
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
