import { EncryptionModule } from '@modules/encryption/module';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SubModule } from '@modules/app/sub-module';

export class InstanceSettingsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { InstanceSettingsService, InstanceSettingsUtilService, InstanceSettingsController } =
      await this.getProviders(configs, 'instance-settings', ['service', 'controller', 'util.service']);

    return {
      module: InstanceSettingsModule,
      imports: [await EncryptionModule.register(configs)],
      controllers: [InstanceSettingsController],
      providers: [InstanceSettingsUtilService, InstanceSettingsService, FeatureAbilityFactory, OrganizationRepository],
      exports: [InstanceSettingsUtilService],
    };
  }
}
