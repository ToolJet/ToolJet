import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CustomDomainRepository } from './repository';

@Injectable()
export class CustomDomainCacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly CACHE_PREFIX = 'custom_domain:org:';
  private readonly TTL_SECONDS = 300; // 5 minutes

  constructor(private readonly repository: CustomDomainRepository) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
      ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
    });
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  async getActiveDomainForOrg(organizationId: string): Promise<string | null> {
    const key = `${this.CACHE_PREFIX}${organizationId}`;
    const cached = await this.redis.get(key);
    if (cached !== null) return cached || null; // empty string = "no domain"

    const record = await this.repository.findActiveByOrganizationId(organizationId);
    const domain = record?.domain ?? '';
    await this.redis.set(key, domain, 'EX', this.TTL_SECONDS);
    return domain || null;
  }

  async invalidate(organizationId: string): Promise<void> {
    await this.redis.del(`${this.CACHE_PREFIX}${organizationId}`);
  }
}
