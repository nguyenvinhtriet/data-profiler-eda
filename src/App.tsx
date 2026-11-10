import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RibbonBar, RibbonTab } from './components/RibbonBar';
import { DataGrid } from './components/DataGrid';
import { ColumnProfilePane } from './components/ColumnProfilePane';
import { StatusBar } from './components/StatusBar';
import { ImportModal } from './components/ImportModal';
import { EDAView } from './components/EDAView';
import { TransformModal } from './components/TransformModal';
import { Dataset, DataType, ProfilingScope } from './types/dataset';
import { SAMPLE_DATASETS } from './utils/sampleData';
import { computeDatasetProfiles, isEmptyValue } from './utils/profiler';
import { exportDatasetToCsv, openPrintableReport } from './utils/reportGenerator';

export default function App() {
  // Theme state (Light theme default for clean, professional Power BI / Excel enterprise feel)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Inspector layout ('side' gives DataGrid 100% vertical breathing room; 'bottom' docks at bottom)
  const [profileLayout, setProfileLayout] = useState<'side' | 'bottom'>('side');

  // Initialize with Superstore sample dataset
  const [dataset, setDataset] = useState<Dataset>(() => SAMPLE_DATASETS[0].getDataset());
  const [selectedColumn, setSelectedColumn] = useState<string | null>(() => dataset.columns[0] || null);

  // Ribbon & View state (Defaulting to 'view' tab with all Power BI Data Profiling toggles ON)
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('view');
  const [showColumnQuality, setShowColumnQuality] = useState<boolean>(true);
  const [showColumnDistribution, setShowColumnDistribution] = useState<boolean>(true);
  const [showColumnProfile, setShowColumnProfile] = useState<boolean>(true);
  const [useMonospace, setUseMonospace] = useState<boolean>(false);
  const [profilingScope, setProfilingScope] = useState<ProfilingScope>('entire');

  // Custom user type overrides
  const [userTypes, setUserTypes] = useState<Record<string, DataType>>({});

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isEdaModalOpen, setIsEdaModalOpen] = useState<boolean>(false);
  const [isTransformModalOpen, setIsTransformModalOpen] = useState<boolean>(false);

  // Success / notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute column profiles reactively based on data, scope, and user type overrides
  const profiles = useMemo(() => {
    return computeDatasetProfiles(dataset.data, dataset.columns, profilingScope, userTypes);
  }, [dataset.data, dataset.columns, profilingScope, userTypes]);

  // Load a sample benchmark dataset
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (sample) {
      const newDataset = sample.getDataset();
      setDataset(newDataset);
      setSelectedColumn(newDataset.columns[0] || null);
      setUserTypes({});
      showToast(`Loaded "${sample.name}" benchmark dataset.`);
    }
  };

  // Load imported dataset (from local file or Google Sheets)
  const handleDatasetLoaded = (newDataset: Dataset) => {
    setDataset(newDataset);
    setSelectedColumn(newDataset.columns[0] || null);
    setUserTypes({});
    showToast(`Successfully imported "${newDataset.name}" (${newDataset.totalRows.toLocaleString()} rows).`);
  };

  // Change data type of a column
  const handleUpdateColumnType = (col: string, newType: DataType) => {
    setUserTypes((prev) => ({
      ...prev,
      [col]: newType,
    }));
    showToast(`Changed column "${col}" type to ${newType}.`);
  };

  // Quick Clean: Remove rows with blank values
  const handleCleanMissingRows = () => {
    if (!selectedColumn) {
      showToast('Please select a column first.');
      return;
    }
    const beforeCount = dataset.data.length;
    const filtered = dataset.data.filter((row) => !isEmptyValue(row[selectedColumn]));
    const removedCount = beforeCount - filtered.length;

    setDataset((prev) => ({
      ...prev,
      data: filtered,
      totalRows: filtered.length,
    }));
    showToast(`Removed ${removedCount} blank rows from column "${selectedColumn}".`);
  };

  // Quick Clean: Remove duplicate rows
  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const filtered = dataset.data.filter((row) => {
      const key = selectedColumn ? String(row[selectedColumn]) : JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const removedCount = dataset.data.length - filtered.length;

    setDataset((prev) => ({
      ...prev,
      data: filtered,
      totalRows: filtered.length,
    }));
    showToast(`Removed ${removedCount} duplicate rows.`);
  };

  // Apply transformation from TransformModal
  const handleApplyTransform = (newRows: Record<string, any>[]) => {
    setDataset((prev) => ({
      ...prev,
      data: newRows,
      totalRows: newRows.length,
    }));
    showToast('Applied transformation successfully.');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors">
      {/* 1. TOP NAVBAR */}
      <Navbar
        currentDataset={dataset}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onSelectSample={handleSelectSample}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenEdaModal={() => setIsEdaModalOpen(true)}
        onExportCsv={() => exportDatasetToCsv(dataset)}
        onExportReport={() => openPrintableReport(dataset, profiles)}
      />

      {/* 2. POWER QUERY RIBBON */}
      <RibbonBar
        activeTab={activeRibbonTab}
        onTabChange={setActiveRibbonTab}
        showColumnQuality={showColumnQuality}
        onToggleColumnQuality={() => setShowColumnQuality(!showColumnQuality)}
        showColumnDistribution={showColumnDistribution}
        onToggleColumnDistribution={() => setShowColumnDistribution(!showColumnDistribution)}
        showColumnProfile={showColumnProfile}
        onToggleColumnProfile={() => setShowColumnProfile(!showColumnProfile)}
        useMonospace={useMonospace}
        onToggleMonospace={() => setUseMonospace(!useMonospace)}
        profileLayout={profileLayout}
        onToggleProfileLayout={() => setProfileLayout(profileLayout === 'side' ? 'bottom' : 'side')}
        profilingScope={profilingScope}
        onChangeScope={setProfilingScope}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenTransformModal={() => setIsTransformModalOpen(true)}
        onOpenEdaModal={() => setIsEdaModalOpen(true)}
        onCleanMissingRows={handleCleanMissingRows}
        onRemoveDuplicates={handleRemoveDuplicates}
        selectedColumn={selectedColumn}
        onApplyTypeChange={handleUpdateColumnType}
      />

      {/* 3. MAIN WORKSPACE AREA */}
      <main className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left / Center: Data Grid & Optional Bottom Profile */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          <DataGrid
            columns={dataset.columns}
            data={dataset.data}
            profiles={profiles}
            selectedColumn={selectedColumn}
            onSelectColumn={(col) => {
              setSelectedColumn(col);
              if (!showColumnProfile) setShowColumnProfile(true);
            }}
            showColumnQuality={showColumnQuality}
            showColumnDistribution={showColumnDistribution}
            useMonospace={useMonospace}
            onUpdateColumnType={handleUpdateColumnType}
          />

          {/* DOCKED BOTTOM PROFILE (If layout is 'bottom') */}
          {showColumnProfile && profileLayout === 'bottom' && selectedColumn && (
            <ColumnProfilePane
              columnName={selectedColumn}
              profile={profiles[selectedColumn]}
              isOpen={showColumnProfile}
              onClose={() => setShowColumnProfile(false)}
              layout="bottom"
            />
          )}
        </div>

        {/* SIDEBAR RIGHT INSPECTOR (If layout is 'side' - default, giving maximum vertical row room) */}
        {showColumnProfile && profileLayout === 'side' && selectedColumn && (
          <ColumnProfilePane
            columnName={selectedColumn}
            profile={profiles[selectedColumn]}
            isOpen={showColumnProfile}
            onClose={() => setShowColumnProfile(false)}
            layout="side"
          />
        )}
      </main>

      {/* 4. BOTTOM STATUS BAR */}
      <StatusBar
        rowCount={dataset.totalRows}
        columnCount={dataset.totalColumns}
        profilingScope={profilingScope}
        onChangeScope={setProfilingScope}
        selectedColumn={selectedColumn}
      />

      {/* MODALS */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
      />

      <EDAView
        dataset={dataset}
        profiles={profiles}
        isOpen={isEdaModalOpen}
        onClose={() => setIsEdaModalOpen(false)}
      />

      <TransformModal
        dataset={dataset}
        profiles={profiles}
        selectedColumn={selectedColumn}
        isOpen={isTransformModalOpen}
        onClose={() => setIsTransformModalOpen(false)}
        onApplyTransform={handleApplyTransform}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-6 z-50 bg-slate-900 text-amber-400 dark:bg-slate-800 dark:text-amber-300 border border-slate-700 px-4 py-2.5 rounded-lg shadow-2xl text-xs flex items-center space-x-2 animate-fade-in font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
