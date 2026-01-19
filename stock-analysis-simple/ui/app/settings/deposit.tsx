import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, CreditCard, Building2, Smartphone, Bitcoin, Copy, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function DepositScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const depositMethods = [
    { id: 'bank', name: t('deposit.bankTransfer'), icon: Building2, fee: t('deposit.free'), time: t('deposit.businessDays') },
    { id: 'fps', name: 'FPS', icon: Smartphone, fee: t('deposit.free'), time: t('deposit.instant') },
    { id: 'card', name: t('deposit.creditDebitCard'), icon: CreditCard, fee: '2.9%', time: t('deposit.instant') },
    { id: 'crypto', name: t('deposit.crypto'), icon: Bitcoin, fee: t('deposit.networkFees'), time: t('deposit.minutes') },
  ];

  const mockInstructions = {
    bank: {
      bankName: 'HSBC Hong Kong',
      accountName: 'Eddid Financial Limited',
      accountNumber: '123-456789-001',
      swiftCode: 'HSBCHKHH',
      reference: 'ED' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    },
    fps: {
      phoneNumber: '+852 1234 5678',
      fpsId: 'eddidfinancial',
      reference: 'ED' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    },
  };

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('deposit.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deposit.selectPaymentMethod')}</Text>

          {depositMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedMethod === method.id ? colors.primary : colors.border,
                  borderWidth: selectedMethod === method.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedMethod(method.id)}>
              <View style={[styles.methodIcon, { backgroundColor: colors.surface }]}>
                <method.icon size={24} color={colors.primary} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                <View style={styles.methodMeta}>
                  <Text style={[styles.methodFee, { color: colors.textSecondary }]}>{t('deposit.fee')}: {method.fee}</Text>
                  <Text style={[styles.methodTime, { color: colors.textTertiary }]}>{method.time}</Text>
                </View>
              </View>
              {selectedMethod === method.id && (
                <CheckCircle2 size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedMethod && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deposit.amount')}</Text>
            <Input
              label={t('deposit.depositAmount')}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <View style={styles.quickAmounts}>
              {['1000', '5000', '10000', '50000'].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.quickAmount, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setAmount(value)}>
                  <Text style={[styles.quickAmountText, { color: colors.text }]}>${value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedMethod === 'bank' && amount && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deposit.bankTransferInstructions')}</Text>
            <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.bankName')}</Text>
                <Text style={[styles.instructionValue, { color: colors.text }]}>
                  {mockInstructions.bank.bankName}
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.accountName')}</Text>
                <Text style={[styles.instructionValue, { color: colors.text }]}>
                  {mockInstructions.bank.accountName}
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.accountNumber')}</Text>
                <View style={styles.instructionValueRow}>
                  <Text style={[styles.instructionValue, { color: colors.text }]}>
                    {mockInstructions.bank.accountNumber}
                  </Text>
                  <TouchableOpacity>
                    <Copy size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.swiftCode')}</Text>
                <Text style={[styles.instructionValue, { color: colors.text }]}>
                  {mockInstructions.bank.swiftCode}
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.reference')}</Text>
                <View style={styles.instructionValueRow}>
                  <Text style={[styles.instructionValue, { color: colors.primary }]}>
                    {mockInstructions.bank.reference}
                  </Text>
                  <TouchableOpacity>
                    <Copy size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.warningCard, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.warningText, { color: colors.warning }]}>
                {t('deposit.depositWarning')}
              </Text>
            </View>
          </View>
        )}

        {selectedMethod === 'fps' && amount && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deposit.fpsTransferInstructions')}</Text>
            <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.fpsId')}</Text>
                <View style={styles.instructionValueRow}>
                  <Text style={[styles.instructionValue, { color: colors.text }]}>
                    {mockInstructions.fps.fpsId}
                  </Text>
                  <TouchableOpacity>
                    <Copy size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.phoneNumber')}</Text>
                <Text style={[styles.instructionValue, { color: colors.text }]}>
                  {mockInstructions.fps.phoneNumber}
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Text style={[styles.instructionLabel, { color: colors.textSecondary }]}>{t('deposit.reference')}</Text>
                <View style={styles.instructionValueRow}>
                  <Text style={[styles.instructionValue, { color: colors.primary }]}>
                    {mockInstructions.fps.reference}
                  </Text>
                  <TouchableOpacity>
                    <Copy size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedMethod && amount && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={`${t('deposit.confirmDeposit')} $${amount}`}
            onPress={() => {}}
            fullWidth
          />
        </View>
      )}
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
  headerTitle: {
    ...Typography.heading4,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    ...Typography.bodyMedium,
    marginBottom: 4,
  },
  methodMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  methodFee: {
    ...Typography.caption,
  },
  methodTime: {
    ...Typography.small,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickAmount: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickAmountText: {
    ...Typography.captionMedium,
  },
  instructionsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  instructionRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  instructionLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  instructionValue: {
    ...Typography.bodyMedium,
  },
  instructionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  warningText: {
    ...Typography.caption,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
});
