import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './service';

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
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      providers: [RedisService],
      exports: [RedisService],
    };
  }
}
