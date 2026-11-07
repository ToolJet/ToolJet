import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';
import { CodePageSecurityService as CodePageSecurityServiceBase } from './service';

export class CodePageSecurityModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;
    const { CodePageSecurityController, CodePageSecurityService } = await this.getProviders(
      configs,
      'code-page-security',
      ['controller', 'service']
    );
    return this.cacheModule(cacheKey, {
      module: CodePageSecurityModule,
      providers: [{ provide: CodePageSecurityServiceBase, useClass: CodePageSecurityService }, FeatureAbilityFactory],
      controllers: isMainImport ? [CodePageSecurityController] : [],
      exports: [CodePageSecurityServiceBase],
    });
  }
}
