import { DynamicModule } from '@nestjs/common';
import { CustomDomainRepository } from './repository';
import { FeatureAbilityFactory } from '@modules/custom-domains/ability';
import { SubModule } from '@modules/app/sub-module';

export class CustomDomainsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const { CustomDomainsController, CustomDomainsService, CloudflareProvider } = await this.getProviders(
      configs,
      'custom-domains',
      ['controller', 'service', 'providers/cloudflare-provider']
    );

    return {
      module: CustomDomainsModule,
      imports: [],
      controllers: isMainImport ? [CustomDomainsController] : [],
      providers: [
        CustomDomainsService,
        CustomDomainRepository,
        FeatureAbilityFactory,
        CloudflareProvider,
      ],
      exports: [CustomDomainsService],
    };
  }
}
