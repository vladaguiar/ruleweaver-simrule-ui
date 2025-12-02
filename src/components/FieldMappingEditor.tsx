// FieldMappingEditor Component - Map dataset fields to fact type fields
import React, { useEffect, useMemo } from 'react';
import { Plus, Trash2, ArrowRight, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useDatasetSchema } from '@/hooks/useDatasets';
import type { FieldMapping, DatasetFieldInfo } from '@/types/api.types';

interface FieldMappingEditorProps {
  /** Dataset ID to get fields from */
  datasetId: string;
  /** Fact type for the scenario */
  factType: string;
  /** Current field mappings */
  value: FieldMapping[];
  /** Callback when mappings change */
  onChange: (mappings: FieldMapping[]) => void;
  /** Optional: known fields from fact schema */
  factTypeFields?: string[];
  /** Whether the editor is disabled */
  disabled?: boolean;
}

// Transformation options for field values
const TRANSFORMATION_OPTIONS: { value: FieldMapping['transformation'] | ''; label: string }[] = [
  { value: '', label: 'Auto (no transformation)' },
  { value: 'STRING', label: 'String' },
  { value: 'INTEGER', label: 'Integer' },
  { value: 'LONG', label: 'Long' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'DATE', label: 'Date (ISO-8601)' },
];

