// useStatistics Hook - Custom hook for statistics data

import { useState, useEffect, useCallback } from 'react';
import { statisticsService, DailyActivity } from '@/services';

/**
 * Hook to fetch activity statistics for the dashboard timeline chart
 */
export function useActivityStats() {
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statisticsService.getActivity();
      setActivityData(data);
    } catch (err) {
      console.error('Failed to fetch activity statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity data');
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activityData, loading, error, refresh };
}
