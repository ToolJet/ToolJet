import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CustomDomainRepository } from './repository';

@Injectable()
export class CustomDomainCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomDomainCacheService.name);
  private redis: Redis;
  private readonly CACHE_PREFIX = 'custom_domain:org:';
  private readonly TTL_SECONDS = 300; // 5 minutes

  constructor(private readonly repository: CustomDomainRepository) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
      ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
    });
    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack);
    });
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  /**
   * Returns the active custom domain for an organization, or null if none.
   * Cache stores empty string for orgs with no active domain (negative cache).
   * This avoids repeated DB lookups for orgs that haven't configured a domain.
   */
  async getActiveDomainForOrg(organizationId: string): Promise<string | null> {
    try {
      const key = `${this.CACHE_PREFIX}${organizationId}`;
      const cached = await this.redis.get(key);
      if (cached !== null) return cached || null;

      const record = await this.repository.findActiveByOrganizationId(organizationId);
      const domain = record?.domain ?? '';
      await this.redis.set(key, domain, 'EX', this.TTL_SECONDS).catch(() => {});
      return domain || null;
    } catch (error) {
      this.logger.error(`Failed to get active domain for org ${organizationId}: ${error.message}`);
      // Fallback: try DB directly if Redis failed
      try {
        const record = await this.repository.findActiveByOrganizationId(organizationId);
        return record?.domain ?? null;
      } catch {
        return null; // Falls back to TOOLJET_HOST in getHostForOrganization
      }
    }
  }

  async invalidate(organizationId: string): Promise<void> {
    try {
      await this.redis.del(`${this.CACHE_PREFIX}${organizationId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for org ${organizationId}: ${error.message}`);
    }
  }
}