export function FieldMappingEditor({
  datasetId,
  factType,
  value,
  onChange,
  factTypeFields = [],
  disabled = false,
}: FieldMappingEditorProps) {
  const { schema, loading, error, refresh } = useDatasetSchema(datasetId);

  // Auto-generate default mappings when dataset changes (if no mappings exist)
  useEffect(() => {
    if (schema && value.length === 0 && schema.fields.length > 0) {
      // Create default 1:1 mappings for all fields
      const defaultMappings: FieldMapping[] = schema.fields
        .filter((f) => !f.name.startsWith('_')) // Skip internal fields
        .map((f) => ({
          datasetField: f.name,
          factField: f.name,
          transformation: undefined,
          defaultValue: undefined,
        }));
      onChange(defaultMappings);
    }
  }, [schema, value.length, onChange]);

  // Add a new empty mapping
  const addMapping = () => {
    onChange([
      ...value,
      { datasetField: '', factField: '', transformation: undefined, defaultValue: undefined },
    ]);
  };

  // Remove a mapping by index
  const removeMapping = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Update a mapping at a specific index
  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const newMappings = [...value];
    newMappings[index] = { ...newMappings[index], ...updates };
    onChange(newMappings);
  };

  // Reset mappings to auto-generated defaults
  const resetToDefaults = () => {
    if (schema) {
      const defaultMappings: FieldMapping[] = schema.fields
        .filter((f) => !f.name.startsWith('_'))
        .map((f) => ({
          datasetField: f.name,
          factField: f.name,
          transformation: undefined,
          defaultValue: undefined,
        }));
      onChange(defaultMappings);
    }
  };

  // Get type badge color
  const getTypeBadgeStyle = (type: DatasetFieldInfo['inferredType']) => {
    const colors: Record<DatasetFieldInfo['inferredType'], { bg: string; color: string }> = {
      STRING: { bg: '#E3F2FD', color: '#1565C0' },
      INTEGER: { bg: '#E8F5E9', color: '#2E7D32' },
      DOUBLE: { bg: '#FFF3E0', color: '#EF6C00' },
      BOOLEAN: { bg: '#F3E5F5', color: '#7B1FA2' },
      OBJECT: { bg: '#ECEFF1', color: '#546E7A' },
      ARRAY: { bg: '#E0F2F1', color: '#00695C' },
    };
    return colors[type] || { bg: '#F5F5F5', color: '#616161' };
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="p-6 rounded-lg flex items-center justify-center gap-3"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Loading dataset schema...
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
            Failed to load dataset schema
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

  const datasetFields = schema?.fields || [];

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Field Mappings
        </h4>
        <div className="flex gap-2">
          {value.length > 0 && (
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={disabled}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <RefreshCw size={14} />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={addMapping}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#E3F2FD', color: 'var(--color-primary)' }}
          >
            <Plus size={14} />
            Add Mapping
          </button>
        </div>
      </div>

      {/* Empty state */}
      {value.length === 0 ? (
        <div
          className="p-6 rounded-lg text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
          }}
        >
          <Info size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            No field mappings configured
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Dataset fields will be passed through directly to the fact type.
          </p>
          <button
            type="button"
            onClick={addMapping}
            disabled={disabled}
            className="px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '13px' }}
          >
            Add a mapping to transform fields
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-[5px]">
          {/* Mapping rows - horizontal single-line cards */}
          {value.map((mapping, index) => (
            <MappingRow
              key={index}
              mapping={mapping}
              index={index}
              datasetFields={datasetFields}
              factTypeFields={factTypeFields}
              disabled={disabled}
              onUpdate={(updates) => updateMapping(index, updates)}
              onRemove={() => removeMapping(index)}
              getTypeBadgeStyle={getTypeBadgeStyle}
            />
          ))}
        </div>
      )}

      {/* Help text */}
      <div
        className="p-3 rounded-lg flex items-start gap-2"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Info size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <p>
            Map dataset fields to fact type fields. Use transformations to convert data types.
          </p>
          <p style={{ marginTop: '4px' }}>
            {schema?.recordCount ? (
              <>
                Dataset has <strong>{schema.recordCount}</strong> records with <strong>{datasetFields.length}</strong> fields.
              </>
            ) : (
              'If no mappings are configured, dataset fields are passed through directly.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// Individual mapping row component
interface MappingRowProps {
  mapping: FieldMapping;
  index: number;
  datasetFields: DatasetFieldInfo[];
  factTypeFields: string[];
  disabled: boolean;
  onUpdate: (updates: Partial<FieldMapping>) => void;
  onRemove: () => void;
  getTypeBadgeStyle: (type: DatasetFieldInfo['inferredType']) => { bg: string; color: string };
}

function MappingRow({
  mapping,
  index,
  datasetFields,
  factTypeFields,
  disabled,
  onUpdate,
  onRemove,
  getTypeBadgeStyle,
}: MappingRowProps) {
  // Find the selected dataset field to show its type
  const selectedField = useMemo(
    () => datasetFields.find((f) => f.name === mapping.datasetField),
    [datasetFields, mapping.datasetField]
  );

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Dataset Field */}
      <select
        value={mapping.datasetField}
        onChange={(e) => onUpdate({ datasetField: e.target.value })}
        disabled={disabled}
        className="px-3 py-1.5 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          fontSize: '13px',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          minWidth: '180px',
        }}
      >
        <option value="">Select field...</option>
        {datasetFields.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name} ({f.inferredType})
          </option>
        ))}
      </select>

      {/* Type badge - inline */}
      {selectedField && (
        <span
          className="px-2 py-0.5 rounded whitespace-nowrap"
          style={{
            fontSize: '10px',
            backgroundColor: getTypeBadgeStyle(selectedField.inferredType).bg,
            color: getTypeBadgeStyle(selectedField.inferredType).color,
          }}
        >
          {selectedField.inferredType}
          {selectedField.nullable && ' (nullable)'}
        </span>
      )}

      {/* Arrow */}
      <ArrowRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />

      {/* Fact Field */}
      <input
        type="text"
        value={mapping.factField}
        onChange={(e) => onUpdate({ factField: e.target.value })}
        placeholder="Fact field name"
        disabled={disabled}
        className="flex-1 px-3 py-1.5 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          fontSize: '13px',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          minWidth: '150px',
        }}
        list={`fact-fields-${index}`}
      />
      {factTypeFields.length > 0 && (
        <datalist id={`fact-fields-${index}`}>
          {factTypeFields.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      )}

      {/* Transformation */}
      <select
        value={mapping.transformation || ''}
        onChange={(e) =>
          onUpdate({
            transformation: (e.target.value as FieldMapping['transformation']) || undefined,
          })
        }
        disabled={disabled}
        className="px-3 py-1.5 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          fontSize: '13px',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          minWidth: '160px',
        }}
      >
        {TRANSFORMATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Remove button - right-justified */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="p-1.5 rounded hover:bg-[#FFEBEE] transition-colors disabled:opacity-50 ml-auto"
        title="Remove mapping"
      >
        <Trash2 size={16} style={{ color: 'var(--color-error)' }} />
      </button>
    </div>
  );
}

export default FieldMappingEditor;
