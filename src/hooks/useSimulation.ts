// useSimulation Hook - Custom hook for simulation management with WebSocket support

import { useState, useEffect, useCallback, useRef } from 'react';
import { simulationService, websocketService } from '@/services';
import type {
  SimulationResponse,
  ExecuteSimulationRequest,
  SimulationFilters,
  SimulationWebSocketMessage,
  SimulationProgressMessage,
  ScenarioCompleteMessage,
  ExecutionMode,
} from '@/types/api.types';
import type { WebSocketStatus } from '@/services/websocket.service';

export interface SimulationProgress {
  percentage: number;
  completedScenarios: number;
  totalScenarios: number;
  currentScenario?: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  elapsedTimeMs: number;
}

export interface UseSimulationsState {
  simulations: SimulationResponse[];
  loading: boolean;
  error: string | null;
}

export interface UseSimulationsActions {
  refresh: () => Promise<void>;
  getById: (id: string) => Promise<SimulationResponse>;
  execute: (request: ExecuteSimulationRequest) => Promise<SimulationResponse>;
  executeScenarios: (
    scenarioIds: string[],
    config?: {
      name?: string;
      executionMode?: ExecutionMode;
      concurrency?: number;
    }
  ) => Promise<SimulationResponse>;
  getRecent: (limit?: number) => Promise<SimulationResponse[]>;
  getStatistics: () => Promise<{
    total: number;
    running: number;
    completed: number;
    failed: number;
    avgPassRate: number;
    avgDurationMs: number;
  }>;
}

export function useSimulations(filters?: SimulationFilters): UseSimulationsState & UseSimulationsActions {
  const [simulations, setSimulations] = useState<SimulationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulationService.getAll(filters);
      setSimulations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load simulations');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getById = useCallback(async (id: string): Promise<SimulationResponse> => {
    return simulationService.getById(id);
  }, []);

  const execute = useCallback(async (request: ExecuteSimulationRequest): Promise<SimulationResponse> => {
    const simulation = await simulationService.execute(request);
    setSimulations((prev) => [simulation, ...prev]);
    return simulation;
  }, []);

  const executeScenarios = useCallback(
    async (
      scenarioIds: string[],
      config?: {
        name?: string;
        executionMode?: ExecutionMode;
        concurrency?: number;
      }
    ): Promise<SimulationResponse> => {
      const simulation = await simulationService.executeScenarios(scenarioIds, config);
      setSimulations((prev) => [simulation, ...prev]);
      return simulation;
    },
    []
  );

  const getRecent = useCallback(async (limit?: number): Promise<SimulationResponse[]> => {
    return simulationService.getRecent(limit);
  }, []);

  const getStatistics = useCallback(async () => {
    return simulationService.getStatistics();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    simulations,
    loading,
    error,
    refresh,
    getById,
    execute,
    executeScenarios,
    getRecent,
    getStatistics,
  };
}

