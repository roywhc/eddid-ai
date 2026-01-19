import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Check } from 'lucide-react-native';

export interface OptionContract {
  id: string;
  strike: number;
  type: 'call' | 'put';
  premium: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface OptionsChainProps {
  underlyingPrice: number;
  expirationDate: string;
  options: OptionContract[];
  selectedOptions: string[];
  onSelectOption: (optionId: string) => void;
}

export function OptionsChain({
  underlyingPrice,
  expirationDate,
  options,
  selectedOptions,
  onSelectOption,
}: OptionsChainProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const strikes = [...new Set(options.map(o => o.strike))].sort((a, b) => a - b);

  const getOption = (strike: number, type: 'call' | 'put') => {
    return options.find(o => o.strike === strike && o.type === type);
  };

  const isSelected = (optionId: string) => selectedOptions.includes(optionId);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>
          {t('tradeOptions.underlying')}: ${underlyingPrice.toFixed(2)} • {t('tradeOptions.expiration')}: {expirationDate}
        </Text>
      </View>

      <View style={[styles.chainHeader, { backgroundColor: colors.surface }]}>
        <View style={styles.callHeader}>
          <Text style={[styles.columnTitle, { color: colors.success }]}>{t('tradeOptions.calls')}</Text>
        </View>
        <View style={styles.strikeHeader}>
          <Text style={[styles.columnTitle, { color: colors.text }]}>{t('tradeOptions.strikeHeader')}</Text>
        </View>
        <View style={styles.putHeader}>
          <Text style={[styles.columnTitle, { color: colors.error }]}>{t('tradeOptions.puts')}</Text>
        </View>
      </View>

      <ScrollView style={styles.chainBody} showsVerticalScrollIndicator={false}>
        {strikes.map(strike => {
          const callOption = getOption(strike, 'call');
          const putOption = getOption(strike, 'put');
          const isAtTheMoney = Math.abs(strike - underlyingPrice) < underlyingPrice * 0.02;

          return (
            <View
              key={strike}
              style={[
                styles.chainRow,
                { backgroundColor: isAtTheMoney ? colors.infoBg : colors.card, borderColor: colors.border },
              ]}>
              <TouchableOpacity
                style={[
                  styles.optionCell,
                  styles.callCell,
                  isSelected(callOption?.id || '') && { backgroundColor: colors.successBg },
                ]}
                onPress={() => callOption && onSelectOption(callOption.id)}
                disabled={!callOption}>
                {callOption && (
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      {isSelected(callOption.id) && (
                        <Check size={16} color={colors.success} />
                      )}
                      <Text style={[styles.premiumText, { color: colors.text }]}>
                        ${callOption.premium.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.optionRight}>
                      <Text style={[styles.volumeText, { color: colors.textTertiary }]}>
                        {t('tradeOptions.volume')}: {callOption.volume}
                      </Text>
                      <Text style={[styles.ivText, { color: colors.textTertiary }]}>
                        {t('tradeOptions.iv')}: {(callOption.impliedVolatility * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <View style={[styles.strikeCell, isAtTheMoney && { backgroundColor: colors.info }]}>
                <Text style={[styles.strikeText, { color: isAtTheMoney ? '#FFFFFF' : colors.text }]}>
                  ${strike.toFixed(2)}
                </Text>
                {isAtTheMoney && (
                  <Text style={[styles.atmBadge, { color: '#FFFFFF' }]}>{t('tradeOptions.atm')}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.optionCell,
                  styles.putCell,
                  isSelected(putOption?.id || '') && { backgroundColor: colors.errorBg },
                ]}
                onPress={() => putOption && onSelectOption(putOption.id)}
                disabled={!putOption}>
                {putOption && (
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      {isSelected(putOption.id) && (
                        <Check size={16} color={colors.error} />
                      )}
                      <Text style={[styles.premiumText, { color: colors.text }]}>
                        ${putOption.premium.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.optionRight}>
                      <Text style={[styles.volumeText, { color: colors.textTertiary }]}>
                        {t('tradeOptions.volume')}: {putOption.volume}
                      </Text>
                      <Text style={[styles.ivText, { color: colors.textTertiary }]}>
                        {t('tradeOptions.iv')}: {(putOption.impliedVolatility * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  headerText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  chainHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  callHeader: {
    flex: 1,
    alignItems: 'center',
  },
  strikeHeader: {
    width: 100,
    alignItems: 'center',
  },
  putHeader: {
    flex: 1,
    alignItems: 'center',
  },
  columnTitle: {
    ...Typography.captionMedium,
  },
  chainBody: {
    flex: 1,
  },
  chainRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionCell: {
    flex: 1,
    padding: Spacing.sm,
  },
  callCell: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  putCell: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  optionContent: {
    gap: 4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    ...Typography.bodySemibold,
  },
  optionRight: {
    gap: 2,
  },
  volumeText: {
    ...Typography.small,
    fontSize: 10,
  },
  ivText: {
    ...Typography.small,
    fontSize: 10,
  },
  strikeCell: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  strikeText: {
    ...Typography.bodySemibold,
  },
  atmBadge: {
    ...Typography.small,
    fontSize: 9,
    marginTop: 2,
  },
});
