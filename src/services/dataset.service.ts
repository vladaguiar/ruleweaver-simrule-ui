// Dataset Service for SimRule UI
// Handles all dataset-related API operations

import { apiService, RequestOptions } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  DatasetResponse,
  UploadDatasetRequest,
  DatasetFilters,
  DatasetFormat,
} from '@/types/api.types';

// Validation constants
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_RECORDS = 10000;
const MAX_HEADER_LENGTH = 100;
const VALID_HEADER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Characters that could indicate XSS or injection attacks
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+=/i, // onclick=, onerror=, etc.
  /data:/i,
  /vbscript:/i,
];

class DatasetService {
  /**
   * Validate file size
   */
  validateFileSize(file: File): void {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
    }
  }

  /**
   * Validate CSV headers
   */
  validateCSVHeaders(headers: string[]): void {
    if (headers.length === 0) {
      throw new Error('CSV file must have at least one header column');
    }

    const seenHeaders = new Set<string>();
    for (const header of headers) {
      // Check header length
      if (header.length > MAX_HEADER_LENGTH) {
        throw new Error(`Header "${header.substring(0, 20)}..." exceeds maximum length of ${MAX_HEADER_LENGTH} characters`);
      }

      // Check for empty headers
      if (!header.trim()) {
        throw new Error('CSV headers cannot be empty');
      }

      // Check for duplicate headers
      const normalizedHeader = header.toLowerCase();
      if (seenHeaders.has(normalizedHeader)) {
        throw new Error(`Duplicate header found: "${header}"`);
      }
      seenHeaders.add(normalizedHeader);

      // Warn about non-standard headers (but don't fail)
      if (!VALID_HEADER_PATTERN.test(header)) {
        console.warn(`Header "${header}" contains special characters - may cause issues with some operations`);
      }
    }
  }

  /**
   * Sanitize a string value to prevent XSS
   */
  sanitizeValue(value: string): string {
    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(value)) {
        console.warn(`Potentially dangerous content detected and sanitized: ${value.substring(0, 50)}...`);
        // Remove potentially dangerous content
        return value.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '');
      }
    }
    return value;
  }

  /**
   * Validate column count consistency in CSV
   */
  validateColumnConsistency(lines: string[], headerCount: number): void {
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines

      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headerCount) {
        throw new Error(
          `Row ${i + 1} has ${values.length} columns but header has ${headerCount} columns. ` +
          `CSV must have consistent column counts.`
        );
      }
    }
  }
  /**
   * Get all datasets with optional filtering
   */
  async getAll(filters?: DatasetFilters, options?: RequestOptions): Promise<DatasetResponse[]> {
    let endpoint = API_ENDPOINTS.DATASETS;

    // Build query string from filters
    const params = new URLSearchParams();
    if (filters?.factType) {
      params.append('factType', filters.factType);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return apiService.get<DatasetResponse[]>(endpoint, options);
  }

  /**
   * Get a single dataset by ID
   */
  async getById(datasetId: string, options?: RequestOptions): Promise<DatasetResponse> {
    const endpoint = API_ENDPOINTS.DATASET_BY_ID(datasetId);
    return apiService.get<DatasetResponse>(endpoint, options);
  }

  /**
   * Upload a new dataset
   */
  async upload(
    dataset: UploadDatasetRequest,
    options?: RequestOptions
  ): Promise<DatasetResponse> {
    return apiService.post<DatasetResponse, UploadDatasetRequest>(
      API_ENDPOINTS.DATASETS,
      dataset,
      options
    );
  }

  /**
   * Delete a dataset
   */
  async delete(datasetId: string, options?: RequestOptions): Promise<void> {
    const endpoint = API_ENDPOINTS.DATASET_BY_ID(datasetId);
    return apiService.delete(endpoint, options);
  }

  /**
   * Parse CSV content to records with validation and sanitization
   */
  parseCSV(csvContent: string): Record<string, unknown>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse and validate headers
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    this.validateCSVHeaders(headers);

    // Validate column consistency
    this.validateColumnConsistency(lines, headers.length);

    // Check record limit
    if (lines.length - 1 > MAX_RECORDS) {
      throw new Error(`CSV contains ${lines.length - 1} records but maximum allowed is ${MAX_RECORDS}`);
    }

    const records: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines

      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Sanitize string value before parsing
          const sanitizedValue = typeof value === 'string' ? this.sanitizeValue(value) : value;
          // Try to parse as number or boolean
          record[header] = this.parseValue(sanitizedValue);
        });
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim().replace(/^["']|["']$/g, ''));
    return values;
  }

  /**
   * Parse string value to appropriate type
   */
  private parseValue(value: string): unknown {
    const trimmed = value.trim();

    // Check for null/undefined
    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return null;
    }

    // Check for boolean
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Check for number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }

    return trimmed;
  }

  /**
   * Parse JSON content to records
   */
  parseJSON(jsonContent: string): Record<string, unknown>[] {
    const parsed = JSON.parse(jsonContent);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    // If it's a single object, wrap in array
    if (typeof parsed === 'object' && parsed !== null) {
      return [parsed];
    }

    throw new Error('Invalid JSON format: expected array or object');
  }

  /**
   * Detect format from file extension
   */
  detectFormat(filename: string): DatasetFormat {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'csv':
        return 'CSV';
      case 'xlsx':
      case 'xls':
        return 'EXCEL';
      case 'json':
      default:
        return 'JSON';
    }
  }

  /**
   * Upload from file with validation
   */
  async uploadFile(
    file: File,
    metadata: {
      name?: string;
      description?: string;
      factType: string;
      tags?: string[];
    },
    options?: RequestOptions
  ): Promise<DatasetResponse> {
    // Validate file size before processing
    this.validateFileSize(file);

    const format = this.detectFormat(file.name);
    const content = await file.text();

    let records: Record<string, unknown>[];

    switch (format) {
      case 'CSV':
        records = this.parseCSV(content);
        break;
      case 'JSON':
        records = this.parseJSON(content);
        // Validate record count for JSON as well
        if (records.length > MAX_RECORDS) {
          throw new Error(`JSON contains ${records.length} records but maximum allowed is ${MAX_RECORDS}`);
        }
        break;
      case 'EXCEL':
        // Excel parsing would require a library like xlsx
        throw new Error('Excel parsing not yet implemented - please use JSON or CSV');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return this.upload(
      {
        name: metadata.name || file.name.replace(/\.[^/.]+$/, ''),
        description: metadata.description,
        factType: metadata.factType,
        format,
        records,
        tags: metadata.tags,
      },
      options
    );
  }

  /**
   * Get unique fact types from all datasets
   */
  async getFactTypes(options?: RequestOptions): Promise<string[]> {
    const datasets = await this.getAll(undefined, options);
    const factTypes = new Set(datasets.map((d) => d.factType));
    return Array.from(factTypes).sort();
  }

  /**
   * Search datasets by name or description
   */
  async search(query: string, options?: RequestOptions): Promise<DatasetResponse[]> {
    const allDatasets = await this.getAll(undefined, options);
    const lowerQuery = query.toLowerCase();

    return allDatasets.filter(
      (d) =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.description?.toLowerCase().includes(lowerQuery) ||
        d.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get dataset statistics summary
   */
  async getStatistics(options?: RequestOptions): Promise<{
    total: number;
    totalRecords: number;
    byFormat: Record<DatasetFormat, number>;
    byFactType: Record<string, number>;
  }> {
    const datasets = await this.getAll(undefined, options);

    const byFormat: Record<DatasetFormat, number> = {
      JSON: 0,
      CSV: 0,
      EXCEL: 0,
    };

    const byFactType: Record<string, number> = {};

    let totalRecords = 0;

    datasets.forEach((d) => {
      totalRecords += d.recordCount;
      byFormat[d.format] = (byFormat[d.format] || 0) + 1;
      byFactType[d.factType] = (byFactType[d.factType] || 0) + 1;
    });

    return {
      total: datasets.length,
      totalRecords,
      byFormat,
      byFactType,
    };
  }
}

// Export singleton instance
export const datasetService = new DatasetService();

// Export class for testing
export { DatasetService };
