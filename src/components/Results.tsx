import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, FileText, Table, FileJson, RefreshCw, AlertCircle, ArrowLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { simulationService } from '@/services';
import { useAppContext } from '@/contexts/AppContext';
import type { SimulationResponse, ScenarioResultDto, SimulationStatus } from '@/types/api.types';

interface ResultsProps {
  simulationId?: string;
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Helper to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function Results({ simulationId, onNavigate }: ResultsProps) {
  const { addNotification } = useAppContext();

  // State for simulations list
  const [simulations, setSimulations] = useState<SimulationResponse[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // State for selected simulation details
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationResponse | null>(null);
  const [selectedScenarioResult, setSelectedScenarioResult] = useState<ScenarioResultDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SimulationStatus>('all');
  const [scenarioStatusFilter, setScenarioStatusFilter] = useState<'all' | 'PASSED' | 'FAILED' | 'ERROR'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Load simulations list
  const loadSimulations = useCallback(async () => {
    setLoadingList(true);
    try {
      // Build proper filter object
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;

      // API returns array directly, not paginated response - handle pagination client-side
      const allSimulations = await simulationService.getAll(filters);

      // Client-side pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedSimulations = allSimulations.slice(startIndex, endIndex);

      setSimulations(paginatedSimulations);
      setTotalPages(Math.ceil(allSimulations.length / pageSize) || 1);
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Failed to Load',
        message: 'Could not load simulations',
      });
      setSimulations([]);
    } finally {
      setLoadingList(false);
    }
  }, [currentPage, statusFilter, addNotification]);

