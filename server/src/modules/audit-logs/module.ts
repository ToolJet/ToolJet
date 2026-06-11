import { Module, DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class AuditLogsModule extends SubModule {
  static async register(): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey();
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    return this.cacheModule(cacheKey, {
      module: AuditLogsModule,
    });
  }
}
