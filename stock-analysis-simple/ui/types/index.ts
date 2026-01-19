export type AssetClass = 'stock' | 'etf' | 'fund' | 'commodity' | 'fx' | 'crypto' | 'rwa';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop' | 'iceberg' | 'twap' | 'vwap';

export type OrderSide = 'buy' | 'sell';

export type OrderStatus = 'pending' | 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok';

export type AccountStatus = 'registered' | 'kyc_pending' | 'kyc_approved' | 'kyc_rejected' | 'active' | 'suspended' | 'closed';

export type KYCStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'resubmit_required';

export type RiskCategory = 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive';

export interface Asset {
  id: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  description?: string;
  exchange: string;
  country?: string;
  currency: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  isTradeable: boolean;
  isShortable: boolean;
  tickSize?: number;
  lotSize?: number;
  tradingHours?: any;
  metadata?: any;
}

export interface Position {
  id: string;
  accountId: string;
  assetId: string;
  asset?: Asset;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  realizedPnl?: number;
  totalCost?: number;
}

export interface Order {
  id: string;
  accountId: string;
  assetId: string;
  asset?: Asset;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  filledQuantity: number;
  limitPrice?: number;
  stopPrice?: number;
  trailingAmount?: number;
  trailingPercent?: number;
  displayQuantity?: number;
  timeInForce: TimeInForce;
  status: OrderStatus;
  rejectReason?: string;
  averageFillPrice?: number;
  totalFees?: number;
  routeStrategy?: string;
  brokerOrderId?: string;
  placedAt?: string;
  filledAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountType: 'retail' | 'professional' | 'corporate';
  accountNumber: string;
  baseCurrency: string;
  status: AccountStatus;
  marginEnabled: boolean;
  buyingPower: number;
  cashBalance: number;
  totalEquity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  occupation?: string;
  employer?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  accountStatus: AccountStatus;
  riskCategory?: RiskCategory;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  assetId?: string;
  alertType: 'price_above' | 'price_below' | 'price_change_percent' | 'volume_spike' | 'indicator_cross' | 'news_sentiment';
  condition: any;
  deliveryChannels: ('push' | 'email' | 'sms' | 'in_app')[];
  status: 'active' | 'triggered' | 'expired' | 'disabled';
  triggerCount: number;
  lastTriggeredAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIChat {
  id: string;
  userId: string;
  title: string;
  context?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  richBlocks?: {
    type: 'chart' | 'table' | 'image';
    title?: string;
    data?: any;
    url?: string;
  }[];
  metadata?: any;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  notificationType: 'alert' | 'order' | 'execution' | 'deposit' | 'withdrawal' | 'kyc' | 'system' | 'news';
  title: string;
  body?: string;
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  transactionType: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'dividend' | 'interest' | 'adjustment' | 'transfer';
  currency: string;
  amount: number;
  balanceAfter?: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  metadata?: any;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'pro' | 'vip';
  priceMonthly?: number;
  priceYearly?: number;
  features: any;
  limits?: any;
  active: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billingCycle?: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
