import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, FileText, Table, FileJson, RefreshCw, AlertCircle, ArrowLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Database, Sparkles } from 'lucide-react';
import { simulationService } from '@/services';
import { useAppContext } from '@/contexts/AppContext';
import { Pagination } from '@/components/ui/Pagination';
import { RecordResultsTable } from '@/components/RecordResultsTable';
import type { SimulationResponse, ScenarioExecutionDto, SimulationStatus } from '@/types/api.types';

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

// Modified Fact section for scenario-level display
interface ScenarioModifiedFactSectionProps {
  inputData?: Record<string, unknown>;
  modifiedFact: Record<string, unknown>;
}

function ScenarioModifiedFactSection({ inputData, modifiedFact }: ScenarioModifiedFactSectionProps) {
  const [showRawJson, setShowRawJson] = React.useState(false);

  // Calculate changed fields
  const changedFields = React.useMemo(() => {
    if (!inputData) return Object.keys(modifiedFact);
    return Object.keys(modifiedFact).filter(
      (key) => JSON.stringify(inputData[key]) !== JSON.stringify(modifiedFact[key])
    );
  }, [inputData, modifiedFact]);

  // Calculate new fields (in modifiedFact but not in inputData)
  const newFields = React.useMemo(() => {
    if (!inputData) return [];
    return Object.keys(modifiedFact).filter((key) => !(key in inputData));
  }, [inputData, modifiedFact]);

  return (
    <div
      className="bg-[var(--color-background)] rounded-lg p-6"
      style={{
        boxShadow: 'var(--shadow-1)',
        border: '1px solid var(--color-primary)',
        borderLeft: '4px solid var(--color-primary)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
          <h3>Modified Fact Data</h3>
          {changedFields.length > 0 && (
            <span
              className="px-2 py-0.5 rounded"
              style={{
                fontSize: '12px',
                backgroundColor: '#E3F2FD',
                color: 'var(--color-primary)',
              }}
            >
              {changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed
            </span>
          )}
        </div>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="px-3 py-1 text-sm border rounded hover:bg-[var(--color-surface)] transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          {showRawJson ? 'Hide JSON' : 'Show JSON'}
        </button>
      </div>

      {/* Visual diff table */}
      {changedFields.length > 0 && inputData ? (
        <div
          className="rounded-lg overflow-hidden mb-4"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-surface)' }}>
              <tr>
                <th
                  className="text-left p-3"
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}
                >
                  Field
                </th>
                <th
                  className="text-left p-3"
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}
                >
                  Before
                </th>
                <th
                  className="text-left p-3"
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}
                >
                  After
                </th>
              </tr>
            </thead>
            <tbody>
              {changedFields.map((field) => (
                <tr
                  key={field}
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <td className="p-3">
                    <code
                      style={{
                        fontSize: '13px',
                        backgroundColor: 'var(--color-surface)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {field}
                    </code>
                    {newFields.includes(field) && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded"
                        style={{
                          fontSize: '10px',
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          fontWeight: 600,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      style={{
                        color: '#C62828',
                        textDecoration: newFields.includes(field) ? 'none' : 'line-through',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {newFields.includes(field)
                        ? '—'
                        : JSON.stringify(inputData[field] ?? null)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      style={{
                        color: '#2E7D32',
                        fontWeight: 600,
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {JSON.stringify(modifiedFact[field])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : changedFields.length === 0 && inputData ? (
        <p
          className="text-center py-4 rounded mb-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            fontSize: '14px',
            color: 'var(--color-text-muted)',
          }}
        >
          No fields were modified by rules
        </p>
      ) : null}

      {/* Collapsible raw JSON */}
      {showRawJson && (
        <pre
          className="p-4 rounded overflow-x-auto"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-text-primary)',
            fontFamily: 'monospace',
            maxHeight: '300px',
          }}
        >
          {JSON.stringify(modifiedFact, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function Results({ simulationId, onNavigate }: ResultsProps) {
  const { addNotification } = useAppContext();

  // State for simulations list
  const [simulations, setSimulations] = useState<SimulationResponse[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // State for selected simulation details
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationResponse | null>(null);
  const [selectedScenarioResult, setSelectedScenarioResult] = useState<ScenarioExecutionDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SimulationStatus>('all');
  const [scenarioStatusFilter, setScenarioStatusFilter] = useState<'all' | 'PASSED' | 'FAILED' | 'ERROR'>('all');

  // Pagination for simulations list (0-based page index)
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Pagination for scenario results within simulation detail view
  const [scenarioResultsPage, setScenarioResultsPage] = useState(0);
  const [scenarioResultsPageSize, setScenarioResultsPageSize] = useState(10);

  // Load simulations list
  const loadSimulations = useCallback(async () => {
    setLoadingList(true);
    try {
      // Build proper filter object
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;

      // API returns array directly, not paginated response - handle pagination client-side
      const allSimulations = await simulationService.getAll(filters);

      // Client-side pagination (0-based indexing)
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedSimulations = allSimulations.slice(startIndex, endIndex);

      setSimulations(paginatedSimulations);
      setTotalPages(Math.ceil(allSimulations.length / pageSize) || 1);
      setTotalItems(allSimulations.length);
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
  }, [currentPage, pageSize, statusFilter, addNotification]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
  }, []);

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
  const filteredScenarioResults = selectedSimulation?.scenarioExecutions?.filter(result => {
    const matchesSearch = result.scenarioName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.scenarioId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = scenarioStatusFilter === 'all' ||
      (scenarioStatusFilter === 'PASSED' && result.success === true) ||
      (scenarioStatusFilter === 'FAILED' && result.success === false);
    return matchesSearch && matchesStatus;
  }) || [];

  // Paginate scenario results
  const paginatedScenarioResults = filteredScenarioResults.slice(
    scenarioResultsPage * scenarioResultsPageSize,
    (scenarioResultsPage + 1) * scenarioResultsPageSize
  );
  const scenarioResultsTotalPages = Math.ceil(filteredScenarioResults.length / scenarioResultsPageSize) || 1;

  // Reset scenario results page when search/filter changes
  useEffect(() => {
    setScenarioResultsPage(0);
  }, [searchTerm, scenarioStatusFilter, selectedSimulation?.id]);

  // Export functions
  const handleExportCSV = () => {
    if (!selectedSimulation) return;

    const lines: string[] = [];
    const escape = (val: string | number | undefined | null) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    // Summary section
    lines.push('=== SIMULATION SUMMARY ===');
    lines.push(`Simulation ID,${escape(selectedSimulation.id)}`);
    lines.push(`Simulation Name,${escape(selectedSimulation.name || 'Unnamed')}`);
    lines.push(`Status,${escape(selectedSimulation.status)}`);
    lines.push(`Executed At,${escape(selectedSimulation.startedAt || selectedSimulation.createdAt)}`);
    lines.push(`Completed At,${escape(selectedSimulation.completedAt || '')}`);
    lines.push(`Total Duration (ms),${selectedSimulation.metrics?.totalDurationMs || 0}`);
    lines.push(`Total Scenarios,${selectedSimulation.metrics?.totalScenarios || 0}`);
    lines.push(`Scenarios Passed,${selectedSimulation.metrics?.scenariosPassed || 0}`);
    lines.push(`Scenarios Failed,${selectedSimulation.metrics?.scenariosFailed || 0}`);
    lines.push(`Success Rate,${(selectedSimulation.metrics?.successRate || 0).toFixed(1)}%`);
    lines.push('');

    // Data-driven metrics (if applicable)
    if (selectedSimulation.metrics?.dataDrivenScenarios) {
      lines.push('=== DATA-DRIVEN METRICS ===');
      lines.push(`Data-Driven Scenarios,${selectedSimulation.metrics.dataDrivenScenarios}`);
      lines.push(`Total Records Processed,${selectedSimulation.metrics.totalRecordsProcessed || 0}`);
      lines.push(`Records Passed,${selectedSimulation.metrics.totalRecordsPassed || 0}`);
      lines.push(`Records Failed,${selectedSimulation.metrics.totalRecordsFailed || 0}`);
      lines.push(`Record Success Rate,${(selectedSimulation.metrics.recordSuccessRate || 0).toFixed(1)}%`);
      lines.push('');
    }

    // Scenario results header
    lines.push('=== SCENARIO RESULTS ===');
    const headers = [
      'Scenario ID',
      'Scenario Name',
      'Status',
      'Duration (ms)',
      'Duration',
      'Rules Fired Count',
      'Rules Fired',
      'Data-Driven',
      'Dataset ID',
      'Total Records',
      'Records Passed',
      'Records Failed',
      'Record Success Rate',
      'Error'
    ];
    lines.push(headers.map(h => escape(h)).join(','));

    // Scenario rows
    selectedSimulation.scenarioExecutions?.forEach(r => {
      const recordSuccessRate = r.totalRecords && r.totalRecords > 0
        ? ((r.recordsPassed || 0) / r.totalRecords * 100).toFixed(1) + '%'
        : '';

      const row = [
        r.scenarioId,
        r.scenarioName || r.scenarioId,
        r.success ? 'PASSED' : 'FAILED',
        r.durationMs || 0,
        formatDuration(r.durationMs || 0),
        r.rulesFired?.length || 0,
        r.rulesFired?.join('; ') || '',
        r.dataDriven ? 'Yes' : 'No',
        r.datasetId || '',
        r.totalRecords || '',
        r.recordsPassed || '',
        r.recordsFailed || '',
        recordSuccessRate,
        r.errorMessage || ''
      ];
      lines.push(row.map(v => escape(v)).join(','));
    });

    // Per-record execution results for data-driven scenarios
    selectedSimulation.scenarioExecutions?.forEach(r => {
      if (r.dataDriven && r.recordExecutions && r.recordExecutions.length > 0) {
        lines.push('');
        lines.push(`=== PER-RECORD RESULTS: ${r.scenarioName || r.scenarioId} ===`);

        // Header row
        const recordHeaders = ['Record ID', 'Status', 'Rules Fired', 'Duration', 'Modified Fact'];
        lines.push(recordHeaders.map(h => escape(h)).join(','));

        // Record rows
        r.recordExecutions.forEach(rec => {
          const recordRow = [
            rec.recordId,
            rec.success ? 'Passed' : 'Failed',
            rec.rulesFired?.length || 0,
            rec.durationMs ? `${rec.durationMs}ms` : '',
            rec.modifiedFact ? JSON.stringify(rec.modifiedFact) : ''
          ];
          lines.push(recordRow.map(v => escape(v)).join(','));
        });
      }

      // Add scenario-level modified fact
      if (r.modifiedFact) {
        lines.push('');
        lines.push(`=== MODIFIED FACT: ${r.scenarioName || r.scenarioId} ===`);
        lines.push(`"Modified Fact",${escape(JSON.stringify(r.modifiedFact))}`);
      }
    });

    // Download
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${selectedSimulation.id}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!selectedSimulation) return;

    const exportData = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        exportVersion: '2.0'
      },
      simulation: {
        id: selectedSimulation.id,
        name: selectedSimulation.name,
        status: selectedSimulation.status,
        executionMode: selectedSimulation.executionMode,
        startedAt: selectedSimulation.startedAt,
        completedAt: selectedSimulation.completedAt,
        executedBy: selectedSimulation.executedBy,
        createdAt: selectedSimulation.createdAt
      },
      metrics: {
        ...selectedSimulation.metrics,
        dataDrivenMetrics: selectedSimulation.metrics?.dataDrivenScenarios ? {
          dataDrivenScenarios: selectedSimulation.metrics.dataDrivenScenarios,
          totalRecordsProcessed: selectedSimulation.metrics.totalRecordsProcessed,
          totalRecordsPassed: selectedSimulation.metrics.totalRecordsPassed,
          totalRecordsFailed: selectedSimulation.metrics.totalRecordsFailed,
          recordSuccessRate: selectedSimulation.metrics.recordSuccessRate
        } : null
      },
      scenarioExecutions: selectedSimulation.scenarioExecutions?.map(r => ({
        scenarioId: r.scenarioId,
        scenarioName: r.scenarioName,
        success: r.success,
        durationMs: r.durationMs,
        durationFormatted: formatDuration(r.durationMs || 0),
        rulesFired: r.rulesFired,
        rulesFiredCount: r.rulesFired?.length || 0,
        errorMessage: r.errorMessage || null,
        assertionResults: r.assertionResults,
        dataDriven: r.dataDriven || false,
        datasetInfo: r.dataDriven ? {
          datasetId: r.datasetId,
          totalRecords: r.totalRecords,
          recordsPassed: r.recordsPassed,
          recordsFailed: r.recordsFailed,
          recordSuccessRate: r.totalRecords ? (r.recordsPassed || 0) / r.totalRecords : null
        } : null,
        modifiedFact: r.modifiedFact || null,
        recordExecutions: r.dataDriven && r.recordExecutions
          ? r.recordExecutions.map(rec => ({
              recordId: rec.recordId,
              recordIndex: rec.recordIndex,
              status: rec.success ? 'Passed' : 'Failed',
              success: rec.success,
              rulesFired: rec.rulesFired,
              rulesFiredCount: rec.rulesFired?.length || 0,
              durationMs: rec.durationMs,
              errorMessage: rec.errorMessage || null,
              modifiedFact: rec.modifiedFact || null
            }))
          : null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${selectedSimulation.id}-report.json`;
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
          <div className="flex items-center gap-2 mb-4">
            <h3>Execution Details</h3>
            {selectedScenarioResult.dataDriven && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ fontSize: '10px', backgroundColor: '#E3F2FD', color: 'var(--color-primary)' }}
              >
                <Database size={12} />
                Data-Driven
              </span>
            )}
          </div>
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
                {selectedScenarioResult.durationMs ? formatDuration(selectedScenarioResult.durationMs) : '-'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Status:</span>
              <p>
                {(() => {
                  const status = selectedScenarioResult.success ? 'PASSED' : 'FAILED';
                  const bgColor = status === 'PASSED' ? '#C3E770' : '#EF6F53';
                  const textColor = status === 'PASSED' ? '#1B5E20' : '#FFFFFF';
                  const icon = status === 'PASSED' ? '✅' : '❌';

                  return (
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {icon} {status}
                    </span>
                  );
                })()}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {selectedScenarioResult.dataDriven ? 'Records Passed:' : 'Validation Result:'}
              </span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {selectedScenarioResult.dataDriven
                  ? `${selectedScenarioResult.recordsPassed || 0} / ${selectedScenarioResult.totalRecords || 0}`
                  : ((selectedScenarioResult.validationResponse as Record<string, unknown>)?.isValid === true ? 'Valid' : 'Invalid')}
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

        {/* Per-Record Execution Results (for both data-driven and non-data-driven scenarios) */}
        {selectedScenarioResult.recordExecutions && selectedScenarioResult.recordExecutions.length > 0 && (
          <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Database size={20} style={{ color: 'var(--color-primary)' }} />
              <h3>Per-Record Execution Results</h3>
              {selectedScenarioResult.dataDriven && (
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ fontSize: '10px', backgroundColor: '#E3F2FD', color: 'var(--color-primary)' }}
                >
                  Data-Driven
                </span>
              )}
            </div>
            <RecordResultsTable
              results={selectedScenarioResult.recordExecutions}
              totalRecords={selectedScenarioResult.totalRecords || selectedScenarioResult.recordExecutions.length}
              recordsPassed={selectedScenarioResult.recordsPassed || selectedScenarioResult.recordExecutions.filter(r => r.success).length}
              recordsFailed={selectedScenarioResult.recordsFailed || selectedScenarioResult.recordExecutions.filter(r => !r.success).length}
            />
          </div>
        )}

        {/* Assertion Results (for non-data-driven scenarios) */}
        {selectedScenarioResult.assertionResults && selectedScenarioResult.assertionResults.length > 0 && !selectedScenarioResult.dataDriven && (
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
        {selectedScenarioResult.modifiedFact && (
          <ScenarioModifiedFactSection
            inputData={selectedScenarioResult.inputData}
            modifiedFact={selectedScenarioResult.modifiedFact}
          />
        )}
      </div>
    );
  }

  // Simulation details view
  if (selectedSimulation) {
    const passed = selectedSimulation.scenarioExecutions?.filter(r => r.success === true).length || 0;
    const failed = selectedSimulation.scenarioExecutions?.filter(r => r.success === false).length || 0;
    const errors = 0; // No separate error status in scenarioExecutions, failures are marked with success=false
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
                {selectedSimulation.metrics?.successRate !== undefined && selectedSimulation.metrics?.successRate !== null
                  ? `${selectedSimulation.metrics.successRate.toFixed(1)}% Pass Rate`
                  : '- Pass Rate'}
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
          <div className="overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
                  {paginatedScenarioResults.map((result) => (
                    <React.Fragment key={result.scenarioId}>
                      <tr
                        className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)' }}
                        onClick={() => setSelectedScenarioResult(result)}
                      >
                        <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          <div className="flex items-center gap-2">
                            {result.scenarioName || result.scenarioId}
                            {result.dataDriven && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                                style={{ fontSize: '10px', backgroundColor: '#E3F2FD', color: 'var(--color-primary)' }}
                              >
                                <Database size={10} />
                                {result.totalRecords} records
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {(() => {
                            const status = result.success ? 'PASSED' : 'FAILED';
                            const bgColor = status === 'PASSED' ? '#C3E770' : '#EF6F53';
                            const textColor = status === 'PASSED' ? '#1B5E20' : '#FFFFFF';
                            const icon = status === 'PASSED' ? '✅' : '❌';

                            return (
                              <span
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                                style={{
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  fontSize: '12px',
                                  fontWeight: 500,
                                }}
                              >
                                {icon} {status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          {result.durationMs ? formatDuration(result.durationMs) : '-'}
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

          {/* Pagination for scenario results */}
          {filteredScenarioResults.length > 0 && (
            <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <Pagination
                currentPage={scenarioResultsPage}
                totalPages={scenarioResultsTotalPages}
                totalElements={filteredScenarioResults.length}
                pageSize={scenarioResultsPageSize}
                onPageChange={(page) => {
                  if (page >= 0 && page < scenarioResultsTotalPages) {
                    setScenarioResultsPage(page);
                  }
                }}
                onPageSizeChange={(size) => {
                  setScenarioResultsPageSize(size);
                  setScenarioResultsPage(0);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
                showPageInfo={true}
                showFirstLast={true}
              />
            </div>
          )}
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
                        {sim.metrics?.successRate !== undefined && sim.metrics?.successRate !== null
                          ? `${sim.metrics.successRate.toFixed(1)}%`
                          : '-'}
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
        {totalItems > 0 && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[5, 10, 20, 50]}
              showPageSizeSelector={true}
              showPageInfo={true}
              showFirstLast={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
