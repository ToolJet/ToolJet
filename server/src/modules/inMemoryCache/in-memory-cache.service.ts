import { Injectable } from '@nestjs/common';
import { ICacheService } from './interfaces/IUtilService';

// Entries without an explicit ttl still expire, so a key that is never read again can't stay forever
const DEFAULT_TTL_MS = 5 * 60_000;
// Process-wide store; past this, the oldest entry is dropped
const MAX_ENTRIES = 1000;

interface CacheEntry {
  value: Promise<any>;
  expiresAt: number;
}

@Injectable()
export class InMemoryCacheService implements ICacheService {
  private static cacheStore: Map<string, CacheEntry> = new Map();

  set(key: string, value: Promise<any>, ttlMs: number = DEFAULT_TTL_MS): void {
    const store = InMemoryCacheService.cacheStore;
    store.delete(key);
    if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key: string): Promise<any> | undefined {
    const entry = InMemoryCacheService.cacheStore.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      InMemoryCacheService.cacheStore.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    InMemoryCacheService.cacheStore.delete(key);
  }

  clear(): void {
    InMemoryCacheService.cacheStore.clear();
  }

  // The store is shared by the whole process, so code that saves cached data can drop the entry
  // without injecting this service.
  static forget(key: string): void {
    InMemoryCacheService.cacheStore.delete(key);
  }
}
