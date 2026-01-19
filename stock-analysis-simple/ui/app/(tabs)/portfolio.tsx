import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';

export default function PortfolioScreen() {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();
  const [selectedView, setSelectedView] = useState<'positions' | 'orders'>('positions');

  const mockPositions = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: '50',
      avgCost: '180.25',
      currentPrice: '185.50',
      marketValue: '9,275.00',
      unrealizedPnl: '+262.50',
      unrealizedPnlPercent: '+2.91',
      isUp: true,
    },
    {
      symbol: '0700.HK',
      name: 'Tencent Holdings',
      quantity: '100',
      avgCost: '335.80',
      currentPrice: '328.60',
      marketValue: '32,860.00',
      unrealizedPnl: '-720.00',
      unrealizedPnlPercent: '-2.14',
      isUp: false,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      quantity: '25',
      avgCost: '235.50',
      currentPrice: '242.80',
      marketValue: '6,070.00',
      unrealizedPnl: '+182.50',
      unrealizedPnlPercent: '+3.10',
      isUp: true,
    },
  ];

  const mockOrders = [
    {
      symbol: 'MSFT',
      side: 'Buy',
      type: 'Limit',
      quantity: '10',
      price: '375.00',
      status: 'Open',
      time: '10:30 AM',
    },
    {
      symbol: 'GOOGL',
      side: 'Sell',
      type: 'Market',
      quantity: '5',
      price: '142.50',
      status: 'Filled',
      time: '09:15 AM',
    },
  ];

  return (
    <SafeContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerGradient, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <EddidLogo width={120} height={30} color={colorScheme === 'dark' ? '#FFFFFF' : '#0D1647'} />
              <TouchableOpacity>
                <RefreshCw size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.glowEffect} />

            <View style={styles.accountValue}>
              <Text style={[styles.accountLabel, { color: colors.text }]}>{t('portfolio.netAccountValue')}</Text>
              <Text style={[styles.accountAmount, { color: colors.text }]}>$133,626.89</Text>
              <View style={styles.accountChange}>
                <TrendingUp size={16} color={colors.success} />
                <Text style={[styles.accountChangeText, { color: colors.success }]}>+$8,784.13 (8.78%)</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>{t('portfolio.buyingPower')}</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>$48,205.50</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>{t('portfolio.cashBalance')}</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>$25,421.89</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                {
                  backgroundColor: selectedView === 'positions' ? colors.primary : colors.surface,
                  borderRadius: BorderRadius.md,
                },
              ]}
              onPress={() => setSelectedView('positions')}>
              <Text
                style={[
                  styles.tabButtonText,
                  { color: selectedView === 'positions' ? colors.secondary : colors.textSecondary },
                ]}>
                {t('portfolio.positions')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                {
                  backgroundColor: selectedView === 'orders' ? colors.primary : colors.surface,
                  borderRadius: BorderRadius.md,
                },
              ]}
              onPress={() => setSelectedView('orders')}>
              <Text
                style={[
                  styles.tabButtonText,
                  { color: selectedView === 'orders' ? colors.secondary : colors.textSecondary },
                ]}>
                {t('portfolio.orders')}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedView === 'positions' ? (
            <View style={styles.section}>
              {mockPositions.map((position, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.positionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push('/(tabs)/trade')}>
                  <View style={styles.positionHeader}>
                    <View>
                      <Text style={[styles.positionSymbol, { color: colors.text }]}>{position.symbol}</Text>
                      <Text style={[styles.positionName, { color: colors.textSecondary }]}>{position.name}</Text>
                    </View>
                    <View style={styles.positionHeaderRight}>
                      <Text style={[styles.positionPrice, { color: colors.text }]}>${position.currentPrice}</Text>
                      <View style={styles.positionChange}>
                        {position.isUp ? (
                          <TrendingUp size={12} color={colors.success} />
                        ) : (
                          <TrendingDown size={12} color={colors.error} />
                        )}
                        <Text style={[
                          styles.positionChangeText,
                          { color: position.isUp ? colors.success : colors.error }
                        ]}>
                          {position.unrealizedPnlPercent}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.positionDetails}>
                    <View style={styles.positionDetailRow}>
                      <Text style={[styles.positionDetailLabel, { color: colors.textSecondary }]}>{t('portfolio.quantity')}</Text>
                      <Text style={[styles.positionDetailValue, { color: colors.text }]}>{position.quantity}</Text>
                    </View>
                    <View style={styles.positionDetailRow}>
                      <Text style={[styles.positionDetailLabel, { color: colors.textSecondary }]}>{t('portfolio.avgCost')}</Text>
                      <Text style={[styles.positionDetailValue, { color: colors.text }]}>${position.avgCost}</Text>
                    </View>
                    <View style={styles.positionDetailRow}>
                      <Text style={[styles.positionDetailLabel, { color: colors.textSecondary }]}>{t('portfolio.marketValue')}</Text>
                      <Text style={[styles.positionDetailValue, { color: colors.text }]}>${position.marketValue}</Text>
                    </View>
                    <View style={styles.positionDetailRow}>
                      <Text style={[styles.positionDetailLabel, { color: colors.textSecondary }]}>{t('portfolio.unrealizedPnl')}</Text>
                      <Text style={[
                        styles.positionDetailValue,
                        { color: position.isUp ? colors.success : colors.error }
                      ]}>
                        ${position.unrealizedPnl}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.section}>
              {mockOrders.map((order, index) => (
                <View
                  key={index}
                  style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderSymbol, { color: colors.text }]}>{order.symbol}</Text>
                    <View style={[
                      styles.orderStatus,
                      { backgroundColor: order.status === 'Filled' ? colors.successBg : colors.infoBg }
                    ]}>
                      <Text style={[
                        styles.orderStatusText,
                        { color: order.status === 'Filled' ? colors.success : colors.info }
                      ]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Side</Text>
                      <Text style={[
                        styles.orderDetailValue,
                        { color: order.side === 'Buy' ? colors.success : colors.error }
                      ]}>
                        {order.side}
                      </Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Type</Text>
                      <Text style={[styles.orderDetailValue, { color: colors.text }]}>{order.type}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Quantity</Text>
                      <Text style={[styles.orderDetailValue, { color: colors.text }]}>{order.quantity}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Price</Text>
                      <Text style={[styles.orderDetailValue, { color: colors.text }]}>${order.price}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Time</Text>
                      <Text style={[styles.orderDetailValue, { color: colors.text }]}>{order.time}</Text>
                    </View>
                  </View>

                  {order.status === 'Open' && (
                    <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.errorBg }]}>
                      <Text style={[styles.cancelButtonText, { color: colors.error }]}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    zIndex: 2,
  },
  glowEffect: {
    position: 'absolute',
    right: -50,
    top: -20,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F8D000',
    opacity: 0.12,
    zIndex: 1,
  },
  accountValue: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  accountLabel: {
    ...Typography.caption,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  accountAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  accountChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountChangeText: {
    ...Typography.body,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  metricLabel: {
    ...Typography.small,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.bodySemibold,
  },
  content: {
    flex: 1,
    marginTop: -Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tabButtonText: {
    ...Typography.bodyMedium,
  },
  section: {
    paddingHorizontal: Spacing.md,
  },
  positionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  positionSymbol: {
    ...Typography.heading4,
    marginBottom: 2,
  },
  positionName: {
    ...Typography.caption,
  },
  positionHeaderRight: {
    alignItems: 'flex-end',
  },
  positionPrice: {
    ...Typography.bodySemibold,
    marginBottom: 2,
  },
  positionChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  positionChangeText: {
    ...Typography.small,
  },
  positionDetails: {
    gap: Spacing.sm,
  },
  positionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionDetailLabel: {
    ...Typography.caption,
  },
  positionDetailValue: {
    ...Typography.captionMedium,
  },
  orderCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  orderSymbol: {
    ...Typography.heading4,
  },
  orderStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  orderStatusText: {
    ...Typography.smallMedium,
  },
  orderDetails: {
    gap: Spacing.sm,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetailLabel: {
    ...Typography.caption,
  },
  orderDetailValue: {
    ...Typography.captionMedium,
  },
  cancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyMedium,
  },
});