// Hook for real-time simulation tracking with WebSocket
export function useSimulationProgress(simulationId: string | null) {
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [progress, setProgress] = useState<SimulationProgress>({
    percentage: 0,
    completedScenarios: 0,
    totalScenarios: 0,
    passedCount: 0,
    failedCount: 0,
    warningCount: 0,
    elapsedTimeMs: 0,
  });
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [logs, setLogs] = useState<Array<{
    type: 'info' | 'success' | 'error' | 'warning';
    time: string;
    message: string;
    details?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  const handleMessage = useCallback((message: SimulationWebSocketMessage) => {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });

    switch (message.type) {
      case 'PROGRESS': {
        const progressMsg = message as SimulationProgressMessage;
        setProgress((prev) => ({
          ...prev,
          percentage: progressMsg.percentage,
          completedScenarios: progressMsg.completedScenarios,
          totalScenarios: progressMsg.totalScenarios,
          currentScenario: progressMsg.currentScenario,
          elapsedTimeMs: Date.now() - startTimeRef.current,
        }));
        break;
      }

      case 'SCENARIO_COMPLETE': {
        const completeMsg = message as ScenarioCompleteMessage;
        setProgress((prev) => {
          const newProgress = { ...prev };
          if (completeMsg.status === 'PASSED') {
            newProgress.passedCount++;
            setLogs((prevLogs) => [
              ...prevLogs,
              {
                type: 'success',
                time: now,
                message: `${completeMsg.scenarioName}: PASS (${(completeMsg.durationMs / 1000).toFixed(1)}s)`,
              },
            ]);
          } else if (completeMsg.status === 'FAILED') {
            newProgress.failedCount++;
            setLogs((prevLogs) => [
              ...prevLogs,
              {
                type: 'error',
                time: now,
                message: `${completeMsg.scenarioName}: FAIL (${(completeMsg.durationMs / 1000).toFixed(1)}s)`,
                details: completeMsg.errorMessage,
              },
            ]);
          } else {
            newProgress.warningCount++;
            setLogs((prevLogs) => [
              ...prevLogs,
              {
                type: 'warning',
                time: now,
                message: `${completeMsg.scenarioName}: ERROR (${(completeMsg.durationMs / 1000).toFixed(1)}s)`,
                details: completeMsg.errorMessage,
              },
            ]);
          }
          return newProgress;
        });
        break;
      }

      case 'SIMULATION_COMPLETE':
        setLogs((prevLogs) => [
          ...prevLogs,
          {
            type: 'info',
            time: now,
            message: `Simulation complete - Pass rate: ${message.passRate.toFixed(1)}%`,
          },
        ]);
        // Refresh simulation data to get final results
        if (simulationId) {
          simulationService.getById(simulationId).then(setSimulation);
        }
        break;

      case 'ERROR':
        setError(message.message);
        setLogs((prevLogs) => [
          ...prevLogs,
          {
            type: 'error',
            time: now,
            message: `Error: ${message.message}`,
          },
        ]);
        break;
    }
  }, [simulationId]);

  // Connect to WebSocket when simulationId changes
  useEffect(() => {
    if (!simulationId) {
      return;
    }

    // Reset state
    setProgress({
      percentage: 0,
      completedScenarios: 0,
      totalScenarios: 0,
      passedCount: 0,
      failedCount: 0,
      warningCount: 0,
      elapsedTimeMs: 0,
    });
    setLogs([{
      type: 'info',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message: 'Started simulation batch',
    }]);
    setError(null);
    startTimeRef.current = Date.now();

    // Load initial simulation data
    setLoading(true);
    simulationService.getById(simulationId)
      .then((sim) => {
        setSimulation(sim);
        if (sim.scenarioIds) {
          setProgress((prev) => ({
            ...prev,
            totalScenarios: sim.scenarioIds.length,
          }));
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    // Connect to WebSocket
    websocketService.connectToSimulation(simulationId, {
      onMessage: handleMessage,
      onStatusChange: setWsStatus,
      onError: () => {
        setError('WebSocket connection failed');
      },
    });

    return () => {
      websocketService.disconnectFromSimulation(simulationId);
    };
  }, [simulationId, handleMessage]);

  // Update elapsed time periodically
  useEffect(() => {
    if (simulation?.status === 'RUNNING') {
      const interval = setInterval(() => {
        setProgress((prev) => ({
          ...prev,
          elapsedTimeMs: Date.now() - startTimeRef.current,
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [simulation?.status]);

  return {
    simulation,
    progress,
    wsStatus,
    logs,
    loading,
    error,
    isRunning: simulation?.status === 'RUNNING',
    isComplete: simulation?.status === 'COMPLETED' || simulation?.status === 'FAILED',
  };
}

// Hook for simulation statistics
export function useSimulationStats() {
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
    avgPassRate: 0,
    avgDurationMs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await simulationService.getStatistics();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return { stats, loading };
}
