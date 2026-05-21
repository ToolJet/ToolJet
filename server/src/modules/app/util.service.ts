import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '@modules/redis/service';
import { ComponentHealth, DbHealthVerbose, CacheHealthVerbose } from './interfaces/IService';

@Injectable()
export class AppUtilService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService
  ) {}

  // --- Basic checks ---

  async checkDb(): Promise<ComponentHealth> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      return { status: 'error' };
    }
  }

  async checkCache(): Promise<ComponentHealth> {
    try {
      const result = await this.redisService.getClient().ping();
      return { status: result === 'PONG' ? 'ok' : 'error' };
    } catch {
      return { status: 'error' };
    }
  }

  // --- Verbose checks ---

  async checkDbVerbose(): Promise<DbHealthVerbose> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      const latency_ms = Date.now() - start;
      const pool = this.getConnectionPoolInfo();

      return {
        status: 'ok',
        type: this.dataSource.options.type,
        latency_ms,
        ...(pool && { pool }),
      };
    } catch (err) {
      return {
        status: 'error',
        type: this.dataSource.options.type,
        latency_ms: Date.now() - start,
        message: err instanceof Error ? err.message : 'Database unreachable',
      };
    }
  }

  async checkCacheVerbose(): Promise<CacheHealthVerbose> {
    const start = Date.now();
    try {
      const result = await this.redisService.getClient().ping();
      const latency_ms = Date.now() - start;

      if (result !== 'PONG') {
        return { status: 'error', type: 'redis', latency_ms, message: `Unexpected response: ${result}` };
      }

      const info = await this.getRedisInfo();

      return {
        status: 'ok',
        type: 'redis',
        latency_ms,
        ...(info.memory && { memory: info.memory }),
        ...(info.stats && { stats: info.stats }),
      };
    } catch (err) {
      return {
        status: 'error',
        type: 'redis',
        latency_ms: Date.now() - start,
        message: err instanceof Error ? err.message : 'Cache unreachable',
      };
    }
  }

  // --- Helpers ---

  private getConnectionPoolInfo(): DbHealthVerbose['pool'] | null {
    try {
      const driver = this.dataSource.driver as any;
      const pool = driver?.master ?? driver?.pool;
      if (!pool) return null;

      return {
        active: (pool.totalCount ?? 0) - (pool.idleCount ?? 0),
        idle: pool.idleCount ?? 0,
        total: pool.totalCount ?? 0,
      };
    } catch {
      return null;
    }
  }

  private async getRedisInfo(): Promise<{
    memory?: CacheHealthVerbose['memory'];
    stats?: CacheHealthVerbose['stats'];
  }> {
    try {
      const client = this.redisService.getClient();
      const [memoryRaw, statsRaw, serverRaw] = await Promise.all([
        client.info('memory'),
        client.info('stats'),
        client.info('server'),
      ]);

      const parse = (raw: string, key: string): string | null => {
        const match = raw.match(new RegExp(`${key}:(.+)`));
        return match ? match[1].trim() : null;
      };

      const usedMemory = parseFloat(parse(memoryRaw, 'used_memory_rss') ?? '0');
      const peakMemory = parseFloat(parse(memoryRaw, 'used_memory_peak') ?? '0');
      const hits = parseFloat(parse(statsRaw, 'keyspace_hits') ?? '0');
      const misses = parseFloat(parse(statsRaw, 'keyspace_misses') ?? '0');
      const clients = parseInt(parse(statsRaw, 'connected_clients') ?? parse(serverRaw, 'connected_clients') ?? '0');
      const uptime = parseInt(parse(serverRaw, 'uptime_in_seconds') ?? '0');

      const totalRequests = hits + misses;

      return {
        memory: {
          used_mb: Math.round((usedMemory / 1024 / 1024) * 100) / 100,
          peak_mb: Math.round((peakMemory / 1024 / 1024) * 100) / 100,
          usage_percent: peakMemory > 0 ? Math.round((usedMemory / peakMemory) * 10000) / 100 : 0,
        },
        stats: {
          connected_clients: clients,
          hit_rate_percent: totalRequests > 0 ? Math.round((hits / totalRequests) * 10000) / 100 : 0,
          uptime_seconds: uptime,
        },
      };
    } catch {
      return {};
    }
  }
}
