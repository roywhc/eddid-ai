import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Zap, TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react-native';
import { OptionContract } from './OptionsChain';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: 'bullish' | 'bearish' | 'neutral' | 'volatile' | 'protection';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  legs: {
    type: 'call' | 'put';
    position: 'long' | 'short';
    strikeOffset: number;
  }[];
}

const PRESET_STRATEGIES: Strategy[] = [
  {
    id: 'bull_call_spread',
    name: 'Bull Call Spread',
    description: 'Buy lower strike call, sell higher strike call. Limited risk and profit.',
    icon: 'bullish',
    difficulty: 'beginner',
    legs: [
      { type: 'call', position: 'long', strikeOffset: -1 },
      { type: 'call', position: 'short', strikeOffset: 1 },
    ],
  },
  {
    id: 'bear_put_spread',
    name: 'Bear Put Spread',
    description: 'Buy higher strike put, sell lower strike put. Limited risk and profit.',
    icon: 'bearish',
    difficulty: 'beginner',
    legs: [
      { type: 'put', position: 'long', strikeOffset: 1 },
      { type: 'put', position: 'short', strikeOffset: -1 },
    ],
  },
  {
    id: 'long_straddle',
    name: 'Long Straddle',
    description: 'Buy call and put at same strike. Profit from large moves in either direction.',
    icon: 'volatile',
    difficulty: 'intermediate',
    legs: [
      { type: 'call', position: 'long', strikeOffset: 0 },
      { type: 'put', position: 'long', strikeOffset: 0 },
    ],
  },
  {
    id: 'short_strangle',
    name: 'Short Strangle',
    description: 'Sell OTM call and put. Profit from low volatility.',
    icon: 'neutral',
    difficulty: 'advanced',
    legs: [
      { type: 'call', position: 'short', strikeOffset: 2 },
      { type: 'put', position: 'short', strikeOffset: -2 },
    ],
  },
  {
    id: 'iron_condor',
    name: 'Iron Condor',
    description: 'Sell OTM call/put spread. Profit from range-bound price action.',
    icon: 'neutral',
    difficulty: 'advanced',
    legs: [
      { type: 'put', position: 'long', strikeOffset: -3 },
      { type: 'put', position: 'short', strikeOffset: -1 },
      { type: 'call', position: 'short', strikeOffset: 1 },
      { type: 'call', position: 'long', strikeOffset: 3 },
    ],
  },
  {
    id: 'butterfly_spread',
    name: 'Butterfly Spread',
    description: 'Buy 1 ITM call, sell 2 ATM calls, buy 1 OTM call. Low-risk, low-reward.',
    icon: 'neutral',
    difficulty: 'intermediate',
    legs: [
      { type: 'call', position: 'long', strikeOffset: -2 },
      { type: 'call', position: 'short', strikeOffset: 0 },
      { type: 'call', position: 'short', strikeOffset: 0 },
      { type: 'call', position: 'long', strikeOffset: 2 },
    ],
  },
  {
    id: 'protective_put',
    name: 'Protective Put',
    description: 'Buy put to protect long position. Insurance against downside.',
    icon: 'protection',
    difficulty: 'beginner',
    legs: [
      { type: 'put', position: 'long', strikeOffset: -1 },
    ],
  },
  {
    id: 'covered_call',
    name: 'Covered Call',
    description: 'Sell call against long position. Generate income from flat/slightly bullish outlook.',
    icon: 'bullish',
    difficulty: 'beginner',
    legs: [
      { type: 'call', position: 'short', strikeOffset: 1 },
    ],
  },
];

interface StrategyBuilderProps {
  options: OptionContract[];
  underlyingPrice: number;
  onBuildStrategy: (strategy: Strategy) => void;
}

