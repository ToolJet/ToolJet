import { Injectable } from '@nestjs/common';
import { ICacheService } from './interfaces/IUtilService';

@Injectable()
export class InMemoryCacheService implements ICacheService {
  private static cacheStore: Map<string, Promise<any>> = new Map();

  set(key: string, value: Promise<any>): void {
    InMemoryCacheService.cacheStore.set(key, value);
  }

  get(key: string): Promise<any> | undefined {
    return InMemoryCacheService.cacheStore.get(key);
  }

  has(key: string): boolean {
    return InMemoryCacheService.cacheStore.has(key);
  }

  clear(): void {
    InMemoryCacheService.cacheStore.clear();
  }
}
