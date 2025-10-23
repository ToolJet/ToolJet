import { FeatureAbilityFactory } from './ability';
import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

export class ExternalApiModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const { ScimService, ScimController } = await this.getProviders(configs, 'scim', ['controller', 'service']);

    return {
      module: ExternalApiModule,
      providers: [FeatureAbilityFactory, ScimService],
      controllers: isMainImport ? [ScimController] : [],
    };
  }
}
