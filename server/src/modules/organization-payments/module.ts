import { Module, DynamicModule } from '@nestjs/common';
import { WhiteLabellingModule } from '../white-labelling/module';
import { EmailModule } from '@modules/email/module';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';
import { OrganizationsAiFeatureRepository } from './organizationAiFeature.repository';

@Module({})
export class OrganizationPaymentModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const { OrganizationPaymentController, OrganizationPaymentService } = await this.getProviders(
      configs,
      'organization-payments',
      ['controller', 'service']
    );

    return {
      module: OrganizationPaymentModule,
      imports: [await WhiteLabellingModule.register(configs), await EmailModule.register(configs)],
      controllers: isMainImport ? [OrganizationPaymentController] : [],
      providers: [OrganizationPaymentService, FeatureAbilityFactory, OrganizationsAiFeatureRepository],
      exports: [],
    };
  }
}
