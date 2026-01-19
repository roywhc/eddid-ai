export interface MacroTopic {
  id: string;
  title: string;
  summary: string;
  icon: string;
}

export const MACRO_TOPICS: MacroTopic[] = [
  {
    id: 'fed-policy',
    title: 'Federal Reserve Policy',
    summary: 'The Fed influences markets through interest rates, quantitative easing/tightening, and forward guidance. Higher rates typically pressure valuations but support the dollar.',
    icon: 'building',
  },
  {
    id: 'inflation',
    title: 'Inflation Dynamics',
    summary: 'CPI, PCE, and PPI measure price changes. Persistent inflation forces central banks to raise rates, impacting growth stocks and bonds. Commodities often benefit.',
    icon: 'trending-up',
  },
  {
    id: 'growth-cycles',
    title: 'Economic Growth Cycles',
    summary: 'GDP, PMI, and employment data signal expansion or contraction. Early cycle favors cyclicals and small caps. Late cycle sees defensives outperform.',
    icon: 'activity',
  },
  {
    id: 'credit-liquidity',
    title: 'Credit & Liquidity',
    summary: 'Tight credit conditions and reduced liquidity amplify market volatility. Watch credit spreads, bank lending standards, and central bank balance sheets.',
    icon: 'droplet',
  },
  {
    id: 'geopolitics',
    title: 'Geopolitical Risks',
    summary: 'Trade tensions, conflicts, and policy shifts create uncertainty. These events often trigger safe-haven flows into bonds, gold, and the dollar.',
    icon: 'globe',
  },
  {
    id: 'sector-rotation',
    title: 'Sector Rotation',
    summary: 'Risk-on sentiment favors tech and cyclicals. Risk-off sees flows into utilities, staples, and healthcare. Track VIX and cross-asset correlations.',
    icon: 'repeat',
  },
  {
    id: 'currency-rates',
    title: 'Currency & Rates Impact',
    summary: 'Strong dollar hurts multinationals with international exposure. Rising yields pressure growth stocks with long-duration cash flows.',
    icon: 'dollar-sign',
  },
  {
    id: 'employment',
    title: 'Employment & Wages',
    summary: 'NFP, jobless claims, and wage growth drive consumer spending and Fed policy. Tight labor markets fuel inflation but support consumer discretionary.',
    icon: 'users',
  },
];

export function getRandomMacroTopics(count: number = 3): MacroTopic[] {
  const shuffled = [...MACRO_TOPICS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
