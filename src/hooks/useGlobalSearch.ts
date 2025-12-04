// useGlobalSearch Hook - Debounced search across scenarios and simulations

import { useState, useEffect, useCallback } from 'react';
import { scenarioService, simulationService } from '@/services';
import type { ScenarioResponse, SimulationResponse } from '@/types/api.types';

export interface GlobalSearchResults {
  scenarios: ScenarioResponse[];
  simulations: SimulationResponse[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to search across scenarios and simulations with debouncing
 * @param query - The search query string
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Search results with loading and error states
 */
export function useGlobalSearch(query: string, debounceMs = 300): GlobalSearchResults {
  const [results, setResults] = useState<GlobalSearchResults>({
    scenarios: [],
    simulations: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Clear results if query is too short
    if (!query || query.length < 2) {
      setResults({
        scenarios: [],
        simulations: [],
        loading: false,
        error: null,
      });
      return;
    }

    // Set loading state immediately
    setResults((prev) => ({ ...prev, loading: true, error: null }));

    // Debounce the search
    const timer = setTimeout(async () => {
      try {
        // Search both scenarios and simulations in parallel
        const [scenarios, simulations] = await Promise.all([
          scenarioService.search(query),
          simulationService.search(query),
        ]);

        // Limit results to top 5 each for dropdown display
        setResults({
          scenarios: scenarios.slice(0, 5),
          simulations: simulations.slice(0, 5),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Global search failed:', error);
        setResults({
          scenarios: [],
          simulations: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Search failed',
        });
      }
    }, debounceMs);

    // Cleanup timer on unmount or query change
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return results;
}

/**
 * Check if there are any search results
 */
export function hasResults(results: GlobalSearchResults): boolean {
  return results.scenarios.length > 0 || results.simulations.length > 0;
}

/**
 * Get total result count
 */
export function getTotalResultCount(results: GlobalSearchResults): number {
  return results.scenarios.length + results.simulations.length;
}
