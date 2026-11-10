import React, { useState } from 'react';
import {
  Wand2,
  Trash2,
  Copy,
  SlidersHorizontal,
  X,
  Hash,
} from 'lucide-react';
import { Dataset, ColumnProfile } from '../types/dataset';
import { isEmptyValue } from '../utils/profiler';

interface TransformModalProps {
  dataset: Dataset;
  profiles: Record<string, ColumnProfile>;
  selectedColumn: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyTransform: (newRows: Record<string, any>[]) => void;
}

export const TransformModal: React.FC<TransformModalProps> = ({
  dataset,
  profiles,
  selectedColumn,
  isOpen,
  onClose,
  onApplyTransform,
}) => {
  const [activeAction, setActiveAction] = useState<'fill' | 'drop_empty' | 'drop_duplicates' | 'replace'>('fill');
  const [targetCol, setTargetCol] = useState<string>(selectedColumn || dataset.columns[0] || '');
  const [fillStrategy, setFillStrategy] = useState<'mean' | 'median' | 'mode' | 'custom'>('mean');
  const [customFillValue, setCustomFillValue] = useState<string>('0');
  const [findValue, setFindValue] = useState<string>('#ERROR!');
  const [replaceValue, setReplaceValue] = useState<string>('0');

  if (!isOpen) return null;

  const handleExecute = () => {
    let modified = [...dataset.data];

    if (activeAction === 'drop_empty') {
      modified = modified.filter((row) => !isEmptyValue(row[targetCol]));
    } else if (activeAction === 'drop_duplicates') {
      const seen = new Set<string>();
      modified = modified.filter((row) => {
        const key = targetCol ? String(row[targetCol]) : JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else if (activeAction === 'replace') {
      modified = modified.map((row) => {
        if (String(row[targetCol]) === findValue) {
          return { ...row, [targetCol]: replaceValue };
        }
        return row;
      });
    } else if (activeAction === 'fill') {
      let replacement: any = customFillValue;
      const numStats = profiles[targetCol]?.numericStats;
      const topFreq = profiles[targetCol]?.distribution?.topFrequencies?.[0]?.value;

      if (fillStrategy === 'mean' && numStats) {
        replacement = numStats.mean;
      } else if (fillStrategy === 'median' && numStats) {
        replacement = numStats.median;
      } else if (fillStrategy === 'mode' && topFreq) {
        replacement = topFreq;
      }

      modified = modified.map((row) => {
        if (isEmptyValue(row[targetCol])) {
          return { ...row, [targetCol]: replacement };
        }
        return row;
      });
    }

    onApplyTransform(modified);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Transform & Cleanse Wizard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Power Query data cleansing operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Column:
            </label>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
            >
              {dataset.columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Operation:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveAction('fill')}
                className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                  activeAction === 'fill'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span>Fill Missing Values</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('drop_empty')}
                className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                  activeAction === 'drop_empty'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Drop Empty Rows</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('drop_duplicates')}
                className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                  activeAction === 'drop_duplicates'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Copy className="w-4 h-4 text-cyan-500" />
                <span>Remove Duplicates</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('replace')}
                className={`p-2.5 rounded-lg border text-left transition flex items-center space-x-2 ${
                  activeAction === 'replace'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Hash className="w-4 h-4 text-emerald-500" />
                <span>Replace Values</span>
              </button>
            </div>
          </div>

          {/* Conditional Options */}
          {activeAction === 'fill' && (
            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Fill Strategy:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={fillStrategy === 'mean'}
                    onChange={() => setFillStrategy('mean')}
                    className="text-amber-500"
                  />
                  <span>Mean (Average)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={fillStrategy === 'median'}
                    onChange={() => setFillStrategy('median')}
                    className="text-amber-500"
                  />
                  <span>Median</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={fillStrategy === 'mode'}
                    onChange={() => setFillStrategy('mode')}
                    className="text-amber-500"
                  />
                  <span>Mode (Most Frequent)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={fillStrategy === 'custom'}
                    onChange={() => setFillStrategy('custom')}
                    className="text-amber-500"
                  />
                  <span>Custom Value</span>
                </label>
              </div>

              {fillStrategy === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter replacement value"
                  value={customFillValue}
                  onChange={(e) => setCustomFillValue(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              )}
            </div>
          )}

          {activeAction === 'replace' && (
            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Find Value:</span>
                  <input
                    type="text"
                    value={findValue}
                    onChange={(e) => setFindValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Replace With:</span>
                  <input
                    type="text"
                    value={replaceValue}
                    onChange={(e) => setReplaceValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-xs"
          >
            Apply Transformation
          </button>
        </div>
      </div>
    </div>
  );
};
