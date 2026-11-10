import React from 'react';
import { Zap } from 'lucide-react';
import { ProfilingScope } from '../types/dataset';

interface StatusBarProps {
  rowCount: number;
  columnCount: number;
  profilingScope: ProfilingScope;
  onChangeScope: (scope: ProfilingScope) => void;
  selectedColumn: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  rowCount,
  columnCount,
  profilingScope,
  onChangeScope,
  selectedColumn,
}) => {
  return (
    <footer className="h-7 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 px-4 flex items-center justify-between select-none shrink-0 transition-colors">
      {/* Left: Row and Column counts & Selection */}
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1 font-mono tabular-nums text-slate-700 dark:text-slate-300">
          <span>{columnCount} columns,</span>
          <span>{rowCount.toLocaleString()} rows</span>
        </span>

        {selectedColumn && (
          <span className="text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-800 pl-3">
            Selected column: <strong className="text-amber-600 dark:text-amber-400 font-mono">{selectedColumn}</strong>
          </span>
        )}
      </div>

      {/* Right: Power BI Profiling Scope Clickable Selector */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onChangeScope(profilingScope === 'sample1000' ? 'entire' : 'sample1000')}
          className="flex items-center space-x-1.5 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition group cursor-pointer"
          title="Click to toggle profiling scope between Top 1000 rows and Entire dataset"
        >
          <Zap
            className={`w-3 h-3 ${
              profilingScope === 'entire' ? 'text-emerald-500' : 'text-amber-500'
            }`}
          />
          <span>
            Column profiling based on{' '}
            <strong className="text-slate-900 dark:text-slate-100 underline decoration-slate-400 dark:decoration-slate-600 underline-offset-2 group-hover:decoration-amber-500">
              {profilingScope === 'entire' ? 'entire dataset' : 'top 1000 rows'}
            </strong>
          </span>
        </button>
      </div>
    </footer>
  );
};
