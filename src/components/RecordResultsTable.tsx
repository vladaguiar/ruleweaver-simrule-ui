// RecordResultsTable Component - Display per-record execution results for data-driven testing
import React, { useState, useMemo } from 'react';
import { Check, X, ChevronDown, ChevronRight, Filter, AlertCircle, Clock, Zap } from 'lucide-react';
import type { RecordExecutionResult, AssertionResultDto } from '@/types/api.types';

interface RecordResultsTableProps {
  /** Per-record execution results */
  results: RecordExecutionResult[];
  /** Total number of records processed */
  totalRecords: number;
  /** Number of records that passed */
  recordsPassed: number;
  /** Number of records that failed */
  recordsFailed: number;
}

type FilterType = 'all' | 'passed' | 'failed';

export function RecordResultsTable({
  results,
  totalRecords,
  recordsPassed,
  recordsFailed,
}: RecordResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');

  // Toggle row expansion
  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Expand/collapse all rows
  const expandAll = () => {
    setExpandedRows(new Set(filteredResults.map((r) => r.recordIndex)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (filter === 'passed') return r.success;
      if (filter === 'failed') return !r.success;
      return true;
    });
  }, [results, filter]);

  // Calculate success rate
  const successRate = totalRecords > 0 ? ((recordsPassed / totalRecords) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div
        className="flex items-center justify-between p-4 rounded-lg"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {totalRecords} Records Tested
            </span>
            <span
              className="px-2 py-0.5 rounded"
              style={{
                fontSize: '12px',
                backgroundColor: successRate === '100.0' ? '#E8F5E9' : '#FFF3E0',
                color: successRate === '100.0' ? '#2E7D32' : '#E65100',
              }}
            >
              {successRate}% Success
            </span>
          </div>
          <div className="flex items-center gap-4" style={{ fontSize: '13px' }}>
            <span className="flex items-center gap-1" style={{ color: '#2E7D32' }}>
              <Check size={16} />
              {recordsPassed} Passed
            </span>
            <span className="flex items-center gap-1" style={{ color: '#C62828' }}>
              <X size={16} />
              {recordsFailed} Failed
            </span>
          </div>
        </div>

        {/* Filter and actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-2 py-1 border rounded focus:outline-none focus:border-[var(--color-primary)]"
              style={{
                borderColor: 'var(--color-border)',
                fontSize: '13px',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="all">Show All</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
          <div className="flex gap-1 border-l pl-3" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs border rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs border rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--color-surface)' }}>
            <tr>
              <th
                className="w-10 p-3 text-left"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}
              ></th>
              <th
                className="p-3 text-left"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}
              >
                Record ID
              </th>
              <th
                className="p-3 text-left"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}
              >
                Status
              </th>
              <th
                className="p-3 text-left"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}
              >
                Rules Fired
              </th>
              <th
                className="p-3 text-right"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}
              >
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <React.Fragment key={result.recordIndex}>
                {/* Main row */}
                <tr
                  className="cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                  style={{
                    backgroundColor: !result.success ? '#FFF8F8' : 'var(--color-background)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                  onClick={() => toggleRow(result.recordIndex)}
                >
                  <td className="p-3 text-center">
                    {expandedRows.has(result.recordIndex) ? (
                      <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                      <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </td>
                  <td className="p-3">
                    <code
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-primary)',
                        backgroundColor: 'var(--color-surface)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {result.recordId}
                    </code>
                  </td>
                  <td className="p-3">
                    {result.success ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: '12px' }}>
                        <Check size={14} />
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#FFEBEE', color: '#C62828', fontSize: '12px' }}>
                        <X size={14} />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="p-3" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <span className="inline-flex items-center gap-1">
                      <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                      {result.rulesFired?.length || 0} rules
                    </span>
                  </td>
                  <td className="p-3 text-right" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {result.durationMs ?? 0}ms
                    </span>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {expandedRows.has(result.recordIndex) && (
                  <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                    <td colSpan={5} className="p-0">
                      <RecordDetailPanel result={result} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Empty state for filtered results */}
        {filteredResults.length === 0 && (
          <div className="p-8 text-center" style={{ backgroundColor: 'var(--color-background)' }}>
            <AlertCircle size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              No records match the current filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Detail panel for expanded record
interface RecordDetailPanelProps {
  result: RecordExecutionResult;
}

function RecordDetailPanel({ result }: RecordDetailPanelProps) {
  return (
    <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div className="grid grid-cols-2 gap-4" style={{ overflow: 'hidden' }}>
        {/* Original Record */}
        {result.originalRecord && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Original Record
            </h5>
            <pre
              className="p-3 rounded"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
                color: 'var(--color-text-primary)',
                maxHeight: '150px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(result.originalRecord, null, 2)}
            </pre>
          </div>
        )}

        {/* Transformed Fact Data */}
        {result.inputData && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Transformed Fact Data
            </h5>
            <pre
              className="p-3 rounded"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
                color: 'var(--color-text-primary)',
                maxHeight: '150px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(result.inputData, null, 2)}
            </pre>
          </div>
        )}

        {/* Rules Fired */}
        {result.rulesFired && result.rulesFired.length > 0 && (
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Rules Fired ({result.rulesFired.length})
            </h5>
            <ul className="space-y-1">
              {result.rulesFired.map((rule, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Zap size={12} style={{ color: 'var(--color-primary)' }} />
                  <code
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-primary)',
                      backgroundColor: '#E3F2FD',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {rule}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Response */}
        {result.validationResponse && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Validation Response
            </h5>
            <pre
              className="p-3 rounded"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
                color: 'var(--color-text-primary)',
                maxHeight: '150px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(result.validationResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Error Message */}
      {result.errorMessage && (
        <div
          className="p-3 rounded"
          style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2' }}
        >
          <h5 style={{ fontSize: '12px', fontWeight: 600, color: '#C62828', marginBottom: '4px' }}>
            Error
          </h5>
          <p style={{ fontSize: '13px', color: '#C62828' }}>{result.errorMessage}</p>
        </div>
      )}

      {/* Assertion Results */}
      {result.assertionResults && result.assertionResults.length > 0 && (
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Assertions ({result.assertionResults.filter((a) => a.passed).length}/{result.assertionResults.length} passed)
          </h5>
          <div className="space-y-2">
            {result.assertionResults.map((assertion, i) => (
              <AssertionResultRow key={i} assertion={assertion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Assertion result row
interface AssertionResultRowProps {
  assertion: AssertionResultDto;
}

function AssertionResultRow({ assertion }: AssertionResultRowProps) {
  return (
    <div
      className="flex items-start gap-2 p-2 rounded"
      style={{
        backgroundColor: assertion.passed ? '#E8F5E9' : '#FFEBEE',
        border: `1px solid ${assertion.passed ? '#C8E6C9' : '#FFCDD2'}`,
      }}
    >
      {assertion.passed ? (
        <Check size={14} style={{ color: '#2E7D32', flexShrink: 0, marginTop: '2px' }} />
      ) : (
        <X size={14} style={{ color: '#C62828', flexShrink: 0, marginTop: '2px' }} />
      )}
      <div className="flex-1">
        <span style={{ fontSize: '12px', color: assertion.passed ? '#2E7D32' : '#C62828' }}>
          {assertion.description || `${assertion.fieldPath} ${assertion.operator} ${JSON.stringify(assertion.expectedValue)}`}
        </span>
        {!assertion.passed && (
          <div style={{ fontSize: '11px', color: '#C62828', marginTop: '4px' }}>
            Expected: <code>{JSON.stringify(assertion.expectedValue)}</code>
            {' | '}
            Got: <code>{JSON.stringify(assertion.actualValue)}</code>
            {assertion.failureMessage && (
              <div style={{ marginTop: '2px' }}>{assertion.failureMessage}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecordResultsTable;
