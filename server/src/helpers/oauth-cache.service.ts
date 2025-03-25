import { Injectable } from '@nestjs/common';

@Injectable()
export class OAuthCacheService {
  private static cacheStore: Map<string, Promise<any>> = new Map();

  set(key: string, value: Promise<any>): void {
    OAuthCacheService.cacheStore.set(key, value);
  }

  get(key: string): Promise<any> | undefined {
    return OAuthCacheService.cacheStore.get(key);
  }

  has(key: string): boolean {
    return OAuthCacheService.cacheStore.has(key);
  }

  clear(): void {
    OAuthCacheService.cacheStore.clear();
  }
}
