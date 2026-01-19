import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, TrendingUp, TrendingDown, Download, Filter } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = ['all', 'deposits', 'withdrawals', 'trades', 'fees'];

  const allTransactions = [
    { id: '1', type: 'deposit', amount: 10000, currency: 'USD', description: 'Bank Transfer', date: '2026-01-07', time: '10:30 AM', status: 'completed' },
    { id: '2', type: 'trade_buy', amount: -9275, currency: 'USD', description: 'Buy AAPL x50', date: '2026-01-07', time: '09:15 AM', status: 'completed' },
    { id: '3', type: 'fee', amount: -2.50, currency: 'USD', description: 'Trading Fee', date: '2026-01-07', time: '09:15 AM', status: 'completed' },
    { id: '4', type: 'trade_sell', amount: 5428, currency: 'USD', description: 'Sell TSLA x20', date: '2026-01-06', time: '03:45 PM', status: 'completed' },
    { id: '5', type: 'withdrawal', amount: -5000, currency: 'USD', description: 'Bank Transfer', date: '2026-01-05', time: '11:00 AM', status: 'completed' },
    { id: '6', type: 'deposit', amount: 25000, currency: 'USD', description: 'FPS Transfer', date: '2026-01-04', time: '02:20 PM', status: 'completed' },
    { id: '7', type: 'dividend', amount: 125.50, currency: 'USD', description: 'AAPL Dividend', date: '2026-01-03', time: '09:00 AM', status: 'completed' },
  ];

  const getFilteredTransactions = () => {
    if (selectedFilter === 'all') {
      return allTransactions;
    }

    return allTransactions.filter((transaction) => {
      switch (selectedFilter) {
        case 'deposits':
          return transaction.type === 'deposit';
        case 'withdrawals':
          return transaction.type === 'withdrawal';
        case 'trades':
          return transaction.type === 'trade_buy' || transaction.type === 'trade_sell';
        case 'fees':
          return transaction.type === 'fee';
        default:
          return true;
      }
    });
  };

  const mockTransactions = getFilteredTransactions();

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: t('transactions.deposit'),
      withdrawal: t('transactions.withdrawal'),
      trade_buy: t('transactions.buy'),
      trade_sell: t('transactions.sell'),
      fee: t('transactions.fee'),
      dividend: t('transactions.dividend'),
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string, amount: number) => {
    if (amount > 0) return colors.success;
    if (amount < 0) return colors.error;
    return colors.text;
  };

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('transactions.title')}</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Download size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setSelectedFilter(filter)}>
              <Text style={[
                styles.filterText,
                { color: selectedFilter === filter ? colors.secondary : colors.textSecondary }
              ]}>
                {t(`transactions.${filter}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Filter size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('transactions.noTransactionsFound')}</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {t('transactions.noTransactionsDesc')}
            </Text>
          </View>
        ) : (
          mockTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.amount > 0 ? colors.successBg : colors.surface }
                ]}>
                  {transaction.amount > 0 ? (
                    <TrendingUp size={20} color={colors.success} />
                  ) : (
                    <TrendingDown size={20} color={colors.error} />
                  )}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.text }]}>
                    {transaction.description}
                  </Text>
                  <View style={styles.transactionMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
                        {getTypeLabel(transaction.type)}
                      </Text>
                    </View>
                    <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
                      {transaction.date} {transaction.time}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  { color: getTypeColor(transaction.type, transaction.amount) }
                ]}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.successBg }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    {t(`transactions.${transaction.status}`)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerAction: {
    padding: Spacing.xs,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
  },
  filters: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterText: {
    ...Typography.captionMedium,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading3,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    ...Typography.body,
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...Typography.bodyMedium,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    ...Typography.tiny,
    textTransform: 'uppercase',
  },
  transactionDate: {
    ...Typography.small,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...Typography.bodySemibold,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.tiny,
    textTransform: 'capitalize',
  },
});
