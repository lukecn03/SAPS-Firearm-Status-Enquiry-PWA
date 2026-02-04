import React, { useState } from 'react';
import styles from './SearchForm.module.css';

interface SearchFormProps {
  onSubmit: (fsref: string, fserial: string) => void;
  onClear: () => void;
  isLoading: boolean;
  initialFsref?: string;
  initialFserial?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSubmit,
  onClear,
  isLoading,
  initialFsref = '',
  initialFserial = ''
}) => {
  const [fsref, setFsref] = useState(initialFsref);
  const [fserial, setFserial] = useState(initialFserial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fsref.trim()) {
      alert('Reference Number is required');
      return;
    }
    onSubmit(fsref, fserial);
  };

  const handleClear = () => {
    setFsref('');
    setFserial('');
    onClear();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="fsref" className={styles.label}>
          Reference Number <span className={styles.required}>*</span>
        </label>
        <input
          id="fsref"
          type="text"
          className={styles.input}
          placeholder="Enter reference number"
          value={fsref}
          onChange={(e) => setFsref(e.target.value)}
          maxLength={40}
          disabled={isLoading}
          aria-describedby="fsref-help"
        />
        <small id="fsref-help" className={styles.help}>
          Required. Max 40 characters.
        </small>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="fserial" className={styles.label}>
          Serial Number <span className={styles.optional}>(Optional)</span>
        </label>
        <input
          id="fserial"
          type="text"
          className={styles.input}
          placeholder="Enter serial number (optional)"
          value={fserial}
          onChange={(e) => setFserial(e.target.value)}
          maxLength={40}
          disabled={isLoading}
          aria-describedby="fserial-help"
        />
        <small id="fserial-help" className={styles.help}>
          Optional. Max 40 characters.
        </small>
      </div>

      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>
    </form>
  );
};
