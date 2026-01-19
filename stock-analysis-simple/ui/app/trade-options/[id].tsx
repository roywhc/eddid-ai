import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated, Dimensions } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ChevronDown, Check, X, AlertCircle, ChevronUp } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ProfitLossChart } from '@/components/ProfitLossChart';
import { OptionContract } from '@/components/OptionsChain';

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

export default function TradeOptionsScreen() {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();
  const { id, options: optionsParam, strategy } = useLocalSearchParams();

  const [orderType, setOrderType] = useState('market');
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [underlyingPrice, setUnderlyingPrice] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeInForce, setTimeInForce] = useState('GTC');
  const [showTimeInForceDropdown, setShowTimeInForceDropdown] = useState(false);

  useEffect(() => {
    if (optionsParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(optionsParam as string));
        setSelectedOptions(decoded.options);
        setUnderlyingPrice(decoded.underlyingPrice);
      } catch (e) {
        console.error('Failed to parse options', e);
      }
    }
  }, [optionsParam]);

  const orderTypes = [
    { key: 'market', label: t('trade.market') },
    { key: 'limit', label: t('trade.limit') },
  ];

  const timeInForceOptions = [
    { key: 'GTC', label: 'Good Till Canceled (GTC)' },
    { key: 'DAY', label: 'Same Day' },
  ];

  const handleSelectOrderType = (type: string) => {
    setOrderType(type);
    setShowOrderTypeDropdown(false);
  };

  const calculateTotalCost = () => {
    let total = 0;
    selectedOptions.forEach(({ option, position, quantity }) => {
      const multiplier = position === 'long' ? 1 : -1;
      total += option.premium * multiplier * quantity * 100;
    });
    return total;
  };

  const calculateFees = () => {
    return selectedOptions.reduce((sum, s) => sum + s.quantity, 0) * 1.50;
  };

  const availableBalance = 3000000;
  const totalCost = calculateTotalCost();
  const fees = calculateFees();
  const netCost = totalCost + fees;
  const isCredit = netCost < 0;

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
    if (selectedOptions.length === 0) return;
    if (!isCredit && Math.abs(netCost) > availableBalance) return;

    triggerConfetti();
    setShowSummaryModal(true);
  };

  const handleUpdateQuantity = (optionId: string, newQuantity: number) => {
    setSelectedOptions(
      selectedOptions.map(s =>
        s.option.id === optionId ? { ...s, quantity: Math.max(1, newQuantity) } : s
      )
    );
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
        <Text style={[styles.title, { color: colors.text }]}>{t('tradeOptions.title')}</Text>
        {strategy && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('tradeOptions.strategy')}: {strategy}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.warningBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning, marginHorizontal: Spacing.md }]}>
          <AlertCircle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            {t('tradeOptions.warning')}
          </Text>
        </View>

        {selectedOptions.length > 0 && (
          <View style={{ marginHorizontal: Spacing.md }}>
            <ProfitLossChart
              underlyingPrice={underlyingPrice}
              selectedOptions={selectedOptions}
              strategyName={strategy as string}
            />
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tradeOptions.positionDetails')}</Text>

          {selectedOptions.map(({ option, position, quantity }, index) => (
            <View key={`${option.id}-${index}`} style={[styles.positionRow, { borderBottomColor: colors.border }]}>
              <View style={styles.positionLeft}>
                <View style={styles.positionHeader}>
                  <Text style={[styles.positionType, { color: option.type === 'call' ? colors.success : colors.error }]}>
                    {option.type.toUpperCase()}
                  </Text>
                  <View style={[styles.positionBadge, {
                    backgroundColor: position === 'long' ? colors.successBg : colors.errorBg
                  }]}>
                    <Text style={[styles.positionBadgeText, {
                      color: position === 'long' ? colors.success : colors.error
                    }]}>
                      {position.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.strikeText, { color: colors.text }]}>
                  {t('tradeOptions.strike')}: ${option.strike.toFixed(2)}
                </Text>
                <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
                  {t('tradeOptions.premium')}: ${option.premium.toFixed(2)}
                </Text>
              </View>
              <View style={styles.positionRight}>
                <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>{t('tradeFutures.contracts')}</Text>
                <TextInput
                  style={[styles.quantityInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={quantity.toString()}
                  onChangeText={(text) => handleUpdateQuantity(option.id, parseInt(text) || 1)}
                  keyboardType="numeric"
                />
                <Text style={[styles.costText, { color: position === 'long' ? colors.error : colors.success }]}>
                  {position === 'long' ? '-' : '+'}${(option.premium * quantity * 100).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tradeOptions.orderSettings')}</Text>

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

          <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeOptions.totalPremium')}</Text>
            <Text style={[styles.summaryValue, { color: isCredit ? colors.success : colors.error }]}>
              {isCredit ? '+' : '-'}${Math.abs(totalCost).toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('trade.estimatedFees')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${fees.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{isCredit ? t('tradeOptions.netCredit') : t('tradeOptions.netDebit')}</Text>
            <Text style={[styles.totalValue, { color: isCredit ? colors.success : colors.error }]}>
              {isCredit ? '+' : '-'}${Math.abs(netCost).toFixed(2)}
            </Text>
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
                backgroundColor: (!isCredit && Math.abs(netCost) > availableBalance) || selectedOptions.length === 0
                  ? colors.border
                  : colors.primary,
                opacity: (!isCredit && Math.abs(netCost) > availableBalance) || selectedOptions.length === 0 ? 0.5 : 1,
              },
            ]}
            disabled={(!isCredit && Math.abs(netCost) > availableBalance) || selectedOptions.length === 0}
            onPress={handlePlaceOrder}>
            <Text style={[styles.placeOrderButtonText, { color: colors.secondary }]}>
              {t('tradeOptions.placeOrder')}
            </Text>
          </TouchableOpacity>

          {!isCredit && Math.abs(netCost) > availableBalance && (
            <View style={styles.errorMessage}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('tradeOptions.insufficientFunds')} ${Math.abs(netCost).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.infoBg, marginHorizontal: Spacing.md }]}>
          <Text style={[styles.infoText, { color: colors.info }]}>
            {t('tradeOptions.infoMessage')}
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
              <View style={[styles.successBadge, { backgroundColor: colors.successBg }]}>
                <Check size={32} color={colors.success} />
              </View>
              <Text style={[styles.summaryModalTitle, { color: colors.text }]}>
                {t('tradeOptions.optionsOrderPlaced')}
              </Text>
              <Text style={[styles.summaryModalSubtitle, { color: colors.textSecondary }]}>
                {t('trade.orderPlacedSuccessfully')}
              </Text>
            </View>

            <View style={styles.summaryModalContent}>
              {strategy && (
                <View style={styles.summaryModalRow}>
                  <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeOptions.strategy')}</Text>
                  <Text style={[styles.summaryModalValue, { color: colors.text }]}>{strategy}</Text>
                </View>
              )}
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('tradeFutures.contracts')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  {selectedOptions.reduce((sum, s) => sum + s.quantity, 0)}
                </Text>
              </View>
              <View style={styles.summaryModalRow}>
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{t('trade.orderType')}</Text>
                <Text style={[styles.summaryModalValue, { color: colors.text }]}>
                  {orderTypes.find(o => o.key === orderType)?.label}
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
                <Text style={[styles.summaryModalLabel, { color: colors.textSecondary }]}>{isCredit ? t('tradeOptions.netCredit') : t('tradeOptions.netDebit')}</Text>
                <Text style={[styles.summaryModalValue, { color: isCredit ? colors.success : colors.error }]}>
                  {isCredit ? '+' : '-'}${Math.abs(netCost).toFixed(2)}
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
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.md,
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
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading4,
    marginBottom: Spacing.md,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  positionLeft: {
    flex: 1,
    gap: 4,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  positionType: {
    ...Typography.captionMedium,
    fontSize: 11,
  },
  positionBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  positionBadgeText: {
    ...Typography.small,
    fontSize: 9,
    fontWeight: '600',
  },
  strikeText: {
    ...Typography.body,
  },
  premiumText: {
    ...Typography.caption,
  },
  positionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  quantityLabel: {
    ...Typography.caption,
  },
  quantityInput: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    ...Typography.body,
    minWidth: 60,
    textAlign: 'center',
  },
  costText: {
    ...Typography.captionMedium,
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
  totalRow: {
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    ...Typography.bodySemibold,
  },
  totalValue: {
    ...Typography.bodySemibold,
    fontSize: 18,
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
