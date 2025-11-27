// Tests for Schema Service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchemaService } from './schema.service';
import { apiService } from './api.service';
import type { FactTypeSchema } from '@/types/api.types';

// Mock the api service
vi.mock('./api.service', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SchemaService', () => {
  let schemaService: SchemaService;

  const mockSchema: FactTypeSchema = {
    factType: 'Customer',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Customer ID',
      },
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Customer name',
        constraints: {
          minLength: 1,
          maxLength: 100,
        },
      },
      {
        name: 'age',
        type: 'integer',
        required: false,
        description: 'Customer age',
        constraints: {
          min: 0,
          max: 150,
        },
      },
      {
        name: 'email',
        type: 'string',
        required: false,
        description: 'Email address',
        constraints: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
      },
      {
        name: 'status',
        type: 'string',
        required: true,
        description: 'Customer status',
        constraints: {
          allowedValues: ['ACTIVE', 'INACTIVE', 'PENDING'],
        },
      },
    ],
    fieldCount: 5,
    requiredFieldCount: 3,
  };

  beforeEach(() => {
    schemaService = new SchemaService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    schemaService.clearCache();
  });

  describe('getSchema', () => {
    it('should fetch schema for a fact type', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockSchema);

      const result = await schemaService.getSchema('Customer');

      expect(apiService.get).toHaveBeenCalledWith(
        '/schemas/Customer',
        undefined
      );
      expect(result).toEqual(mockSchema);
    });

    it('should cache schema after first fetch', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockSchema);

      // First call
      await schemaService.getSchema('Customer');
      // Second call
      await schemaService.getSchema('Customer');

      // API should only be called once due to caching
      expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('should return null when schema not found (404)', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 404 });

      const result = await schemaService.getSchema('NonExistent');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 500 });

      await expect(schemaService.getSchema('Customer')).rejects.toEqual({ status: 500 });
    });

    it('should encode fact type in URL', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockSchema);

      await schemaService.getSchema('My Fact Type');

      expect(apiService.get).toHaveBeenCalledWith(
        '/schemas/My%20Fact%20Type',
        undefined
      );
    });
  });

  describe('getSampleData', () => {
    it('should fetch sample data for a fact type', async () => {
      const sampleResponse = {
        factType: 'Customer',
        sample: { id: 'sample-1', name: 'John Doe', status: 'ACTIVE' },
      };
      vi.mocked(apiService.get).mockResolvedValue(sampleResponse);

      const result = await schemaService.getSampleData('Customer');

      expect(apiService.get).toHaveBeenCalledWith(
        '/schemas/Customer/sample',
        undefined
      );
      expect(result).toEqual(sampleResponse);
    });

    it('should return null when sample generation not available (404)', async () => {
      vi.mocked(apiService.get).mockRejectedValue({ status: 404 });

      const result = await schemaService.getSampleData('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('validateData', () => {
    it('should return empty array for valid data', () => {
      const validData = {
        id: 'cust-1',
        name: 'John Doe',
        age: 30,
        status: 'ACTIVE',
      };

      const errors = schemaService.validateData(validData, mockSchema);

      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {
        id: 'cust-1',
        // missing 'name' and 'status'
      };

      const errors = schemaService.validateData(invalidData, mockSchema);

      expect(errors.some(e => e.field === 'name' && e.type === 'required')).toBe(true);
      expect(errors.some(e => e.field === 'status' && e.type === 'required')).toBe(true);
    });

    it('should detect type mismatches', () => {
      const invalidData = {
        id: 'cust-1',
        name: 'John',
        age: 'thirty', // should be integer
        status: 'ACTIVE',
      };

      const errors = schemaService.validateData(invalidData, mockSchema);

      expect(errors.some(e => e.field === 'age' && e.type === 'type')).toBe(true);
    });

    it('should validate string length constraints', () => {
      const invalidData = {
        id: 'cust-1',
        name: '', // minLength is 1
        status: 'ACTIVE',
      };

      const errors = schemaService.validateData(invalidData, mockSchema);

      expect(errors.some(e => e.field === 'name' && e.type === 'constraint')).toBe(true);
    });

    it('should validate numeric range constraints', () => {
      const invalidData = {
        id: 'cust-1',
        name: 'John',
        age: -5, // min is 0
        status: 'ACTIVE',
      };

      const errors = schemaService.validateData(invalidData, mockSchema);

      expect(errors.some(e => e.field === 'age' && e.type === 'constraint')).toBe(true);
    });

    it('should validate allowed values (enum)', () => {
      const invalidData = {
        id: 'cust-1',
        name: 'John',
        status: 'INVALID_STATUS',
      };

      const errors = schemaService.validateData(invalidData, mockSchema);

      expect(errors.some(e => e.field === 'status' && e.type === 'constraint')).toBe(true);
    });

    it('should allow optional fields to be missing', () => {
      const validData = {
        id: 'cust-1',
        name: 'John Doe',
        status: 'ACTIVE',
        // 'age' and 'email' are optional
      };

      const errors = schemaService.validateData(validData, mockSchema);

      expect(errors).toHaveLength(0);
    });

    it('should detect null values for required fields', () => {
      const invalidData = {
        id: 'cust-1',
        name: null,
        status: 'ACTIVE',
      };

      const errors = schemaService.validateData(invalidData as Record<string, unknown>, mockSchema);

      expect(errors.some(e => e.field === 'name' && e.type === 'required')).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear entire cache', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockSchema);

      // Populate cache
      await schemaService.getSchema('Customer');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Clear cache
      schemaService.clearCache();

      // Should fetch again
      await schemaService.getSchema('Customer');
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    it('should invalidate specific schema from cache', async () => {
      vi.mocked(apiService.get).mockResolvedValue(mockSchema);

      // Populate cache
      await schemaService.getSchema('Customer');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Invalidate specific entry
      schemaService.invalidateCache('Customer');

      // Should fetch again
      await schemaService.getSchema('Customer');
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });
  });
});
