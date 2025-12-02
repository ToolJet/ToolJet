import { FeatureAbilityFactory } from './ability';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { RolesModule } from '@modules/roles/module';
import { DynamicModule } from '@nestjs/common';
import { RolesRepository } from '@modules/roles/repository';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { OrganizationsModule } from '@modules/organizations/module';
import { VersionModule } from '@modules/versions/module';
import { UserPersonalAccessTokenRepository } from '../users/repositories/UserPersonalAccessTokens.repository';
import { SessionModule } from '@modules/session/module';
import { UsersModule } from '@modules/users/module';
import { AppGitModule } from '@modules/app-git/module';
import { GitSyncModule } from '@modules/git-sync/module';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SubModule } from '@modules/app/sub-module';
import { AppsRepository } from '@modules/apps/repository';
import { UserRepository } from '@modules/users/repositories/repository';

export class ExternalApiModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { ExternalApisController, ExternalApisService, ExternalApiUtilService, ExternalApisAppsController } =
      await this.getProviders(configs, 'external-apis', [
        'controller',
        'service',
        'util.service',
        'controllers/apps.controller',
      ]);

    return {
      module: ExternalApiModule,
      imports: [
        await UsersModule.register(configs),
        await RolesModule.register(configs),
        await GroupPermissionsModule.register(configs),
        await TooljetDbModule.register(configs),
        await AppsModule.register(configs),
        await OrganizationsModule.register(configs),
        await VersionModule.register(configs),
        await AppGitModule.register(configs),
        await GitSyncModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await SessionModule.register(configs),
      ],
      providers: [
        ExternalApiUtilService,
        ExternalApisService,
        FeatureAbilityFactory,
        RolesRepository,
        AppsRepository,
        GroupPermissionsRepository,
        VersionRepository,
        AppGitRepository,
        OrganizationRepository,
        UserRepository,
        UserPersonalAccessTokenRepository,
        UserRepository,
        AppsRepository,
      ],
      controllers: [ExternalApisController, ExternalApisAppsController],
      exports: [ExternalApiUtilService],
    };
  }
}
