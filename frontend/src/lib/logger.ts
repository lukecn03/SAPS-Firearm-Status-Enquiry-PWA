/**
 * Simple logging utility for frontend debugging
 */

const isProd = import.meta.env.PROD;

function safeConsole(fn?: (...args: any[]) => void, ...args: any[]) {
  if (!isProd && fn) {
    try {
      fn(...args);
    } catch (_) {
      // swallow console errors in rare environments
    }
  }
}

export const logger = {
  debug: (message: string, data?: any) => {
    safeConsole(console.log, `[DEBUG] ${message}`, data ? data : '');
  },
  info: (message: string, data?: any) => {
    safeConsole(console.log, `[INFO] ${message}`, data ? data : '');
  },
  warn: (message: string, data?: any) => {
    safeConsole(console.warn, `[WARN] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    safeConsole(console.error, `[ERROR] ${message}`, error ? error : '');
  }
};
