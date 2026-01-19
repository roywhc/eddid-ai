import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getActiveSubscriptions,
  getAISubscription,
  getDataSubscriptions,
  checkAIMessageLimit,
  checkDataAccess,
  type ActiveSubscription,
} from '@/lib/subscriptionService';

interface SubscriptionContextType {
  subscriptions: ActiveSubscription[];
  aiSubscription: ActiveSubscription | null;
  dataSubscriptions: ActiveSubscription[];
  loading: boolean;
  refreshSubscriptions: () => Promise<void>;
  hasAIAccess: boolean;
  hasDataAccess: (marketType: string) => boolean;
  checkAILimit: () => Promise<{
    hasAccess: boolean;
    remaining: number;
    limit: number | null;
    isUnlimited: boolean;
  }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [aiSubscription, setAISubscription] = useState<ActiveSubscription | null>(null);
  const [dataSubscriptions, setDataSubscriptions] = useState<ActiveSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    } else {
      setSubscriptions([]);
      setAISubscription(null);
      setDataSubscriptions([]);
      setLoading(false);
    }
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [allSubs, aiSub, dataSubs] = await Promise.all([
        getActiveSubscriptions(user.id),
        getAISubscription(user.id),
        getDataSubscriptions(user.id),
      ]);

      setSubscriptions(allSubs);
      setAISubscription(aiSub);
      setDataSubscriptions(dataSubs);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptions = async () => {
    await loadSubscriptions();
  };

  const hasAIAccess = !!aiSubscription;

  const hasDataAccessFn = (marketType: string): boolean => {
    if (!user || dataSubscriptions.length === 0) return false;

    return dataSubscriptions.some(
      (sub) => sub.market_type === marketType || sub.market_type === 'all_markets'
    );
  };

  const checkAILimit = async () => {
    if (!user) {
      return {
        hasAccess: false,
        remaining: 0,
        limit: 0,
        isUnlimited: false,
      };
    }

    return checkAIMessageLimit(user.id);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        aiSubscription,
        dataSubscriptions,
        loading,
        refreshSubscriptions,
        hasAIAccess,
        hasDataAccess: hasDataAccessFn,
        checkAILimit,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
