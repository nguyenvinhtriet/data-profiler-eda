import React from 'react';
import {
  Eye,
  SlidersHorizontal,
  Wand2,
  Table,
  Sparkles,
  BarChart2,
  Trash2,
  Copy,
  Hash,
  Type,
  Calendar,
  Binary,
  Zap,
  PanelRightClose,
  PanelRightOpen,
  LayoutGrid,
} from 'lucide-react';
import { ProfilingScope, DataType } from '../types/dataset';

export type RibbonTab = 'view' | 'transform' | 'eda';

interface RibbonBarProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  showColumnQuality: boolean;
  onToggleColumnQuality: () => void;
  showColumnDistribution: boolean;
  onToggleColumnDistribution: () => void;
  showColumnProfile: boolean;
  onToggleColumnProfile: () => void;
  useMonospace: boolean;
  onToggleMonospace: () => void;
  profileLayout: 'side' | 'bottom';
  onToggleProfileLayout: () => void;
  profilingScope: ProfilingScope;
  onChangeScope: (scope: ProfilingScope) => void;
  onOpenImportModal: () => void;
  onOpenTransformModal: () => void;
  onOpenEdaModal: () => void;
  onCleanMissingRows: () => void;
  onRemoveDuplicates: () => void;
  selectedColumn: string | null;
  onApplyTypeChange: (col: string, newType: DataType) => void;
}

export const RibbonBar: React.FC<RibbonBarProps> = ({
  activeTab,
  onTabChange,
  showColumnQuality,
  onToggleColumnQuality,
  showColumnDistribution,
  onToggleColumnDistribution,
  showColumnProfile,
  onToggleColumnProfile,
  useMonospace,
  onToggleMonospace,
  profileLayout,
  onToggleProfileLayout,
  profilingScope,
  onChangeScope,
  onOpenImportModal,
  onOpenTransformModal,
  onOpenEdaModal,
  onCleanMissingRows,
  onRemoveDuplicates,
  selectedColumn,
  onApplyTypeChange,
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 select-none transition-colors">
      {/* Tab Navigation */}
      <div className="flex items-center px-4 pt-1.5 border-b border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => onTabChange('view')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'view'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View (Data Profiling)</span>
        </button>

        <button
          onClick={() => onTabChange('transform')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'transform'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Transform & Clean</span>
        </button>

        <button
          onClick={() => onTabChange('eda')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'eda'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>EDA Suite</span>
        </button>
      </div>

      {/* Ribbon Action Bar */}
      <div className="px-4 py-2 flex items-center min-h-[46px] overflow-x-auto text-xs bg-white dark:bg-slate-800/60">
        {/* VIEW TAB CONTROLS (Power Query Data Profiling Core) */}
        {activeTab === 'view' && (
          <div className="flex items-center space-x-5">
            {/* Toggles Group */}
            <div className="flex items-center space-x-4 pr-5 border-r border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Preview:
              </span>

              {/* Column Quality */}
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition">
                <input
                  type="checkbox"
                  checked={showColumnQuality}
                  onChange={onToggleColumnQuality}
                  className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Column quality
                </span>
                <span className="flex space-x-0.5 items-center ml-0.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500" title="Valid" />
                  <span className="w-2 h-2 rounded-xs bg-rose-500" title="Error" />
                  <span className="w-2 h-2 rounded-xs bg-slate-400" title="Empty" />
                </span>
              </label>

              {/* Column Distribution */}
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition">
                <input
                  type="checkbox"
                  checked={showColumnDistribution}
                  onChange={onToggleColumnDistribution}
                  className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Column distribution
                </span>
              </label>

              {/* Column Profile Toggle */}
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition">
                <input
                  type="checkbox"
                  checked={showColumnProfile}
                  onChange={onToggleColumnProfile}
                  className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Column profile
                </span>
              </label>

              {/* Monospace Font */}
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition pl-1 border-l border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={useMonospace}
                  onChange={onToggleMonospace}
                  className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Monospace
                </span>
              </label>
            </div>

            {/* Profile Scope Selector */}
            <div className="flex items-center space-x-2.5 pr-5 border-r border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Scope:
              </span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => onChangeScope('sample1000')}
                  className={`px-2.5 py-1 rounded text-xs transition font-medium ${
                    profilingScope === 'sample1000'
                      ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Compute profiling only on top 1,000 rows"
                >
                  Top 1,000 rows
                </button>
                <button
                  onClick={() => onChangeScope('entire')}
                  className={`px-2.5 py-1 rounded text-xs transition flex items-center space-x-1 font-medium ${
                    profilingScope === 'entire'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Compute profiling across entire dataset"
                >
                  <Zap className="w-3 h-3" />
                  <span>Entire dataset</span>
                </button>
              </div>
            </div>

            {/* Inspector Layout Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Layout:
              </span>
              <button
                onClick={onToggleProfileLayout}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                title="Switch between Side Inspector and Bottom Dock"
              >
                {profileLayout === 'side' ? (
                  <>
                    <PanelRightOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Right Side Panel</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Bottom Dock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TRANSFORM TAB CONTROLS */}
        {activeTab === 'transform' && (
          <div className="flex items-center space-x-4">
            {selectedColumn ? (
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Column <strong className="text-slate-800 dark:text-slate-100 font-mono">"{selectedColumn}"</strong>:
                </span>
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => onApplyTypeChange(selectedColumn, 'integer')}
                    className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <Hash className="w-3 h-3 text-sky-500" />
                    <span>Whole Number</span>
                  </button>
                  <button
                    onClick={() => onApplyTypeChange(selectedColumn, 'decimal')}
                    className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <span className="font-mono text-[10px] text-cyan-500">1.2</span>
                    <span>Decimal</span>
                  </button>
                  <button
                    onClick={() => onApplyTypeChange(selectedColumn, 'text')}
                    className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <Type className="w-3 h-3 text-emerald-500" />
                    <span>Text</span>
                  </button>
                  <button
                    onClick={() => onApplyTypeChange(selectedColumn, 'date')}
                    className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <Calendar className="w-3 h-3 text-violet-500" />
                    <span>Date</span>
                  </button>
                  <button
                    onClick={() => onApplyTypeChange(selectedColumn, 'boolean')}
                    className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <Binary className="w-3 h-3 text-amber-500" />
                    <span>Boolean</span>
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-slate-400 italic">Select a column in the grid to convert its type.</span>
            )}

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center space-x-2">
              <button
                onClick={onCleanMissingRows}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Remove Blank Rows</span>
              </button>

              <button
                onClick={onRemoveDuplicates}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md transition"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Remove Duplicates</span>
              </button>

              <button
                onClick={onOpenTransformModal}
                className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md font-medium transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Transform Wizard</span>
              </button>
            </div>
          </div>
        )}

        {/* EDA TAB CONTROLS */}
        {activeTab === 'eda' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenEdaModal}
              className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Open Comprehensive EDA Suite</span>
            </button>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Includes Pearson Correlation Matrix (-1.0 to +1.0), Missingness Heatmap, Bivariate Scatter & Tukey Outlier Box Plots.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
