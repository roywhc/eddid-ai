import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, TrendingUp, Star, Lightbulb, GraduationCap, Users, Building2 } from 'lucide-react-native';
import { router } from 'expo-router';

const FUND_CATEGORIES = [
  { id: 'retail', title: 'Retail Funds', icon: Users, description: 'Funds for individual investors' },
  { id: 'provident', title: 'Provident Funds', icon: Building2, description: 'Retirement savings funds' },
  { id: 'sar', title: 'SAR Funds', icon: Star, description: 'Special administrative region funds' },
  { id: 'etf', title: 'ETFs', icon: TrendingUp, description: 'Exchange-traded funds' },
];

const TOP_FUNDS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', aum: '$450.2B', expense: '0.09%', return: '+25.3%' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', aum: '$280.5B', expense: '0.20%', return: '+32.1%' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', aum: '$380.8B', expense: '0.03%', return: '+24.8%' },
  { symbol: 'AGG', name: 'iShares Core US Aggregate Bond ETF', type: 'ETF', aum: '$95.2B', expense: '0.03%', return: '+2.5%' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETF', aum: '$425.1B', expense: '0.03%', return: '+25.2%' },
  { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', type: 'ETF', aum: '$410.3B', expense: '0.03%', return: '+25.1%' },
];

const INSIGHTS = [
  {
    title: 'Market Outlook 2026',
    description: 'Key trends shaping the investment landscape',
    category: 'Market Analysis',
  },
  {
    title: 'ESG Investing Guide',
    description: 'Understanding sustainable investment strategies',
    category: 'Sustainability',
  },
  {
    title: 'Rising Interest Rates',
    description: 'Impact on fixed income and equity funds',
    category: 'Economic Trends',
  },
];

const INVESTMENT_IDEAS = [
  {
    title: 'Diversified Growth Portfolio',
    description: '60/40 equity-bond allocation for balanced growth',
    risk: 'Moderate',
  },
  {
    title: 'Technology Sector Focus',
    description: 'High-growth potential in tech-focused ETFs',
    risk: 'High',
  },
  {
    title: 'Dividend Income Strategy',
    description: 'Steady income through dividend-paying funds',
    risk: 'Low',
  },
];

export default function FundsListingScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Funds</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {INSIGHTS.map((insight, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.insightIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Lightbulb size={20} color={colors.primary} />
                </View>
                <Text style={[styles.insightCategory, { color: colors.textSecondary }]}>{insight.category}</Text>
                <Text style={[styles.insightTitle, { color: colors.text }]} numberOfLines={2}>
                  {insight.title}
                </Text>
                <Text style={[styles.insightDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {insight.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Investment Ideas</Text>
          {INVESTMENT_IDEAS.map((idea, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.ideaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ideaHeader}>
                <View style={styles.ideaHeaderLeft}>
                  <Star size={16} color={colors.primary} />
                  <Text style={[styles.ideaTitle, { color: colors.text }]}>{idea.title}</Text>
                </View>
                <View style={[
                  styles.riskBadge,
                  {
                    backgroundColor:
                      idea.risk === 'Low' ? colors.success + '15' :
                      idea.risk === 'Moderate' ? colors.warning + '15' :
                      colors.error + '15',
                  },
                ]}>
                  <Text style={[
                    styles.riskText,
                    {
                      color:
                        idea.risk === 'Low' ? colors.success :
                        idea.risk === 'Moderate' ? colors.warning :
                        colors.error,
                    },
                  ]}>
                    {idea.risk}
                  </Text>
                </View>
              </View>
              <Text style={[styles.ideaDescription, { color: colors.textSecondary }]}>{idea.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Educational</Text>
          <TouchableOpacity
            style={[styles.educationalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.educationalIcon, { backgroundColor: colors.success + '15' }]}>
              <GraduationCap size={32} color={colors.success} />
            </View>
            <View style={styles.educationalContent}>
              <Text style={[styles.educationalTitle, { color: colors.text }]}>Fund Investing Basics</Text>
              <Text style={[styles.educationalDescription, { color: colors.textSecondary }]}>
                Learn how mutual funds and ETFs work, understand fees, and make informed investment decisions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.educationalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.educationalIcon, { backgroundColor: colors.primary + '15' }]}>
              <GraduationCap size={32} color={colors.primary} />
            </View>
            <View style={styles.educationalContent}>
              <Text style={[styles.educationalTitle, { color: colors.text }]}>Risk Management</Text>
              <Text style={[styles.educationalDescription, { color: colors.textSecondary }]}>
                Discover strategies to balance risk and return through diversification and asset allocation
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fund Categories</Text>
          <View style={styles.categoriesGrid}>
            {FUND_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
                  <category.icon size={24} color={colors.primary} />
                </View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.title}</Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: Spacing.xl }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Funds</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {TOP_FUNDS.map((fund, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.fundCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/fund/${fund.symbol}?name=${encodeURIComponent(fund.name)}`)}>
              <View style={styles.fundHeader}>
                <View>
                  <Text style={[styles.fundSymbol, { color: colors.text }]}>{fund.symbol}</Text>
                  <Text style={[styles.fundName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {fund.name}
                  </Text>
                </View>
                <View style={[styles.fundTypeBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.fundType, { color: colors.primary }]}>{fund.type}</Text>
                </View>
              </View>
              <View style={styles.fundStats}>
                <View style={styles.fundStat}>
                  <Text style={[styles.fundStatLabel, { color: colors.textSecondary }]}>AUM</Text>
                  <Text style={[styles.fundStatValue, { color: colors.text }]}>{fund.aum}</Text>
                </View>
                <View style={styles.fundStat}>
                  <Text style={[styles.fundStatLabel, { color: colors.textSecondary }]}>Expense</Text>
                  <Text style={[styles.fundStatValue, { color: colors.text }]}>{fund.expense}</Text>
                </View>
                <View style={styles.fundStat}>
                  <Text style={[styles.fundStatLabel, { color: colors.textSecondary }]}>YTD</Text>
                  <Text style={[styles.fundStatValue, { color: colors.success }]}>{fund.return}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    ...Typography.heading3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading3,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  seeAll: {
    ...Typography.bodyMedium,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  insightCard: {
    width: 280,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  insightCategory: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  insightTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    ...Typography.caption,
  },
  ideaCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ideaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  ideaTitle: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  riskText: {
    ...Typography.small,
    fontWeight: '600',
  },
  ideaDescription: {
    ...Typography.caption,
  },
  educationalCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  educationalIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  educationalContent: {
    flex: 1,
  },
  educationalTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  educationalDescription: {
    ...Typography.caption,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    ...Typography.small,
  },
  fundCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  fundSymbol: {
    ...Typography.bodySemibold,
  },
  fundName: {
    ...Typography.caption,
  },
  fundTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  fundType: {
    ...Typography.small,
    fontWeight: '600',
  },
  fundStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  fundStat: {
    flex: 1,
  },
  fundStatLabel: {
    ...Typography.small,
    marginBottom: 2,
  },
  fundStatValue: {
    ...Typography.bodyMedium,
  },
});
