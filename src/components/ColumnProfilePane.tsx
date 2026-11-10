import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  BarChart2,
  Maximize2,
  Minimize2,
  Table,
} from 'lucide-react';
import { ColumnProfile } from '../types/dataset';

interface ColumnProfilePaneProps {
  columnName: string | null;
  profile?: ColumnProfile;
  isOpen: boolean;
  onClose: () => void;
  onFilterValue?: (val: string) => void;
  layout?: 'side' | 'bottom';
}

export const ColumnProfilePane: React.FC<ColumnProfilePaneProps> = ({
  columnName,
  profile,
  isOpen,
  onClose,
  onFilterValue,
  layout = 'side',
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'distribution'>('stats');

  if (!isOpen || !columnName || !profile) return null;

  const quality = profile.quality;
  const distribution = profile.distribution;
  const numStats = profile.numericStats;
  const textStats = profile.textStats;
  const dateStats = profile.dateStats;
  const activeType = profile.userType || profile.inferredType;

  const handleCopyStats = () => {
    let summary = `Column Profile for "${columnName}" (Type: ${activeType})\n`;
    summary += `----------------------------------------\n`;
    summary += `Total Rows: ${quality.totalCount}\n`;
    summary += `Valid: ${quality.validCount} (${quality.validPercent}%)\n`;
    summary += `Errors: ${quality.errorCount} (${quality.errorPercent}%)\n`;
    summary += `Empty: ${quality.emptyCount} (${quality.emptyPercent}%)\n`;
    summary += `Distinct: ${distribution.distinctCount}\n`;
    summary += `Unique: ${distribution.uniqueCount}\n`;

    if (numStats) {
      summary += `\nNumeric Statistics:\n`;
      summary += `Min: ${numStats.min}\n`;
      summary += `Max: ${numStats.max}\n`;
      summary += `Average (Mean): ${numStats.mean}\n`;
      summary += `Median: ${numStats.median}\n`;
      summary += `Std Dev: ${numStats.stdDev}\n`;
      summary += `Sum: ${numStats.sum}\n`;
      summary += `Zeroes: ${numStats.zeroCount}\n`;
      summary += `IQR: ${numStats.iqr} (Q1: ${numStats.q1}, Q3: ${numStats.q3})\n`;
      summary += `Outliers: ${numStats.outliersCount}\n`;
      summary += `Skewness: ${numStats.skewness}\n`;
    }

    if (textStats) {
      summary += `\nText Statistics:\n`;
      summary += `Min Length: ${textStats.minLength}\n`;
      summary += `Max Length: ${textStats.maxLength}\n`;
      summary += `Average Length: ${textStats.avgLength}\n`;
      summary += `Most Frequent: "${textStats.mostFrequent}"\n`;
    }

    if (dateStats && dateStats.earliestDate) {
      summary += `\nDate Statistics:\n`;
      summary += `Earliest: ${dateStats.earliestDate}\n`;
      summary += `Latest: ${dateStats.latestDate}\n`;
      summary += `Day Span: ${dateStats.daySpan} days\n`;
    }

    summary += `\nTop Values:\n`;
    distribution.topFrequencies.forEach((f) => {
      summary += `- ${f.value}: ${f.count} (${f.percentage}%)\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SIDEBAR LAYOUT (Default: Vertical Inspector alongside DataGrid, zero height crunch)
  if (layout === 'side') {
    return (
      <aside className="w-80 lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col h-full shrink-0 z-20 shadow-lg select-none transition-colors">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 truncate">
              <BarChart2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Column Profile:</span>
              <span className="font-semibold text-xs text-slate-900 dark:text-white truncate font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {columnName}
              </span>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={handleCopyStats}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                title="Copy all column stats to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader info & tab toggles */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
              Type: {activeType}
            </span>

            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded text-[11px]">
              <button
                onClick={() => setActiveSubTab('stats')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  activeSubTab === 'stats'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveSubTab('distribution')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  activeSubTab === 'distribution'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Values ({distribution.distinctCount})
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeSubTab === 'stats' ? (
            <>
              {/* SECTION 1: Quality & Completeness */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quality & Completeness
                </div>

                <div className="space-y-1.5 tabular-nums font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-sans text-slate-500 dark:text-slate-400">Total Count:</span>
                    <span className="font-semibold">{quality.totalCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span className="font-sans">Valid:</span>
                    <span className="font-semibold">{quality.validCount} ({quality.validPercent}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span className="font-sans">Errors:</span>
                    <span className="font-semibold">{quality.errorCount} ({quality.errorPercent}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span className="font-sans">Empty / Null:</span>
                    <span className="font-semibold">{quality.emptyCount} ({quality.emptyPercent}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded overflow-hidden flex mt-2">
                  <div style={{ width: `${quality.validPercent}%` }} className="bg-emerald-500" title={`Valid: ${quality.validPercent}%`} />
                  <div style={{ width: `${quality.errorPercent}%` }} className="bg-rose-500" title={`Error: ${quality.errorPercent}%`} />
                  <div style={{ width: `${quality.emptyPercent}%` }} className="bg-slate-400 dark:bg-slate-600" title={`Empty: ${quality.emptyPercent}%`} />
                </div>
              </div>

              {/* SECTION 2: Cardinality & Uniqueness */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cardinality & Diversity
                </div>

                <div className="space-y-1.5 tabular-nums font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-sans text-slate-500 dark:text-slate-400">Distinct Values:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{distribution.distinctCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-sans text-slate-500 dark:text-slate-400">Unique (Count = 1):</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{distribution.uniqueCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-sans text-slate-500 dark:text-slate-400">Uniqueness Ratio:</span>
                    <span className="font-semibold">
                      {quality.totalCount > 0
                        ? `${Math.round((distribution.uniqueCount / quality.totalCount) * 1000) / 10}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Deep Type-Specific Statistics */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Deep Statistics ({activeType.toUpperCase()})
                </div>

                {numStats ? (
                  <div className="space-y-1.5 tabular-nums font-mono text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Min:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{numStats.min}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Max:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{numStats.max}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Mean (Average):</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{numStats.mean}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Median:</span>
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">{numStats.median}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Std Dev (σ):</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{numStats.stdDev}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Sum:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{numStats.sum.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Zero Count:</span>
                      <span className="font-semibold">{numStats.zeroCount}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">IQR (Q3 - Q1):</span>
                      <span className="font-semibold">{numStats.iqr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Tukey Outliers:</span>
                      <span className={`font-semibold ${numStats.outliersCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                        {numStats.outliersCount}
                      </span>
                    </div>
                  </div>
                ) : dateStats && dateStats.earliestDate ? (
                  <div className="space-y-1.5 tabular-nums font-mono text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Earliest:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dateStats.earliestDate}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Latest:</span>
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">{dateStats.latestDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Timespan:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{dateStats.daySpan} days</span>
                    </div>
                  </div>
                ) : textStats ? (
                  <div className="space-y-1.5 tabular-nums font-mono text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Min Length:</span>
                      <span className="font-semibold">{textStats.minLength} chars</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Max Length:</span>
                      <span className="font-semibold">{textStats.maxLength} chars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500 dark:text-slate-400">Avg Length:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{textStats.avgLength} chars</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* SECTION 4: Top 5 Frequent Values Quick View */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Top Frequent Values</span>
                  <button
                    onClick={() => setActiveSubTab('distribution')}
                    className="text-amber-600 dark:text-amber-400 hover:underline capitalize font-normal lowercase text-[11px]"
                  >
                    view all →
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {distribution.topFrequencies.slice(0, 5).map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span className="truncate max-w-[170px] font-medium" title={f.value}>
                          {f.value}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {f.count.toLocaleString()} ({f.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.max(4, f.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ALL VALUES FREQUENCY TABLE */
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between items-center">
                <span>Value Frequency Analysis</span>
                <span>{distribution.topFrequencies.length} unique values</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Value</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Count</th>
                      <th className="px-2 py-1.5 text-right font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {distribution.topFrequencies.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium truncate max-w-[130px]" title={f.value}>
                          {f.value}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-slate-600 dark:text-slate-300">
                          {f.count.toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-amber-600 dark:text-amber-400">
                          {f.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // BOTTOM DOCK LAYOUT (Horizontal drawer at bottom)
  return (
    <div
      className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-200 flex flex-col z-20 select-none ${
        isExpanded ? 'h-[440px]' : 'h-[250px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-100">
            <BarChart2 className="w-4 h-4 text-amber-500" />
            <span>Column Profile:</span>
            <span className="font-mono text-amber-600 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {columnName}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 capitalize">
            Type: {activeType}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Subtabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded p-0.5 border border-slate-200 dark:border-slate-700 mr-2">
            <button
              onClick={() => setActiveSubTab('stats')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                activeSubTab === 'stats'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Column Statistics
            </button>
            <button
              onClick={() => setActiveSubTab('distribution')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                activeSubTab === 'distribution'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Value Distribution ({distribution.distinctCount})
            </button>
          </div>

          <button
            onClick={handleCopyStats}
            className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded transition text-[11px]"
            title="Copy all column statistics to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Stats'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Close profile panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-auto p-4 text-xs">
        {activeSubTab === 'stats' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
            {/* Box 1: Quality Summary */}
            <div className="bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Quality & Completeness
              </div>
              <div className="space-y-1.5 font-mono tabular-nums">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Total Count:</span>
                  <span className="font-semibold">{quality.totalCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span className="font-sans">Valid:</span>
                  <span className="font-semibold">{quality.validCount} ({quality.validPercent}%)</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span className="font-sans">Errors:</span>
                  <span className="font-semibold">{quality.errorCount} ({quality.errorPercent}%)</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span className="font-sans">Empty / Null:</span>
                  <span className="font-semibold">{quality.emptyCount} ({quality.emptyPercent}%)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded overflow-hidden flex mt-2">
                <div style={{ width: `${quality.validPercent}%` }} className="bg-emerald-500" />
                <div style={{ width: `${quality.errorPercent}%` }} className="bg-rose-500" />
                <div style={{ width: `${quality.emptyPercent}%` }} className="bg-slate-400 dark:bg-slate-600" />
              </div>
            </div>

            {/* Box 2: Cardinality & Diversity */}
            <div className="bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Cardinality & Uniqueness
              </div>
              <div className="space-y-1.5 font-mono tabular-nums">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Distinct Values:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{distribution.distinctCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Unique (Count = 1):</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{distribution.uniqueCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Uniqueness Rate:</span>
                  <span className="font-semibold">
                    {quality.totalCount > 0
                      ? `${Math.round((distribution.uniqueCount / quality.totalCount) * 1000) / 10}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Most Frequent:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 truncate max-w-[120px]" title={distribution.topFrequencies[0]?.value}>
                    {distribution.topFrequencies[0]?.value || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 italic mt-2">
                High distinct count indicates potential ID or key field.
              </div>
            </div>

            {/* Box 3: Data-Type-Specific Stats */}
            <div className="bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 col-span-2 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Deep Column Statistics ({activeType.toUpperCase()})
              </div>

              {numStats ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Min:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{numStats.min}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Max:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{numStats.max}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Average (Mean):</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{numStats.mean}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Median:</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{numStats.median}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Std Dev (σ):</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{numStats.stdDev}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Sum:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{numStats.sum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Zero Count:</span>
                    <span className="font-semibold">{numStats.zeroCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">IQR (Q3-Q1):</span>
                    <span className="font-semibold">{numStats.iqr}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Outliers (Tukey):</span>
                    <span className={`font-semibold ${numStats.outliersCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                      {numStats.outliersCount}
                    </span>
                  </div>
                </div>
              ) : dateStats && dateStats.earliestDate ? (
                <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Earliest Date:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dateStats.earliestDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Latest Date:</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{dateStats.latestDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Timespan:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{dateStats.daySpan} days</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Invalid Dates:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{dateStats.invalidDates}</span>
                  </div>
                </div>
              ) : textStats ? (
                <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Min Length:</span>
                    <span className="font-semibold">{textStats.minLength} chars</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Max Length:</span>
                    <span className="font-semibold">{textStats.maxLength} chars</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Average Length:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{textStats.avgLength} chars</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Empty Strings:</span>
                    <span className="font-semibold text-slate-400">{textStats.emptyLengthCount}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* DISTRIBUTION SUBTAB: Detailed Top Frequencies */
          <div className="h-full flex flex-col">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
              <span>Value frequency table for <strong className="text-slate-900 dark:text-slate-100">"{columnName}"</strong></span>
              <span>Showing top {distribution.topFrequencies.length} values</span>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Value</th>
                    <th className="px-3 py-2 text-right font-semibold">Count</th>
                    <th className="px-3 py-2 text-right font-semibold">Percentage</th>
                    <th className="px-4 py-2 w-1/3 font-semibold">Distribution Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {distribution.topFrequencies.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                      <td className="px-3 py-1.5 font-medium text-slate-900 dark:text-slate-200">
                        {f.value}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {f.count.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-amber-600 dark:text-amber-400">
                        {f.percentage}%
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded"
                            style={{ width: `${Math.max(4, f.percentage)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
