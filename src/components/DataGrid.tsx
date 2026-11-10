import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Check,
} from 'lucide-react';
import { ColumnProfile, DataType } from '../types/dataset';

interface DataGridProps {
  columns: string[];
  data: Record<string, any>[];
  profiles: Record<string, ColumnProfile>;
  selectedColumn: string | null;
  onSelectColumn: (col: string) => void;
  showColumnQuality: boolean;
  showColumnDistribution: boolean;
  useMonospace: boolean;
  onUpdateColumnType: (col: string, newType: DataType) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  columns,
  data,
  profiles,
  selectedColumn,
  onSelectColumn,
  showColumnQuality,
  showColumnDistribution,
  useMonospace,
  onUpdateColumnType,
}) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [typeDropdownCol, setTypeDropdownCol] = useState<string | null>(null);

  // Sorting
  const sortedData = React.useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDir === 'asc' ? -1 : 1;
      if (strA > strB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortCol, sortDir]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const getTypeIcon = (type: DataType) => {
    switch (type) {
      case 'integer':
        return <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono">123</span>;
      case 'decimal':
        return <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">1.2</span>;
      case 'text':
        return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-sans">ABC</span>;
      case 'date':
        return <Calendar className="w-3 h-3 text-violet-600 dark:text-violet-400" />;
      case 'boolean':
        return <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">✓/✗</span>;
      default:
        return <span className="text-[10px] font-bold text-slate-500 font-mono">?</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none overflow-hidden">
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto relative">
        <table className={`w-full text-left border-collapse text-xs ${useMonospace ? 'font-mono' : 'font-sans'}`}>
          {/* THEAD */}
          <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-850 shadow-xs border-b border-slate-200 dark:border-slate-700">
            <tr>
              {/* Row Index Column */}
              <th className="w-11 px-2 py-2 bg-slate-100/70 dark:bg-slate-800 text-slate-400 font-mono text-[10px] text-center border-r border-slate-200 dark:border-slate-700/80">
                #
              </th>

              {columns.map((col) => {
                const profile = profiles[col];
                const quality = profile?.quality;
                const distribution = profile?.distribution;
                const isSelected = selectedColumn === col;
                const activeType = profile?.userType || profile?.inferredType || 'text';

                return (
                  <th
                    key={col}
                    onClick={() => onSelectColumn(col)}
                    className={`min-w-[180px] max-w-[280px] p-0 border-r border-slate-200 dark:border-slate-700/80 cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-slate-750 ring-1 ring-inset ring-amber-400 dark:ring-amber-500/80'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      {/* 1. COMPACT COLUMN QUALITY BAR (Green/Red/Gray) */}
                      {showColumnQuality && quality && (
                        <div
                          className="px-2 pt-1 pb-1 border-b border-slate-200/60 dark:border-slate-750 bg-white/70 dark:bg-slate-900/60 group/quality relative"
                          title={`Valid: ${quality.validCount} (${quality.validPercent}%)\nError: ${quality.errorCount} (${quality.errorPercent}%)\nEmpty: ${quality.emptyCount} (${quality.emptyPercent}%)`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono mb-0.5 text-slate-500 dark:text-slate-400 leading-none">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{quality.validPercent}% valid</span>
                            {quality.errorPercent > 0 && (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">{quality.errorPercent}% err</span>
                            )}
                            {quality.emptyPercent > 0 && (
                              <span>{quality.emptyPercent}% empty</span>
                            )}
                          </div>

                          {/* Thin Multi-segment Colored Bar */}
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-750 rounded-xs overflow-hidden flex">
                            {quality.validPercent > 0 && (
                              <div
                                style={{ width: `${quality.validPercent}%` }}
                                className="h-full bg-emerald-500"
                              />
                            )}
                            {quality.errorPercent > 0 && (
                              <div
                                style={{ width: `${quality.errorPercent}%` }}
                                className="h-full bg-rose-500"
                              />
                            )}
                            {quality.emptyPercent > 0 && (
                              <div
                                style={{ width: `${quality.emptyPercent}%` }}
                                className="h-full bg-slate-400 dark:bg-slate-600"
                              />
                            )}
                          </div>

                          {/* Hover Details Tooltip */}
                          <div className="opacity-0 group-hover/quality:opacity-100 pointer-events-none absolute left-2 top-full mt-1 z-50 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md p-2 shadow-xl text-[11px] text-slate-700 dark:text-slate-200 transition-opacity">
                            <div className="font-semibold pb-1 mb-1 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                              <span className="truncate">{col}</span>
                              <span className="text-[10px] text-amber-500 font-mono">Quality</span>
                            </div>
                            <div className="space-y-0.5 font-mono text-[10px]">
                              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                <span>Valid:</span>
                                <span>{quality.validCount} ({quality.validPercent}%)</span>
                              </div>
                              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                <span>Error:</span>
                                <span>{quality.errorCount} ({quality.errorPercent}%)</span>
                              </div>
                              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Empty:</span>
                                <span>{quality.emptyCount} ({quality.emptyPercent}%)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. COMPACT COLUMN DISTRIBUTION SPARK-BARS */}
                      {showColumnDistribution && distribution && (
                        <div className="px-2 py-1 border-b border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                          <span>
                            Distinct: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{distribution.distinctCount}</strong>
                          </span>
                          <span>
                            Unique: <strong className="text-cyan-600 dark:text-cyan-300 font-semibold">{distribution.uniqueCount}</strong>
                          </span>

                          {/* Mini Sparkline Bar Chart */}
                          <div className="h-3.5 w-14 flex items-end space-x-0.5 pl-1">
                            {distribution.topFrequencies.slice(0, 6).map((freq, idx) => {
                              const maxFreq = distribution.topFrequencies[0]?.count || 1;
                              const hPct = Math.max(20, Math.round((freq.count / maxFreq) * 100));
                              return (
                                <div
                                  key={idx}
                                  className="flex-1 bg-amber-400 dark:bg-amber-400/80 hover:bg-amber-500 rounded-t-2xs"
                                  style={{ height: `${hPct}%` }}
                                  title={`${freq.value}: ${freq.count} (${freq.percentage}%)`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 3. COLUMN TITLE & TYPE SELECTOR */}
                      <div className="px-2.5 py-1.5 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {/* Type icon button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTypeDropdownCol(typeDropdownCol === col ? null : col);
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                              title={`Current type: ${activeType}. Click to change.`}
                            >
                              {getTypeIcon(activeType)}
                            </button>

                            {/* Type Dropdown */}
                            {typeDropdownCol === col && (
                              <div
                                className="absolute left-0 top-full mt-1 z-50 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl py-1 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  Data Type
                                </div>
                                {(['integer', 'decimal', 'text', 'date', 'boolean'] as DataType[]).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => {
                                      onUpdateColumnType(col, t);
                                      setTypeDropdownCol(null);
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200 capitalize"
                                  >
                                    <span className="flex items-center space-x-1.5">
                                      {getTypeIcon(t)}
                                      <span>{t}</span>
                                    </span>
                                    {activeType === t && <Check className="w-3.5 h-3.5 text-amber-500" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">
                            {col}
                          </span>
                        </div>

                        {/* Sort Trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSort(col);
                          }}
                          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition ${
                            sortCol === col ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                          title={`Sort by ${col}`}
                        >
                          {sortCol === col ? (
                            sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* TBODY */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {paginatedData.map((row, rowIdx) => {
              const absoluteIdx = page * pageSize + rowIdx + 1;
              const isEven = rowIdx % 2 === 0;

              return (
                <tr
                  key={rowIdx}
                  className={`transition-colors ${
                    isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-850/40'
                  } hover:bg-amber-50/50 dark:hover:bg-slate-800/60`}
                >
                  {/* Row Index */}
                  <td className="px-2 py-1.5 text-slate-400 font-mono text-[10px] text-center bg-slate-50/80 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800">
                    {absoluteIdx}
                  </td>

                  {columns.map((col) => {
                    const rawVal = row[col];
                    const isSelected = selectedColumn === col;
                    const isBlank = rawVal === null || rawVal === undefined || rawVal === '';
                    const isError = rawVal === '#ERROR!' || rawVal === '#DIV/0!' || rawVal === '#VALUE!';

                    return (
                      <td
                        key={col}
                        onClick={() => onSelectColumn(col)}
                        className={`px-3 py-1.5 border-r border-slate-100 dark:border-slate-800 truncate max-w-[280px] ${
                          isSelected
                            ? 'bg-amber-50/60 dark:bg-amber-500/5 font-medium text-slate-900 dark:text-white'
                            : ''
                        }`}
                      >
                        {isBlank ? (
                          <span className="text-slate-400 italic text-[11px]">null</span>
                        ) : isError ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded text-[11px]">
                            {String(rawVal)}
                          </span>
                        ) : typeof rawVal === 'boolean' ? (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              rawVal
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {rawVal ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : (
                          <span>{String(rawVal)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-hidden"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <span className="text-slate-400 pl-2">
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length.toLocaleString()} rows
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            Previous
          </button>
          <span>
            Page <strong className="text-slate-800 dark:text-slate-200">{page + 1}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalPages || 1}</strong>
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
