import { DynamicModule } from '@nestjs/common';
import { UserRepository } from '@modules/users/repositories/repository';
import { RolesRepository } from '@modules/roles/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { RolesModule } from '@modules/roles/module';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class GroupPermissionsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      GroupPermissionsService,
      GroupPermissionsUtilService,
      GroupPermissionsControllerV2,
      GranularPermissionsService,
      GranularPermissionsUtilService,
      GroupPermissionLicenseUtilService,
      GroupPermissionsDuplicateService,
      GranularPermissionsController,
      GroupAdminService,
      GroupAdminController,
    } = await this.getProviders(configs, 'group-permissions', [
      'service',
      'util.service',
      'controller',
      'services/granular-permissions.service',
      'util-services/granular-permissions.util.service',
      'util-services/license.util.service',
      'services/duplicate.service',
      'controllers/granular-permissions.controller',
      'services/group-admin.service',
      'controllers/group-admin.controller',
    ]);

    return this.cacheModule(cacheKey, {
      module: GroupPermissionsModule,
      imports: [await RolesModule.register(configs)],
      controllers: isMainImport
        ? [GranularPermissionsController, GroupPermissionsControllerV2, GroupAdminController]
        : [],
      providers: [
        GranularPermissionsService,
        GroupPermissionsService,
        GroupPermissionsDuplicateService,
        GroupPermissionsUtilService,
        GranularPermissionsUtilService,
        GroupPermissionLicenseUtilService,
        GroupAdminService,
        OrganizationUsersRepository,
        RolesRepository,
        UserRepository,
        GroupPermissionsRepository,
        FeatureAbilityFactory,
      ],
      exports: [GroupPermissionsUtilService, GranularPermissionsUtilService, GroupAdminService],
    });
  }
}         