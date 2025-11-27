// Hook for fetching fact type schemas from SimRule API
import { useState, useEffect, useCallback } from 'react';
import { schemaService } from '@/services';
import type { FactTypeSchema } from '@/types/api.types';

interface UseSchemasState {
  schemas: FactTypeSchema[];
  factTypes: string[];
  loading: boolean;
  error: string | null;
}

interface UseSchemasActions {
  refresh: () => Promise<void>;
  getSchemaByFactType: (factType: string) => FactTypeSchema | null;
  getRuleSetsForFactType: (factType: string) => string[];
}

export function useSchemas(): UseSchemasState & UseSchemasActions {
  const [schemas, setSchemas] = useState<FactTypeSchema[]>([]);
  const [factTypes, setFactTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schemaService.getAllSchemas();
      setSchemas(response);
      setFactTypes(response.map((s) => s.factType));
    } catch (err) {
      console.error('Failed to fetch schemas:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schemas');
      setSchemas([]);
      setFactTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchSchemas = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await schemaService.getAllSchemas({ signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setSchemas(response);
          setFactTypes(response.map((s) => s.factType));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch schemas:', err);
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load schemas');
          setSchemas([]);
          setFactTypes([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSchemas();

    return () => {
      abortController.abort();
    };
  }, []);

  const getSchemaByFactType = useCallback((factType: string): FactTypeSchema | null => {
    return schemas.find(s => s.factType === factType) || null;
  }, [schemas]);

  const getRuleSetsForFactType = useCallback((factType: string): string[] => {
    const schema = getSchemaByFactType(factType);
    return schema?.associatedRuleSets || [];
  }, [getSchemaByFactType]);

  return {
    schemas,
    factTypes,
    loading,
    error,
    refresh,
    getSchemaByFactType,
    getRuleSetsForFactType
  };
}
