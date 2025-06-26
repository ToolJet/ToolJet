import { getImportPath } from '@modules/app/constants';
import { EncryptionModule } from '@modules/encryption/module';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';

export class InstanceSettingsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { InstanceSettingsService } = await import(`${importPath}/instance-settings/service`);
    const { InstanceSettingsUtilService } = await import(`${importPath}/instance-settings/util.service`);
    const { InstanceSettingsController } = await import(`${importPath}/instance-settings/controller`);

    return {
      module: InstanceSettingsModule,
      imports: [await EncryptionModule.register(configs)],
      controllers: [InstanceSettingsController],
      providers: [InstanceSettingsUtilService, InstanceSettingsService, FeatureAbilityFactory, OrganizationRepository],
      exports: [InstanceSettingsUtilService],
    };
  }
}
