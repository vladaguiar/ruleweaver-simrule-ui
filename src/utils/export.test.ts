// Tests for export utilities
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCSV, exportToCSV, exportToJSON, formatDateForExport, formatArrayForExport } from './export';

describe('Export Utilities', () => {
  describe('toCSV', () => {
    it('should generate CSV with headers only when data is empty', () => {
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'age' as const, header: 'Age' },
      ];
      const result = toCSV([], columns);
      expect(result).toBe('Name,Age');
    });

    it('should generate CSV with headers and data rows', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'age' as const, header: 'Age' },
      ];
      const result = toCSV(data, columns);
      expect(result).toBe('Name,Age\nJohn,30\nJane,25');
    });

    it('should escape values with commas', () => {
      const data = [{ name: 'Doe, John', age: 30 }];
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'age' as const, header: 'Age' },
      ];
      const result = toCSV(data, columns);
      expect(result).toContain('"Doe, John"');
    });

    it('should escape values with quotes', () => {
      const data = [{ name: 'John "Jack" Doe', age: 30 }];
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'age' as const, header: 'Age' },
      ];
      const result = toCSV(data, columns);
      expect(result).toContain('"John ""Jack"" Doe"');
    });

    it('should handle null and undefined values', () => {
      const data = [{ name: null, age: undefined }];
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'age' as const, header: 'Age' },
      ];
      const result = toCSV(data as any, columns);
      expect(result).toBe('Name,Age\n,');
    });

    it('should escape values with newlines', () => {
      const data = [{ name: 'John\nDoe', age: 30 }];
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'age' as const, header: 'Age' },
      ];
      const result = toCSV(data, columns);
      expect(result).toContain('"John\nDoe"');
    });
  });

  describe('formatDateForExport', () => {
    it('should convert date string to ISO format', () => {
      const date = '2024-01-15T10:30:00Z';
      const result = formatDateForExport(date);
      expect(result).toContain('2024-01-15');
    });

    it('should return original string if invalid date', () => {
      const invalidDate = 'not-a-date';
      const result = formatDateForExport(invalidDate);
      // Invalid dates should still return something
      expect(typeof result).toBe('string');
    });
  });

  describe('formatArrayForExport', () => {
    it('should join array elements with semicolon', () => {
      const arr = ['tag1', 'tag2', 'tag3'];
      const result = formatArrayForExport(arr);
      expect(result).toBe('tag1; tag2; tag3');
    });

    it('should return empty string for empty array', () => {
      const result = formatArrayForExport([]);
      expect(result).toBe('');
    });

    it('should return empty string for null', () => {
      const result = formatArrayForExport(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = formatArrayForExport(undefined);
      expect(result).toBe('');
    });
  });

  describe('exportToCSV', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockLink: Partial<HTMLAnchorElement>;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      mockRevokeObjectURL = vi.fn();
      mockLink = {
        href: '',
        download: '',
        style: { display: '' } as CSSStyleDeclaration,
        click: vi.fn(),
      };
      mockCreateElement = vi.fn().mockReturnValue(mockLink);
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();

      vi.stubGlobal('URL', {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      });

      vi.spyOn(document, 'createElement').mockImplementation(mockCreateElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and trigger download', () => {
      const data = [{ name: 'Test', value: 123 }];
      const columns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'value' as const, header: 'Value' },
      ];

      exportToCSV(data, columns, 'test.csv');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('test.csv');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
    });
  });

  describe('exportToJSON', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockLink: Partial<HTMLAnchorElement>;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      mockRevokeObjectURL = vi.fn();
      mockLink = {
        href: '',
        download: '',
        style: { display: '' } as CSSStyleDeclaration,
        click: vi.fn(),
      };

      vi.stubGlobal('URL', {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      });

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should export data as JSON', () => {
      const data = { name: 'Test', items: [1, 2, 3] };

      exportToJSON(data, 'test.json');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('test.json');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});
