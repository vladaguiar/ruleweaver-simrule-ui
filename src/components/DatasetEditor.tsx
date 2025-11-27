// DatasetEditor component for editing dataset metadata
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { datasetService } from '@/services/dataset.service';
import { useAppContext } from '@/contexts/AppContext';
import type { DatasetResponse, UpdateDatasetRequest } from '@/types/api.types';

interface DatasetEditorProps {
  datasetId?: string;
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string; datasetId?: string }) => void;
}

export function DatasetEditor({ datasetId, onNavigate }: DatasetEditorProps) {
  const { addNotification } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [formData, setFormData] = useState<UpdateDatasetRequest>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasetId) {
      loadDataset();
    } else {
      setError('No dataset ID provided');
      setLoading(false);
    }
  }, [datasetId]);

  const loadDataset = async () => {
    if (!datasetId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await datasetService.getById(datasetId);
      setDataset(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        tags: data.tags || [],
        status: data.status,
      });
    } catch (err) {
      console.error('Failed to load dataset:', err);
      setError('Unable to load dataset');
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Unable to load dataset',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!datasetId) return;

    setSaving(true);
    try {
      await datasetService.update(datasetId, formData);
      addNotification({
        type: 'success',
        title: 'Dataset Updated',
        message: 'Changes saved successfully',
      });
      setHasChanges(false);
      onNavigate('datasets');
    } catch (err: unknown) {
      console.error('Failed to update dataset:', err);
      const apiError = err as { status?: number; message?: string };

      if (apiError.status === 409) {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Dataset is in use by an active simulation',
        });
      } else if (apiError.status === 404) {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Dataset not found',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Unable to save changes',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof UpdateDatasetRequest>(
    field: K,
    value: UpdateDatasetRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    onNavigate('datasets');
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('datasets')}
            className="p-2 rounded hover:bg-[var(--color-surface)]"
          >
            <ArrowLeft size={20} style={{ color: 'var(--color-text-primary)' }} />
          </button>
          <h1 style={{ color: 'var(--color-text-primary)' }}>Edit Dataset</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
          <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>Loading dataset...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dataset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('datasets')}
            className="p-2 rounded hover:bg-[var(--color-surface)]"
          >
            <ArrowLeft size={20} style={{ color: 'var(--color-text-primary)' }} />
          </button>
          <h1 style={{ color: 'var(--color-text-primary)' }}>Edit Dataset</h1>
        </div>
        <div className="bg-[var(--color-background)] rounded-lg p-8 text-center" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Failed to Load Dataset</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{error || 'Dataset not found'}</p>
          <button
            onClick={() => onNavigate('datasets')}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Back to Datasets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 rounded hover:bg-[var(--color-surface)]"
          >
            <ArrowLeft size={20} style={{ color: 'var(--color-text-primary)' }} />
          </button>
          <h1 style={{ color: 'var(--color-text-primary)' }}>Edit Dataset</h1>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm" style={{ color: 'var(--color-warning)' }}>
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleCancel}
            className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Fact Type
            </label>
            <input
              type="text"
              value={dataset.factType}
              disabled
              className="w-full px-4 py-2 border rounded opacity-50 cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Fact type cannot be changed after creation
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              placeholder="Optional description for this dataset"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Tags
            </label>
            <TagInput
              value={formData.tags || []}
              onChange={(tags) => updateField('tags', tags)}
            />
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Status
            </label>
            <select
              value={formData.status || 'ACTIVE'}
              onChange={(e) => updateField('status', e.target.value as 'ACTIVE' | 'ARCHIVED')}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Format
            </label>
            <input
              type="text"
              value={dataset.format}
              disabled
              className="w-full px-4 py-2 border rounded opacity-50 cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
            />
          </div>
        </div>

        {/* Read-only info section */}
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <h4 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>Dataset Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Records</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {dataset.recordCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Version</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {dataset.version}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Usage Count</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {dataset.usageCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Created</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {new Date(dataset.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            To modify records, please delete this dataset and re-upload with updated data.
          </p>
        </div>
      </div>
    </div>
  );
}

// TagInput component for managing tags
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:opacity-70"
              type="button"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={addTag}
          type="button"
          className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
