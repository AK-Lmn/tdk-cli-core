/**
 * Shared caching utilities for TDK CLI
 *
 * Provides generic cache implementations with TTL support to ensure
 * consistent caching behavior across the codebase.
 */

/**
 * A single cache entry with value and timestamp.
 * @template T The type of the cached value
 */
export interface CacheEntry<T> {
  value: T;
  /** Unix timestamp when the entry was created */
  timestamp: number;
}

/**
 * Configuration options for the Cache class.
 */
export interface CacheOptions {
  /** Time-to-live in milliseconds before cache entries expire */
  ttlMs: number;
}

export class Cache<T> {
  private data: Map<string, CacheEntry<T>>;
  private options: CacheOptions;

  constructor(options: CacheOptions) {
    this.data = new Map();
    this.options = options;
  }

  /**
   * Check if the cache has a valid (non-expired) entry for the given key
   */
  has(key: string): boolean {
    const entry = this.data.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.options.ttlMs;
    if (isExpired) {
      this.data.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get a value from the cache. Returns undefined if not found or expired.
   */
  get(key: string): T | undefined {
    if (!this.has(key)) {
      return undefined;
    }
    return this.data.get(key)?.value;
  }

  /**
   * Store a value in the cache
   */
  set(key: string, value: T): void {
    this.data.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove a specific entry from the cache
   */
  delete(key: string): void {
    this.data.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * Get all keys in the cache (excluding expired entries)
   */
  keys(): string[] {
    const validKeys: string[] = [];
    for (const key of this.data.keys()) {
      if (this.has(key)) {
        validKeys.push(key);
      }
    }
    return validKeys;
  }

  /**
   * Get the number of valid entries in the cache
   */
  size(): number {
    return this.keys().length;
  }
}

/**
 * Create a simple TTL-based cache validator function
 */
export function createCacheValidator(ttlMs: number) {
  let lastUpdated = 0;

  return {
    isValid(): boolean {
      return Date.now() - lastUpdated < ttlMs;
    },
    markUpdated(): void {
      lastUpdated = Date.now();
    },
    reset(): void {
      lastUpdated = 0;
    },
  };
}
