// Schema Service for SimRule UI
// Handles fact type schema operations for validation and sample data generation

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type { FactTypeSchema, SampleDataResponse, FieldDefinition } from '@/types/api.types';

class SchemaService {
  // Cache for schemas to avoid repeated API calls
  private schemaCache: Map<string, FactTypeSchema> = new Map();

  /**
   * Get schema for a specific fact type
   * Uses caching to avoid repeated API calls
   */
  async getSchema(factType: string, options?: RequestOptions): Promise<FactTypeSchema | null> {
    // Check cache first
    if (this.schemaCache.has(factType)) {
      return this.schemaCache.get(factType)!;
    }

    try {
      const endpoint = API_ENDPOINTS.SCHEMA_BY_FACT_TYPE(factType);
      const schema = await apiService.get<FactTypeSchema>(endpoint, options);

      // Cache the schema
      this.schemaCache.set(factType, schema);
      return schema;
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn(`Schema not available for fact type: ${factType}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all available fact type schemas
   * Uses caching to avoid repeated API calls
   */
  async getAllSchemas(options?: RequestOptions): Promise<FactTypeSchema[]> {
    const CACHE_KEY = '__ALL_SCHEMAS__';

    // Check cache first
    if (this.schemaCache.has(CACHE_KEY)) {
      return this.schemaCache.get(CACHE_KEY) as FactTypeSchema[];
    }

    try {
      const endpoint = API_ENDPOINTS.SCHEMAS;
      const schemas = await apiService.get<FactTypeSchema[]>(endpoint, options);

      // Cache each schema individually for getSchema() lookups
      schemas.forEach(schema => {
        this.schemaCache.set(schema.factType, schema);
      });

      // Cache the full list
      this.schemaCache.set(CACHE_KEY, schemas);

      return schemas;
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn('No schemas available from API');
        return [];
      }
      throw error;
    }
  }

  /**
   * Generate sample data for a fact type
   */
  async getSampleData(factType: string, options?: RequestOptions): Promise<SampleDataResponse | null> {
    try {
      const endpoint = API_ENDPOINTS.SCHEMA_SAMPLE(factType);
      return await apiService.get<SampleDataResponse>(endpoint, options);
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      if (apiError.status === 404) {
        console.warn(`Sample data generation not available for fact type: ${factType}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Validate test data against a schema
   * Returns an array of validation errors (empty if valid)
   */
  validateData(data: Record<string, unknown>, schema: FactTypeSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required fields
    for (const field of schema.fields) {
      if (field.required && !(field.name in data)) {
        errors.push({
          field: field.name,
          message: `Required field '${field.name}' is missing`,
          type: 'required',
        });
        continue;
      }

      const value = data[field.name];
      if (value === undefined || value === null) {
        if (field.required) {
          errors.push({
            field: field.name,
            message: `Required field '${field.name}' cannot be null`,
            type: 'required',
          });
        }
        continue;
      }

      // Type validation
      const typeError = this.validateFieldType(field, value);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Constraint validation
      const constraintErrors = this.validateConstraints(field, value);
      errors.push(...constraintErrors);
    }

    return errors;
  }

  /**
   * Validate field type
   */
  private validateFieldType(field: FieldDefinition, value: unknown): ValidationError | null {
    const actualType = typeof value;

    switch (field.type) {
      case 'string':
        if (actualType !== 'string') {
          return {
            field: field.name,
            message: `Field '${field.name}' should be a string, got ${actualType}`,
            type: 'type',
          };
        }
        break;
      case 'integer':
      case 'long':
        if (actualType !== 'number' || !Number.isInteger(value)) {
          return {
            field: field.name,
            message: `Field '${field.name}' should be an integer, got ${actualType}`,
            type: 'type',
          };
        }
        break;
      case 'double':
      case 'float':
      case 'number':
        if (actualType !== 'number') {
          return {
            field: field.name,
            message: `Field '${field.name}' should be a number, got ${actualType}`,
            type: 'type',
          };
        }
        break;
      case 'boolean':
        if (actualType !== 'boolean') {
          return {
            field: field.name,
            message: `Field '${field.name}' should be a boolean, got ${actualType}`,
            type: 'type',
          };
        }
        break;
      case 'date':
        if (actualType !== 'string' || isNaN(Date.parse(value as string))) {
          return {
            field: field.name,
            message: `Field '${field.name}' should be a valid date string`,
            type: 'type',
          };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: field.name,
            message: `Field '${field.name}' should be an array`,
            type: 'type',
          };
        }
        break;
      case 'object':
        if (actualType !== 'object' || Array.isArray(value)) {
          return {
            field: field.name,
            message: `Field '${field.name}' should be an object`,
            type: 'type',
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate field constraints
   */
  private validateConstraints(field: FieldDefinition, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const constraints = field.constraints;

    if (!constraints) return errors;

    // String constraints
    if (typeof value === 'string') {
      if (constraints.minLength !== undefined && value.length < constraints.minLength) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' must be at least ${constraints.minLength} characters`,
          type: 'constraint',
        });
      }
      if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' must be at most ${constraints.maxLength} characters`,
          type: 'constraint',
        });
      }
      if (constraints.pattern && !new RegExp(constraints.pattern).test(value)) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' must match pattern: ${constraints.pattern}`,
          type: 'constraint',
        });
      }
    }

    // Numeric constraints
    if (typeof value === 'number') {
      if (constraints.min !== undefined && value < constraints.min) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' must be at least ${constraints.min}`,
          type: 'constraint',
        });
      }
      if (constraints.max !== undefined && value > constraints.max) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' must be at most ${constraints.max}`,
          type: 'constraint',
        });
      }
    }

    // Enum constraints
    if (constraints.allowedValues && constraints.allowedValues.length > 0) {
      if (!constraints.allowedValues.includes(String(value))) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' must be one of: ${constraints.allowedValues.join(', ')}`,
          type: 'constraint',
        });
      }
    }

    return errors;
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Remove a specific schema from cache
   */
  invalidateCache(factType: string): void {
    this.schemaCache.delete(factType);
  }
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'type' | 'constraint';
}

// Export singleton instance
export const schemaService = new SchemaService();

// Export class for testing
export { SchemaService };
