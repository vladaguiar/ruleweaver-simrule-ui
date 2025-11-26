// Hook for fetching rule sets from Rule Inspector API
import { useState, useEffect, useCallback } from 'react';
import { ruleSetService } from '@/services';
import type { RuleSetInfo } from '@/types/api.types';

interface UseRuleSetsState {
  ruleSets: RuleSetInfo[];
  ruleSetIds: string[];
  loading: boolean;
  error: string | null;
}

interface UseRuleSetsActions {
  refresh: () => Promise<void>;
}

export function useRuleSets(): UseRuleSetsState & UseRuleSetsActions {
  const [ruleSets, setRuleSets] = useState<RuleSetInfo[]>([]);
  const [ruleSetIds, setRuleSetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ruleSetService.getAll();
      setRuleSets(response.ruleSets);
      setRuleSetIds(response.ruleSets.map((rs) => rs.ruleSetId));
    } catch (err) {
      console.error('Failed to fetch rule sets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rule sets');
      setRuleSets([]);
      setRuleSetIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchRuleSets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ruleSetService.getAll({ signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setRuleSets(response.ruleSets);
          setRuleSetIds(response.ruleSets.map((rs) => rs.ruleSetId));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch rule sets:', err);
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load rule sets');
          setRuleSets([]);
          setRuleSetIds([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRuleSets();

    return () => {
      abortController.abort();
    };
  }, []);

  return { ruleSets, ruleSetIds, loading, error, refresh };
}
