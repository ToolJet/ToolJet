import { Injectable } from '@nestjs/common';

/**
 * CE stub – no Redis, every call is a cache miss.
 */
@Injectable()
export class RemoteBranchCacheService {
  async get(_organizationId: string): Promise<any[] | null> {
    return null;
  }

  async set(_organizationId: string, _branches: any[]): Promise<void> {}

  async invalidate(_organizationId: string): Promise<void> {}

  async invalidateAndWarm(_organizationId: string, _fetch: () => Promise<any[]>): Promise<void> {}
}
