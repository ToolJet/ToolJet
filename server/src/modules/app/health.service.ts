import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis | null = null;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  onModuleInit() {
    const redisHost = process.env.REDIS_HOST;
    if (!redisHost) return;

    this.redisClient = new Redis({
      host: redisHost,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
      ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  async getHealth() {
    return {
      version: globalThis.TOOLJET_VERSION || '',
      db_status: await this.checkDb(),
      cache_status: await this.checkCache(),
    };
  }

  private async checkDb(): Promise<string> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkCache(): Promise<string> {
    if (!this.redisClient) return 'not_configured';
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG' ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }
}
