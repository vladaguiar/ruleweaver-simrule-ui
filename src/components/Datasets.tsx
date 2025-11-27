import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Search, Upload, Eye, Download, Trash2, Database, X, FileJson, FileSpreadsheet, File, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Plus, Check, Edit } from 'lucide-react';
import { useDatasets, useDatasetUpload, useDatasetPreview } from '@/hooks/useDatasets';
import { useAppContext } from '@/contexts/AppContext';
import type { DatasetResponse, DatasetFormat, DatasetFilters } from '@/types/api.types';

interface DatasetsProps {
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
}

export function Datasets({ onNavigate }: DatasetsProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [factTypeFilter, setFactTypeFilter] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<DatasetResponse | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const previewPageSize = 10;

  // Filters for API
  const filters: DatasetFilters = useMemo(() => ({
    factType: factTypeFilter || undefined,
  }), [factTypeFilter]);

  // Hooks
  const { datasets, loading, error, refresh, remove } = useDatasets(filters);
  const { addNotification } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique fact types from loaded datasets
  const factTypes = useMemo(() => {
    const types = new Set(datasets.map(d => d.factType));
    return Array.from(types).sort();
  }, [datasets]);

  // Filter datasets by search term (client-side)
  const filteredDatasets = useMemo(() => {
    if (!searchTerm) return datasets;
    const term = searchTerm.toLowerCase();
    return datasets.filter(dataset =>
      dataset.name.toLowerCase().includes(term) ||
      dataset.description?.toLowerCase().includes(term) ||
      dataset.factType.toLowerCase().includes(term) ||
      dataset.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }, [datasets, searchTerm]);

  // Delete handler
  const handleDelete = async (datasetId: string) => {
    try {
      await remove(datasetId);
      addNotification({ type: 'success', title: 'Dataset Deleted', message: 'Dataset deleted successfully' });
      setShowDeleteConfirm(null);
      if (selectedDataset?.id === datasetId) {
        setSelectedDataset(null);
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Delete Failed', message: err instanceof Error ? err.message : 'Failed to delete dataset' });
    }
  };

  // Download handler
  const handleDownload = (dataset: DatasetResponse) => {
    const content = JSON.stringify(dataset.records, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification({ type: 'success', title: 'Download Complete', message: `Downloaded ${dataset.name}` });
  };

  // Format helpers
  const getFormatIcon = (format: DatasetFormat) => {
    switch (format) {
      case 'JSON':
        return <FileJson size={32} />;
      case 'CSV':
        return <FileSpreadsheet size={32} />;
      case 'EXCEL':
        return <FileSpreadsheet size={32} />;
      default:
        return <File size={32} />;
    }
  };

  const getFormatColor = (format: DatasetFormat) => {
    switch (format) {
      case 'JSON':
        return 'var(--color-primary)';
      case 'CSV':
        return '#C3E770';
      case 'EXCEL':
        return '#87C1F1';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatSize = (recordCount: number) => {
    // Estimate size based on record count (rough approximation)
    const estimatedBytes = recordCount * 500; // ~500 bytes per record average
    if (estimatedBytes < 1024) return `${estimatedBytes} B`;
    if (estimatedBytes < 1024 * 1024) return `${(estimatedBytes / 1024).toFixed(1)} KB`;
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (loading && datasets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 style={{ color: 'var(--color-text-primary)' }}>Test Datasets</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>Loading datasets...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && datasets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 style={{ color: 'var(--color-text-primary)' }}>Test Datasets</h1>
        </div>
        <div className="bg-[var(--color-background)] rounded-lg p-8 text-center" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Failed to Load Datasets</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 style={{ color: 'var(--color-text-primary)' }}>Test Datasets</h1>
        <div className="flex gap-3">
          <button
            onClick={() => refresh()}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
            style={{ boxShadow: 'var(--shadow-1)', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            <Upload size={18} />
            Upload
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[var(--color-background)] rounded-lg p-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
            <input
              type="text"
              placeholder="Search datasets by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <select
            value={factTypeFilter}
            onChange={(e) => setFactTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)]"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', minWidth: '180px' }}
          >
            <option value="">All Fact Types</option>
            {factTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--color-background)] rounded-lg p-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Datasets</p>
          <p style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{datasets.length}</p>
        </div>
        <div className="bg-[var(--color-background)] rounded-lg p-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Records</p>
          <p style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {datasets.reduce((sum, d) => sum + d.recordCount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-[var(--color-background)] rounded-lg p-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Fact Types</p>
          <p style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{factTypes.length}</p>
        </div>
        <div className="bg-[var(--color-background)] rounded-lg p-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>In Use</p>
          <p style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {datasets.filter(d => d.usageCount > 0).length}
          </p>
        </div>
      </div>

      {/* Datasets Grid */}
      {filteredDatasets.length === 0 ? (
        <div className="bg-[var(--color-background)] rounded-lg p-8 text-center" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <Database size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>No Datasets Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            {searchTerm || factTypeFilter ? 'Try adjusting your search or filters' : 'Upload your first dataset to get started'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
          >
            Upload Dataset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ marginTop: '5px', marginBottom: '5px', gap: '10px' }}>
          {filteredDatasets.map((dataset) => (
            <div
              key={dataset.id}
              className="bg-[var(--color-background)] rounded-lg p-6 cursor-pointer transition-all border-2 hover:bg-[var(--color-surface)]"
              style={{ boxShadow: 'var(--shadow-1)', borderColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onClick={() => setSelectedDataset(dataset)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${getFormatColor(dataset.format)}15`, color: getFormatColor(dataset.format) }}
                >
                  {getFormatIcon(dataset.format)}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#E3F2FD', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500 }}
                  >
                    v{dataset.version}
                  </span>
                  {dataset.usageCount > 0 && (
                    <span
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#E8F5E9', color: 'var(--color-success)', fontSize: '11px', fontWeight: 500 }}
                    >
                      In use
                    </span>
                  )}
                </div>
              </div>
              <h4 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>{dataset.name}</h4>
              {dataset.description && (
                <p className="mb-3 line-clamp-2" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {dataset.description}
                </p>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <span>📊</span>
                  <span>{dataset.recordCount.toLocaleString()} records</span>
                </div>
                <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <span>📁</span>
                  <span>{dataset.format}</span>
                </div>
                <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <span>🏷️</span>
                  <span>{dataset.factType}</span>
                </div>
                <div className="flex items-center gap-2" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span>🕒</span>
                  <span>Updated {formatDate(dataset.updatedAt)}</span>
                </div>
              </div>
              {dataset.tags && dataset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {dataset.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-surface)', fontSize: '11px', color: 'var(--color-text-secondary)' }}
                    >
                      {tag}
                    </span>
                  ))}
                  {dataset.tags.length > 3 && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      +{dataset.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDataset(dataset);
                    setShowPreviewModal(true);
                    setPreviewPage(0);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '13px', color: 'var(--color-text-primary)' }}
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('dataset-editor', { datasetId: dataset.id });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '13px', color: 'var(--color-primary)' }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(dataset);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '13px', color: 'var(--color-text-primary)' }}
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Instructions / Drop Zone */}
      <div
        className="bg-[#E3F2FD] rounded-lg p-6 border-2 border-dashed cursor-pointer hover:bg-[#BBDEFB] transition-colors"
        style={{ borderColor: 'var(--color-primary)' }}
        onClick={() => setShowUploadModal(true)}
      >
        <div className="text-center">
          <Upload size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
          <h4 className="mb-2">Upload New Dataset</h4>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Click here or use the Upload button above to add new test datasets
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Supported formats: JSON, CSV, Excel (.xlsx)
          </p>
        </div>
      </div>

      {/* Detail Panel Modal */}
      {selectedDataset && !showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setSelectedDataset(null)}>
          <div
            className="bg-[var(--color-background)] rounded-lg p-8 max-w-2xl w-full"
            style={{ boxShadow: 'var(--shadow-4)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${getFormatColor(selectedDataset.format)}15`, color: getFormatColor(selectedDataset.format) }}
                >
                  {getFormatIcon(selectedDataset.format)}
                </div>
                <div>
                  <h2 style={{ color: 'var(--color-text-primary)' }}>{selectedDataset.name}</h2>
                  {selectedDataset.description && (
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {selectedDataset.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedDataset(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                style={{ fontSize: '24px' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Format</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.format}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Fact Type</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.factType}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Records</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.recordCount.toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Size (estimated)</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatSize(selectedDataset.recordCount)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Version</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.version}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Status</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.status}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Created</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {new Date(selectedDataset.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Last Modified</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {new Date(selectedDataset.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Tags</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDataset.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: 'var(--color-surface)', fontSize: '13px', color: 'var(--color-text-primary)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDataset.statistics && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h5 className="mb-3" style={{ color: 'var(--color-text-primary)' }}>Field Statistics</h5>
                  {selectedDataset.statistics.fieldNames && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDataset.statistics.fieldNames.map(field => (
                        <div key={field} className="flex items-center gap-2">
                          <span style={{ color: 'var(--color-primary)' }}>•</span>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {field}
                            {selectedDataset.statistics?.fieldTypes?.[field] && (
                              <span style={{ color: 'var(--color-text-muted)' }}> ({selectedDataset.statistics.fieldTypes[field]})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedDataset.usedByScenarios && selectedDataset.usedByScenarios.length > 0 && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h5 className="mb-3" style={{ color: 'var(--color-text-primary)' }}>Used In Scenarios ({selectedDataset.usageCount})</h5>
                  <ul className="space-y-2">
                    {selectedDataset.usedByScenarios.slice(0, 5).map((scenarioId) => (
                      <li key={scenarioId} className="flex items-center gap-2">
                        <span style={{ color: 'var(--color-primary)' }}>•</span>
                        <button
                          onClick={() => {
                            setSelectedDataset(null);
                            onNavigate('scenario-editor', { scenarioId });
                          }}
                          className="text-[var(--color-primary)] hover:underline"
                          style={{ fontSize: '14px' }}
                        >
                          {scenarioId}
                        </button>
                      </li>
                    ))}
                    {selectedDataset.usedByScenarios.length > 5 && (
                      <li style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        +{selectedDataset.usedByScenarios.length - 5} more scenarios
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => {
                    setShowPreviewModal(true);
                    setPreviewPage(0);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors"
                  style={{ fontSize: '14px', fontWeight: 500 }}
                >
                  <Eye size={18} />
                  Preview Records
                </button>
                <button
                  onClick={() => handleDownload(selectedDataset)}
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors"
                  style={{ fontSize: '14px', fontWeight: 500 }}
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(selectedDataset.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[#FFEBEE] transition-colors"
                  style={{ fontSize: '14px', fontWeight: 500 }}
                  disabled={selectedDataset.usageCount > 0}
                  title={selectedDataset.usageCount > 0 ? 'Cannot delete dataset in use' : ''}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Preview Modal */}
      {showPreviewModal && selectedDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowPreviewModal(false)}>
          <div
            className="bg-[var(--color-background)] rounded-lg w-full max-w-6xl"
            style={{ boxShadow: 'var(--shadow-4)', maxHeight: '90vh', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 style={{ color: 'var(--color-text-primary)' }}>{selectedDataset.name} - Records</h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Showing {previewPage * previewPageSize + 1} - {Math.min((previewPage + 1) * previewPageSize, selectedDataset.recordCount)} of {selectedDataset.recordCount} records
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
                >
                  <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>
            </div>
            <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              <table className="w-full">
                <thead className="sticky top-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <tr>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                      #
                    </th>
                    {selectedDataset.records.length > 0 && Object.keys(selectedDataset.records[0]).map(key => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left"
                        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedDataset.records
                    .slice(previewPage * previewPageSize, (previewPage + 1) * previewPageSize)
                    .map((record, index) => (
                      <tr key={index} className="hover:bg-[var(--color-surface)]">
                        <td className="px-4 py-3" style={{ fontSize: '13px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                          {previewPage * previewPageSize + index + 1}
                        </td>
                        {Object.values(record).map((value, i) => (
                          <td
                            key={i}
                            className="px-4 py-3"
                            style={{ fontSize: '13px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}
                          >
                            {value === null ? (
                              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>null</span>
                            ) : typeof value === 'object' ? (
                              <code style={{ fontSize: '12px', backgroundColor: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                                {JSON.stringify(value)}
                              </code>
                            ) : typeof value === 'boolean' ? (
                              <span style={{ color: value ? 'var(--color-success)' : 'var(--color-error)' }}>
                                {value.toString()}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Page {previewPage + 1} of {Math.ceil(selectedDataset.recordCount / previewPageSize)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                  disabled={previewPage === 0}
                  className="px-3 py-1 border rounded hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPreviewPage(p => Math.min(Math.ceil(selectedDataset.recordCount / previewPageSize) - 1, p + 1))}
                  disabled={previewPage >= Math.ceil(selectedDataset.recordCount / previewPageSize) - 1}
                  className="px-3 py-1 border rounded hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            refresh();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className="bg-[var(--color-background)] rounded-lg p-6 max-w-md w-full"
            style={{ boxShadow: 'var(--shadow-4)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-[#FFEBEE]">
                <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
              </div>
              <h3 style={{ color: 'var(--color-text-primary)' }}>Delete Dataset</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Are you sure you want to delete this dataset? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-[var(--color-error)] text-white rounded hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Upload Modal Component
interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'preview'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [factType, setFactType] = useState('');
  const [tags, setTags] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, error: uploadError, uploadFile, reset } = useDatasetUpload();
  const { preview, loading: previewLoading, error: previewError } = useDatasetPreview(selectedFile);
  const { addNotification } = useAppContext();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    const validExtensions = ['.json', '.csv', '.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      addNotification({ type: 'error', title: 'Invalid File', message: 'Invalid file type. Please upload JSON, CSV, or Excel files.' });
      return;
    }

    setSelectedFile(file);
    setName(file.name.replace(/\.[^/.]+$/, ''));
    setStep('configure');
  };

  const handleUpload = async () => {
    if (!selectedFile || !factType) {
      addNotification({ type: 'error', title: 'Missing Fields', message: 'Please fill in all required fields' });
      return;
    }

    try {
      const result = await uploadFile(selectedFile, {
        name: name || selectedFile.name.replace(/\.[^/.]+$/, ''),
        description: description || undefined,
        factType,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });

      if (result) {
        addNotification({ type: 'success', title: 'Upload Complete', message: `Dataset "${result.name}" uploaded successfully with ${result.recordCount} records` });
        onSuccess();
      }
    } catch (err) {
      addNotification({ type: 'error', title: 'Upload Failed', message: err instanceof Error ? err.message : 'Failed to upload dataset' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div
        className="bg-[var(--color-background)] rounded-lg w-full max-w-2xl"
        style={{ boxShadow: 'var(--shadow-4)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex justify-between items-center">
            <h2 style={{ color: 'var(--color-text-primary)' }}>Upload Dataset</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
            >
              <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mt-4">
            {['select', 'configure', 'preview'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === s ? 'bg-[var(--color-primary)] text-white' :
                    ['select', 'configure', 'preview'].indexOf(step) > i ? 'bg-[var(--color-success)] text-white' :
                    'bg-[var(--color-surface)]'
                  }`}
                  style={{ fontSize: '14px', fontWeight: 500 }}
                >
                  {['select', 'configure', 'preview'].indexOf(step) > i ? <Check size={16} /> : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className="flex-1 h-0.5"
                    style={{
                      backgroundColor: ['select', 'configure', 'preview'].indexOf(step) > i
                        ? 'var(--color-success)'
                        : 'var(--color-border)'
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>Select File</span>
            <span>Configure</span>
            <span>Preview</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'bg-[#E3F2FD] border-[var(--color-primary)]' : 'border-[var(--color-border)]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <Upload size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
              <h4 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Drag & drop your file here
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                or click to browse from your computer
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity"
              >
                Browse Files
              </button>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px' }}>
                Supported formats: JSON, CSV, Excel (.xlsx)
              </p>
            </div>
          )}

          {step === 'configure' && selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                <FileJson size={24} style={{ color: 'var(--color-primary)' }} />
                <div className="flex-1">
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedFile.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setStep('select');
                  }}
                  className="p-1 hover:bg-[var(--color-background)] rounded"
                >
                  <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Dataset Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter dataset name"
                  className="w-full mt-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Fact Type *
                </label>
                <input
                  type="text"
                  value={factType}
                  onChange={(e) => setFactType(e.target.value)}
                  placeholder="e.g., Customer, Order, Payment"
                  className="w-full mt-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  The type of business entity this dataset represents
                </p>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for this dataset"
                  rows={3}
                  className="w-full mt-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  className="w-full mt-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Optional tags for organization (e.g., test, production, sample)
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 style={{ color: 'var(--color-text-primary)' }}>Preview</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Showing first {preview.records.length} of {preview.records.length} parsed records
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded"
                  style={{ backgroundColor: 'var(--color-surface)', fontSize: '12px', color: 'var(--color-text-secondary)' }}
                >
                  {preview.format} • {preview.columns.length} columns
                </span>
              </div>

              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Parsing file...</span>
                </div>
              ) : previewError ? (
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFEBEE' }}>
                  <p style={{ color: 'var(--color-error)', fontSize: '14px' }}>{previewError}</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-64 border rounded" style={{ borderColor: 'var(--color-border)' }}>
                  <table className="w-full">
                    <thead className="sticky top-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                      <tr>
                        {preview.columns.map(col => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left"
                            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.records.map((record, i) => (
                        <tr key={i}>
                          {preview.columns.map(col => (
                            <td
                              key={col}
                              className="px-3 py-2"
                              style={{ fontSize: '12px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}
                            >
                              {record[col] === null ? (
                                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>null</span>
                              ) : typeof record[col] === 'object' ? (
                                JSON.stringify(record[col])
                              ) : (
                                String(record[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {uploadError && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFEBEE' }}>
                  <p style={{ color: 'var(--color-error)', fontSize: '14px' }}>{uploadError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => {
              if (step === 'configure') {
                setStep('select');
                setSelectedFile(null);
              } else if (step === 'preview') {
                setStep('configure');
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {step === 'select' ? 'Cancel' : 'Back'}
          </button>

          {step === 'configure' && (
            <button
              onClick={() => setStep('preview')}
              disabled={!name || !factType}
              className="px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Preview
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={handleUpload}
              disabled={uploading || !!previewError}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Dataset
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
