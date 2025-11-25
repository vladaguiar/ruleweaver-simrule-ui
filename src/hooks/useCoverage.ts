// useCoverage Hook - Custom hook for coverage analysis

import { useState, useEffect, useCallback } from 'react';
import { coverageService } from '@/services';
import type { CoverageReportResponse, RuleCoverageDto } from '@/types/api.types';

export interface UseCoverageState {
  report: CoverageReportResponse | null;
  loading: boolean;
  error: string | null;
}

export interface UseCoverageActions {
  refresh: () => Promise<void>;
  generate: () => Promise<CoverageReportResponse>;
  getHeatmapData: () => Promise<
    Array<{
      rule: string;
      hits: number;
      status: 'covered' | 'low' | 'untested';
      successRate: number;
    }>
  >;
  getTrends: () => Promise<Array<{ date: string; coverage: number }>>;
}

export function useCoverage(ruleSet: string | null): UseCoverageState & UseCoverageActions {
  const [report, setReport] = useState<CoverageReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ruleSet) {
      setReport(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await coverageService.getLatest(ruleSet);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage report');
    } finally {
      setLoading(false);
    }
  }, [ruleSet]);

  const generate = useCallback(async (): Promise<CoverageReportResponse> => {
    if (!ruleSet) {
      throw new Error('No rule set selected');
    }
    const generated = await coverageService.generate(ruleSet);
    setReport(generated);
    return generated;
  }, [ruleSet]);

  const getHeatmapData = useCallback(async () => {
    if (!ruleSet) {
      return [];
    }
    return coverageService.getHeatmapData(ruleSet);
  }, [ruleSet]);

  const getTrends = useCallback(async () => {
    if (!ruleSet) {
      return [];
    }
    return coverageService.getTrends(ruleSet);
  }, [ruleSet]);

  useEffect(() => {
    if (ruleSet) {
      refresh();
    }
  }, [ruleSet, refresh]);

  return {
    report,
    loading,
    error,
    refresh,
    generate,
    getHeatmapData,
    getTrends,
  };
}

// Hook for coverage summary across multiple rule sets
export function useCoverageSummary(ruleSets: string[]) {
  const [summary, setSummary] = useState<
    Array<{
      ruleSet: string;
      coveragePercentage: number;
      totalRules: number;
      testedRules: number;
      untestedRules: number;
    }>
  >([]);
  const [overall, setOverall] = useState({
    overallPercentage: 0,
    totalRules: 0,
    testedRules: 0,
    untestedRules: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (ruleSets.length === 0) {
      setSummary([]);
      setOverall({
        overallPercentage: 0,
        totalRules: 0,
        testedRules: 0,
        untestedRules: 0,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summaryData, overallData] = await Promise.all([
        coverageService.getSummary(ruleSets),
        coverageService.getOverallCoverage(ruleSets),
      ]);
      setSummary(summaryData);
      setOverall(overallData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage summary');
    } finally {
      setLoading(false);
    }
  }, [ruleSets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, overall, loading, error, refresh };
}

// Hook for untested rules
export function useUntestedRules(ruleSets: string[]) {
  const [untestedRules, setUntestedRules] = useState<
    Array<{
      ruleSet: string;
      rules: RuleCoverageDto[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRules = async () => {
      if (ruleSets.length === 0) {
        setUntestedRules([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await coverageService.getAllUntestedRules(ruleSets);
        setUntestedRules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load untested rules');
      } finally {
        setLoading(false);
      }
    };
    loadRules();
  }, [ruleSets]);

  // Flatten to get all untested rules with risk level
  const flattenedRules = untestedRules.flatMap((group) =>
    group.rules.map((rule) => ({
      ...rule,
      ruleSet: group.ruleSet,
      risk: coverageService.getRiskLevel(rule),
    }))
  );

  return { untestedRules: flattenedRules, grouped: untestedRules, loading, error };
}

// Hook for coverage heatmap
export function useCoverageHeatmap(ruleSet: string | null) {
  const [heatmapData, setHeatmapData] = useState<
    Array<{
      rule: string;
      hits: number;
      status: 'covered' | 'low' | 'untested';
      successRate: number;
      color: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!ruleSet) {
        setHeatmapData([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await coverageService.getHeatmapData(ruleSet);
        // Add color based on status
        const dataWithColors = data.map((item) => ({
          ...item,
          color:
            item.status === 'covered'
              ? '#285A84'
              : item.status === 'low'
              ? '#F7EA73'
              : '#E9ECEF',
        }));
        setHeatmapData(dataWithColors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load heatmap data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [ruleSet]);

  return { heatmapData, loading, error };
}

// Hook for coverage trends
export function useCoverageTrends(ruleSet: string | null) {
  const [trends, setTrends] = useState<Array<{ date: string; coverage: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrends = async () => {
      if (!ruleSet) {
        setTrends([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await coverageService.getTrends(ruleSet);
        setTrends(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load coverage trends');
      } finally {
        setLoading(false);
      }
    };
    loadTrends();
  }, [ruleSet]);

  return { trends, loading, error };
}
