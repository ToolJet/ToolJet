import { FeatureAbilityFactory } from './ability';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { RolesModule } from '@modules/roles/module';
import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { RolesRepository } from '@modules/roles/repository';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { OrganizationsModule } from '@modules/organizations/module';
import { VersionModule } from '@modules/versions/module';
import { UsersModule } from '@modules/users/module';
import { AppGitModule } from '@modules/app-git/module';
import { GitSyncModule } from '@modules/git-sync/module';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
export class ExternalApiModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { ExternalApisController } = await import(`${importPath}/external-apis/controller`);
    const { ExternalApisService } = await import(`${importPath}/external-apis/service`);
    const { ExternalApiUtilService } = await import(`${importPath}/external-apis/util.service`);

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
      ],
      providers: [
        ExternalApiUtilService,
        ExternalApisService,
        FeatureAbilityFactory,
        RolesRepository,
        GroupPermissionsRepository,
        VersionRepository,
        AppGitRepository,
      ],
      controllers: [ExternalApisController],
      exports: [ExternalApiUtilService],
    };
  }
}
