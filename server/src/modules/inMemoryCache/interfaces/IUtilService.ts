export interface ICacheService {
  /**
   * Store a promise value in the cache with the given key
   * @param key - The cache key
   * @param value - The promise to cache
   */
  set(key: string, value: Promise<any>): void;

  /**
   * Retrieve a cached promise by key
   * @param key - The cache key
   * @returns The cached promise or undefined if not found
   */
  get(key: string): Promise<any> | undefined;

  /**
   * Check if a key exists in the cache
   * @param key - The cache key
   * @returns True if the key exists, false otherwise
   */
  has(key: string): boolean;

  /**
   * Clear all cached entries
   */
  clear(): void;
}
