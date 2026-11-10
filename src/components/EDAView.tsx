import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  BarChart3,
  BarChart2,
  Dot,
  Grid,
  AlertCircle,
  TrendingUp,
  Layers,
  Database,
  Info,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  Hash,
  Type,
  Calendar,
  Binary,
} from 'lucide-react';
import {
  Dataset,
  ColumnProfile,
  CorrelationResult,
  MissingDataAnalysis,
} from '../types/dataset';
import {
  computeCorrelationMatrix,
  computeMissingDataAnalysis,
} from '../utils/profiler';

interface EDAViewProps {
  dataset: Dataset;
  profiles: Record<string, ColumnProfile>;
  isOpen: boolean;
  onClose: () => void;
}

export type AggregationType = 'sum' | 'mean' | 'count' | 'median' | 'max' | 'min';
export type ChartTypeSelection = 'auto' | 'column' | 'bar' | 'scatter';
export type SortAxisBy = 'value' | 'category';
export type SortAxisOrder = 'desc' | 'asc';

export const EDAView: React.FC<EDAViewProps> = ({
  dataset,
  profiles,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'correlation' | 'missing' | 'bivariate'>('overview');

  // Identify numeric columns
  const numericColumns = useMemo(() => {
    return dataset.columns.filter((col) => {
      const type = profiles[col]?.userType || profiles[col]?.inferredType;
      return type === 'integer' || type === 'decimal';
    });
  }, [dataset.columns, profiles]);

  // Compute Correlation Matrix
  const correlation: CorrelationResult = useMemo(() => {
    if (numericColumns.length < 2) {
      return { columns: numericColumns, matrix: [] };
    }
    return computeCorrelationMatrix(dataset.data, numericColumns);
  }, [dataset.data, numericColumns]);

  // Compute Missing Data Analysis
  const missingAnalysis: MissingDataAnalysis = useMemo(() => {
    return computeMissingDataAnalysis(dataset.data, dataset.columns);
  }, [dataset.data, dataset.columns]);

  // Tab 4 State: Axis selection
  const [xAxisCol, setXAxisCol] = useState<string>(() => {
    // Pick first non-id column or first column
    return dataset.columns.find((c) => !c.toLowerCase().includes('id')) || dataset.columns[0] || '';
  });
  const [yAxisCol, setYAxisCol] = useState<string>(() => {
    // Pick first numeric column
    return numericColumns[0] || dataset.columns[1] || dataset.columns[0] || '';
  });

  const [selectedCorrCell, setSelectedCorrCell] = useState<{ x: string; y: string; r: number } | null>(null);

  // Tab 4 State: Chart configuration
  const [chartSelection, setChartSelection] = useState<ChartTypeSelection>('auto');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [sortBy, setSortBy] = useState<SortAxisBy>('value');
  const [sortOrder, setSortOrder] = useState<SortAxisOrder>('desc');
  const [topNLimit, setTopNLimit] = useState<number | 'all'>(15);
  const [selectedBarItem, setSelectedBarItem] = useState<{ key: string; value: number; count: number; formattedValue: string } | null>(null);

  // Types of selected columns
  const xType = profiles[xAxisCol]?.userType || profiles[xAxisCol]?.inferredType || 'text';
  const yType = profiles[yAxisCol]?.userType || profiles[yAxisCol]?.inferredType || 'text';
  const isXNumeric = xType === 'integer' || xType === 'decimal';
  const isYNumeric = yType === 'integer' || yType === 'decimal';

  // Resolved effective chart type
  const effectiveChartType: 'column' | 'bar' | 'scatter' = useMemo(() => {
    if (chartSelection === 'column') return 'column';
    if (chartSelection === 'bar') return 'bar';
    if (chartSelection === 'scatter') {
      return 'scatter';
    }
    // Auto mode:
    if (isXNumeric && isYNumeric) {
      return 'scatter';
    }
    return 'column';
  }, [chartSelection, isXNumeric, isYNumeric]);

  // Aggregated data for Column / Bar Chart
  const aggregatedData = useMemo(() => {
    if (!xAxisCol) return { items: [], totalCategories: 0, overallSum: 0, minVal: 0, maxVal: 0 };

    const groups = new Map<string, number[]>();

    for (let i = 0; i < dataset.data.length; i++) {
      const row = dataset.data[i];
      const rawX = row[xAxisCol];
      const key = rawX === null || rawX === undefined || String(rawX).trim() === '' ? '(Blank)' : String(rawX);

      let val = 1;
      if (isYNumeric && yAxisCol) {
        const parsed = Number(String(row[yAxisCol]).replace(/,/g, ''));
        val = isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
      }

      const list = groups.get(key) || [];
      list.push(val);
      groups.set(key, list);
    }

    const items: {
      key: string;
      value: number;
      count: number;
      formattedValue: string;
    }[] = [];

    let overallSum = 0;

    groups.forEach((vals, key) => {
      let computedVal = 0;
      if (aggregation === 'count' || !isYNumeric) {
        computedVal = vals.length;
      } else if (aggregation === 'sum') {
        computedVal = vals.reduce((a, b) => a + b, 0);
      } else if (aggregation === 'mean') {
        computedVal = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      } else if (aggregation === 'median') {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        computedVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      } else if (aggregation === 'max') {
        computedVal = Math.max(...vals);
      } else if (aggregation === 'min') {
        computedVal = Math.min(...vals);
      }

      computedVal = Math.round(computedVal * 100) / 100;
      overallSum += computedVal;

      items.push({
        key,
        value: computedVal,
        count: vals.length,
        formattedValue: computedVal.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      });
    });

    const totalCategories = items.length;

    // Apply Axis Sorting
    items.sort((a, b) => {
      if (sortBy === 'value') {
        return sortOrder === 'desc' ? b.value - a.value : a.value - b.value;
      } else {
        return sortOrder === 'desc' ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key);
      }
    });

    // Top N slice
    const displayItems = typeof topNLimit === 'number' ? items.slice(0, topNLimit) : items;
    let minVal = 0;
    let maxVal = 0;

    displayItems.forEach((it) => {
      if (it.value < minVal) minVal = it.value;
      if (it.value > maxVal) maxVal = it.value;
    });

    if (maxVal === 0 && minVal === 0) maxVal = 1;

    return {
      items: displayItems,
      totalCategories,
      overallSum: Math.round(overallSum * 100) / 100,
      minVal,
      maxVal,
    };
  }, [dataset.data, xAxisCol, yAxisCol, isYNumeric, aggregation, sortBy, sortOrder, topNLimit]);

  // Scatter points calculation for Scatter Plot
  const scatterPoints = useMemo(() => {
    if (!xAxisCol || !yAxisCol) return [];
    const pts: { x: number; y: number; label: string }[] = [];

    for (let i = 0; i < dataset.data.length; i++) {
      const row = dataset.data[i];
      const vx = Number(String(row[xAxisCol]).replace(/,/g, ''));
      const vy = Number(String(row[yAxisCol]).replace(/,/g, ''));
      if (!isNaN(vx) && !isNaN(vy) && isFinite(vx) && isFinite(vy)) {
        pts.push({ x: vx, y: vy, label: `Row #${i + 1}` });
      }
    }
    return pts;
  }, [dataset.data, xAxisCol, yAxisCol]);

  // Min / Max for scatter scale
  const scatterBounds = useMemo(() => {
    if (scatterPoints.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    scatterPoints.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const padX = (maxX - minX) * 0.05 || 1;
    const padY = (maxY - minY) * 0.05 || 1;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [scatterPoints]);

  // Linear regression trendline for scatter plot
  const regressionLine = useMemo(() => {
    if (scatterPoints.length < 2) return null;
    const n = scatterPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const p of scatterPoints) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }, [scatterPoints]);

  // Correlation between current X and Y if both numeric
  const activePairCorrelation = useMemo(() => {
    if (!isXNumeric || !isYNumeric) return null;
    const xIdx = correlation.columns.indexOf(xAxisCol);
    const yIdx = correlation.columns.indexOf(yAxisCol);
    if (xIdx !== -1 && yIdx !== -1) {
      return correlation.matrix[xIdx]?.[yIdx] ?? null;
    }
    return null;
  }, [correlation, isXNumeric, isYNumeric, xAxisCol, yAxisCol]);

  if (!isOpen) return null;

  const renderTypeIcon = (colName: string) => {
    const t = profiles[colName]?.userType || profiles[colName]?.inferredType || 'text';
    if (t === 'integer') return <Hash className="w-3 h-3 text-sky-500 shrink-0" />;
    if (t === 'decimal') return <span className="text-[10px] font-mono text-cyan-500 font-bold shrink-0">1.2</span>;
    if (t === 'date') return <Calendar className="w-3 h-3 text-violet-500 shrink-0" />;
    if (t === 'boolean') return <Binary className="w-3 h-3 text-amber-500 shrink-0" />;
    return <Type className="w-3 h-3 text-emerald-500 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Exploratory Data Analysis (EDA) Suite</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {dataset.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statistical correlation, missingness topology, bivariate scatter & categorical column/bar charts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 px-6 pt-2 space-x-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-md border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Dataset Health & Overview
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            className={`px-4 py-2 rounded-t-md border-b-2 transition ${
              activeTab === 'correlation'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Pearson Correlation Matrix ({numericColumns.length} Numeric)
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-4 py-2 rounded-t-md border-b-2 transition ${
              activeTab === 'missing'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Missing Data Matrix & Topology
          </button>
          <button
            onClick={() => setActiveTab('bivariate')}
            className={`px-4 py-2 rounded-t-md border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'bivariate'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Bivariate & Visual Chart Suite</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800 dark:text-slate-200">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Rows</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1 tabular-nums">
                    {dataset.totalRows.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400">Records in memory</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Columns</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1 tabular-nums">
                    {dataset.totalColumns}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {numericColumns.length} numeric, {dataset.totalColumns - numericColumns.length} categorical
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Complete Records</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 tabular-nums">
                    {missingAnalysis.completeRowsPercentage}%
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {missingAnalysis.completeRowsCount.toLocaleString()} rows with 0 missing cells
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimated Footprint</span>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 tabular-nums">
                    {Math.round((JSON.stringify(dataset.data).length / 1024) * 10) / 10} KB
                  </div>
                  <span className="text-[11px] text-slate-400">In-browser data table footprint</span>
                </div>
              </div>

              {/* Column Summary Table */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center justify-between">
                  <span>Column Inventory & Quality Breakdown</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    Calculated across entire dataset
                  </span>
                </h3>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-750 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Column Name</th>
                        <th className="px-3 py-2 font-semibold">Detected Type</th>
                        <th className="px-3 py-2 text-right font-semibold">Valid %</th>
                        <th className="px-3 py-2 text-right font-semibold">Empty %</th>
                        <th className="px-3 py-2 text-right font-semibold">Distinct</th>
                        <th className="px-3 py-2 text-right font-semibold">Unique (Count=1)</th>
                        <th className="px-3 py-2 font-semibold">Health Quality Bar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                      {dataset.columns.map((col) => {
                        const prof = profiles[col];
                        const qual = prof?.quality;
                        const dist = prof?.distribution;
                        const type = prof?.userType || prof?.inferredType || 'text';

                        return (
                          <tr key={col} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition">
                            <td className="px-3 py-2 font-sans font-semibold text-slate-900 dark:text-slate-200">
                              {col}
                            </td>
                            <td className="px-3 py-2 capitalize text-slate-500 dark:text-slate-400">
                              {type}
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              {qual ? `${qual.validPercent}%` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">
                              {qual ? `${qual.emptyPercent}%` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400 font-semibold">
                              {dist ? dist.distinctCount : '-'}
                            </td>
                            <td className="px-3 py-2 text-right text-cyan-600 dark:text-cyan-400">
                              {dist ? dist.uniqueCount : '-'}
                            </td>
                            <td className="px-3 py-2">
                              {qual && (
                                <div className="h-2 w-28 bg-slate-200 dark:bg-slate-800 rounded overflow-hidden flex">
                                  <div style={{ width: `${qual.validPercent}%` }} className="bg-emerald-500" />
                                  <div style={{ width: `${qual.errorPercent}%` }} className="bg-rose-500" />
                                  <div style={{ width: `${qual.emptyPercent}%` }} className="bg-slate-400 dark:bg-slate-600" />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CORRELATION MATRIX */}
          {activeTab === 'correlation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Pearson Correlation Heatmap (r)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Measures linear correlation between numeric columns (-1.0 to +1.0)
                  </p>
                </div>

                {/* Color Legend */}
                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-850 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-sky-600 dark:text-sky-400 font-bold">-1.0 (Neg)</span>
                  <div className="w-24 h-2.5 rounded bg-gradient-to-r from-sky-500 via-slate-300 dark:via-slate-700 to-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+1.0 (Pos)</span>
                </div>
              </div>

              {numericColumns.length < 2 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  This dataset requires at least 2 numeric columns to compute Pearson correlation.
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-x-auto">
                  <table className="border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 text-slate-400 font-normal"></th>
                        {correlation.columns.map((col) => (
                          <th
                            key={col}
                            className="p-2 text-slate-700 dark:text-slate-300 font-semibold text-center truncate max-w-[100px]"
                            title={col}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlation.columns.map((rowCol, rIdx) => (
                        <tr key={rowCol}>
                          <th className="p-2 text-slate-700 dark:text-slate-300 font-semibold text-right pr-4 truncate max-w-[120px]" title={rowCol}>
                            {rowCol}
                          </th>
                          {correlation.columns.map((colCol, cIdx) => {
                            const r = correlation.matrix[rIdx]?.[cIdx] ?? 0;
                            let bgClass = 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
                            if (r >= 0.7) bgClass = 'bg-emerald-600 text-white font-bold';
                            else if (r >= 0.3) bgClass = 'bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-200 font-semibold';
                            else if (r <= -0.7) bgClass = 'bg-sky-600 text-white font-bold';
                            else if (r <= -0.3) bgClass = 'bg-sky-200 dark:bg-sky-900/80 text-sky-900 dark:text-sky-200 font-semibold';

                            return (
                              <td
                                key={colCol}
                                onClick={() => setSelectedCorrCell({ x: rowCol, y: colCol, r })}
                                className={`w-16 h-12 p-1 text-center font-mono border border-slate-300 dark:border-slate-800 cursor-pointer transition hover:scale-105 hover:z-10 ${bgClass}`}
                                title={`${rowCol} vs ${colCol}: r = ${r}`}
                              >
                                {r.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedCorrCell && (
                    <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedCorrCell.x} vs {selectedCorrCell.y}:
                        </span>{' '}
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">
                          r = {selectedCorrCell.r}
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400 ml-2">
                          {Math.abs(selectedCorrCell.r) >= 0.7
                            ? '(Strong Linear Relationship)'
                            : Math.abs(selectedCorrCell.r) >= 0.3
                            ? '(Moderate Relationship)'
                            : '(Weak or No Linear Relationship)'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setXAxisCol(selectedCorrCell.x);
                          setYAxisCol(selectedCorrCell.y);
                          setChartSelection('scatter');
                          setActiveTab('bivariate');
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition shadow-xs"
                      >
                        Inspect in Visualizer →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MISSING DATA */}
          {activeTab === 'missing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Missing % Bar Chart */}
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Missing Value Rate per Column
                  </h3>
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
                    {missingAnalysis.columnNames.map((col, idx) => {
                      const count = missingAnalysis.missingCounts[idx];
                      const pct = missingAnalysis.missingPercentages[idx];

                      return (
                        <div key={col} className="text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                              {col}
                            </span>
                            <span className="font-mono text-slate-500 dark:text-slate-400">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded overflow-hidden">
                            <div
                              className={`h-full ${pct > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.max(pct, pct === 0 ? 100 : 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Missing Data Matrix Strip (Row Sample) */}
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Missingness Topology (Sample Matrix)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Visualizing rows vs columns: Slate = Present, Red = Missing (Null/Blank)
                    </p>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 overflow-x-auto">
                      <div className="grid gap-0.5">
                        {missingAnalysis.matrixPreview.map((rowMissing, rIdx) => (
                          <div key={rIdx} className="flex space-x-0.5">
                            {rowMissing.map((isMiss, cIdx) => (
                              <div
                                key={cIdx}
                                className={`w-3.5 h-2 rounded-2xs ${
                                  isMiss ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                                title={`${missingAnalysis.columnNames[cIdx]}: ${isMiss ? 'Missing' : 'Present'}`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Complete Rows: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{missingAnalysis.completeRowsCount}</strong>
                    </span>
                    <span>
                      Incomplete Rows:{' '}
                      <strong className="text-rose-600 dark:text-rose-400 font-mono">
                        {missingAnalysis.totalRows - missingAnalysis.completeRowsCount}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BIVARIATE & CATEGORICAL VISUALIZER (Scatter, Column, Bar Charts) */}
          {activeTab === 'bivariate' && (
            <div className="space-y-4">
              {/* PRIMARY CONTROLS BAR: Field and Chart Type Selector */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                {/* Row 1: Axis Field Selection & Chart Type */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* X-Axis */}
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <span>X-Axis (Category / Dimension):</span>
                      </span>
                      <div className="relative flex items-center">
                        <select
                          value={xAxisCol}
                          onChange={(e) => setXAxisCol(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg pl-2.5 pr-8 py-1.5 focus:outline-hidden focus:border-amber-500 font-medium"
                        >
                          {dataset.columns.map((c) => (
                            <option key={c} value={c}>
                              {c} ({profiles[c]?.userType || profiles[c]?.inferredType || 'text'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Y-Axis */}
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <span>Y-Axis (Metric / Measure):</span>
                      </span>
                      <div className="relative flex items-center">
                        <select
                          value={yAxisCol}
                          onChange={(e) => setYAxisCol(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg pl-2.5 pr-8 py-1.5 focus:outline-hidden focus:border-amber-500 font-medium"
                        >
                          {dataset.columns.map((c) => (
                            <option key={c} value={c}>
                              {c} ({profiles[c]?.userType || profiles[c]?.inferredType || 'text'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Chart Type Toggle (Power BI Style Visual Picker) */}
                  <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700">
                    <button
                      onClick={() => setChartSelection('auto')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        chartSelection === 'auto'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Intelligently picks Column Chart for Categorical and Scatter Plot for Numeric pairs"
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => setChartSelection('column')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                        chartSelection === 'column'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Vertical Column Chart"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Column</span>
                    </button>
                    <button
                      onClick={() => setChartSelection('bar')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                        chartSelection === 'bar'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Horizontal Bar Chart (Great for long text names)"
                    >
                      <BarChart2 className="w-3 h-3 rotate-90" />
                      <span>Bar</span>
                    </button>
                    <button
                      onClick={() => setChartSelection('scatter')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                        chartSelection === 'scatter'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Bivariate Scatter Plot (Numeric vs Numeric)"
                    >
                      <Dot className="w-3.5 h-3.5" />
                      <span>Scatter</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Secondary Controls (Aggregation, Axis Sorting, Top N limit) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  {/* Left: Aggregation & Top N (for Column/Bar) or Scatter Info */}
                  <div className="flex flex-wrap items-center gap-3">
                    {effectiveChartType !== 'scatter' ? (
                      <>
                        {/* Aggregation Function */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Calculation:</span>
                          <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 p-0.5">
                            {(['sum', 'mean', 'count', 'median', 'max', 'min'] as AggregationType[]).map((agg) => (
                              <button
                                key={agg}
                                onClick={() => setAggregation(agg)}
                                disabled={!isYNumeric && agg !== 'count'}
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold transition ${
                                  aggregation === agg
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                                title={!isYNumeric && agg !== 'count' ? 'Non-numeric Y column only supports COUNT' : `Aggregate by ${agg}`}
                              >
                                {agg}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Top N Filter */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Show:</span>
                          <select
                            value={String(topNLimit)}
                            onChange={(e) => setTopNLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-0.5 text-[11px] focus:outline-hidden"
                          >
                            <option value="10">Top 10</option>
                            <option value="15">Top 15</option>
                            <option value="25">Top 25</option>
                            <option value="50">Top 50</option>
                            <option value="all">All ({aggregatedData.totalCategories})</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      /* Scatter Plot Status */
                      <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                        <span>
                          Plotted <strong className="font-mono text-slate-900 dark:text-slate-100">{scatterPoints.length}</strong> valid numeric pairs
                        </span>
                        {activePairCorrelation !== null && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold border border-emerald-300 dark:border-emerald-800">
                            Pearson r = {activePairCorrelation.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Axis Sorting Controls (Sort Axis feature requested by user) */}
                  {effectiveChartType !== 'scatter' && (
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                      <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Sort Axis:</span>

                      {/* Sort by Metric vs Category */}
                      <button
                        onClick={() => setSortBy(sortBy === 'value' ? 'category' : 'value')}
                        className={`px-2 py-0.5 rounded transition font-medium ${
                          sortBy === 'value'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                        title="Sort by Metric Value (Y) or Category Name (X)"
                      >
                        {sortBy === 'value' ? `By Value (${aggregation.toUpperCase()})` : `By Category (A-Z)`}
                      </button>

                      {/* Sort Order: Descending vs Ascending */}
                      <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                        title={sortOrder === 'desc' ? 'Descending (High to Low / Z-A)' : 'Ascending (Low to High / A-Z)'}
                      >
                        {sortOrder === 'desc' ? (
                          <>
                            <ArrowDown className="w-3 h-3 text-rose-500" />
                            <span>Cao → Thấp</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-3 h-3 text-emerald-500" />
                            <span>Thấp → Cao</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI Summary Strip */}
              {effectiveChartType !== 'scatter' && aggregatedData.items.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Categories</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {aggregatedData.totalCategories}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Showing {aggregatedData.items.length} on chart
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                      {aggregation.toUpperCase()} of {yAxisCol}
                    </span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      {aggregatedData.overallSum.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Aggregated metric total</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Top Category</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 truncate block font-mono" title={aggregatedData.items[0]?.key}>
                      {aggregatedData.items[0]?.key || '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {aggregatedData.items[0]?.formattedValue}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Active View</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize block">
                      {effectiveChartType} Chart ({sortBy} / {sortOrder})
                    </span>
                    <span className="text-[10px] text-slate-400 block">Click any bar to inspect details</span>
                  </div>
                </div>
              )}

              {/* CHART CANVAS AREA */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center relative min-h-[380px]">
                {/* CASE 1: VERTICAL COLUMN CHART */}
                {effectiveChartType === 'column' && (
                  aggregatedData.items.length === 0 ? (
                    <div className="py-16 text-slate-400 text-xs italic">
                      No data available to render column chart for selected columns.
                    </div>
                  ) : (
                    <div className="w-full h-84 relative flex flex-col items-center justify-center">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 650 300">
                        {/* Background Axis Grid */}
                        <line x1="50" y1="20" x2="50" y2="240" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1" />
                        <line x1="50" y1="240" x2="630" y2="240" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1" />

                        {/* Y-Axis Label */}
                        <text x="15" y="130" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif" transform="rotate(-90 15 130)">
                          {aggregation.toUpperCase()} of {yAxisCol}
                        </text>

                        {/* Bars rendering */}
                        {aggregatedData.items.map((item, idx) => {
                          const totalBars = aggregatedData.items.length;
                          const availableWidth = 570;
                          const slotWidth = availableWidth / totalBars;
                          const barWidth = Math.min(36, Math.max(10, slotWidth * 0.7));
                          const x = 55 + idx * slotWidth + (slotWidth - barWidth) / 2;

                          // Height calculation (handle positive/negative)
                          const range = Math.max(1, aggregatedData.maxVal - Math.min(0, aggregatedData.minVal));
                          const zeroY = 240 - (Math.abs(Math.min(0, aggregatedData.minVal)) / range) * 200;
                          const barHeight = (Math.abs(item.value) / range) * 200;
                          const isNegative = item.value < 0;
                          const y = isNegative ? zeroY : zeroY - barHeight;

                          const isSelected = selectedBarItem?.key === item.key;

                          return (
                            <g
                              key={item.key}
                              className="cursor-pointer transition-transform group"
                              onClick={() => setSelectedBarItem(item)}
                            >
                              {/* Hover & click indicator */}
                              <rect
                                x={x - 2}
                                y={y - 2}
                                width={barWidth + 4}
                                height={barHeight + 4}
                                rx="4"
                                className={`fill-transparent transition ${
                                  isSelected ? 'stroke-2 stroke-amber-500' : 'group-hover:stroke-1 group-hover:stroke-slate-400'
                                }`}
                              />

                              {/* Bar rectangle */}
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(2, barHeight)}
                                rx="3"
                                className={`transition-all ${
                                  isNegative
                                    ? 'fill-rose-500/80 group-hover:fill-rose-500'
                                    : isSelected
                                    ? 'fill-amber-500'
                                    : 'fill-indigo-600/80 dark:fill-indigo-500/80 group-hover:fill-indigo-500'
                                }`}
                              >
                                <title>{`${item.key}\n${aggregation.toUpperCase()}: ${item.formattedValue}\nCount: ${item.count} rows`}</title>
                              </rect>

                              {/* Value label on top of bar */}
                              <text
                                x={x + barWidth / 2}
                                y={isNegative ? y + barHeight + 12 : y - 6}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="monospace"
                                className="tabular-nums"
                              >
                                {item.value >= 1000000
                                  ? `${(item.value / 1000000).toFixed(1)}M`
                                  : item.value >= 1000
                                  ? `${(item.value / 1000).toFixed(1)}k`
                                  : item.formattedValue}
                              </text>

                              {/* Category label under the axis */}
                              <text
                                x={x + barWidth / 2}
                                y={254}
                                textAnchor="end"
                                fill={isSelected ? '#f59e0b' : '#64748b'}
                                fontSize="9"
                                fontFamily="sans-serif"
                                transform={`rotate(-40 ${x + barWidth / 2} 254)`}
                                className="font-medium truncate"
                              >
                                {item.key.length > 12 ? `${item.key.slice(0, 10)}…` : item.key}
                                <title>{item.key}</title>
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )
                )}

                {/* CASE 2: HORIZONTAL BAR CHART */}
                {effectiveChartType === 'bar' && (
                  aggregatedData.items.length === 0 ? (
                    <div className="py-16 text-slate-400 text-xs italic">
                      No data available to render bar chart.
                    </div>
                  ) : (
                    <div className="w-full max-h-96 overflow-y-auto space-y-2.5 pr-3">
                      {aggregatedData.items.map((item) => {
                        const pctOfMax = Math.min(100, (Math.abs(item.value) / (aggregatedData.maxVal || 1)) * 100);
                        const isSelected = selectedBarItem?.key === item.key;

                        return (
                          <div
                            key={item.key}
                            onClick={() => setSelectedBarItem(item)}
                            className={`p-2 rounded-lg cursor-pointer transition ${
                              isSelected
                                ? 'bg-amber-500/15 border border-amber-500/40'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[280px]" title={item.key}>
                                {item.key}
                              </span>
                              <div className="flex items-center space-x-2 font-mono tabular-nums">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {item.formattedValue}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({item.count} rows)
                                </span>
                              </div>
                            </div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.value < 0 ? 'bg-rose-500' : isSelected ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
                                }`}
                                style={{ width: `${Math.max(2, pctOfMax)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* CASE 3: SCATTER PLOT (Numeric vs Numeric) */}
                {effectiveChartType === 'scatter' && (
                  scatterPoints.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                      <p>Scatter plot requires numeric values on both X and Y axes.</p>
                      <button
                        onClick={() => setChartSelection('column')}
                        className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-md text-xs mt-2"
                      >
                        Switch to Column Chart instead →
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-2xl h-80 relative flex items-center justify-center">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 300">
                        {/* Grid lines */}
                        <line x1="50" y1="20" x2="50" y2="260" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1" />
                        <line x1="50" y1="260" x2="480" y2="260" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1" />

                        {/* X and Y labels */}
                        <text x="260" y="290" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                          {xAxisCol}
                        </text>
                        <text x="15" y="140" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="sans-serif" transform="rotate(-90 15 140)">
                          {yAxisCol}
                        </text>

                        {/* Regression trend line if exists */}
                        {regressionLine && (
                          (() => {
                            const spanX = scatterBounds.maxX - scatterBounds.minX || 1;
                            const spanY = scatterBounds.maxY - scatterBounds.minY || 1;
                            const x1 = scatterBounds.minX;
                            const y1 = regressionLine.slope * x1 + regressionLine.intercept;
                            const x2 = scatterBounds.maxX;
                            const y2 = regressionLine.slope * x2 + regressionLine.intercept;

                            const cx1 = 50 + ((x1 - scatterBounds.minX) / spanX) * 430;
                            const cy1 = 260 - ((y1 - scatterBounds.minY) / spanY) * 240;
                            const cx2 = 50 + ((x2 - scatterBounds.minX) / spanX) * 430;
                            const cy2 = 260 - ((y2 - scatterBounds.minY) / spanY) * 240;

                            return (
                              <line
                                x1={cx1}
                                y1={cy1}
                                x2={cx2}
                                y2={cy2}
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity="0.8"
                              >
                                <title>{`Trendline: y = ${regressionLine.slope.toFixed(3)}x + ${regressionLine.intercept.toFixed(2)}`}</title>
                              </line>
                            );
                          })()
                        )}

                        {/* Plot points */}
                        {scatterPoints.map((pt, i) => {
                          const spanX = scatterBounds.maxX - scatterBounds.minX || 1;
                          const spanY = scatterBounds.maxY - scatterBounds.minY || 1;
                          const cx = 50 + ((pt.x - scatterBounds.minX) / spanX) * 430;
                          const cy = 260 - ((pt.y - scatterBounds.minY) / spanY) * 240;

                          return (
                            <circle
                              key={i}
                              cx={cx}
                              cy={cy}
                              r="4.5"
                              className="fill-indigo-600/80 dark:fill-indigo-400/80 hover:fill-amber-500 hover:r-6 transition-all cursor-pointer"
                            >
                              <title>{`${pt.label}\n${xAxisCol}: ${pt.x}\n${yAxisCol}: ${pt.y}`}</title>
                            </circle>
                          );
                        })}
                      </svg>
                    </div>
                  )
                )}
              </div>

              {/* BAR DETAIL CARD (When a bar is clicked) */}
              {selectedBarItem && effectiveChartType !== 'scatter' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      {selectedBarItem.key}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {aggregation.toUpperCase()}: <strong className="font-mono text-slate-900 dark:text-white font-bold">{selectedBarItem.formattedValue}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Records: <strong className="font-mono">{selectedBarItem.count} rows</strong> ({aggregatedData.overallSum > 0 ? `${Math.round((selectedBarItem.value / aggregatedData.overallSum) * 1000) / 10}% of total` : ''})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedBarItem(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-semibold"
                  >
                    Clear selection ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
