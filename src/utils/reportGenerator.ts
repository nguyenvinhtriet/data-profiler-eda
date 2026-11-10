import { Dataset, ColumnProfile } from '../types/dataset';
import Papa from 'papaparse';

/**
 * Downloads dataset rows as a CSV file
 */
export function exportDatasetToCsv(dataset: Dataset): void {
  const csv = Papa.unparse(dataset.data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${dataset.name.replace(/\.[^/.]+$/, '')}_cleaned.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive Data Profiling & Quality Audit printable HTML window
 */
export function openPrintableReport(dataset: Dataset, profiles: Record<string, ColumnProfile>): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups to view the printable Data Profiling report.');
    return;
  }

  const columnsHtml = dataset.columns
    .map((col) => {
      const prof = profiles[col];
      const q = prof?.quality;
      const dist = prof?.distribution;
      const num = prof?.numericStats;
      const txt = prof?.textStats;
      const type = prof?.userType || prof?.inferredType || 'text';

      return `
      <div style="page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-family: system-ui, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; color: #0f172a;">${col}</h3>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Type: ${type}</span>
          </div>
          <div style="text-align: right; font-size: 12px;">
            <span style="color: #10b981; font-weight: bold;">Valid: ${q?.validPercent}%</span> | 
            <span style="color: #ef4444; font-weight: bold;">Error: ${q?.errorPercent}%</span> | 
            <span style="color: #64748b;">Empty: ${q?.emptyPercent}%</span>
          </div>
        </div>

        <!-- Quality Bar -->
        <div style="height: 10px; width: 100%; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; margin-bottom: 14px;">
          <div style="width: ${q?.validPercent || 0}%; background: #10b981;"></div>
          <div style="width: ${q?.errorPercent || 0}%; background: #ef4444;"></div>
          <div style="width: ${q?.emptyPercent || 0}%; background: #94a3b8;"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; font-size: 12px;">
          <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Distinct:</strong> ${dist?.distinctCount}</div>
          <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Unique:</strong> ${dist?.uniqueCount}</div>
          ${
            num
              ? `
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Min:</strong> ${num.min}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Max:</strong> ${num.max}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Average:</strong> ${num.mean}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Median:</strong> ${num.median}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Std Dev:</strong> ${num.stdDev}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Outliers:</strong> ${num.outliersCount}</div>
          `
              : txt
              ? `
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Min Length:</strong> ${txt.minLength}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Max Length:</strong> ${txt.maxLength}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Avg Length:</strong> ${txt.avgLength}</div>
            <div style="background: #f8fafc; padding: 8px; border-radius: 4px;"><strong>Most Frequent:</strong> "${txt.mostFrequent}"</div>
          `
              : ''
          }
        </div>
      </div>
    `;
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Data Profiling Report - ${dataset.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; }
          .header { margin-bottom: 24px; border-bottom: 3px solid #0f172a; padding-bottom: 16px; }
          .btn-print { background: #0f172a; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; border: none; font-weight: 600; margin-bottom: 20px; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <div class="header">
          <h1 style="margin: 0 0 6px 0; font-size: 24px;">Data Profiling & Quality Audit Report</h1>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Dataset: <strong>${dataset.name}</strong> | Total Rows: <strong>${dataset.totalRows.toLocaleString()}</strong> | Columns: <strong>${dataset.totalColumns}</strong> | Generated: ${new Date().toLocaleString()}
          </p>
        </div>
        ${columnsHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
}
