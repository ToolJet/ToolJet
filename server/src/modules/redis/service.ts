import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { TransactionLogger } from '@modules/logging/service';

/**
 * Global Redis Service
 *
 * Provides a singleton Redis connection that can be shared across the application.
 * Automatically initializes on module init and disconnects on module destroy.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly redisService: RedisService) {}
 *
 *   async doSomething() {
 *     const redis = this.redisService.getClient();
 *     await redis.set('key', 'value');
 *   }
 * }
 * ```
 *
 * @remarks
 * For pub/sub usage, create dedicated subscriber connections using `createSubscriber()`
 * since Redis pub/sub requires dedicated connections.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly transactionLogger: TransactionLogger) {}

  /**
   * Redis connection configuration derived from environment variables
   */
  private getRedisConfig() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
      ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
    };
  }

  onModuleInit() {
    this.client = new Redis(this.getRedisConfig());

    this.client.on('error', (err) => {
      this.transactionLogger.error(`[RedisService] Redis connection error: ${err.message}`, err.stack);
    });

    this.client.on('connect', () => {
      this.transactionLogger.log('[RedisService] Redis client connected');
    });

    this.client.on('ready', () => {
      this.transactionLogger.log('[RedisService] Redis client ready');
    });

    this.client.on('close', () => {
      this.transactionLogger.warn('[RedisService] Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.transactionLogger.log('[RedisService] Redis client reconnecting...');
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
    this.transactionLogger.log('[RedisService] Redis client disconnected');
  }

  /**
   * Returns the singleton Redis client instance.
   * Use this for general Redis operations (get, set, hset, etc.)
   */
  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized. Ensure RedisModule is imported.');
    }
    return this.client;
  }

  /**
   * Creates a new dedicated Redis connection for pub/sub subscriber.
   * Redis pub/sub requires dedicated connections - the subscriber connection
   * enters a special mode and can only receive messages.
   *
   * @remarks
   * The caller is responsible for managing the lifecycle of this connection,
   * including calling disconnect() when done.
   *
   * @example
   * ```typescript
   * const subscriber = this.redisService.createSubscriber();
   * subscriber.subscribe('my-channel');
   * subscriber.on('message', (channel, message) => { ... });
   * // Later: subscriber.disconnect();
   * ```
   */
  createSubscriber(): Redis {
    const subscriber = new Redis(this.getRedisConfig());

    subscriber.on('error', (err) => {
      this.transactionLogger.error(`[RedisService] Redis subscriber error: ${err.message}`, err.stack);
    });

    return subscriber;
  }

  /**
   * Creates a new dedicated Redis connection for pub/sub publisher.
   * While the main client can be used for publishing, dedicated publishers
   * are useful for isolation in high-throughput scenarios.
   *
   * @remarks
   * The caller is responsible for managing the lifecycle of this connection.
   */
  createPublisher(): Redis {
    const publisher = new Redis(this.getRedisConfig());

    publisher.on('error', (err) => {
      this.transactionLogger.error(`[RedisService] Redis publisher error: ${err.message}`, err.stack);
    });

    return publisher;
  }
}
