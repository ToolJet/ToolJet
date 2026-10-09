import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { SessionModule } from '@modules/session/module';
import { UserRepository } from '@modules/users/repositories/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { FeatureAbilityFactory } from './ability';

export class PersonalAccessTokensModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const { PersonalAccessTokensController, PersonalAccessTokensService } = await this.getProviders(
      configs,
      'personal-access-tokens',
      ['controller', 'service']
    );

    return {
      module: PersonalAccessTokensModule,
      // SessionModule: the PAT -> session exchange mints a normal session via SessionUtilService.
      imports: [await SessionModule.register(configs)],
      providers: [PersonalAccessTokensService, FeatureAbilityFactory, UserRepository, OrganizationRepository],
      controllers: isMainImport ? [PersonalAccessTokensController] : [],
      exports: [PersonalAccessTokensService],
    };
  }
}
