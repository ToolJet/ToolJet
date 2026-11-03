import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { AppsRepository } from '@modules/apps/repository';
import { AppSecurityAbilityFactory, ScanPolicyAbilityFactory } from './ability';
import { AppSecurityService as AppSecurityServiceBase } from './service';

export class AppSecurityModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;
    // The edition's service module may also export a scheduler (the CE stub does not).
    const { AppSecurityController, ScanPolicyController, AppSecurityService, AppSecurityRecheckScheduler } =
      await this.getProviders(configs, 'app-security', ['controller', 'service']);
    return this.cacheModule(cacheKey, {
      module: AppSecurityModule,
      providers: [
        // The edition's service, under the public class as its token.
        { provide: AppSecurityServiceBase, useClass: AppSecurityService },
        AppSecurityAbilityFactory,
        ScanPolicyAbilityFactory,
        AppsRepository,
        // Only in the main import, so the interval is set up once.
        ...(isMainImport && AppSecurityRecheckScheduler ? [AppSecurityRecheckScheduler] : []),
      ],
      controllers: isMainImport ? [AppSecurityController, ScanPolicyController] : [],
      exports: [AppSecurityServiceBase],
    });
  }
}
