import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { OrganizationRepository } from './repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';

export class OrganizationsModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { OrganizationsService } = await import(`${importPath}/organizations/service`);
    const { OrganizationsController } = await import(`${importPath}/organizations/controller`);
    const { FeatureAbilityFactory } = await import(`${importPath}/organizations/ability`);
    const { OrganizationsUtilService } = await import(`${importPath}/organizations/util.service`);

    return {
      module: OrganizationsModule,
      imports: [await InstanceSettingsModule.register(configs), await AppEnvironmentsModule.register(configs)],
      controllers: [OrganizationsController],
      providers: [OrganizationsService, OrganizationRepository, FeatureAbilityFactory, OrganizationsUtilService],
      exports: [OrganizationsUtilService],
    };
  }
}
