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
        <h3 className={styles.sectionTitle}>Competency Application</h3>
        <p className={styles.instruction}>
          Provide <strong>ONLY the Reference Number</strong>
        </p>
      </div>
    </div>
  );
};
