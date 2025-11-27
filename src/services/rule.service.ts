// Rule Service for SimRule UI
// Handles fetching rules from Rule Inspector API

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type { RuleInfo } from '@/types/api.types';

class RuleService {
  /**
   * Get all active rules from Rule Inspector
   * Returns full list - filtering by ruleSet happens client-side
   */
  async getAll(options?: RequestOptions): Promise<RuleInfo[]> {
    try {
      const endpoint = API_ENDPOINTS.RULES;
      const rules = await apiService.get<RuleInfo[]>(endpoint, options);
      return rules;
    } catch (error) {
      // Don't log AbortErrors - they're expected when requests are cancelled
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch rules:', error);
      }
      throw error;
    }
  }

  /**
   * Get rules filtered by rule set
   * API requires ruleSet query parameter
   */
  async getByRuleSet(ruleSet: string, options?: RequestOptions): Promise<RuleInfo[]> {
    try {
      const endpoint = `${API_ENDPOINTS.RULES}?ruleSet=${encodeURIComponent(ruleSet)}`;
      const rules = await apiService.get<RuleInfo[]>(endpoint, options);
      return rules;
    } catch (error) {
      // Don't log AbortErrors - they're expected when requests are cancelled
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch rules for rule set:', ruleSet, error);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const ruleService = new RuleService();

// Export class for testing
export { RuleService };
