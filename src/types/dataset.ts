export type DataType = 'text' | 'integer' | 'decimal' | 'date' | 'boolean' | 'unknown';

export interface ColumnQuality {
  validCount: number;
  validPercent: number;
  errorCount: number;
  errorPercent: number;
  emptyCount: number;
  emptyPercent: number;
  totalCount: number;
}

export interface ValueFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface ColumnDistribution {
  distinctCount: number;
  uniqueCount: number;
  topFrequencies: ValueFrequency[];
  totalEvaluated: number;
}

export interface NumericStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  sum: number;
  zeroCount: number;
  q1: number;
  q3: number;
  iqr: number;
  outliersCount: number;
  skewness: number;
}

export interface TextStats {
  minLength: number;
  maxLength: number;
  avgLength: number;
  emptyLengthCount: number;
  mostFrequent: string;
}

export interface DateStats {
  earliestDate: string | null;
  latestDate: string | null;
  daySpan: number;
  invalidDates: number;
  weekdayDistribution: { [key: string]: number };
}

export interface BooleanStats {
  trueCount: number;
  falseCount: number;
}

export interface ColumnProfile {
  name: string;
  inferredType: DataType;
  userType?: DataType;
  quality: ColumnQuality;
  distribution: ColumnDistribution;
  numericStats?: NumericStats;
  textStats?: TextStats;
  dateStats?: DateStats;
  booleanStats?: BooleanStats;
}

export interface Dataset {
  id: string;
  name: string;
  source: 'upload' | 'googlesheets' | 'sample';
  sourceUrl?: string;
  columns: string[];
  columnTypes: Record<string, DataType>;
  data: Record<string, any>[];
  totalRows: number;
  totalColumns: number;
  createdAt: string;
}

export type ProfilingScope = 'sample1000' | 'entire';

export interface CorrelationResult {
  columns: string[];
  matrix: number[][]; // N x N values between -1 and 1
}

export interface MissingDataAnalysis {
  columnNames: string[];
  missingCounts: number[];
  missingPercentages: number[];
  totalRows: number;
  completeRowsCount: number;
  completeRowsPercentage: number;
  matrixPreview: boolean[][]; // row sample x column sample, true if missing
}
