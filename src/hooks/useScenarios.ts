// useScenarios Hook - Custom hook for scenario management

import { useState, useEffect, useCallback, useRef } from 'react';
import { scenarioService } from '@/services';
import type { PaginationParams } from '@/services/scenario.service';
import type {
  ScenarioResponse,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  ScenarioFilters,
  ScenarioStatus,
  PaginatedResponse,
} from '@/types/api.types';

export type { PaginationParams };

export interface UseScenariosState {
  scenarios: ScenarioResponse[];
  loading: boolean;
  error: string | null;
  selectedScenario: ScenarioResponse | null;
}

export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UseScenariosActions {
  refresh: () => Promise<void>;
  getById: (id: string) => Promise<ScenarioResponse>;
  create: (scenario: CreateScenarioRequest) => Promise<ScenarioResponse>;
  update: (id: string, scenario: UpdateScenarioRequest) => Promise<ScenarioResponse>;
  remove: (id: string) => Promise<void>;
  clone: (id: string) => Promise<ScenarioResponse>;
  bulkDelete: (ids: string[]) => Promise<void>;
  activate: (id: string) => Promise<ScenarioResponse>;
  archive: (id: string) => Promise<ScenarioResponse>;
  setSelectedScenario: (scenario: ScenarioResponse | null) => void;
  search: (query: string) => Promise<ScenarioResponse[]>;
  getRuleSets: () => Promise<string[]>;
  getTags: () => Promise<string[]>;
}

export function useScenarios(filters?: ScenarioFilters): UseScenariosState & UseScenariosActions {
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scenarioService.getAll(filters);
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getById = useCallback(async (id: string): Promise<ScenarioResponse> => {
    return scenarioService.getById(id);
  }, []);

  const create = useCallback(async (scenario: CreateScenarioRequest): Promise<ScenarioResponse> => {
    setError(null);
    const created = await scenarioService.create(scenario);
    setScenarios((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(
    async (id: string, scenario: UpdateScenarioRequest): Promise<ScenarioResponse> => {
      setError(null);
      const updated = await scenarioService.update(id, scenario);
      setScenarios((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (selectedScenario?.id === id) {
        setSelectedScenario(updated);
      }
      return updated;
    },
    [selectedScenario]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await scenarioService.delete(id);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      if (selectedScenario?.id === id) {
        setSelectedScenario(null);
      }
    },
    [selectedScenario]
  );

  const clone = useCallback(async (id: string): Promise<ScenarioResponse> => {
    setError(null);
    const cloned = await scenarioService.clone(id);
    setScenarios((prev) => [...prev, cloned]);
    return cloned;
  }, []);

  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      setError(null);
      const deletedIds: string[] = [];
      const errors: string[] = [];

      // Delete one by one to track which ones succeed
      for (const id of ids) {
        try {
          await scenarioService.delete(id);
          deletedIds.push(id);
        } catch (err) {
          errors.push(`Failed to delete ${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Update state with successfully deleted items
      if (deletedIds.length > 0) {
        setScenarios((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
        if (selectedScenario && deletedIds.includes(selectedScenario.id)) {
          setSelectedScenario(null);
        }
      }

      // If there were any errors, throw with details
      if (errors.length > 0) {
        throw new Error(
          `Deleted ${deletedIds.length}/${ids.length} scenarios. Errors: ${errors.join('; ')}`
        );
      }
    },
    [selectedScenario]
  );

  const activate = useCallback(
    async (id: string): Promise<ScenarioResponse> => {
      return update(id, { status: 'ACTIVE' });
    },
    [update]
  );

  const archive = useCallback(
    async (id: string): Promise<ScenarioResponse> => {
      return update(id, { status: 'ARCHIVED' });
    },
    [update]
  );

  const search = useCallback(async (query: string): Promise<ScenarioResponse[]> => {
    return scenarioService.search(query);
  }, []);

  const getRuleSets = useCallback(async (): Promise<string[]> => {
    return scenarioService.getRuleSets();
  }, []);

  const getTags = useCallback(async (): Promise<string[]> => {
    return scenarioService.getTags();
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    scenarios,
    loading,
    error,
    selectedScenario,
    refresh,
    getById,
    create,
    update,
    remove,
    clone,
    bulkDelete,
    activate,
    archive,
    setSelectedScenario,
    search,
    getRuleSets,
    getTags,
  };
}

// Hook for a single scenario
export function useScenario(id: string | null) {
  const [scenario, setScenario] = useState<ScenarioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!id) {
      setScenario(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await scenarioService.getById(id);
      if (!isMountedRef.current) return;
      setScenario(data);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load scenario');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scenario, loading, error, refresh };
}

// Hook for scenario counts by status
export function useScenarioCounts() {
  const [counts, setCounts] = useState<Record<ScenarioStatus | 'all', number>>({
    all: 0,
    ACTIVE: 0,
    DRAFT: 0,
    ARCHIVED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const loadCounts = async () => {
      try {
        if (!isMountedRef.current) return;
        setError(null);
        const scenarios = await scenarioService.getAll();
        // Check if still mounted after async operation
        if (!isMountedRef.current) return;
        const newCounts: Record<ScenarioStatus | 'all', number> = {
          all: scenarios.length,
          ACTIVE: 0,
          DRAFT: 0,
          ARCHIVED: 0,
        };
        scenarios.forEach((s) => {
          newCounts[s.status]++;
        });
        setCounts(newCounts);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load scenario counts');
        console.error('Failed to load scenario counts:', err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    loadCounts();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { counts, loading, error };
}

// Hook for paginated scenarios
export interface UsePaginatedScenariosOptions {
  initialPage?: number;
  initialPageSize?: number;
  filters?: ScenarioFilters;
}

export interface UsePaginatedScenariosReturn {
  scenarios: ScenarioResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePaginatedScenarios(
  options?: UsePaginatedScenariosOptions
): UsePaginatedScenariosReturn {
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: options?.initialPage ?? 0,
    size: options?.initialPageSize ?? 10,
    totalElements: 0,
    totalPages: 0,
  });
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scenarioService.getPaginated(
        { page: pagination.page, size: pagination.size },
        options?.filters
      );
      if (!isMountedRef.current) return;
      setScenarios(result.content);
      setPagination(prev => ({
        ...prev,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.size, options?.filters]);

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load data when pagination changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page: Math.max(0, Math.min(page, prev.totalPages - 1)) }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 0 })); // Reset to first page when changing size
  }, []);

  const goToFirstPage = useCallback(() => setPage(0), [setPage]);
  const goToLastPage = useCallback(() => setPage(pagination.totalPages - 1), [setPage, pagination.totalPages]);
  const goToNextPage = useCallback(() => setPage(pagination.page + 1), [setPage, pagination.page]);
  const goToPreviousPage = useCallback(() => setPage(pagination.page - 1), [setPage, pagination.page]);

  const hasNextPage = pagination.page < pagination.totalPages - 1;
  const hasPreviousPage = pagination.page > 0;

  return {
    scenarios,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    refresh,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
  };
}
