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
import { AppsRepository } from '@modules/apps/repository';
import { SessionModule } from '@modules/session/module';
import { UserRepository } from '@modules/users/repositories/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { UsersModule } from '@modules/users/module';
import { SubModule } from '@modules/app/sub-module';
export class ExternalApiModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { ExternalApisController, ExternalApisService, ExternalApiUtilService } = await this.getProviders(
      configs,
      'external-apis',
      ['controller', 'service', 'util.service']
    );

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
