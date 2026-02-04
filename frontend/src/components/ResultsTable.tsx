import React from 'react';
import styles from './ResultsTable.module.css';
import { FirearmRecord } from '../lib/parser';

interface ResultsTableProps {
  records: FirearmRecord[];
  error?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ records, error }) => {
  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Search Results:</h3>
        <div className={styles.error}>
          <p className={styles.errorText}>{error}</p>
          <p className={styles.errorHint}>
            This usually indicates the SAPS servers are offline or not responding.
          </p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Search Results:</h3>
        <p className={styles.empty}>
          Please supply a Serial Number AND Reference Number OR Reference Number ONLY to search
          on...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Search Results:</h3>
      <div className={styles.cards}>
        {records.map((record, idx) => (
          <div key={idx} className={styles.card}>
            <h4 className={styles.cardTitle}>{record.applicationNumber || 'Application'}</h4>
            <dl className={styles.definitionList}>
              <div className={styles.rowItem}>
                <dt className={styles.term}>Application Type</dt>
                <dd className={styles.desc}>{record.applicationType}</dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Calibre</dt>
                <dd className={styles.desc}>{record.calibre}</dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Make</dt>
                <dd className={styles.desc}>{record.make}</dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Serial Number</dt>
                <dd className={styles.desc}>{record.serialNumber}</dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Status Date</dt>
                <dd className={styles.desc}>{record.statusDate}</dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Status</dt>
                <dd className={styles.desc}><span className={styles.statusBadge}>{record.status}</span></dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Status Description</dt>
                <dd className={styles.desc}>{record.statusDescription}</dd>
              </div>

              <div className={styles.rowItem}>
                <dt className={styles.term}>Next Step</dt>
                <dd className={styles.desc}>{record.nextStep}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};
