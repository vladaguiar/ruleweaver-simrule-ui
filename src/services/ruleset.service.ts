// Rule Set Service - Fetches available rule sets from Rule Inspector via SimRule API
import { apiService, type RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type { RuleSetsResponse } from '@/types/api.types';

export class RuleSetService {
  /**
   * Get all available rule sets from Rule Inspector
   * @param options Request options including abort signal
   * @returns Paginated response with rule set metadata
   */
  async getAll(options?: RequestOptions): Promise<RuleSetsResponse> {
    return apiService.get<RuleSetsResponse>(API_ENDPOINTS.RULE_SETS, options);
  }

  /**
   * Get just the rule set IDs (convenience method for dropdowns)
   * @param options Request options including abort signal
   * @returns Array of rule set ID strings
   */
  async getRuleSetIds(options?: RequestOptions): Promise<string[]> {
    try {
      const response = await this.getAll(options);
      return response.ruleSets.map((rs) => rs.ruleSetId);
    } catch (error) {
      // If API is unavailable, return empty array
      console.error('Failed to fetch rule sets:', error);
      return [];
    }
  }
}

export const ruleSetService = new RuleSetService();
