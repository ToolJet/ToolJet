import { Module, DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { WhiteLabellingRepository } from './repository';
import { OrganizationRepository } from '../organizations/repository';
import { FeatureAbilityFactory } from '@modules/white-labelling/ability';

@Module({})
export class WhiteLabellingModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { WhiteLabellingController } = await import(`${importPath}/white-labelling/controller`);
    const { WhiteLabellingService } = await import(`${importPath}/white-labelling/service`);
    const { WhiteLabellingUtilService } = await import(`${importPath}/white-labelling/util.service`);

    return {
      module: WhiteLabellingModule,
      imports: [],
      controllers: [WhiteLabellingController],
      providers: [
        WhiteLabellingService,
        OrganizationRepository,
        WhiteLabellingRepository,
        WhiteLabellingUtilService,
        FeatureAbilityFactory,
      ],
      exports: [WhiteLabellingUtilService],
    };
  }
}
