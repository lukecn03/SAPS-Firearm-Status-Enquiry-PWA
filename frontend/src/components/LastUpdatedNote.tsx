import React from 'react';
import styles from './LastUpdatedNote.module.css';

export const LastUpdatedNote: React.FC = () => {
  return (
    <p className={styles.note}>
      📅 <strong>Take note:</strong> The data on this page were updated on 2026-02-02. The results
      shown include finalized as well as outstanding applications for the year prior to the
      updated date.
    </p>
  );
};
