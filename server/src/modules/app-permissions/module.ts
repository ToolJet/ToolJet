import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { RolesRepository } from '@modules/roles/repository';
import { PageUsersRepository } from './repositories/page-users.repository';
import { PagePermissionsRepository } from './repositories/page-permissions.repository';
import { QueryUsersRepository } from './repositories/query-users.repository';
import { QueryPermissionsRepository } from './repositories/query-permissions.repository';
import { ComponentUsersRepository } from './repositories/component-users.repository';
import { ComponentPermissionsRepository } from './repositories/component-permissions.repository';
import { SubModule } from '@modules/app/sub-module';
import { AppsRepository } from '@modules/apps/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { ViewAsService } from './view-as.service';

export class AppPermissionsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      AppPermissionsController,
      AppPermissionsService,
      AppPermissionsUtilService,
      ViewAsService: ViewAsServiceImpl,
    } = await this.getProviders(configs, 'app-permissions', [
      'controller',
      'service',
      'util.service',
      'view-as.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: AppPermissionsModule,
      controllers: isMainImport ? [AppPermissionsController] : [],
      providers: [
        AppPermissionsService,
        AppPermissionsUtilService,
        // Registered under the CE class so CE code (ViewAsInterceptor) and EE code inject the same
        // token; the edition decides the implementation.
        { provide: ViewAsService, useClass: ViewAsServiceImpl },
        AppsRepository,
        RolesRepository,
        PageUsersRepository,
        PagePermissionsRepository,
        QueryUsersRepository,
        QueryPermissionsRepository,
        ComponentUsersRepository,
        ComponentPermissionsRepository,
        FeatureAbilityFactory,
        GroupPermissionsRepository,
      ],
      exports: [AppPermissionsUtilService, ViewAsService],
    });
  }
}
