// ============================================
// Parent Mode Component
// Settings panel for data management (API key handled by Vercel)
// ============================================

import { useState, useRef } from 'react';
import { Settings } from '../types';
import { exportAllData, importAllData, clearAllData, ExportData } from '../services/database';
import styles from './ParentMode.module.css';

interface ParentModeProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onClose: () => void;
}

export function ParentMode({ settings, onUpdateSettings, onClose }: ParentModeProps) {
  const [imageCount, setImageCount] = useState(settings.imageCount);
  const [extraGentleMode, setExtraGentleMode] = useState(settings.extraGentleMode);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    const newSettings: Settings = {
      ...settings,
      imageCount,
      extraGentleMode,
    };
    onUpdateSettings(newSettings);
    setMessage({ type: 'success', text: 'Settings saved!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rylans-story-studio-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Export complete!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Export failed' });
    }
    setIsExporting(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      if (!data.animals || !data.scenes || !data.settings) throw new Error('Invalid file format');
      await importAllData(data);
      setMessage({ type: 'success', text: 'Import complete! Refresh to see changes.' });
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: 'Import failed - check file format' });
    }
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = async () => {
    const confirmed = confirm('Are you sure you want to delete ALL data? This cannot be undone!');
    if (confirmed && confirm('Really delete everything?')) {
      try {
        await clearAllData();
        setMessage({ type: 'success', text: 'All data cleared. Refresh to start fresh.' });
      } catch (error) {
        console.error('Clear error:', error);
        setMessage({ type: 'error', text: 'Failed to clear data' });
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>🔧 Settings</h2>
          <p className={styles.subtitle}>For grown-ups only!</p>
        </div>

        {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>🎨 Image Generation</h3>
          <div className={styles.field}>
            <label className={styles.label}>Images per scene</label>
            <div className={styles.countButtons}>
              {[1, 2, 3, 4].map((count) => (
                <button key={count} className={`${styles.countButton} ${imageCount === count ? styles.countActive : ''}`} onClick={() => setImageCount(count)}>{count}</button>
              ))}
            </div>
            <small className={styles.hint}>More images = more choices!</small>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>🛡️ Safety</h3>
          <label className={styles.toggle}>
            <input type="checkbox" checked={extraGentleMode} onChange={(e) => setExtraGentleMode(e.target.checked)} />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>Extra Gentle Mode<small>Stricter content filtering</small></span>
          </label>
        </section>

        <button className={styles.saveButton} onClick={handleSaveSettings}>💾 Save Settings</button>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>📦 Data Management</h3>
          <div className={styles.dataButtons}>
            <button className={styles.dataButton} onClick={handleExport} disabled={isExporting}>{isExporting ? '⏳ Exporting...' : '📤 Export World'}</button>
            <button className={styles.dataButton} onClick={handleImportClick} disabled={isImporting}>{isImporting ? '⏳ Importing...' : '📥 Import World'}</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </div>
          <button className={styles.dangerButton} onClick={handleClearAll}>🗑️ Clear All Data</button>
        </section>

        <button className={styles.closeButton} onClick={onClose}>← Back to App</button>
      </div>
    </div>
  );
}
