// Simulation Service for SimRule UI
// Handles all simulation-related API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  SimulationResponse,
  ExecuteSimulationRequest,
  SimulationFilters,
  ExecutionMode,
} from '@/types/api.types';

class SimulationService {
  /**
   * Get all simulations with optional filtering
   */
  async getAll(filters?: SimulationFilters, options?: RequestOptions): Promise<SimulationResponse[]> {
    let endpoint = API_ENDPOINTS.SIMULATIONS;

    // Build query string from filters
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return apiService.get<SimulationResponse[]>(endpoint, options);
  }

  /**
   * Get a single simulation by ID
   */
  async getById(simulationId: string, options?: RequestOptions): Promise<SimulationResponse> {
    const endpoint = API_ENDPOINTS.SIMULATION_BY_ID(simulationId);
    return apiService.get<SimulationResponse>(endpoint, options);
  }

  /**
   * Execute a new simulation
   */
  async execute(
    request: ExecuteSimulationRequest,
    options?: RequestOptions
  ): Promise<SimulationResponse> {
    return apiService.post<SimulationResponse, ExecuteSimulationRequest>(
      API_ENDPOINTS.SIMULATIONS,
      request,
      options
    );
  }

  /**
   * Execute simulation for a single scenario
   */
  async executeScenario(
    scenarioId: string,
    name?: string,
    options?: RequestOptions
  ): Promise<SimulationResponse> {
    return this.execute(
      {
        name: name || `Single Scenario Run - ${new Date().toISOString()}`,
        scenarioIds: [scenarioId],
        executionMode: 'SEQUENTIAL',
      },
      options
    );
  }

  /**
   * Execute simulation for multiple scenarios
   */
  async executeScenarios(
    scenarioIds: string[],
    config: {
      name?: string;
      executionMode?: ExecutionMode;
      concurrency?: number;
      timeoutSeconds?: number;
    } = {},
    options?: RequestOptions
  ): Promise<SimulationResponse> {
    return this.execute(
      {
        name: config.name || `Batch Simulation - ${new Date().toISOString()}`,
        scenarioIds,
        executionMode: config.executionMode || 'SEQUENTIAL',
        concurrency: config.concurrency,
        timeoutSeconds: config.timeoutSeconds,
      },
      options
    );
  }

  /**
   * Get recent simulations
   */
  async getRecent(limit: number = 10, options?: RequestOptions): Promise<SimulationResponse[]> {
    const allSimulations = await this.getAll(undefined, options);

    // Sort by createdAt descending and take first N
    return allSimulations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get completed simulations
   */
  async getCompleted(options?: RequestOptions): Promise<SimulationResponse[]> {
    return this.getAll({ status: 'COMPLETED' }, options);
  }

  /**
   * Get running simulations
   */
  async getRunning(options?: RequestOptions): Promise<SimulationResponse[]> {
    return this.getAll({ status: 'RUNNING' }, options);
  }

  /**
   * Get simulation statistics
   */
  async getStatistics(options?: RequestOptions): Promise<{
    total: number;
    running: number;
    completed: number;
    failed: number;
    avgPassRate: number;
    avgDurationMs: number;
  }> {
    const simulations = await this.getAll(undefined, options);

    const running = simulations.filter((s) => s.status === 'RUNNING').length;
    const completed = simulations.filter((s) => s.status === 'COMPLETED').length;
    const failed = simulations.filter((s) => s.status === 'FAILED').length;

    const completedSims = simulations.filter(
      (s) => s.status === 'COMPLETED' && s.metrics
    );

    const avgPassRate =
      completedSims.length > 0
        ? completedSims.reduce((sum, s) => sum + (s.metrics?.successRate || 0), 0) /
          completedSims.length
        : 0;

    const avgDurationMs =
      completedSims.length > 0
        ? completedSims.reduce((sum, s) => sum + (s.metrics?.totalDurationMs || 0), 0) /
          completedSims.length
        : 0;

    return {
      total: simulations.length,
      running,
      completed,
      failed,
      avgPassRate,
      avgDurationMs,
    };
  }

  /**
   * Format simulation status for display
   */
  formatStatus(status: SimulationResponse['status']): 'pass' | 'fail' | 'warning' | 'running' {
    switch (status) {
      case 'COMPLETED':
        return 'pass';
      case 'FAILED':
        return 'fail';
      case 'RUNNING':
      case 'PENDING':
        return 'running';
      case 'CANCELLED':
        return 'warning';
      default:
        return 'warning';
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(durationMs: number): string {
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }
    if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}s`;
    }
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

// Export singleton instance
export const simulationService = new SimulationService();

// Export class for testing
export { SimulationService };
