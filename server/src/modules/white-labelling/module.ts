import { Module, DynamicModule } from '@nestjs/common';
import { WhiteLabellingRepository } from './repository';
import { OrganizationRepository } from '../organizations/repository';
import { FeatureAbilityFactory } from '@modules/white-labelling/ability';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class WhiteLabellingModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { WhiteLabellingController, WhiteLabellingService, WhiteLabellingUtilService } = await this.getProviders(
      configs,
      'white-labelling',
      ['controller', 'service', 'util.service']
    );

    return this.cacheModule(cacheKey, {
      module: WhiteLabellingModule,
      imports: [],
      controllers: isMainImport ? [WhiteLabellingController] : [],
      providers: [
        WhiteLabellingService,
        OrganizationRepository,
        WhiteLabellingRepository,
        WhiteLabellingUtilService,
        FeatureAbilityFactory,
      ],
      exports: [WhiteLabellingUtilService],
    });
  }
}
