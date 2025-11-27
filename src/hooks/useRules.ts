// Hook for fetching rules from Rule Inspector API
import { useState, useEffect, useCallback } from 'react';
import { ruleService } from '@/services/rule.service';
import type { RuleInfo } from '@/types/api.types';

interface UseRulesParams {
  ruleSet?: string;
  enabled?: boolean; // Conditional fetching
}

interface UseRulesReturn {
  rules: RuleInfo[];
  ruleNames: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRules(params: UseRulesParams = {}): UseRulesReturn {
  const { ruleSet, enabled = true } = params;

  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ruleSet || !enabled) {
      setRules([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedRules = await ruleService.getByRuleSet(ruleSet);
      setRules(fetchedRules);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [ruleSet, enabled]);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchRules = async () => {
      if (!ruleSet || !enabled) {
        setRules([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedRules = await ruleService.getByRuleSet(ruleSet, {
          signal: abortController.signal
        });

        if (!abortController.signal.aborted) {
          setRules(fetchedRules);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch rules:', err);
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load rules');
          setRules([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRules();

    return () => {
      abortController.abort();
    };
  }, [ruleSet, enabled]);

  const ruleNames = rules.map(rule => rule.ruleName);

  return {
    rules,
    ruleNames,
    loading,
    error,
    refresh,
  };
}
