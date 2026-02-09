import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import { AddToHomeScreen } from './components/AddToHomeScreen';
import { InstructionsBanner } from './components/InstructionsBanner';
import { SearchForm } from './components/SearchForm';
import { ResultsTable } from './components/ResultsTable';
import { queryFirearmStatus } from './lib/api';
import { getFromCache, saveToCache, clearCacheEntry, getLastQuery, saveLastQuery, FirearmRecord } from './lib/cache';
import { logger } from './lib/logger';

function App() {
  const basePath = import.meta.env.BASE_URL || '/';
  const privacyHref = `${basePath}privacy.html`;
  const [records, setRecords] = useState<FirearmRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [lastQuery, setLastQuery] = useState<{ fsref: string; fserial: string }>({
    fsref: '',
    fserial: ''
  });

  // Load last query from localStorage on app mount
  useEffect(() => {
    const saved = getLastQuery();
    if (saved) {
      setLastQuery(saved);
      logger.debug('Restored last query from localStorage');
    }
  }, []);

  const handleSearch = async (fsref: string, fserial: string) => {
    setIsLoading(true);
    setError(undefined);
    setRecords([]);
    setLastQuery({ fsref, fserial });
    
    // Save to localStorage for next time
    saveLastQuery(fsref, fserial);

    try {
      // Check cache first
      const cached = getFromCache(fsref, fserial);
      if (cached && Array.isArray(cached)) {
        setRecords(cached);
        setIsLoading(false);
        return;
      }

      // Query API
      const result = await queryFirearmStatus(fsref, fserial);

      if (result.error) {
        setError(result.error.message);
        setRecords([]);
      } else {
        setRecords(result.records);
        // Cache successful results
        saveToCache(fsref, fserial, result.records);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to search: ${message}`);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRecords([]);
    setError(undefined);
    if (lastQuery.fsref) {
      clearCacheEntry(lastQuery.fsref, lastQuery.fserial);
    }
    setLastQuery({ fsref: '', fserial: '' });
  };



  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>SAPS Firearm Status Enquiry</h1>
        <p className={styles.subtitle}>Check your firearm application or competency application status</p>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <InstructionsBanner />

          <SearchForm
            onSubmit={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
            initialFsref={lastQuery.fsref}
            initialFserial={lastQuery.fserial}
          />

          <ResultsTable records={records} error={error} />
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Not affiliated with SAPS.{' '}
          <a
            href="https://github.com/lukecn03/SAPS-Firearm-Status-Enquiry-PWA"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
        <p>
          <a href={privacyHref} className={styles.footerLink}>Privacy Policy</a> •{' '}
          <AddToHomeScreen />
        </p>
        <p className={styles.version}>v1.0.0</p>
      </footer>
    </div>
  );
}

export default App;
