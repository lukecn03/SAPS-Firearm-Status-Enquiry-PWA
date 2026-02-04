import { logger } from './logger';

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'firearm_status_cache';

export interface CacheEntry {
  query: {
    fsref: string;
    fserial?: string;
  };
  data: unknown;
  timestamp: number;
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

function getCacheKey(fsref: string, fserial?: string): string {
  return `${fsref}:${fserial || ''}`;
}

export function getFromCache(fsref: string, fserial?: string): unknown | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) {
      logger.debug('Cache miss: no cache found');
      return null;
    }

    const cache: CacheStore = JSON.parse(stored);
    const key = getCacheKey(fsref, fserial);
    const entry = cache[key];

    if (!entry) {
      logger.debug('Cache miss: entry not found', { key });
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      // Cache expired, remove it
      logger.debug('Cache expired', { key, age: now - entry.timestamp });
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    logger.debug('Cache hit', { key, age: now - entry.timestamp });
    return entry.data;
  } catch (error) {
    logger.error('Error reading cache', error);
    return null;
  }
}

export function saveToCache(
  fsref: string,
  fserial: string | undefined,
  data: unknown
): void {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    const cache: CacheStore = stored ? JSON.parse(stored) : {};

    const key = getCacheKey(fsref, fserial);
    cache[key] = {
      query: { fsref, fserial },
      data,
      timestamp: Date.now()
    };

    logger.debug('Saving to cache', { key, dataSize: JSON.stringify(data).length });
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    logger.error('Error saving to cache', error);
  }
}

export function clearCacheEntry(fsref: string, fserial?: string): void {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return;

    const cache: CacheStore = JSON.parse(stored);
    const key = getCacheKey(fsref, fserial);
    delete cache[key];

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    logger.error('Error clearing cache entry:', error);
  }
}

export function clearAllCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    logger.error('Error clearing all cache:', error);
  }
}

export function getCacheStats(): {
  count: number;
  entries: Array<{ query: string; age: number }>;
} {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return { count: 0, entries: [] };

    const cache: CacheStore = JSON.parse(stored);
    const now = Date.now();
    const entries = Object.entries(cache)
      .filter(([, entry]) => now - entry.timestamp <= CACHE_DURATION_MS)
      .map(([, entry]) => ({
        query: `${entry.query.fsref}${entry.query.fserial ? ':' + entry.query.fserial : ''}`,
        age: now - entry.timestamp
      }));

    return { count: entries.length, entries };
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return { count: 0, entries: [] };
  }
}
