// Statistics Service for SimRule UI
// Handles statistics-related API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';

/**
 * Daily activity data for the timeline chart
 */
export interface DailyActivity {
  date: string;   // Day label (Mon, Tue, Wed, etc.)
  tests: number;  // Total scenarios executed that day
  passed: number; // Scenarios that passed that day
}

class StatisticsService {
  /**
   * Get daily activity statistics for the timeline chart
   * API defaults to 7 days if no parameter provided
   */
  async getActivity(options?: RequestOptions): Promise<DailyActivity[]> {
    return apiService.get<DailyActivity[]>(API_ENDPOINTS.STATISTICS_ACTIVITY, options);
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();

// Export class for testing
export { StatisticsService };
