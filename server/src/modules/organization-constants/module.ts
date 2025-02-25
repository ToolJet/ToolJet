import { Module, DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { EncryptionModule } from '@modules/encryption/module';
import { OrganizationConstantRepository } from './repository';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';

@Module({})
export class OrganizationConstantModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { OrganizationConstantController } = await import(`${importPath}/organization-constants/controller`);
    const { OrganizationConstantsService } = await import(`${importPath}/organization-constants/service`);
    const { OrganizationConstantsUtilService } = await import(`${importPath}/organization-constants/util.service`);

    return {
      module: OrganizationConstantModule,
      imports: [await AppEnvironmentsModule.register(configs), await EncryptionModule.register(configs)],
      controllers: [OrganizationConstantController],
      providers: [
        OrganizationConstantsUtilService,
        OrganizationConstantsService,
        OrganizationConstantRepository,
        OrganizationRepository,
        AppsRepository,
        FeatureAbilityFactory,
      ],
      exports: [OrganizationConstantsUtilService],
    };
  }
}
