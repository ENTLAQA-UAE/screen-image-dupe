import { useCallback } from 'react';

interface CsvExportOptions {
  filename: string;
  headers: string[];
  data: Record<string, any>[];
  columnMap: Record<string, string>; // Maps display header to data key
}

export function useCsvExport() {
  const exportToCsv = useCallback(({ filename, headers, data, columnMap }: CsvExportOptions) => {
    // Build CSV content
    const csvRows: string[] = [];
    
    // Add headers
    csvRows.push(headers.map(h => `"${h}"`).join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const key = columnMap[header];
        let value = row[key];
        
        // Handle nested objects
        if (key.includes('.')) {
          const keys = key.split('.');
          value = keys.reduce((obj, k) => obj?.[k], row);
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Handle objects (like score_summary)
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return { exportToCsv };
}
