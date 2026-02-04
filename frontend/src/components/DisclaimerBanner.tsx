import React from 'react';
import styles from './DisclaimerBanner.module.css';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className={styles.banner}>
      <h2 className={styles.title}>Privacy & Data Protection</h2>
      <ul className={styles.list}>
        <li>
          This application queries <strong>SAPS servers</strong> and displays only the status
          returned from SAPS.
        </li>
        <li>
          The app is designed to be <strong>POPIA-compliant</strong>: we collect only what is
          necessary, for the stated purpose, and retain it minimally.
        </li>
        <li>
          We <strong>do not store personal data</strong> server-side.
        </li>
        <li>
          <strong>No server-side logging</strong> of reference or serial numbers is performed by
          the app's proxy.
        </li>
        <li>
          This project is <strong>not affiliated with SAPS</strong> and is provided as-is for
          public convenience.
        </li>
      </ul>
    </div>
  );
};
