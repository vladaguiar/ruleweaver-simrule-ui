// DatasetPicker Component - Select datasets by fact type for data-driven testing
import React, { useMemo } from 'react';
import { Database, Upload, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useCompatibleDatasets } from '@/hooks/useDatasets';
import type { DatasetResponse } from '@/types/api.types';

interface DatasetPickerProps {
  /** Fact type to filter datasets by */
  factType: string | null;
  /** Currently selected dataset ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (datasetId: string | null) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Callback to navigate to datasets page */
  onNavigateToDatasets?: () => void;
}

export function DatasetPicker({
  factType,
  value,
  onChange,
  disabled = false,
  onNavigateToDatasets,
}: DatasetPickerProps) {
  const { datasets, loading, error, refresh } = useCompatibleDatasets(factType);

  // Find the selected dataset for display
  const selectedDataset = useMemo(
    () => datasets.find((d) => d.id === value),
    [datasets, value]
  );

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // No fact type selected
  if (!factType) {
    return (
      <div
        className="p-4 rounded-lg flex items-start gap-3"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Info size={20} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Select a <strong>Fact Type</strong> first to see available datasets
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="p-4 rounded-lg flex items-center gap-3"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Loading datasets for {factType}...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="p-4 rounded-lg flex items-start gap-3"
        style={{
          backgroundColor: '#FFEBEE',
          border: '1px solid var(--color-error)',
        }}
      >
        <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
        <div className="flex-1">
          <p style={{ fontSize: '14px', color: 'var(--color-error)', fontWeight: 500 }}>
            Failed to load datasets
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {error}
          </p>
          <button
            onClick={() => refresh()}
            className="mt-2 px-3 py-1 rounded hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--color-error)',
              color: 'white',
              fontSize: '13px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No compatible datasets found
  if (datasets.length === 0) {
    return (
      <div
        className="p-4 rounded-lg flex items-start gap-3"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
        }}
      >
        <Database size={20} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <div className="flex-1">
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            No datasets found for fact type <strong>{factType}</strong>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Upload a dataset with this fact type to enable data-driven testing.
          </p>
          {onNavigateToDatasets && (
            <button
              onClick={onNavigateToDatasets}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '13px',
              }}
            >
              <Upload size={14} />
              Upload Dataset
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dropdown select */}
      <div className="flex gap-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            fontSize: '14px',
            backgroundColor: disabled ? 'var(--color-surface)' : 'var(--color-background)',
            color: 'var(--color-text-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="">Select a dataset...</option>
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name} ({dataset.recordCount} records)
            </option>
          ))}
        </select>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="px-3 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
          style={{ borderColor: 'var(--color-border)' }}
          title="Refresh datasets"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Selected dataset info card */}
      {selectedDataset && (
        <DatasetInfoCard dataset={selectedDataset} formatDate={formatDate} />
      )}

      {/* Help text */}
      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Showing {datasets.length} dataset(s) with fact type "{factType}"
      </p>
    </div>
  );
}

// Info card for selected dataset
interface DatasetInfoCardProps {
  dataset: DatasetResponse;
  formatDate: (date: string) => string;
}

function DatasetInfoCard({ dataset, formatDate }: DatasetInfoCardProps) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: '#E3F2FD',
        border: '1px solid #BBDEFB',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginBottom: '4px',
            }}
          >
            {dataset.name}
          </h4>
          {dataset.description && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
              }}
            >
              {dataset.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1">
              <Database size={12} />
              {dataset.recordCount.toLocaleString()} records
            </span>
            <span>
              Format: {dataset.format}
            </span>
            <span>
              Created: {formatDate(dataset.createdAt)}
            </span>
            {dataset.version > 1 && (
              <span>
                v{dataset.version}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {dataset.tags && dataset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {dataset.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'white',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Info about data-driven execution */}
      <div
        className="mt-3 pt-3"
        style={{
          borderTop: '1px solid #BBDEFB',
          fontSize: '12px',
          color: '#1565C0',
        }}
      >
        This scenario will execute <strong>{dataset.recordCount} times</strong> (once per record)
      </div>
    </div>
  );
}

export default DatasetPicker;
