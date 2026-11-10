import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Dataset, DataType } from '../types/dataset';
import { detectDataType } from './profiler';

/**
 * Normalizes Google Sheets URLs to direct CSV export format.
 */
export function normalizeGoogleSheetsUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return trimmed;

  const sheetId = match[1];
  let gid = '0';
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Creates a structured Dataset object from raw rows and column list.
 */
export function buildDatasetFromRows(
  name: string,
  rows: Record<string, any>[],
  source: 'upload' | 'googlesheets' | 'sample',
  sourceUrl?: string
): Dataset {
  if (!rows || rows.length === 0) {
    return {
      id: `ds-${Date.now()}`,
      name,
      source,
      sourceUrl,
      columns: [],
      columnTypes: {},
      data: [],
      totalRows: 0,
      totalColumns: 0,
      createdAt: new Date().toISOString(),
    };
  }

  // Collect unique column keys from rows
  const colSet = new Set<string>();
  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      const cleanKey = k.trim();
      if (cleanKey !== '') colSet.add(cleanKey);
    });
  });
  const columns = Array.from(colSet);

  // Inferred data types
  const columnTypes: Record<string, DataType> = {};
  for (const col of columns) {
    const values = rows.slice(0, 500).map(r => r[col]);
    columnTypes[col] = detectDataType(values);
  }

  return {
    id: `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    source,
    sourceUrl,
    columns,
    columnTypes,
    data: rows,
    totalRows: rows.length,
    totalColumns: columns.length,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Parses raw CSV/TSV text into Dataset
 */
export function parseCsvText(csvText: string, datasetName: string, source: 'upload' | 'googlesheets' | 'sample', sourceUrl?: string): Dataset {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false, // Keep strings so profiler can detect data quality/errors cleanly
  });

  const cleanedData = parsed.data.filter(row => {
    return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
  });

  return buildDatasetFromRows(datasetName, cleanedData, source, sourceUrl);
}

/**
 * Parses an ArrayBuffer / File of XLSX/XLS/CSV
 */
export async function parseFile(file: File): Promise<Dataset> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    const text = await file.text();
    return parseCsvText(text, fileName, 'upload');
  }

  if (extension === 'json') {
    const text = await file.text();
    const json = JSON.parse(text);
    const rows = Array.isArray(json) ? json : [json];
    return buildDatasetFromRows(fileName, rows, 'upload');
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
    return buildDatasetFromRows(fileName, rows, 'upload');
  }

  throw new Error(`Unsupported file format .${extension}. Please upload CSV, XLSX, XLS, or JSON.`);
}

/**
 * Fetches and parses a public Google Sheets link or public CSV URL
 */
export async function fetchGoogleSheet(url: string, customName?: string): Promise<Dataset> {
  const exportUrl = normalizeGoogleSheetsUrl(url);

  try {
    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error(`Failed to load sheet: HTTP status ${response.status} (${response.statusText}). Make sure the Google Sheet is shared with "Anyone with the link can view".`);
    }

    const text = await response.text();
    // Check if Google returned an HTML login page instead of CSV
    if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com')) {
      throw new Error('Google Sheet is private or requires sign-in. Please ensure access is set to "Anyone with the link can view".');
    }

    const name = customName || 'Google Sheet Data';
    return parseCsvText(text, name, 'googlesheets', url);
  } catch (err: any) {
    throw new Error(err.message || 'Unable to import Google Sheet. Please check the URL and sharing permissions.');
  }
}
