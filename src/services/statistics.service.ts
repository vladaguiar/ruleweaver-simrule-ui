// Statistics Service for SimRule UI
// Handles statistics-related API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type { TrendsResponse, OverviewResponse, DailyActivity } from '@/types/api.types';

class StatisticsService {
  /**
   * Get daily activity statistics for the timeline chart
   * API defaults to 7 days if no parameter provided
   */
  async getActivity(options?: RequestOptions): Promise<DailyActivity[]> {
    try {
      return await apiService.get<DailyActivity[]>(API_ENDPOINTS.STATISTICS_ACTIVITY, options);
    } catch (error: unknown) {
      // Return empty array if endpoint not available
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn('Activity endpoint not available');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get trend data for KPIs
   * @param period - 'daily', 'weekly', or 'monthly'
   */
  async getTrends(period: string = 'weekly', options?: RequestOptions): Promise<TrendsResponse | null> {
    try {
      const endpoint = `${API_ENDPOINTS.STATISTICS_TRENDS}?period=${period}`;
      return await apiService.get<TrendsResponse>(endpoint, options);
    } catch (error: unknown) {
      // Graceful degradation - return null if endpoint not available
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn('Trends endpoint not available');
        return null;
      }
      throw error;
    }
  }

  /**
   * Get overview statistics for dashboard
   */
  async getOverview(options?: RequestOptions): Promise<OverviewResponse | null> {
    try {
      return await apiService.get<OverviewResponse>(API_ENDPOINTS.STATISTICS_OVERVIEW, options);
    } catch (error: unknown) {
      // Graceful degradation - return null if endpoint not available
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn('Overview endpoint not available');
        return null;
      }
      throw error;
    }
  }

  /**
   * Calculate trend direction from percentage change
   */
  getTrendDirection(percentageChange: number): 'UP' | 'DOWN' | 'STABLE' {
    if (percentageChange > 1) return 'UP';
    if (percentageChange < -1) return 'DOWN';
    return 'STABLE';
  }

  /**
   * Format percentage change for display
   */
  formatPercentageChange(value: number): string {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();

// Export class for testing
export { StatisticsService };
