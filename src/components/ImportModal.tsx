import React, { useState } from 'react';
import {
  Upload,
  Link as LinkIcon,
  FileSpreadsheet,
  AlertCircle,
  Database,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { parseFile, fetchGoogleSheet } from '../utils/dataParser';
import { SAMPLE_DATASETS } from '../utils/sampleData';
import { Dataset } from '../types/dataset';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'googlesheets' | 'samples'>('upload');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const dataset = await parseFile(file);
      onDatasetLoaded(dataset);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSheetsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheets URL.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dataset = await fetchGoogleSheet(sheetUrl, sheetName.trim() || undefined);
      onDatasetLoaded(dataset);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find(s => s.id === sampleId);
    if (sample) {
      const ds = sample.getDataset();
      onDatasetLoaded(ds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Import Dataset for Profiling & EDA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload local CSV/Excel or link any public Google Sheet without fixed schemas
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/50 px-6 pt-2 space-x-2">
          <button
            onClick={() => { setActiveTab('upload'); setError(null); }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File (CSV, XLSX, JSON)</span>
          </button>

          <button
            onClick={() => { setActiveTab('googlesheets'); setError(null); }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'googlesheets'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Public Google Sheet Link</span>
          </button>

          <button
            onClick={() => { setActiveTab('samples'); setError(null); }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'samples'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-yellow-300" />
            <span>Benchmark Datasets</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg flex items-start space-x-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Import Error</p>
                <p className="text-rose-600 dark:text-rose-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  dragOver
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-850/60'
                }`}
                onClick={() => {
                  const input = document.getElementById('file-upload-input');
                  input?.click();
                }}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls,.json,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-3 text-amber-500 shadow-sm border border-slate-200 dark:border-slate-700">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {loading ? 'Parsing dataset and profiling structure...' : 'Click to browse or drag & drop file'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports CSV, Excel (.xlsx, .xls), TSV, and JSON formats
                </p>
                <div className="flex items-center space-x-2 mt-4 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">.csv</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">.xlsx</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">.xls</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">.json</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                💡 <span className="font-semibold text-slate-800 dark:text-slate-300">Universal dynamic engine:</span> Data profiling, distinct/unique cardinality, column quality %, and EDA correlation matrices compute entirely in your browser memory for 100% privacy and speed.
              </div>
            </div>
          )}

          {/* TAB 2: Google Sheets */}
          {activeTab === 'googlesheets' && (
            <form onSubmit={handleGoogleSheetsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Public Google Sheets Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Dataset Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Forecast 2026"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3.5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                  <span>How to make a Google Sheet accessible:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  <li>In Google Sheets, click the green <strong className="text-slate-800 dark:text-slate-200">Share</strong> button in the top right.</li>
                  <li>Under <em>General access</em>, change from <em>Restricted</em> to <strong className="text-slate-800 dark:text-slate-200">Anyone with the link</strong>.</li>
                  <li>Copy and paste the URL here. Our engine automatically converts it to direct CSV export format.</li>
                </ol>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching and Profiling Sheet...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      <span>Import Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Sample Benchmark Datasets */}
          {activeTab === 'samples' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_DATASETS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.id)}
                  className="bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between group shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {sample.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                      {sample.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Load Dataset</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
