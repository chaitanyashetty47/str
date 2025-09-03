import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  WeekAnalyticsData, 
  OverallAnalyticsData,
  getWeekAnalytics,
  getOverallAnalytics 
} from '@/actions/client-workout/workout-analytics.action';
import {
  getTrainerWeekAnalytics,
  getTrainerOverallAnalytics
} from '@/actions/trainer-clients/trainer-workout-analytics.action';

// Cache structure
interface AnalyticsCache {
  weeklyData: Map<string, { data: WeekAnalyticsData; timestamp: number }>;
  overallData: Map<string, { data: OverallAnalyticsData; timestamp: number }>;
}

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Global cache instance
let analyticsCache: AnalyticsCache = {
  weeklyData: new Map(),
  overallData: new Map(),
};

// Helper to check if cached data is still valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

// Helper to detect if we're in trainer context
function isTrainerContext(pathname: string): boolean {
  console.log('🔍 Checking context for path:', pathname);
  const isTrainer = pathname.includes('/fitness/plans/') && pathname.includes('/progress');
  console.log('Is trainer context?', isTrainer);
  return isTrainer;
}

// Generate cache keys (include context to separate client/trainer caches)
function getWeekCacheKey(planId: string, weekNumber: number, isTrainer: boolean): string {
  const context = isTrainer ? 'trainer' : 'client';
  return `${planId}-week-${weekNumber}-${context}`;
}

function getOverallCacheKey(planId: string, isTrainer: boolean): string {
  const context = isTrainer ? 'trainer' : 'client';
  return `${planId}-overall-${context}`;
}

// Hook for weekly analytics with caching
export function useWeeklyAnalytics(planId: string, weekNumber: number) {
  const [data, setData] = useState<WeekAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  console.log("inside weekly analytics hook")

  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log('📊 Weekly Analytics - Starting fetch', { planId, weekNumber, pathname });
    
    const isTrainer = isTrainerContext(pathname);
    const cacheKey = getWeekCacheKey(planId, weekNumber, isTrainer);
    console.log('🔑 Cache key generated:', cacheKey);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEntry = analyticsCache.weeklyData.get(cacheKey);
      console.log('🔍 Cache check:', { 
        hasCachedEntry: !!cachedEntry,
        isValid: cachedEntry && isCacheValid(cachedEntry.timestamp)
      });
      
      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        console.log(`📦 Using cached weekly data for ${cacheKey}`);
        setData(cachedEntry.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh weekly data for ${cacheKey}`, {
      context: isTrainer ? 'trainer' : 'client',
      action: isTrainer ? 'getTrainerWeekAnalytics' : 'getWeekAnalytics'
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // Call appropriate action based on context
      const result = isTrainer 
        ? await getTrainerWeekAnalytics({ planId, weekNumber })
        : await getWeekAnalytics({ planId, weekNumber });
      
      console.log('📥 Server action response:', { 
        hasError: !!result.error,
        hasData: !!result.data,
        error: result.error
      });
      
      if (result.error) {
        console.error('❌ Server action error:', result.error);
        setError(result.error);
        setData(null);
      } else if (result.data) {
        console.log('✅ Server action success, caching data');
        setData(result.data);
        // Cache the result
        analyticsCache.weeklyData.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
        console.log(`💾 Cached weekly data for ${cacheKey}`);
      }
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setError('Failed to fetch analytics data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [planId, weekNumber, pathname]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook for overall analytics with caching
export function useOverallAnalytics(planId: string) {
  const [data, setData] = useState<OverallAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log('📈 Overall Analytics - Starting fetch', { planId, pathname });
    
    const isTrainer = isTrainerContext(pathname);
    const cacheKey = getOverallCacheKey(planId, isTrainer);
    console.log('🔑 Cache key generated:', cacheKey);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEntry = analyticsCache.overallData.get(cacheKey);
      console.log('🔍 Cache check:', { 
        hasCachedEntry: !!cachedEntry,
        isValid: cachedEntry && isCacheValid(cachedEntry.timestamp)
      });
      
      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        console.log(`📦 Using cached overall data for ${cacheKey}`);
        setData(cachedEntry.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh overall data for ${cacheKey}`, {
      context: isTrainer ? 'trainer' : 'client',
      action: isTrainer ? 'getTrainerOverallAnalytics' : 'getOverallAnalytics'
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // Call appropriate action based on context
      const result = isTrainer 
        ? await getTrainerOverallAnalytics({ planId })
        : await getOverallAnalytics({ planId });
      
      console.log('📥 Server action response:', { 
        hasError: !!result.error,
        hasData: !!result.data,
        error: result.error
      });
      
      if (result.error) {
        console.error('❌ Server action error:', result.error);
        setError(result.error);
        setData(null);
      } else if (result.data) {
        console.log('✅ Server action success, caching data');
        setData(result.data);
        // Cache the result
        analyticsCache.overallData.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
        console.log(`💾 Cached overall data for ${cacheKey}`);
      }
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setError('Failed to fetch analytics data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [planId, pathname]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Utility functions for cache management
export const analyticsUtils = {
  // Clear all cached data
  clearCache: () => {
    analyticsCache.weeklyData.clear();
    analyticsCache.overallData.clear();
    console.log('🗑️ Cleared analytics cache');
  },

  // Clear cache for specific plan
  clearPlanCache: (planId: string) => {
    // Clear weekly data for this plan (both client and trainer contexts)
    for (const [key] of analyticsCache.weeklyData) {
      if (key.startsWith(planId)) {
        analyticsCache.weeklyData.delete(key);
      }
    }
    
    // Clear overall data for this plan (both contexts)
    const clientOverallKey = getOverallCacheKey(planId, false);
    const trainerOverallKey = getOverallCacheKey(planId, true);
    analyticsCache.overallData.delete(clientOverallKey);
    analyticsCache.overallData.delete(trainerOverallKey);
    
    console.log(`🗑️ Cleared cache for plan ${planId} (both contexts)`);
  },

  // Get cache stats
  getCacheStats: () => {
    const weeklyCount = analyticsCache.weeklyData.size;
    const overallCount = analyticsCache.overallData.size;
    const totalSize = weeklyCount + overallCount;
    
    return {
      weeklyCount,
      overallCount,
      totalSize,
      weeklyKeys: Array.from(analyticsCache.weeklyData.keys()),
      overallKeys: Array.from(analyticsCache.overallData.keys()),
    };
  },

  // Preload data for faster navigation
  preloadWeekData: async (planId: string, weekNumbers: number[], isTrainer: boolean = false) => {
    const promises = weekNumbers.map(weekNumber => {
      const cacheKey = getWeekCacheKey(planId, weekNumber, isTrainer);
      const cachedEntry = analyticsCache.weeklyData.get(cacheKey);
      
      // Only preload if not cached or cache is expired
      if (!cachedEntry || !isCacheValid(cachedEntry.timestamp)) {
        const actionCall = isTrainer 
          ? getTrainerWeekAnalytics({ planId, weekNumber })
          : getWeekAnalytics({ planId, weekNumber });
          
        return actionCall.then(result => {
          if (result.data) {
            analyticsCache.weeklyData.set(cacheKey, {
              data: result.data,
              timestamp: Date.now(),
            });
            console.log(`⚡ Preloaded week ${weekNumber} data (${isTrainer ? 'trainer' : 'client'})`);
          }
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  },
}; 