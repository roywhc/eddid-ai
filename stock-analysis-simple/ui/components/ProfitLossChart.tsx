import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { OptionContract } from './OptionsChain';

const { width } = Dimensions.get('window');

interface SelectedOption {
  option: OptionContract;
  position: 'long' | 'short';
  quantity: number;
}

interface ProfitLossChartProps {
  underlyingPrice: number;
  selectedOptions: SelectedOption[];
  strategyName?: string;
}

export function ProfitLossChart({ underlyingPrice, selectedOptions, strategyName }: ProfitLossChartProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (selectedOptions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('tradeOptions.selectOptionsForChart')}
        </Text>
      </View>
    );
  }

  const chartWidth = width - Spacing.md * 4;
  const chartHeight = 200;
  const padding = 40;

  const strikes = selectedOptions.map(s => s.option.strike);
  const minStrike = Math.min(...strikes, underlyingPrice * 0.9);
  const maxStrike = Math.max(...strikes, underlyingPrice * 1.1);

  const pricePoints = [];
  const numPoints = 50;
  for (let i = 0; i <= numPoints; i++) {
    pricePoints.push(minStrike + (maxStrike - minStrike) * (i / numPoints));
  }

  const calculateProfitLoss = (price: number) => {
    let totalPL = 0;

    selectedOptions.forEach(({ option, position, quantity }) => {
      const multiplier = position === 'long' ? 1 : -1;
      let optionValue = 0;

      if (option.type === 'call') {
        optionValue = Math.max(0, price - option.strike);
      } else {
        optionValue = Math.max(0, option.strike - price);
      }

      const profitLoss = (optionValue - option.premium) * multiplier * quantity * 100;
      totalPL += profitLoss;
    });

    return totalPL;
  };

  const plValues = pricePoints.map(price => calculateProfitLoss(price));
  const maxPL = Math.max(...plValues);
  const minPL = Math.min(...plValues);
  const plRange = maxPL - minPL || 1;

  const normalizeX = (price: number) => {
    return ((price - minStrike) / (maxStrike - minStrike)) * (chartWidth - padding * 2) + padding;
  };

  const normalizeY = (pl: number) => {
    return chartHeight - padding - ((pl - minPL) / plRange) * (chartHeight - padding * 2);
  };

  const pathPoints = pricePoints.map((price, index) => {
    const x = normalizeX(price);
    const y = normalizeY(plValues[index]);
    return `${x},${y}`;
  }).join(' ');

  const zeroLineY = normalizeY(0);
  const currentPriceX = normalizeX(underlyingPrice);
  const currentPL = calculateProfitLoss(underlyingPrice);

  const breakEvenPoints: number[] = [];
  for (let i = 0; i < pricePoints.length - 1; i++) {
    if ((plValues[i] <= 0 && plValues[i + 1] >= 0) || (plValues[i] >= 0 && plValues[i + 1] <= 0)) {
      const ratio = Math.abs(plValues[i]) / (Math.abs(plValues[i]) + Math.abs(plValues[i + 1]));
      const breakEvenPrice = pricePoints[i] + (pricePoints[i + 1] - pricePoints[i]) * ratio;
      breakEvenPoints.push(breakEvenPrice);
    }
  }

  const maxProfit = maxPL > 0 ? maxPL : null;
  const maxLoss = minPL < 0 ? minPL : null;

  return (
    <View style={styles.container}>
      {strategyName && (
        <View style={[styles.strategyHeader, { backgroundColor: colors.primary }]}>
          <Text style={[styles.strategyName, { color: colors.secondary }]}>{strategyName}</Text>
        </View>
      )}

      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Svg width={chartWidth} height={chartHeight}>
          <Line
            x1={padding}
            y1={zeroLineY}
            x2={chartWidth - padding}
            y2={zeroLineY}
            stroke={colors.border}
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          <Line
            x1={currentPriceX}
            y1={padding}
            x2={currentPriceX}
            y2={chartHeight - padding}
            stroke={colors.info}
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {breakEvenPoints.map((price, index) => {
            const x = normalizeX(price);
            return (
              <Circle
                key={`be-${index}`}
                cx={x}
                cy={zeroLineY}
                r="6"
                fill={colors.warning}
                stroke={colors.card}
                strokeWidth="2"
              />
            );
          })}

          <Polyline
            points={pathPoints}
            fill="none"
            stroke={currentPL >= 0 ? colors.success : colors.error}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Circle
            cx={currentPriceX}
            cy={normalizeY(currentPL)}
            r="6"
            fill={currentPL >= 0 ? colors.success : colors.error}
            stroke={colors.card}
            strokeWidth="2"
          />

          <SvgText
            x={padding}
            y={padding - 10}
            fill={colors.textSecondary}
            fontSize="10"
            fontWeight="600">
            ${(maxPL / 1000).toFixed(1)}K
          </SvgText>

          <SvgText
            x={padding}
            y={chartHeight - padding + 20}
            fill={colors.textSecondary}
            fontSize="10"
            fontWeight="600">
            ${(minPL / 1000).toFixed(1)}K
          </SvgText>

          <SvgText
            x={currentPriceX - 15}
            y={chartHeight - padding + 20}
            fill={colors.info}
            fontSize="10"
            fontWeight="600">
            ${underlyingPrice.toFixed(0)}
          </SvgText>
        </Svg>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('tradeOptions.currentPL')}:</Text>
            <Text style={[styles.statValue, { color: currentPL >= 0 ? colors.success : colors.error }]}>
              ${currentPL.toFixed(2)}
            </Text>
          </View>

          {maxProfit !== null && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('tradeOptions.maxProfit')}:</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {maxProfit > 999999 ? t('tradeOptions.unlimited') : `$${maxProfit.toFixed(2)}`}
              </Text>
            </View>
          )}

          {maxLoss !== null && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('tradeOptions.maxLoss')}:</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {Math.abs(maxLoss) > 999999 ? t('tradeOptions.unlimited') : `$${maxLoss.toFixed(2)}`}
              </Text>
            </View>
          )}

          {breakEvenPoints.length > 0 && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('tradeOptions.breakEven')}:</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                ${breakEvenPoints.map(p => p.toFixed(2)).join(', $')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('tradeOptions.currentPrice')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('tradeOptions.breakEven')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('tradeOptions.zeroLine')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  strategyHeader: {
    padding: Spacing.sm,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    alignItems: 'center',
  },
  strategyName: {
    ...Typography.bodySemibold,
  },
  chartContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
  },
  statValue: {
    ...Typography.captionMedium,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 12,
    height: 2,
  },
  legendText: {
    ...Typography.small,
    fontSize: 10,
  },
});