const STRATEGY_TRANSLATION_KEYS: Record<string, { name: string; desc: string }> = {
  bull_call_spread: { name: 'bullCallSpread', desc: 'bullCallSpreadDesc' },
  bear_put_spread: { name: 'bearPutSpread', desc: 'bearPutSpreadDesc' },
  long_straddle: { name: 'longStraddle', desc: 'longStraddleDesc' },
  short_strangle: { name: 'shortStrangle', desc: 'shortStrangleDesc' },
  iron_condor: { name: 'ironCondor', desc: 'ironCondorDesc' },
  butterfly_spread: { name: 'butterflySpread', desc: 'butterflySpreadDesc' },
  protective_put: { name: 'protectivePut', desc: 'protectivePutDesc' },
  covered_call: { name: 'coveredCall', desc: 'coveredCallDesc' },
};

const DIFFICULTY_TRANSLATION_KEYS: Record<string, string> = {
  beginner: 'difficultyBeginner',
  intermediate: 'difficultyIntermediate',
  advanced: 'difficultyAdvanced',
};

export function StrategyBuilder({ options, underlyingPrice, onBuildStrategy }: StrategyBuilderProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const getStrategyIcon = (icon: Strategy['icon']) => {
    const iconProps = { size: 24, color: colors.text };
    switch (icon) {
      case 'bullish':
        return <TrendingUp {...iconProps} color={colors.success} />;
      case 'bearish':
        return <TrendingDown {...iconProps} color={colors.error} />;
      case 'neutral':
        return <Activity {...iconProps} color={colors.info} />;
      case 'volatile':
        return <Zap {...iconProps} color={colors.warning} />;
      case 'protection':
        return <Shield {...iconProps} color={colors.primary} />;
    }
  };

  const getDifficultyColor = (difficulty: Strategy['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.error;
    }
  };

  const getStrategyName = (strategyId: string) => {
    const keys = STRATEGY_TRANSLATION_KEYS[strategyId];
    if (keys) {
      return t(`tradeOptions.${keys.name}`);
    }
    return strategyId;
  };

  const getStrategyDescription = (strategyId: string) => {
    const keys = STRATEGY_TRANSLATION_KEYS[strategyId];
    if (keys) {
      return t(`tradeOptions.${keys.desc}`);
    }
    return '';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const key = DIFFICULTY_TRANSLATION_KEYS[difficulty];
    if (key) {
      return t(`tradeOptions.${key}`);
    }
    return difficulty;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tradeOptions.autoBuildStrategies')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('tradeOptions.autoBuildSubtitle')}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strategiesScroll}>
        {PRESET_STRATEGIES.map(strategy => (
          <TouchableOpacity
            key={strategy.id}
            style={[styles.strategyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onBuildStrategy(strategy)}>
            <View style={styles.strategyHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                {getStrategyIcon(strategy.icon)}
              </View>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(strategy.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(strategy.difficulty) }]}>
                  {getDifficultyLabel(strategy.difficulty)}
                </Text>
              </View>
            </View>

            <Text style={[styles.strategyName, { color: colors.text }]} numberOfLines={2}>
              {getStrategyName(strategy.id)}
            </Text>

            <Text style={[styles.strategyDescription, { color: colors.textSecondary }]} numberOfLines={3}>
              {getStrategyDescription(strategy.id)}
            </Text>

            <View style={styles.legsInfo}>
              <Text style={[styles.legsText, { color: colors.textTertiary }]}>
                {strategy.legs.length} {strategy.legs.length === 1 ? t('tradeOptions.leg') : t('tradeOptions.legs')}
              </Text>
            </View>

            <View style={[styles.buildButton, { backgroundColor: colors.primary }]}>
              <Zap size={16} color={colors.secondary} />
              <Text style={[styles.buildButtonText, { color: colors.secondary }]}>{t('tradeOptions.build')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export { PRESET_STRATEGIES };

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
  },
  strategiesScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.md,
  },
  strategyCard: {
    width: 220,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    ...Typography.small,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  strategyName: {
    ...Typography.bodySemibold,
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  strategyDescription: {
    ...Typography.small,
    lineHeight: 16,
    marginBottom: Spacing.sm,
    minHeight: 48,
  },
  legsInfo: {
    marginBottom: Spacing.sm,
  },
  legsText: {
    ...Typography.small,
    fontSize: 10,
  },
  buildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  buildButtonText: {
    ...Typography.captionMedium,
  },
});
