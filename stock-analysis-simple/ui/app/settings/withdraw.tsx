import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Building2, Plus, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function WithdrawScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const linkedAccounts = [
    { id: '1', bankName: 'HSBC', accountNumber: '***6789', verified: true },
    { id: '2', bankName: 'Hang Seng Bank', accountNumber: '***1234', verified: true },
  ];

  const availableBalance = 48205.50;
  const fee = 0;

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('withdraw.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('withdraw.availableToWithdraw')}</Text>
          <Text style={[styles.balanceAmount, { color: colors.text }]}>${availableBalance.toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('withdraw.withdrawalAccount')}</Text>
            <TouchableOpacity>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {linkedAccounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedAccount === account.id ? colors.primary : colors.border,
                  borderWidth: selectedAccount === account.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedAccount(account.id)}>
              <View style={[styles.accountIcon, { backgroundColor: colors.surface }]}>
                <Building2 size={24} color={colors.primary} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountBank, { color: colors.text }]}>{account.bankName}</Text>
                <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                  {account.accountNumber}
                </Text>
              </View>
              {account.verified && (
                <CheckCircle2 size={20} color={colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedAccount && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('withdraw.amount')}</Text>
            <Input
              label={t('withdraw.withdrawalAmount')}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <View style={styles.quickAmounts}>
              {['25%', '50%', '75%', '100%'].map((percent) => {
                const value = Math.floor(availableBalance * (parseInt(percent) / 100));
                return (
                  <TouchableOpacity
                    key={percent}
                    style={[styles.quickAmount, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setAmount(value.toString())}>
                    <Text style={[styles.quickAmountText, { color: colors.text }]}>{percent}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('withdraw.withdrawAmount')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${amount || '0.00'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('deposit.fee')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>${fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>{t('withdraw.youWillReceive')}</Text>
                <Text style={[styles.summaryTotalValue, { color: colors.text }]}>
                  ${(parseFloat(amount || '0') - fee).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.infoBg }]}>
              <Text style={[styles.infoText, { color: colors.info }]}>
                {t('withdraw.withdrawInfo')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedAccount && amount && parseFloat(amount) > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={`${t('withdraw.title')} $${amount}`}
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
  balanceCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading3,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountBank: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  accountNumber: {
    ...Typography.caption,
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
  summary: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: BorderRadius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
  },
  summaryTotal: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  summaryTotalLabel: {
    ...Typography.bodySemibold,
  },
  summaryTotalValue: {
    ...Typography.bodySemibold,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  infoText: {
    ...Typography.caption,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
});
