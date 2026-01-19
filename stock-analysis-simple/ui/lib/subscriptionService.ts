import { supabase } from './supabase';

export interface SubscriptionProduct {
  id: string;
  product_type: 'data_subscription' | 'ai_subscription';
  name: string;
  slug: string;
  description: string;
  features: string[];
  price_monthly: number;
  price_yearly: number;
  currency: string;
  market_type?: string;
  data_features?: any;
  ai_tier?: string;
  ai_features?: any;
  monthly_ai_limit?: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  trial_days: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  product_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  is_trial: boolean;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  auto_renew: boolean;
  next_billing_date?: string;
  usage_current_period: any;
  created_at: string;
  updated_at: string;
}

export interface ActiveSubscription {
  subscription_id: string;
  user_id: string;
  status: string;
  billing_cycle: string;
  amount: number;
  current_period_start: string;
  current_period_end: string;
  is_trial: boolean;
  cancel_at_period_end: boolean;
  usage_current_period: any;
  product_id: string;
  product_type: string;
  product_name: string;
  product_slug: string;
  product_description: string;
  product_features: string[];
  market_type?: string;
  data_features?: any;
  ai_tier?: string;
  ai_features?: any;
  monthly_ai_limit?: number;
}

export async function getSubscriptionProducts(
  type?: 'data_subscription' | 'ai_subscription'
): Promise<SubscriptionProduct[]> {
  let query = supabase
    .from('subscription_products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (type) {
    query = query.eq('product_type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching subscription products:', error);
    throw error;
  }

  return data || [];
}

export async function getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }

  return data || [];
}

export async function getActiveSubscriptions(userId: string): Promise<ActiveSubscription[]> {
  const { data, error } = await supabase
    .from('user_active_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching active subscriptions:', error);
    throw error;
  }

  return data || [];
}

export async function hasActiveSubscription(
  userId: string,
  productType?: 'data_subscription' | 'ai_subscription',
  marketType?: string
): Promise<boolean> {
  let query = supabase
    .from('user_active_subscriptions')
    .select('subscription_id')
    .eq('user_id', userId);

  if (productType) {
    query = query.eq('product_type', productType);
  }

  if (marketType) {
    query = query.or(`market_type.eq.${marketType},market_type.eq.all_markets`);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  return !!data;
}

export async function getAISubscription(userId: string): Promise<ActiveSubscription | null> {
  const { data, error } = await supabase
    .from('user_active_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', 'ai_subscription')
    .order('monthly_ai_limit', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching AI subscription:', error);
    return null;
  }

  return data;
}

export async function getDataSubscriptions(userId: string): Promise<ActiveSubscription[]> {
  const { data, error } = await supabase
    .from('user_active_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', 'data_subscription')
    .order('market_type', { ascending: true });

  if (error) {
    console.error('Error fetching data subscriptions:', error);
    return [];
  }

  return data || [];
}

export async function createSubscription(
  userId: string,
  productId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<UserSubscription> {
  const product = await supabase
    .from('subscription_products')
    .select('*')
    .eq('id', productId)
    .maybeSingle();

  if (product.error || !product.data) {
    throw new Error('Product not found');
  }

  const amount = billingCycle === 'monthly' ? product.data.price_monthly : product.data.price_yearly;
  const periodStart = new Date();
  const periodEnd = new Date();

  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const isTrial = product.data.trial_days > 0;
  const trialEnd = isTrial ? new Date(periodStart.getTime() + product.data.trial_days * 24 * 60 * 60 * 1000) : null;

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      product_id: productId,
      status: isTrial ? 'trial' : 'active',
      billing_cycle: billingCycle,
      amount,
      currency: product.data.currency,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      is_trial: isTrial,
      trial_start: isTrial ? periodStart.toISOString() : null,
      trial_end: trialEnd?.toISOString() || null,
      auto_renew: true,
      next_billing_date: periodEnd.toISOString(),
      usage_current_period: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  return data;
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true,
  reason?: string
): Promise<void> {
  const updates: any = {
    cancel_at_period_end: cancelAtPeriodEnd,
    cancellation_reason: reason,
    updated_at: new Date().toISOString(),
  };

  if (!cancelAtPeriodEnd) {
    updates.status = 'cancelled';
    updates.cancelled_at = new Date().toISOString();
  } else {
    updates.cancelled_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update(updates)
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

export async function updateSubscriptionUsage(
  subscriptionId: string,
  usageType: string,
  increment: number = 1
): Promise<void> {
  const { data: subscription, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('usage_current_period')
    .eq('id', subscriptionId)
    .single();

  if (fetchError) {
    console.error('Error fetching subscription usage:', fetchError);
    throw fetchError;
  }

  const currentUsage = subscription.usage_current_period || {};
  currentUsage[usageType] = (currentUsage[usageType] || 0) + increment;

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      usage_current_period: currentUsage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error updating subscription usage:', error);
    throw error;
  }
}

export async function checkAIMessageLimit(userId: string): Promise<{
  hasAccess: boolean;
  remaining: number;
  limit: number | null;
  isUnlimited: boolean;
}> {
  const aiSubscription = await getAISubscription(userId);

  if (!aiSubscription) {
    return {
      hasAccess: false,
      remaining: 0,
      limit: 0,
      isUnlimited: false,
    };
  }

  const limit = aiSubscription.monthly_ai_limit ?? null;
  const isUnlimited = limit === null;

  if (isUnlimited) {
    return {
      hasAccess: true,
      remaining: -1,
      limit: null,
      isUnlimited: true,
    };
  }

  const usage = aiSubscription.usage_current_period?.ai_messages || 0;
  const remaining = Math.max(0, (limit || 0) - usage);

  return {
    hasAccess: remaining > 0,
    remaining,
    limit: limit,
    isUnlimited: false,
  };
}

export async function checkDataAccess(
  userId: string,
  marketType: string
): Promise<boolean> {
  return hasActiveSubscription(userId, 'data_subscription', marketType);
}
