import { Module, DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class CrmModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { CrmListenerService, CrmController, CRMService } = await this.getProviders(configs, 'CRM', [
      'listener',
      'controller',
      'service',
    ]);
    return this.cacheModule(cacheKey, {
      module: CrmModule,
      controllers: isMainImport ? [CrmController] : [],
      providers: isMainImport ? [CRMService, CrmListenerService] : [], // Register CRM Listener service
      exports: [], // Export the CRM Listener if needed elsewhere
    });
  }
}
