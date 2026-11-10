import {
  ColumnProfile,
  ColumnQuality,
  ColumnDistribution,
  NumericStats,
  TextStats,
  DateStats,
  BooleanStats,
  DataType,
  ProfilingScope,
  CorrelationResult,
  MissingDataAnalysis,
  ValueFrequency,
} from '../types/dataset';

/**
 * Checks if a value is null, undefined, or empty string / whitespace.
 */
export function isEmptyValue(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  return false;
}

/**
 * Infers data type from an array of sample values.
 */
export function detectDataType(values: any[]): DataType {
  let validValuesCount = 0;
  let integerMatches = 0;
  let decimalMatches = 0;
  let booleanMatches = 0;
  let dateMatches = 0;

  const sample = values.slice(0, 500);

  for (const v of sample) {
    if (isEmptyValue(v)) continue;
    validValuesCount++;

    const str = String(v).trim();
    const lower = str.toLowerCase();

    // Boolean check
    if (lower === 'true' || lower === 'false' || lower === '1' || lower === '0' || lower === 'yes' || lower === 'no') {
      if (typeof v === 'boolean' || lower === 'true' || lower === 'false') {
        booleanMatches++;
      }
    }

    // Number check (must handle thousands separators or plain floats/ints)
    // Avoid classifying date-like strings (e.g. 2023-05-12) as numbers
    const cleanNumStr = str.replace(/,/g, '');
    const isStrictNum = !isNaN(Number(cleanNumStr)) && !isNaN(parseFloat(cleanNumStr)) && !str.includes('-') && !str.includes('/') && !str.includes(':');
    
    if (isStrictNum) {
      const num = Number(cleanNumStr);
      if (Number.isInteger(num)) {
        integerMatches++;
      } else {
        decimalMatches++;
      }
    } else {
      // Date check
      if (str.length >= 8 && (str.includes('-') || str.includes('/') || str.includes('.'))) {
        const timestamp = Date.parse(str);
        if (!isNaN(timestamp) && timestamp > -2208988800000 && timestamp < 2524608000000) {
          dateMatches++;
        }
      }
    }
  }

  if (validValuesCount === 0) return 'text';

  const threshold = validValuesCount * 0.75;
  if (integerMatches >= threshold) return 'integer';
  if (integerMatches + decimalMatches >= threshold) return 'decimal';
  if (booleanMatches >= threshold) return 'boolean';
  if (dateMatches >= threshold) return 'date';

  return 'text';
}

/**
 * Computes Column Quality:
 * - Valid: Correctly parsed, non-null, valid format
 * - Error: Fails parsing according to column type (e.g. NaN in numeric column, invalid date)
 * - Empty: Null, undefined, empty string
 */
export function computeColumnQuality(values: any[], type: DataType): ColumnQuality {
  const totalCount = values.length;
  if (totalCount === 0) {
    return {
      validCount: 0,
      validPercent: 0,
      errorCount: 0,
      errorPercent: 0,
      emptyCount: 0,
      emptyPercent: 0,
      totalCount: 0,
    };
  }

  let emptyCount = 0;
  let errorCount = 0;
  let validCount = 0;

  for (const val of values) {
    if (isEmptyValue(val)) {
      emptyCount++;
      continue;
    }

    if (val === '#ERROR!' || val === '#VALUE!' || val === '#DIV/0!' || val === 'NaN' || val === 'undefined') {
      errorCount++;
      continue;
    }

    switch (type) {
      case 'integer': {
        const clean = String(val).replace(/,/g, '').trim();
        const num = Number(clean);
        if (isNaN(num) || !Number.isInteger(num)) {
          errorCount++;
        } else {
          validCount++;
        }
        break;
      }
      case 'decimal': {
        const clean = String(val).replace(/,/g, '').trim();
        const num = Number(clean);
        if (isNaN(num)) {
          errorCount++;
        } else {
          validCount++;
        }
        break;
      }
      case 'date': {
        const timestamp = Date.parse(String(val));
        if (isNaN(timestamp)) {
          errorCount++;
        } else {
          validCount++;
        }
        break;
      }
      case 'boolean': {
        const s = String(val).toLowerCase().trim();
        if (s === 'true' || s === 'false' || s === '1' || s === '0' || s === 'yes' || s === 'no') {
          validCount++;
        } else {
          errorCount++;
        }
        break;
      }
      case 'text':
      default:
        validCount++;
        break;
    }
  }

  return {
    validCount,
    validPercent: Math.round((validCount / totalCount) * 1000) / 10,
    errorCount,
    errorPercent: Math.round((errorCount / totalCount) * 1000) / 10,
    emptyCount,
    emptyPercent: Math.round((emptyCount / totalCount) * 1000) / 10,
    totalCount,
  };
}

/**
 * Computes Column Distribution:
 * - Distinct: Number of unique non-identical values
 * - Unique: Number of values that appear exactly once
 * - Top frequencies: Top frequent values with counts and percentages
 */
