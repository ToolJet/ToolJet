import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
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
      providers: [PersonalAccessTokensService, FeatureAbilityFactory],
      controllers: isMainImport ? [PersonalAccessTokensController] : [],
      exports: [PersonalAccessTokensService],
    };
  }
}
