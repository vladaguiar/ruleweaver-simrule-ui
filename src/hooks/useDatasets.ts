// useDatasets Hook - Custom hook for dataset management

import * as XLSX from 'xlsx';
import { useState, useEffect, useCallback } from 'react';
import { datasetService } from '@/services';
import type { DatasetResponse, UploadDatasetRequest, DatasetFilters, DatasetSchemaResponse } from '@/types/api.types';

export interface UseDatasetsState {
  datasets: DatasetResponse[];
  loading: boolean;
  error: string | null;
  selectedDataset: DatasetResponse | null;
}

export interface UseDatasetsActions {
  refresh: () => Promise<void>;
  getById: (id: string) => Promise<DatasetResponse>;
  upload: (request: UploadDatasetRequest) => Promise<DatasetResponse>;
  uploadFile: (
    file: File,
    metadata: {
      name?: string;
      description?: string;
      factType: string;
      tags?: string[];
    }
  ) => Promise<DatasetResponse>;
  remove: (id: string) => Promise<void>;
  setSelectedDataset: (dataset: DatasetResponse | null) => void;
  search: (query: string) => Promise<DatasetResponse[]>;
  getFactTypes: () => Promise<string[]>;
}

export function useDatasets(filters?: DatasetFilters): UseDatasetsState & UseDatasetsActions {
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<DatasetResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetService.getAll(filters);
      setDatasets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getById = useCallback(async (id: string): Promise<DatasetResponse> => {
    return datasetService.getById(id);
  }, []);

  const upload = useCallback(async (request: UploadDatasetRequest): Promise<DatasetResponse> => {
    const uploaded = await datasetService.upload(request);
    setDatasets((prev) => [...prev, uploaded]);
    return uploaded;
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      metadata: {
        name?: string;
        description?: string;
        factType: string;
        tags?: string[];
      }
    ): Promise<DatasetResponse> => {
      const uploaded = await datasetService.uploadFile(file, metadata);
      setDatasets((prev) => [...prev, uploaded]);
      return uploaded;
    },
    []
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await datasetService.delete(id);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      if (selectedDataset?.id === id) {
        setSelectedDataset(null);
      }
    },
    [selectedDataset]
  );

  const search = useCallback(async (query: string): Promise<DatasetResponse[]> => {
    return datasetService.search(query);
  }, []);

  const getFactTypes = useCallback(async (): Promise<string[]> => {
    return datasetService.getFactTypes();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    datasets,
    loading,
    error,
    selectedDataset,
    refresh,
    getById,
    upload,
    uploadFile,
    remove,
    setSelectedDataset,
    search,
    getFactTypes,
  };
}

// Hook for a single dataset
export function useDataset(id: string | null) {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setDataset(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await datasetService.getById(id);
      setDataset(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dataset, loading, error, refresh };
}

// Hook for dataset statistics
export function useDatasetStats() {
  const [stats, setStats] = useState({
    total: 0,
    totalRecords: 0,
    byFormat: { JSON: 0, CSV: 0, EXCEL: 0 },
    byFactType: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await datasetService.getStatistics();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return { stats, loading };
}

// Hook for file upload with progress
export function useDatasetUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<DatasetResponse | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      metadata: {
        name?: string;
        description?: string;
        factType: string;
        tags?: string[];
      }
    ): Promise<DatasetResponse | null> => {
      setUploading(true);
      setError(null);
      setUploadedDataset(null);

      try {
        const dataset = await datasetService.uploadFile(file, metadata);
        setUploadedDataset(dataset);
        return dataset;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload dataset';
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setUploading(false);
    setError(null);
    setUploadedDataset(null);
  }, []);

  return {
    uploading,
    error,
    uploadedDataset,
    uploadFile,
    reset,
  };
}

// Hook for dataset preview
export function useDatasetPreview(file: File | null) {
  const [preview, setPreview] = useState<{
    records: Record<string, unknown>[];
    columns: string[];
    format: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseFile = async () => {
      if (!file) {
        setPreview(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const content = await file.text();
        const format = datasetService.detectFormat(file.name);

        let records: Record<string, unknown>[];
        if (format === 'CSV') {
          records = datasetService.parseCSV(content);
        } else if (format === 'JSON') {
          records = datasetService.parseJSON(content);
        } else if (format === 'EXCEL') {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error('Excel file has no sheets');
          }
          const worksheet = workbook.Sheets[sheetName];
          records = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            defval: null,
          });
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }

        // Get columns from first record
        const columns = records.length > 0 ? Object.keys(records[0]) : [];

        // Limit preview to first 10 records
        setPreview({
          records: records.slice(0, 10),
          columns,
          format,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      } finally {
        setLoading(false);
      }
    };

    parseFile();
  }, [file]);

  return { preview, loading, error };
}

// ============================================
// Data-Driven Testing Hooks
// ============================================

/**
 * Hook to get datasets compatible with a specific fact type
 * Used by DatasetPicker to show only relevant datasets
 */
export function useCompatibleDatasets(factType: string | null) {
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDatasets = async () => {
      if (!factType) {
        setDatasets([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await datasetService.getDatasetsByFactType(factType);
        setDatasets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load compatible datasets');
      } finally {
        setLoading(false);
      }
    };

    loadDatasets();
  }, [factType]);

  const refresh = useCallback(async () => {
    if (!factType) {
      setDatasets([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await datasetService.getDatasetsByFactType(factType);
      setDatasets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compatible datasets');
    } finally {
      setLoading(false);
    }
  }, [factType]);

  return { datasets, loading, error, refresh };
}

/**
 * Hook to get dataset schema (field information)
 * Used by FieldMappingEditor to show available fields
 */
export function useDatasetSchema(datasetId: string | null) {
  const [schema, setSchema] = useState<DatasetSchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      if (!datasetId) {
        setSchema(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await datasetService.getDatasetSchema(datasetId);
        setSchema(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dataset schema');
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, [datasetId]);

  const refresh = useCallback(async () => {
    if (!datasetId) {
      setSchema(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await datasetService.getDatasetSchema(datasetId);
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset schema');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  return { schema, loading, error, refresh };
}

/**
 * Hook to get preview records from a dataset
 * Useful for field mapping preview in ScenarioEditor
 */
export function useDatasetPreviewRecords(datasetId: string | null, maxRecords: number = 5) {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecords = async () => {
      if (!datasetId) {
        setRecords([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await datasetService.getPreviewRecords(datasetId, maxRecords);
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview records');
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [datasetId, maxRecords]);

  return { records, loading, error };
}
