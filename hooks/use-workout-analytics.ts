import { useState, useEffect, useCallback } from 'react';
import { 
  WeekAnalyticsData, 
  OverallAnalyticsData,
  getWeekAnalytics,
  getOverallAnalytics 
} from '@/actions/client-workout/workout-analytics.action';

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

// Generate cache keys
function getWeekCacheKey(planId: string, weekNumber: number): string {
  return `${planId}-week-${weekNumber}`;
}

function getOverallCacheKey(planId: string): string {
  return `${planId}-overall`;
}

// Hook for weekly analytics with caching
export function useWeeklyAnalytics(planId: string, weekNumber: number) {
  const [data, setData] = useState<WeekAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = getWeekCacheKey(planId, weekNumber);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEntry = analyticsCache.weeklyData.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        console.log(`📦 Using cached weekly data for ${cacheKey}`);
        setData(cachedEntry.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh weekly data for ${cacheKey}`);
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWeekAnalytics({ planId, weekNumber });
      
      if (result.error) {
        setError(result.error);
        setData(null);
      } else if (result.data) {
        setData(result.data);
        // Cache the result
        analyticsCache.weeklyData.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
        console.log(`💾 Cached weekly data for ${cacheKey}`);
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [planId, weekNumber]);

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

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = getOverallCacheKey(planId);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEntry = analyticsCache.overallData.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        console.log(`📦 Using cached overall data for ${cacheKey}`);
        setData(cachedEntry.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh overall data for ${cacheKey}`);
    setLoading(true);
    setError(null);
    
    try {
      const result = await getOverallAnalytics({ planId });
      
      if (result.error) {
        setError(result.error);
        setData(null);
      } else if (result.data) {
        setData(result.data);
        // Cache the result
        analyticsCache.overallData.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
        console.log(`💾 Cached overall data for ${cacheKey}`);
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

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
    // Clear weekly data for this plan
    for (const [key] of analyticsCache.weeklyData) {
      if (key.startsWith(planId)) {
        analyticsCache.weeklyData.delete(key);
      }
    }
    
    // Clear overall data for this plan
    const overallKey = getOverallCacheKey(planId);
    analyticsCache.overallData.delete(overallKey);
    
    console.log(`🗑️ Cleared cache for plan ${planId}`);
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
  preloadWeekData: async (planId: string, weekNumbers: number[]) => {
    const promises = weekNumbers.map(weekNumber => {
      const cacheKey = getWeekCacheKey(planId, weekNumber);
      const cachedEntry = analyticsCache.weeklyData.get(cacheKey);
      
      // Only preload if not cached or cache is expired
      if (!cachedEntry || !isCacheValid(cachedEntry.timestamp)) {
        return getWeekAnalytics({ planId, weekNumber }).then(result => {
          if (result.data) {
            analyticsCache.weeklyData.set(cacheKey, {
              data: result.data,
              timestamp: Date.now(),
            });
            console.log(`⚡ Preloaded week ${weekNumber} data`);
          }
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  },
}; 