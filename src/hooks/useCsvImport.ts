import { useState, useCallback } from 'react';

interface CsvImportResult<T> {
  success: T[];
  errors: { row: number; message: string; data: Record<string, string> }[];
}

interface CsvImportOptions<T> {
  requiredColumns: string[];
  optionalColumns?: string[];
  validateRow?: (row: Record<string, string>, rowIndex: number) => { valid: boolean; error?: string };
  transformRow: (row: Record<string, string>) => T;
}

export function useCsvImport<T>() {
  const [importing, setImporting] = useState(false);

  const parseCsv = useCallback((content: string): Record<string, string>[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    
    // Parse data rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      rows.push(row);
    }
    
    return rows;
  }, []);

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current);
    
    return result;
  };

  const importCsv = useCallback(async (
    file: File,
    options: CsvImportOptions<T>
  ): Promise<CsvImportResult<T>> => {
    setImporting(true);
    
    try {
      const content = await file.text();
      const rows = parseCsv(content);
      
      if (rows.length === 0) {
        return { success: [], errors: [{ row: 0, message: 'No data found in CSV', data: {} }] };
      }

      // Check required columns
      const firstRow = rows[0];
      const missingColumns = options.requiredColumns.filter(
        col => !(col.toLowerCase() in firstRow)
      );
      
      if (missingColumns.length > 0) {
        return {
          success: [],
          errors: [{
            row: 0,
            message: `Missing required columns: ${missingColumns.join(', ')}`,
            data: {}
          }]
        };
      }

      const success: T[] = [];
      const errors: CsvImportResult<T>['errors'] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (Object.values(row).every(v => !v)) continue;

        // Validate row
        if (options.validateRow) {
          const validation = options.validateRow(row, i + 2); // +2 for 1-indexed + header
          if (!validation.valid) {
            errors.push({ row: i + 2, message: validation.error || 'Validation failed', data: row });
            continue;
          }
        }

        try {
          const transformed = options.transformRow(row);
          success.push(transformed);
        } catch (e: any) {
          errors.push({ row: i + 2, message: e.message || 'Transform failed', data: row });
        }
      }

      return { success, errors };
    } finally {
      setImporting(false);
    }
  }, [parseCsv]);

  const downloadTemplate = useCallback((columns: string[], filename: string) => {
    const csvContent = columns.join(',') + '\n';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return { importCsv, importing, downloadTemplate };
}
