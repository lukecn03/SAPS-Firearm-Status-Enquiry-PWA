/**
 * Simple logging utility for backend debugging
 * Logs only in development environment
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, data ? data : '');
    }
  },
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[INFO] ${new Date().toISOString()} ${message}`, data ? data : '');
    }
  },
  warn: (message: string, data?: any) => {
    if (isDev) {
      console.warn(`[WARN] ${new Date().toISOString()} ${message}`, data ? data : '');
    }
  },
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error ? error : '');
    }
  }
};