export function computeColumnDistribution(values: any[]): ColumnDistribution {
  const counts = new Map<string, number>();

  for (const v of values) {
    const key = isEmptyValue(v) ? '(Blank)' : String(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  let uniqueCount = 0;
  const entries: [string, number][] = [];

  for (const [val, count] of counts.entries()) {
    if (count === 1) uniqueCount++;
    entries.push([val, count]);
  }

  // Sort descending by frequency
  entries.sort((a, b) => b[1] - a[1]);

  const totalEvaluated = values.length;
  const topFrequencies: ValueFrequency[] = entries.slice(0, 10).map(([val, count]) => ({
    value: val,
    count,
    percentage: totalEvaluated > 0 ? Math.round((count / totalEvaluated) * 1000) / 10 : 0,
  }));

  return {
    distinctCount: counts.size,
    uniqueCount,
    topFrequencies,
    totalEvaluated,
  };
}

/**
 * Computes Numeric Statistics:
 * Min, Max, Mean, Median, StdDev, Sum, Zero count, Q1, Q3, IQR, Outliers, Skewness
 */
export function computeNumericStats(values: any[]): NumericStats | undefined {
  const nums: number[] = [];
  let zeroCount = 0;

  for (const v of values) {
    if (isEmptyValue(v)) continue;
    const clean = String(v).replace(/,/g, '').trim();
    const n = Number(clean);
    if (!isNaN(n) && isFinite(n)) {
      nums.push(n);
      if (n === 0) zeroCount++;
    }
  }

  if (nums.length === 0) return undefined;

  nums.sort((a, b) => a - b);
  const count = nums.length;
  const sum = nums.reduce((acc, x) => acc + x, 0);
  const mean = sum / count;

  // Standard deviation
  const variance = nums.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (count > 1 ? count - 1 : 1);
  const stdDev = Math.sqrt(variance);

  // Percentiles helper
  const getPercentile = (p: number) => {
    const idx = (count - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (lower === upper) return nums[lower];
    return nums[lower] * (1 - weight) + nums[upper] * weight;
  };

  const min = nums[0];
  const max = nums[count - 1];
  const median = getPercentile(0.5);
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Tukey outlier detection rule: < Q1 - 1.5 * IQR or > Q3 + 1.5 * IQR
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliersCount = nums.filter(x => x < lowerFence || x > upperFence).length;

  // Pearson skewness approximation: 3 * (mean - median) / stdDev (if stdDev > 0)
  const skewness = stdDev > 0 ? (3 * (mean - median)) / stdDev : 0;

  return {
    min: Math.round(min * 1000) / 1000,
    max: Math.round(max * 1000) / 1000,
    mean: Math.round(mean * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    sum: Math.round(sum * 1000) / 1000,
    zeroCount,
    q1: Math.round(q1 * 1000) / 1000,
    q3: Math.round(q3 * 1000) / 1000,
    iqr: Math.round(iqr * 1000) / 1000,
    outliersCount,
    skewness: Math.round(skewness * 100) / 100,
  };
}

/**
 * Computes Text Statistics:
 * Min length, Max length, Avg length, Empty length, Most frequent string
 */
export function computeTextStats(values: any[]): TextStats {
  let minLength = Infinity;
  let maxLength = 0;
  let totalLength = 0;
  let count = 0;
  let emptyLengthCount = 0;
  const freq = new Map<string, number>();

  for (const v of values) {
    if (isEmptyValue(v)) {
      emptyLengthCount++;
      continue;
    }
    const str = String(v);
    const len = str.length;
    if (len < minLength) minLength = len;
    if (len > maxLength) maxLength = len;
    totalLength += len;
    count++;
    freq.set(str, (freq.get(str) || 0) + 1);
  }

  let mostFrequent = '-';
  let maxFreq = 0;
  for (const [val, f] of freq.entries()) {
    if (f > maxFreq) {
      maxFreq = f;
      mostFrequent = val;
    }
  }

  return {
    minLength: minLength === Infinity ? 0 : minLength,
    maxLength,
    avgLength: count > 0 ? Math.round((totalLength / count) * 10) / 10 : 0,
    emptyLengthCount,
    mostFrequent,
  };
}

/**
 * Computes Date Statistics:
 * Earliest, Latest, Day span, Weekday distribution
 */
export function computeDateStats(values: any[]): DateStats {
  const dates: Date[] = [];
  let invalidDates = 0;
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayDistribution: { [key: string]: number } = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  for (const v of values) {
    if (isEmptyValue(v)) continue;
    const t = Date.parse(String(v));
    if (isNaN(t)) {
      invalidDates++;
    } else {
      const d = new Date(t);
      dates.push(d);
      const wd = weekdayNames[d.getDay()];
      weekdayDistribution[wd] = (weekdayDistribution[wd] || 0) + 1;
    }
  }

  if (dates.length === 0) {
    return {
      earliestDate: null,
      latestDate: null,
      daySpan: 0,
      invalidDates,
      weekdayDistribution,
    };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  const diffDays = Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

  return {
    earliestDate: earliest.toISOString().split('T')[0],
    latestDate: latest.toISOString().split('T')[0],
    daySpan: diffDays,
    invalidDates,
    weekdayDistribution,
  };
}

/**
 * Computes Boolean Statistics
 */
export function computeBooleanStats(values: any[]): BooleanStats {
  let trueCount = 0;
  let falseCount = 0;

  for (const v of values) {
    if (isEmptyValue(v)) continue;
    const s = String(v).toLowerCase().trim();
    if (s === 'true' || s === '1' || s === 'yes') trueCount++;
    if (s === 'false' || s === '0' || s === 'no') falseCount++;
  }

  return { trueCount, falseCount };
}

/**
 * Computes complete column profile
 */
export function computeColumnProfile(
  name: string,
  values: any[],
  targetType?: DataType
): ColumnProfile {
  const inferredType = detectDataType(values);
  const activeType = targetType || inferredType;

  const quality = computeColumnQuality(values, activeType);
  const distribution = computeColumnDistribution(values);

  const profile: ColumnProfile = {
    name,
    inferredType,
    userType: targetType,
    quality,
    distribution,
  };

  if (activeType === 'integer' || activeType === 'decimal') {
    profile.numericStats = computeNumericStats(values);
  } else if (activeType === 'date') {
    profile.dateStats = computeDateStats(values);
  } else if (activeType === 'boolean') {
    profile.booleanStats = computeBooleanStats(values);
  }

  // Always provide text stats for character length analysis
  profile.textStats = computeTextStats(values);

  return profile;
}

/**
 * Computes profiles for all columns in dataset according to scope (sample 1000 vs entire)
 */
export function computeDatasetProfiles(
  data: Record<string, any>[],
  columns: string[],
  scope: ProfilingScope = 'entire',
  userTypes: Record<string, DataType> = {}
): Record<string, ColumnProfile> {
  const subset = scope === 'sample1000' ? data.slice(0, 1000) : data;
  const result: Record<string, ColumnProfile> = {};

  for (const col of columns) {
    const colValues = subset.map(row => row[col]);
    result[col] = computeColumnProfile(col, colValues, userTypes[col]);
  }

  return result;
}

/**
 * Pearson correlation between two numeric arrays
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denom === 0) return 0;
  const r = numerator / denom;
  return Math.round(r * 100) / 100;
}

/**
 * Computes correlation matrix for numeric columns
 */
export function computeCorrelationMatrix(
  data: Record<string, any>[],
  numericCols: string[]
): CorrelationResult {
  const matrix: number[][] = [];
  const colDataMap: Record<string, number[]> = {};

  // Extract clean paired numbers
  for (const col of numericCols) {
    colDataMap[col] = data.map(r => {
      const v = r[col];
      if (isEmptyValue(v)) return NaN;
      const num = Number(String(v).replace(/,/g, ''));
      return isNaN(num) ? NaN : num;
    });
  }

  for (let i = 0; i < numericCols.length; i++) {
    matrix[i] = [];
    const colA = numericCols[i];
    for (let j = 0; j < numericCols.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
        continue;
      }
      const colB = numericCols[j];
      const validPairsX: number[] = [];
      const validPairsY: number[] = [];

      for (let k = 0; k < data.length; k++) {
        const valA = colDataMap[colA][k];
        const valB = colDataMap[colB][k];
        if (!isNaN(valA) && !isNaN(valB)) {
          validPairsX.push(valA);
          validPairsY.push(valB);
        }
      }

      matrix[i][j] = calculatePearsonCorrelation(validPairsX, validPairsY);
    }
  }

  return {
    columns: numericCols,
    matrix,
  };
}

/**
 * Computes Missing Data Analysis
 */
export function computeMissingDataAnalysis(
  data: Record<string, any>[],
  columns: string[]
): MissingDataAnalysis {
  const totalRows = data.length;
  const missingCounts: number[] = [];
  const missingPercentages: number[] = [];

  for (const col of columns) {
    let miss = 0;
    for (const row of data) {
      if (isEmptyValue(row[col])) miss++;
    }
    missingCounts.push(miss);
    missingPercentages.push(totalRows > 0 ? Math.round((miss / totalRows) * 1000) / 10 : 0);
  }

  // Count complete rows (rows with 0 missing values)
  let completeRowsCount = 0;
  for (const row of data) {
    let isComplete = true;
    for (const col of columns) {
      if (isEmptyValue(row[col])) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) completeRowsCount++;
  }

  // Create matrix preview (up to 40 representative rows)
  const sampleStep = Math.max(1, Math.floor(totalRows / 40));
  const matrixPreview: boolean[][] = [];

  for (let i = 0; i < totalRows && matrixPreview.length < 40; i += sampleStep) {
    const row = data[i];
    const rowMissing = columns.map(col => isEmptyValue(row[col]));
    matrixPreview.push(rowMissing);
  }

  return {
    columnNames: columns,
    missingCounts,
    missingPercentages,
    totalRows,
    completeRowsCount,
    completeRowsPercentage: totalRows > 0 ? Math.round((completeRowsCount / totalRows) * 1000) / 10 : 0,
    matrixPreview,
  };
}