  // Load simulation details
  const loadSimulationDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    try {
      const simulation = await simulationService.getById(id);
      setSelectedSimulation(simulation);
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Failed to Load',
        message: 'Could not load simulation details',
      });
    } finally {
      setLoadingDetails(false);
    }
  }, [addNotification]);

  // Load data on mount
  useEffect(() => {
    if (simulationId) {
      loadSimulationDetails(simulationId);
    } else {
      loadSimulations();
    }
  }, [simulationId, loadSimulations, loadSimulationDetails]);

  // Filter scenario results
  const filteredScenarioResults = selectedSimulation?.results?.filter(result => {
    const matchesSearch = result.scenarioName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.scenarioId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = scenarioStatusFilter === 'all' || result.status === scenarioStatusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Export functions
  const handleExportCSV = () => {
    if (!selectedSimulation) return;

    const headers = ['Scenario Name', 'Status', 'Duration (ms)', 'Rules Fired', 'Error'];
    const rows = selectedSimulation.results?.map(r => [
      r.scenarioName || r.scenarioId,
      r.status,
      r.executionTimeMs?.toString() || '',
      r.rulesFired?.join('; ') || '',
      r.errorMessage || '',
    ]) || [];

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${selectedSimulation.id}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!selectedSimulation) return;

    const blob = new Blob([JSON.stringify(selectedSimulation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${selectedSimulation.id}-full.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Scenario detail view
  if (selectedScenarioResult) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedScenarioResult(null)}
            className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
          >
            <ArrowLeft size={24} style={{ color: 'var(--color-primary)' }} />
          </button>
          <div>
            <h1>Scenario Result: {selectedScenarioResult.scenarioName || selectedScenarioResult.scenarioId}</h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Part of simulation: {selectedSimulation?.name || selectedSimulation?.id}
            </p>
          </div>
        </div>

        {/* Execution Details */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Execution Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Scenario ID:</span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                {selectedScenarioResult.scenarioId}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Duration:</span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {selectedScenarioResult.executionTimeMs ? formatDuration(selectedScenarioResult.executionTimeMs) : '-'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Status:</span>
              <p>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: selectedScenarioResult.status === 'PASSED' ? '#C3E770' :
                      selectedScenarioResult.status === 'FAILED' ? '#EF6F53' : '#F7EA73',
                    color: selectedScenarioResult.status === 'PASSED' ? '#1B5E20' :
                      selectedScenarioResult.status === 'FAILED' ? '#FFFFFF' : '#5D4037',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {selectedScenarioResult.status === 'PASSED' ? '✅' : selectedScenarioResult.status === 'FAILED' ? '❌' : '⚠️'}
                  {selectedScenarioResult.status}
                </span>
              </p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Validation Result:</span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {selectedScenarioResult.validationPassed ? 'Valid' : 'Invalid'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {selectedScenarioResult.errorMessage && (
          <div className="p-4 rounded" style={{ backgroundColor: '#FFEBEE', border: '1px solid #EF6F53' }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={20} style={{ color: 'var(--color-error)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-error)' }}>Error</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-error)', fontFamily: 'monospace' }}>
              {selectedScenarioResult.errorMessage}
            </p>
          </div>
        )}

        {/* Rules Fired */}
        {selectedScenarioResult.rulesFired && selectedScenarioResult.rulesFired.length > 0 && (
          <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
            <h3 className="mb-4">Rules Fired ({selectedScenarioResult.rulesFired.length})</h3>
            <div className="space-y-2">
              {selectedScenarioResult.rulesFired.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded"
                  style={{ fontSize: '14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <CheckCircle size={16} style={{ color: '#C3E770' }} />
                  <span style={{ fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assertion Results */}
        {selectedScenarioResult.assertionResults && selectedScenarioResult.assertionResults.length > 0 && (
          <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
            <h3 className="mb-4">Assertion Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Field</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Expected</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Actual</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedScenarioResult.assertionResults.map((assertion, index) => (
                    <tr
                      key={index}
                      className="border-b"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: assertion.passed ? '#E8F5E9' : '#FFEBEE',
                      }}
                    >
                      <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>
                        {assertion.fieldPath}
                      </td>
                      <td className="p-4" style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                        {String(assertion.expectedValue)}
                      </td>
                      <td className="p-4" style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                        {String(assertion.actualValue)}
                      </td>
                      <td className="p-4" style={{ fontSize: '14px' }}>
                        {assertion.passed ? '✅ Pass' : '❌ Fail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modified Fact Data */}
        {selectedScenarioResult.modifiedFactData && (
          <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
            <h3 className="mb-4">Modified Fact Data</h3>
            <pre
              className="bg-[var(--color-surface)] p-4 rounded overflow-x-auto"
              style={{ fontFamily: 'monospace', fontSize: '12px', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {JSON.stringify(selectedScenarioResult.modifiedFactData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Simulation details view
  if (selectedSimulation) {
    const passed = selectedSimulation.results?.filter(r => r.status === 'PASSED').length || 0;
    const failed = selectedSimulation.results?.filter(r => r.status === 'FAILED').length || 0;
    const errors = selectedSimulation.results?.filter(r => r.status === 'ERROR').length || 0;
    const totalDuration = selectedSimulation.metrics?.totalDurationMs || 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedSimulation(null);
              if (simulationId) {
                onNavigate('results');
              }
            }}
            className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
          >
            <ArrowLeft size={24} style={{ color: 'var(--color-primary)' }} />
          </button>
          <div className="flex-1">
            <h1>{selectedSimulation.name || `Simulation ${selectedSimulation.id.slice(0, 8)}`}</h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {formatDate(selectedSimulation.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadSimulationDetails(selectedSimulation.id)}
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="bg-[#E3F2FD] rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} style={{ color: '#1B5E20' }} />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{passed} Passed</span>
            </div>
            <div className="h-6 w-px bg-[#87C1F1]"></div>
            <div className="flex items-center gap-2">
              <XCircle size={20} style={{ color: '#EF6F53' }} />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{failed} Failed</span>
            </div>
            <div className="h-6 w-px bg-[#87C1F1]"></div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} style={{ color: '#F7EA73' }} />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{errors} Errors</span>
            </div>
            <div className="h-6 w-px bg-[#87C1F1]"></div>
            <div className="flex items-center gap-2">
              <Clock size={20} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{formatDuration(totalDuration)}</span>
            </div>
            <div className="h-6 w-px bg-[#87C1F1]"></div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                {selectedSimulation.metrics?.successRate?.toFixed(1) || 0}% Pass Rate
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-background)] rounded-lg p-4 flex flex-col md:flex-row gap-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <select
            value={scenarioStatusFilter}
            onChange={(e) => setScenarioStatusFilter(e.target.value as typeof scenarioStatusFilter)}
            className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          >
            <option value="all">All Status</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="ERROR">Error</option>
          </select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <div className="overflow-x-auto">
            {filteredScenarioResults.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>No scenario results found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Scenario Name</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Status</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Duration</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Rules Fired</th>
                    <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScenarioResults.map((result) => (
                    <React.Fragment key={result.scenarioId}>
                      <tr
                        className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)' }}
                        onClick={() => setSelectedScenarioResult(result)}
                      >
                        <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          {result.scenarioName || result.scenarioId}
                        </td>
                        <td className="p-4">
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: result.status === 'PASSED' ? '#C3E770' :
                                result.status === 'FAILED' ? '#EF6F53' : '#F7EA73',
                              color: result.status === 'PASSED' ? '#1B5E20' :
                                result.status === 'FAILED' ? '#FFFFFF' : '#5D4037',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️'}
                            {result.status}
                          </span>
                        </td>
                        <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          {result.executionTimeMs ? formatDuration(result.executionTimeMs) : '-'}
                        </td>
                        <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {result.rulesFired?.length || 0}
                        </td>
                        <td className="p-4">
                          <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                        </td>
                      </tr>
                      {result.errorMessage && (
                        <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: '#FFEBEE' }}>
                          <td colSpan={5} className="p-4 pl-12" style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--color-error)' }}>
                            └─ {result.errorMessage}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Export Options</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}
            >
              <Table size={18} />
              CSV Export
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}
            >
              <FileJson size={18} />
              JSON Export
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simulations list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Simulation Results</h1>
        <button
          onClick={loadSimulations}
          disabled={loadingList}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
        >
          <RefreshCw size={18} className={loadingList ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-background)] rounded-lg p-4 flex flex-col md:flex-row gap-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <option value="all">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="RUNNING">Running</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search simulations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Simulations List */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        {loadingList ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
            <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Loading simulations...</span>
          </div>
        ) : simulations.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>No simulations found</p>
            <button
              onClick={() => onNavigate('simulations')}
              className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
              style={{ fontSize: '14px' }}
            >
              Run a Simulation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Simulation</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Status</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Pass Rate</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Duration</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Date</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {simulations
                  .filter(sim => sim.name?.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm)
                  .map((sim) => (
                    <tr
                      key={sim.id}
                      className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                      style={{ borderColor: 'var(--color-border)' }}
                      onClick={() => setSelectedSimulation(sim)}
                    >
                      <td className="p-4">
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {sim.name || `Simulation ${sim.id.slice(0, 8)}`}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {sim.metrics?.totalScenarios || 0} scenarios
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: sim.status === 'COMPLETED' ? '#C3E770' :
                              sim.status === 'RUNNING' ? '#87C1F1' :
                                sim.status === 'FAILED' ? '#EF6F53' : '#C7CDD0',
                            color: sim.status === 'COMPLETED' ? '#1B5E20' :
                              sim.status === 'RUNNING' ? '#0D47A1' :
                                sim.status === 'FAILED' ? '#FFFFFF' : '#212529',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {sim.status}
                        </span>
                      </td>
                      <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {sim.metrics?.successRate?.toFixed(1) || 0}%
                      </td>
                      <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {sim.metrics?.totalDurationMs ? formatDuration(sim.metrics.totalDurationMs) : '-'}
                      </td>
                      <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(sim.createdAt)}
                      </td>
                      <td className="p-4">
                        <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded hover:bg-[var(--color-background)] transition-colors disabled:opacity-50"
              style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded hover:bg-[var(--color-background)] transition-colors disabled:opacity-50"
              style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
