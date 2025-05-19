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
import { UserPersonalAccessTokenRepository } from './repositories/UserPersonalAccessTokens.repository';
import { AppsRepository } from '@modules/apps/repository';
import { SessionModule } from '@modules/session/module';
import { UserRepository } from '@modules/users/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
export class ExternalApiModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { ExternalApisController } = await import(`${importPath}/external-apis/controller`);
    const { ExternalApisService } = await import(`${importPath}/external-apis/service`);
    const { ExternalApiUtilService } = await import(`${importPath}/external-apis/util.service`);

    return {
      module: ExternalApiModule,
      imports: [
        await RolesModule.register(configs),
        await GroupPermissionsModule.register(configs),
        await TooljetDbModule.register(configs),
        await AppsModule.register(configs),
        await OrganizationsModule.register(configs),
        await VersionModule.register(configs),
        await SessionModule.register(configs),
      ],
      providers: [
        ExternalApiUtilService,
        ExternalApisService,
        FeatureAbilityFactory,
        RolesRepository,
        UserPersonalAccessTokenRepository,
        AppsRepository,
        UserRepository,
        OrganizationRepository,
      ],
      controllers: [ExternalApisController],
      exports: [ExternalApiUtilService],
    };
  }
}
