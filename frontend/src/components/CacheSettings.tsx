import React, { useState } from 'react';
import styles from './CacheSettings.module.css';
import { clearAllCache, getCacheStats } from '../lib/cache';

export const CacheSettings: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [cacheStats, setCacheStats] = useState(() => getCacheStats());

  const handleToggle = () => {
    setShowSettings(!showSettings);
    if (!showSettings) {
      setCacheStats(getCacheStats());
    }
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached search results?')) {
      clearAllCache();
      setCacheStats(getCacheStats());
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.toggle} onClick={handleToggle} aria-expanded={showSettings}>
        ⚙️ {showSettings ? 'Hide' : 'Show'} Settings
      </button>

      {showSettings && (
        <div className={styles.panel}>
          <h3 className={styles.title}>Cache & Settings</h3>
          <div className={styles.section}>
            <p className={styles.label}>
              Cached searches: <strong>{cacheStats.count}</strong>
            </p>
            <p className={styles.hint}>
              Cached results expire after 5 minutes. Click below to clear all.
            </p>
            <button className={styles.clearButton} onClick={handleClearCache}>
              Clear All Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
