import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated, Dimensions } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, TrendingUp, Check, X, Info } from 'lucide-react-native';
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

export default function TradeFundScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { id, name } = useLocalSearchParams();

  const [amount, setAmount] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);

  const currentFundPrice = 67.10;
  const availableBalance = 48205.50;
  const fundSymbol = id;
  const fundName = (name as string) || 'Fund';

  const percentageButtons = ['25%', '50%', '75%', '100%'];

  const handlePercentageClick = (percent: string) => {
    const percentage = parseInt(percent) / 100;
    const subscriptionAmount = (availableBalance * percentage).toFixed(2);
    setAmount(subscriptionAmount);
  };

  const calculateUnits = () => {
    const amountValue = parseFloat(amount) || 0;
    return (amountValue / currentFundPrice).toFixed(4);
  };

  const calculateFees = () => {
    const amountValue = parseFloat(amount) || 0;
    return (amountValue * 0.005).toFixed(2);
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

  const handleSubscribe = () => {
    if (!amount || parseFloat(amount) <= 0) return;

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tradeFund.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{fundSymbol}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.fundPreview, { backgroundColor: colors.card, marginHorizontal: Spacing.md, borderColor: colors.border }]}>
          <View style={styles.fundPreviewLeft}>
            <Text style={[styles.fundSymbol, { color: colors.text }]}>{fundSymbol}</Text>
            <Text style={[styles.fundName, { color: colors.textSecondary }]}>{fundName}</Text>
          </View>
          <View style={styles.fundPreviewRight}>
            <Text style={[styles.fundPrice, { color: colors.text }]}>${currentFundPrice.toFixed(2)}</Text>
            <View style={styles.fundChange}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={[styles.fundChangeText, { color: colors.success }]}>+1.28%</Text>
            </View>
          </View>
        </View>

        <View style={[styles.noticeCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: Spacing.md }]}>
          <Info size={16} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            {t('tradeFund.navNotice')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tradeFund.subscriptionAmount')}</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('tradeFund.amountUsd')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.percentageButtons}>
            {percentageButtons.map((percent) => (
              <TouchableOpacity
                key={percent}
                style={[styles.percentageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handlePercentageClick(percent)}>
                <Text style={[styles.percentageButtonText, { color: colors.text }]}>{percent}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('tradeFund.availableBalance')}</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>${availableBalance.toLocaleString()}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tradeFund.subscriptionSummary')}</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.subscriptionAmount')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${amount || '0.00'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.estimatedUnits')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{calculateUnits()}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.navPerUnit')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${currentFundPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.initialCharge')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${calculateFees()}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('tradeFund.totalAmount')}</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${(parseFloat(amount || '0') + parseFloat(calculateFees())).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={{ height: Spacing.sm }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          onPress={handleSubscribe}>
          <Text style={[styles.subscribeButtonText, { color: colors.secondary }]}>{t('tradeFund.subscribeFund')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummaryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Check size={48} color={colors.success} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('tradeFund.subscriptionReceived')}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {t('tradeFund.subscriptionMessage')}
            </Text>

            <View style={[styles.orderSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.fund')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{fundSymbol}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.amount')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>${amount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.estimatedUnits')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{calculateUnits()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('tradeFund.status')}</Text>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>{t('tradeFund.pending')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowSummaryModal(false);
                router.back();
              }}>
              <Text style={[styles.modalButtonText, { color: colors.secondary }]}>{t('common.done')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSummaryModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {confetti.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} />
      ))}
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  fundPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  fundPreviewLeft: {
    flex: 1,
  },
  fundSymbol: {
    ...Typography.heading4,
    marginBottom: Spacing.xs,
  },
  fundName: {
    ...Typography.caption,
  },
  fundPreviewRight: {
    alignItems: 'flex-end',
  },
  fundPrice: {
    ...Typography.heading4,
    marginBottom: Spacing.xs,
  },
  fundChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fundChangeText: {
    ...Typography.caption,
  },
  noticeCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  noticeText: {
    ...Typography.caption,
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sectionTitle: {
    ...Typography.heading4,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    ...Typography.bodyMedium,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    paddingVertical: Spacing.md,
  },
  percentageButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  percentageButtonText: {
    ...Typography.bodyMedium,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    ...Typography.caption,
  },
  balanceValue: {
    ...Typography.bodyMedium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.bodyMedium,
  },
  totalRow: {
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    ...Typography.bodyMedium,
  },
  totalValue: {
    ...Typography.heading4,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  subscribeButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  orderSummary: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
