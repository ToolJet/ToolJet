import { Injectable } from '@nestjs/common';
import { ICacheService } from './interfaces/IUtilService';

interface CacheEntry {
  value: Promise<any>;
  expiresAt: number | null;
}

@Injectable()
export class InMemoryCacheService implements ICacheService {
  private static cacheStore: Map<string, CacheEntry> = new Map();

  set(key: string, value: Promise<any>, ttlMs?: number): void {
    InMemoryCacheService.cacheStore.set(key, {
      value,
      expiresAt: ttlMs != null ? Date.now() + ttlMs : null,
    });
  }

  get(key: string): Promise<any> | undefined {
    const entry = InMemoryCacheService.cacheStore.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt != null && Date.now() > entry.expiresAt) {
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
}
