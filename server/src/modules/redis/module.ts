import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './service';
import { REDIS_MODULE_OPTIONS, RedisModuleOptions } from './redis.constants';

export { REDIS_MODULE_OPTIONS } from './redis.constants';
export type { RedisModuleOptions } from './redis.constants';

/**
 * Global Redis Module
 *
 * Provides a singleton Redis service that can be injected across the application.
 * Import this module once in your root module using `RedisModule.forRoot()`.
 *
 * @example
 * ```typescript
 * // In your module loader or app module:
 * imports: [
 *   RedisModule.forRoot(),
 *   // ... other modules
 * ]
 *
 * // In any service:
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly redisService: RedisService) {}
 * }
 * ```
 */
@Global()
@Module({})
export class RedisModule {
  static forRoot(configs?: { IS_GET_CONTEXT?: boolean }): DynamicModule {
    // In migration/CLI context we register the provider (many services inject RedisService, so it
    // must stay resolvable) but skip the eager connection.
    const options: RedisModuleOptions = { eagerConnect: !configs?.IS_GET_CONTEXT };
    return {
      module: RedisModule,
      providers: [{ provide: REDIS_MODULE_OPTIONS, useValue: options }, RedisService],
      exports: [RedisService],
    };
  }
}
