import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Target, CheckCircle, Plus, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useScenarioCounts } from '@/hooks/useScenarios';
import { useSimulations, useSimulationStats } from '@/hooks/useSimulation';
import { useActivityStats } from '@/hooks/useStatistics';
import { useRuleSets } from '@/hooks/useRuleSets';
import { useAppContext } from '@/contexts/AppContext';
import { simulationService, coverageService, statisticsService } from '@/services';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import type { SimulationResponse, TrendsResponse, OverviewResponse, TrendDirection } from '@/types/api.types';

interface DashboardProps {
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Helper to determine status from simulation
function getSimulationStatus(sim: SimulationResponse): 'pass' | 'fail' | 'warning' {
  if (!sim.metrics) return 'warning';
  if (sim.status === 'FAILED') return 'fail';
  if (sim.metrics.successRate >= 95) return 'pass';
  if (sim.metrics.successRate >= 80) return 'warning';
  return 'fail';
}

export function Dashboard({ onNavigate }: DashboardProps) {
  // Get data from hooks
  const { counts: scenarioCounts, loading: scenariosLoading } = useScenarioCounts();
  const { stats: simStats, loading: statsLoading } = useSimulationStats();
  const { activityData, loading: activityLoading } = useActivityStats();
  const { apiStatus, checkApiConnection } = useAppContext();

  // Recent simulations state
  const [recentSimulations, setRecentSimulations] = useState<SimulationResponse[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rule set and coverage state
  const { ruleSetIds: availableRuleSets, loading: ruleSetsLoading } = useRuleSets();
  const [coverageMetrics, setCoverageMetrics] = useState<{
    percentage: number;
    covered: number;
    untested: number;
    total: number;
  } | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(true);

  // KPI trends state
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  // Overview statistics state (single API call for all overview stats)
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Fetch aggregate coverage across all rule sets
  useEffect(() => {
    if (ruleSetsLoading) {
      return;
    }

    if (availableRuleSets.length === 0) {
      setCoverageLoading(false);
      setCoverageMetrics(null);
      return;
    }

    const abortController = new AbortController();
    setCoverageLoading(true);

    const loadAggregateCoverage = async () => {
      try {
        // Fetch coverage for all rule sets in parallel
        const coveragePromises = availableRuleSets.map((ruleSet) =>
          coverageService.getLatest(ruleSet, { signal: abortController.signal }).catch(() => null)
        );

        const coverageResults = await Promise.all(coveragePromises);

        if (abortController.signal.aborted) {
          return;
        }

        // Filter out failed requests and calculate aggregate
        const validReports = coverageResults.filter((report) => report !== null);

        if (validReports.length === 0) {
          setCoverageMetrics(null);
        } else {
          // Calculate totals across all rule sets
          const totals = validReports.reduce(
            (acc, report) => ({
              covered: acc.covered + report.testedRules,
              untested: acc.untested + report.untestedRules,
              total: acc.total + report.totalRules,
            }),
            { covered: 0, untested: 0, total: 0 }
          );

          // Calculate average coverage percentage
          const avgPercentage = totals.total > 0 ? (totals.covered / totals.total) * 100 : 0;

          setCoverageMetrics({
            percentage: avgPercentage,
            covered: totals.covered,
            untested: totals.untested,
            total: totals.total,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load aggregate coverage:', error);
        if (!abortController.signal.aborted) {
          setCoverageMetrics(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setCoverageLoading(false);
        }
      }
    };
    loadAggregateCoverage();

    return () => {
      abortController.abort();
    };
  }, [availableRuleSets, ruleSetsLoading]);

  // Load recent simulations with AbortController for cleanup
  useEffect(() => {
    const abortController = new AbortController();

    const loadRecent = async () => {
      try {
        const recent = await simulationService.getRecent(5, { signal: abortController.signal });
        // Only update state if not aborted
        if (!abortController.signal.aborted) {
          setRecentSimulations(recent);
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load recent simulations:', error);
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingRecent(false);
        }
      }
    };
    loadRecent();

    // Cleanup: abort request if component unmounts
    return () => {
      abortController.abort();
    };
  }, []);

  // Load KPI trends on mount
  useEffect(() => {
    const abortController = new AbortController();

    const loadTrends = async () => {
      try {
        const trendsData = await statisticsService.getTrends('weekly', { signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setTrends(trendsData);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load trends:', error);
      } finally {
        if (!abortController.signal.aborted) {
          setTrendsLoading(false);
        }
      }
    };
    loadTrends();

    return () => {
      abortController.abort();
    };
  }, []);

  // Load overview statistics on mount
  useEffect(() => {
    const abortController = new AbortController();

    const loadOverview = async () => {
      try {
        const overviewData = await statisticsService.getOverview({ signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setOverview(overviewData);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load overview:', error);
      } finally {
        if (!abortController.signal.aborted) {
          setOverviewLoading(false);
        }
      }
    };
    loadOverview();

    return () => {
      abortController.abort();
    };
  }, []);

  // Refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkApiConnection();
    try {
      const [recent, trendsData, overviewData] = await Promise.all([
        simulationService.getRecent(5),
        statisticsService.getTrends('weekly'),
        statisticsService.getOverview(),
      ]);
      setRecentSimulations(recent);
      if (trendsData) {
        setTrends(trendsData);
      }
      if (overviewData) {
        setOverview(overviewData);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setRefreshing(false);
  }, [checkApiConnection]);

  // Helper to get trend data from API response
  const getTrendInfo = (): { change: number; direction: TrendDirection } | null => {
    if (trendsLoading || !trends?.summary) return null;
    return {
      change: trends.summary.percentageChange,
      direction: trends.summary.trend,
    };
  };

  const trendInfo = getTrendInfo();

  // Build KPI data from actual state - prefer overview API when available
  const isLoading = overviewLoading && scenariosLoading;
  const totalScenarios = overview?.totalScenarios ?? scenarioCounts.all;
  const runningSimulations = overview?.runningSimulations ?? simStats.running;
  const completedSimulations = overview?.totalSimulations ?? simStats.completed;
  const successRate = overview?.overallSuccessRate ?? simStats.avgPassRate;

  const kpiData = [
    {
      label: 'Total Scenarios',
      value: isLoading ? '...' : String(totalScenarios),
      trendInfo: trendInfo, // Show overall trend on scenarios
      icon: Activity,
      color: 'var(--color-primary)',
    },
    {
      label: 'Active Sims',
      value: overviewLoading && statsLoading ? '...' : String(runningSimulations),
      status: runningSimulations > 0 ? 'Live' : 'None',
      icon: Activity,
      color: 'var(--color-accent)',
    },
    {
      label: 'Coverage Score',
      value: coverageLoading ? '...' : coverageMetrics ? `${Math.round(coverageMetrics.percentage)}%` : 'N/A',
      icon: Target,
      color: 'var(--color-success)',
    },
    {
      label: 'Recent Runs',
      value: overviewLoading && statsLoading ? '...' : String(completedSimulations),
      status: `${Math.round(successRate)}% Pass`,
      trendInfo: trendInfo, // Show overall trend on recent runs too
      icon: CheckCircle,
      color: 'var(--color-info)',
    },
  ];

  // Coverage data from API
  const coverageData = coverageMetrics ? [
    { name: 'Covered', value: coverageMetrics.covered, color: '#C3E770' },
    { name: 'Untested', value: coverageMetrics.untested, color: '#EF6F53' },
  ] : [];
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1>Dashboard</h1>
          {/* API Status Indicator */}
          <div className="flex items-center gap-2">
            {apiStatus === 'connected' ? (
              <span className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                <Wifi size={14} /> Connected
              </span>
            ) : apiStatus === 'checking' ? (
              <span className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FFF3E0', color: '#5D4037' }}>
                <RefreshCw size={14} className="animate-spin" /> Checking...
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
                <WifiOff size={14} /> Disconnected
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('scenario-editor')}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
            style={{ boxShadow: 'var(--shadow-1)', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            <Plus size={18} />
            New Scenario
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '5px' }}>
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-[var(--color-background)] rounded-lg p-6"
              style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${kpi.color}15` }}>
                  <Icon size={24} style={{ color: kpi.color }} />
                </div>
                {kpi.trendInfo && (
                  <TrendIndicator
                    change={kpi.trendInfo.change}
                    trend={kpi.trendInfo.direction}
                  />
                )}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div className="mt-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {kpi.label}
              </div>
              {kpi.status && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-border)' }}>
                  {kpi.status}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ marginTop: '5px', marginBottom: '5px', gap: '5px' }}>
        {/* Activity Timeline */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Recent Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-2)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Line type="monotone" dataKey="tests" stroke="#285A84" strokeWidth={2} name="Total Tests" />
              <Line type="monotone" dataKey="passed" stroke="#87C1F1" strokeWidth={2} name="Passed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Chart */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Rule Coverage Overview</h3>
          {coverageLoading ? (
            <div className="flex items-center justify-center" style={{ height: '250px' }}>
              <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
              <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Loading coverage...</span>
            </div>
          ) : coverageData.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ height: '250px' }}>
              <Target size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                {availableRuleSets.length === 0 ? 'No rule sets available' : 'No coverage reports generated yet'}
              </p>
              <button
                onClick={() => onNavigate('coverage')}
                className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px' }}
              >
                Generate Coverage Report
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={coverageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {coverageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-2)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {coverageData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('scenario-editor')}
            className="px-6 py-3 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Create Scenario
          </button>
          <button
            onClick={() => onNavigate('simulations')}
            className="px-6 py-3 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Run Simulation
          </button>
          <button
            onClick={() => onNavigate('coverage')}
            className="px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}
          >
            View Reports
          </button>
          <button
            onClick={() => onNavigate('datasets')}
            className="px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}
          >
            Manage Datasets
          </button>
        </div>
      </div>

      {/* Recent Simulations */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)', marginTop: '5px' }}>
        <div className="flex justify-between items-center mb-4">
          <h3>Recent Simulations</h3>
          <button
            onClick={() => onNavigate('results')}
            className="text-[var(--color-primary)] hover:underline"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {loadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
              <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Loading simulations...</span>
            </div>
          ) : recentSimulations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>No simulations yet</p>
              <button
                onClick={() => onNavigate('simulations')}
                className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px' }}
              >
                Run Your First Simulation
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Simulation Name</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Status</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Duration</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Results</th>
                </tr>
              </thead>
              <tbody>
                {recentSimulations.map((sim) => {
                  const status = getSimulationStatus(sim);
                  const duration = sim.metrics
                    ? simulationService.formatDuration(sim.metrics.totalDurationMs)
                    : '-';
                  const results = sim.metrics
                    ? `${sim.metrics.scenariosPassed}/${sim.metrics.totalScenarios}`
                    : '-';

                  return (
                    <tr
                      key={sim.id}
                      onClick={() => onNavigate('results', { simulationId: sim.id })}
                      className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {sim.name || `Simulation ${sim.id.slice(0, 8)}`}
                      </td>
                      <td className="p-4">
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                          style={{
                            backgroundColor:
                              status === 'pass'
                                ? '#C3E770'
                                : status === 'fail'
                                ? '#EF6F53'
                                : '#F7EA73',
                            color:
                              status === 'pass'
                                ? '#1B5E20'
                                : status === 'fail'
                                ? '#FFFFFF'
                                : '#5D4037',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'}
                          {status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Warning'}
                        </span>
                      </td>
                      <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{duration}</td>
                      <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{results}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}