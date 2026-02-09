import React from 'react';
import styles from './InstructionsBanner.module.css';

export const InstructionsBanner: React.FC = () => {
  return (
    <div className={styles.banner}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Firearm Application or Renewal</h3>
        <p className={styles.instruction}>
          Provide <strong>Reference Number</strong> OR <strong>Serial Number AND Reference Number</strong>
        </p>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Firearm Competency Certificate (FCC)</h3>
        <p className={styles.instruction}>
          Provide <strong>ONLY the Reference Number</strong> from your FCC application
        </p>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tips</h3>
        <p className={styles.instruction}>
          On failure, double-check your input and try again. If you continue to have issues, request again, sometimes SAPS servers need some waking up hehe
        </p>
      </div>
    </div>
  );
};
