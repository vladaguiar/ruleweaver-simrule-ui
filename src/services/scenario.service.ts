// Scenario Service for SimRule UI
// Handles all scenario-related API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  ScenarioResponse,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  ScenarioFilters,
  PaginatedResponse,
  BulkDeleteRequest,
  BulkDeleteResponse,
} from '@/types/api.types';

// Pagination parameters
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

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
   * Get paginated scenarios with optional filtering
   */
  async getPaginated(
    pagination?: PaginationParams,
    filters?: ScenarioFilters,
    options?: RequestOptions
  ): Promise<PaginatedResponse<ScenarioResponse>> {
    let endpoint = API_ENDPOINTS.SCENARIOS;

    // Build query string from pagination and filters
    const params = new URLSearchParams();

    // Pagination params
    if (pagination?.page !== undefined) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.size !== undefined) {
      params.append('size', pagination.size.toString());
    }
    if (pagination?.sort) {
      params.append('sort', pagination.sort);
    }
    if (pagination?.direction) {
      params.append('direction', pagination.direction);
    }

    // Filter params
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

    try {
      // Try to get paginated response from server
      const response = await apiService.get<PaginatedResponse<ScenarioResponse>>(endpoint, options);

      // If response looks like a paginated response, return it
      if ('content' in response && 'totalElements' in response) {
        return response;
      }

      // If server returns array (non-paginated), convert to paginated format
      const scenarios = response as unknown as ScenarioResponse[];
      const page = pagination?.page ?? 0;
      const size = pagination?.size ?? 10;
      const start = page * size;
      const end = start + size;
      const paginatedContent = scenarios.slice(start, end);

      return {
        content: paginatedContent,
        totalElements: scenarios.length,
        totalPages: Math.ceil(scenarios.length / size),
        page,
        size,
      };
    } catch {
      // Fallback: get all and paginate client-side
      const scenarios = await this.getAll(filters, options);
      const page = pagination?.page ?? 0;
      const size = pagination?.size ?? 10;
      const start = page * size;
      const end = start + size;
      const paginatedContent = scenarios.slice(start, end);

      return {
        content: paginatedContent,
        totalElements: scenarios.length,
        totalPages: Math.ceil(scenarios.length / size),
        page,
        size,
      };
    }
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
   * Bulk delete scenarios using efficient API endpoint
   * Falls back to individual deletes if bulk endpoint not available
   */
  async bulkDelete(scenarioIds: string[], options?: RequestOptions): Promise<BulkDeleteResponse> {
    try {
      // Try efficient bulk delete API
      const request: BulkDeleteRequest = { ids: scenarioIds };
      return await apiService.delete<BulkDeleteResponse>(
        API_ENDPOINTS.SCENARIOS_BULK_DELETE,
        { ...options, body: JSON.stringify(request) }
      );
    } catch (error: unknown) {
      // Fallback to individual deletes if bulk endpoint not available (404)
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn('Bulk delete endpoint not available, falling back to individual deletes');
        const results = await Promise.allSettled(
          scenarioIds.map((id) => this.delete(id, options))
        );

        const deletedIds: string[] = [];
        const failures: { id: string; reason: string }[] = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            deletedIds.push(scenarioIds[index]);
          } else {
            failures.push({
              id: scenarioIds[index],
              reason: result.reason?.message || 'Unknown error',
            });
          }
        });

        return {
          totalRequested: scenarioIds.length,
          successCount: deletedIds.length,
          failureCount: failures.length,
          deletedIds,
          failures,
        };
      }
      throw error;
    }
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
