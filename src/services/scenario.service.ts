// Scenario Service for SimRule UI
// Handles all scenario-related API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  ScenarioResponse,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  ScenarioFilters,
} from '@/types/api.types';

class ScenarioService {
  /**
   * Get all scenarios with optional filtering
   */
  async getAll(filters?: ScenarioFilters, options?: RequestOptions): Promise<ScenarioResponse[]> {
    let endpoint = API_ENDPOINTS.SCENARIOS;

    // Build query string from filters
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.ruleSet) {
      params.append('ruleSet', filters.ruleSet);
    }

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return apiService.get<ScenarioResponse[]>(endpoint, options);
  }

  /**
   * Get a single scenario by ID
   */
  async getById(scenarioId: string, options?: RequestOptions): Promise<ScenarioResponse> {
    const endpoint = API_ENDPOINTS.SCENARIO_BY_ID(scenarioId);
    return apiService.get<ScenarioResponse>(endpoint, options);
  }

  /**
   * Create a new scenario
   */
  async create(
    scenario: CreateScenarioRequest,
    options?: RequestOptions
  ): Promise<ScenarioResponse> {
    return apiService.post<ScenarioResponse, CreateScenarioRequest>(
      API_ENDPOINTS.SCENARIOS,
      scenario,
      options
    );
  }

  /**
   * Update an existing scenario
   */
  async update(
    scenarioId: string,
    scenario: UpdateScenarioRequest,
    options?: RequestOptions
  ): Promise<ScenarioResponse> {
    const endpoint = API_ENDPOINTS.SCENARIO_BY_ID(scenarioId);
    return apiService.put<ScenarioResponse, UpdateScenarioRequest>(endpoint, scenario, options);
  }

  /**
   * Delete a scenario
   */
  async delete(scenarioId: string, options?: RequestOptions): Promise<void> {
    const endpoint = API_ENDPOINTS.SCENARIO_BY_ID(scenarioId);
    return apiService.delete(endpoint, options);
  }

  /**
   * Clone an existing scenario
   */
  async clone(scenarioId: string, options?: RequestOptions): Promise<ScenarioResponse> {
    const endpoint = API_ENDPOINTS.SCENARIO_CLONE(scenarioId);
    return apiService.post<ScenarioResponse, object>(endpoint, {}, options);
  }

  /**
   * Bulk delete scenarios
   */
  async bulkDelete(scenarioIds: string[], options?: RequestOptions): Promise<void> {
    await Promise.all(scenarioIds.map((id) => this.delete(id, options)));
  }

  /**
   * Get scenarios by status
   */
  async getByStatus(
    status: ScenarioResponse['status'],
    options?: RequestOptions
  ): Promise<ScenarioResponse[]> {
    return this.getAll({ status }, options);
  }

  /**
   * Get scenarios by rule set
   */
  async getByRuleSet(ruleSet: string, options?: RequestOptions): Promise<ScenarioResponse[]> {
    return this.getAll({ ruleSet }, options);
  }

  /**
   * Activate a scenario (change status to ACTIVE)
   */
  async activate(scenarioId: string, options?: RequestOptions): Promise<ScenarioResponse> {
    return this.update(scenarioId, { status: 'ACTIVE' }, options);
  }

  /**
   * Archive a scenario
   */
  async archive(scenarioId: string, options?: RequestOptions): Promise<ScenarioResponse> {
    return this.update(scenarioId, { status: 'ARCHIVED' }, options);
  }

  /**
   * Get unique rule sets from all scenarios
   */
  async getRuleSets(options?: RequestOptions): Promise<string[]> {
    const scenarios = await this.getAll(undefined, options);
    const ruleSets = new Set(scenarios.map((s) => s.ruleSet));
    return Array.from(ruleSets).sort();
  }

  /**
   * Get unique tags from all scenarios
   */
  async getTags(options?: RequestOptions): Promise<string[]> {
    const scenarios = await this.getAll(undefined, options);
    const tags = new Set<string>();
    scenarios.forEach((s) => {
      s.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Search scenarios by name or description
   */
  async search(query: string, options?: RequestOptions): Promise<ScenarioResponse[]> {
    const allScenarios = await this.getAll(undefined, options);
    const lowerQuery = query.toLowerCase();

    return allScenarios.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description?.toLowerCase().includes(lowerQuery) ||
        s.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// Export singleton instance
export const scenarioService = new ScenarioService();

// Export class for testing
export { ScenarioService };
