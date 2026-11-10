import React from 'react';
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  ChevronDown,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { Dataset } from '../types/dataset';
import { SAMPLE_DATASETS } from '../utils/sampleData';

interface NavbarProps {
  currentDataset: Dataset;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectSample: (sampleId: string) => void;
  onOpenImportModal: () => void;
  onOpenEdaModal: () => void;
  onExportCsv: () => void;
  onExportReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDataset,
  isDarkMode,
  onToggleDarkMode,
  onSelectSample,
  onOpenImportModal,
  onOpenEdaModal,
  onExportCsv,
  onExportReport,
}) => {
  const [showSampleDropdown, setShowSampleDropdown] = React.useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 select-none transition-colors">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-7 h-7 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
              Power Query Profiler
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden sm:inline">
              Data Profiling & EDA Suite
            </span>
          </div>
        </div>

        {/* Center: Active Dataset & Quick Switcher */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowSampleDropdown(!showSampleDropdown)}
              className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 transition"
              title="Switch or inspect current dataset"
            >
              <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="max-w-[200px] truncate">{currentDataset.name}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                ({currentDataset.totalRows.toLocaleString()} rows)
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showSampleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSampleDropdown(false)}
                />
                <div className="absolute left-0 mt-1.5 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                    Switch Benchmark Datasets
                  </div>
                  {SAMPLE_DATASETS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onSelectSample(sample.id);
                        setShowSampleDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-start justify-between group"
                    >
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {sample.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {sample.description}
                        </div>
                      </div>
                      {currentDataset.name.includes(sample.name.split(' ')[0]) && (
                        <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 ml-2" />
                      )}
                    </button>
                  ))}
                  <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={() => {
                        setShowSampleDropdown(false);
                        onOpenImportModal();
                      }}
                      className="w-full text-center py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 font-semibold rounded text-xs transition"
                    >
                      + Import Custom CSV / Sheets
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Import Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-md text-xs transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data</span>
          </button>

          {/* EDA View */}
          <button
            onClick={onOpenEdaModal}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-md text-xs transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>EDA Suite</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-md text-xs transition"
            title="Download active dataset as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>CSV</span>
          </button>

          {/* Print Report */}
          <button
            onClick={onExportReport}
            className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-md text-xs transition"
            title="Generate printable Data Profiling & Quality Audit Report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
