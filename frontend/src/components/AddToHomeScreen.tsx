import React from 'react';
import styles from '../App.module.css';

export const AddToHomeScreen: React.FC = () => {
  const basePath = import.meta.env.BASE_URL || '/';
  const href = `${basePath}a2hs.html`;

  return (
    <a href={href} className={styles.footerLink}>
      Add to Home Screen
    </a>
  );
};
