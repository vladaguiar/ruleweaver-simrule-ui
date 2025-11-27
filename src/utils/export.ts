// Export Utilities - Functions for exporting data in various formats

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, newline, or quotes, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert an array of objects to CSV format
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) {
    return columns.map(c => escapeCSVValue(c.header)).join(',');
  }

  // Header row
  const headerRow = columns.map(c => escapeCSVValue(c.header)).join(',');

  // Data rows
  const dataRows = data.map(row =>
    columns.map(col => escapeCSVValue(row[col.key])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  const csv = toCSV(data, columns);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data as JSON and trigger download
 */
export function exportToJSON<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

/**
 * Format date for export (ISO format)
 */
export function formatDateForExport(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return dateString;
  }
}

/**
 * Format array values for export (join with semicolon)
 */
export function formatArrayForExport(arr: unknown[] | undefined | null): string {
  if (!arr || arr.length === 0) {
    return '';
  }
  return arr.join('; ');
}
