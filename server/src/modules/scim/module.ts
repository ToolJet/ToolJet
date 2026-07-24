import { FeatureAbilityFactory } from './ability';
import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { ExternalApiModule } from '@modules/external-apis/module';
import { GroupPermissionsModule } from '@modules/group-permissions/module';

export class ScimModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      ScimService,
      ScimController,
      ScimUsersController,
      ScimUsersService,
      ScimGroupsController,
      ScimGroupsService,
    } = await this.getProviders(configs, 'scim', [
      'controller',
      'service',
      'controllers/scim-users.controller',
      'services/scim-users.service',
      'controllers/scim-groups.controller',
      'services/scim-groups.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: ScimModule,
      imports: [await ExternalApiModule.register(configs), await GroupPermissionsModule.register(configs)],
      providers: [FeatureAbilityFactory, ScimService, ScimUsersService, ScimGroupsService],
      controllers: isMainImport ? [ScimController, ScimUsersController, ScimGroupsController] : [],
    });
  }
}
