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
      console.error('Failed to fetch rules:', error);
      throw error;
    }
  }

  /**
   * Get rules filtered by rule set
   * Client-side filtering since API returns all rules
   */
  async getByRuleSet(ruleSet: string, options?: RequestOptions): Promise<RuleInfo[]> {
    const allRules = await this.getAll(options);
    return allRules.filter(rule => rule.ruleSet === ruleSet);
  }
}

// Export singleton instance
export const ruleService = new RuleService();

// Export class for testing
export { RuleService };
