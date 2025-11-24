import { DynamicModule } from '@nestjs/common';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { OrganizationRepository } from './repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { SubModule } from '@modules/app/sub-module';

export class OrganizationsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { OrganizationsService, OrganizationsController, OrganizationsUtilService, FeatureAbilityFactory } =
      await this.getProviders(configs, 'organizations', ['controller', 'service', 'util.service', 'ability']);

    return {
      module: OrganizationsModule,
      imports: [await InstanceSettingsModule.register(configs), await AppEnvironmentsModule.register(configs)],
      controllers: [OrganizationsController],
      providers: [OrganizationsService, OrganizationRepository, FeatureAbilityFactory, OrganizationsUtilService],
      exports: [OrganizationsUtilService],
    };
  }
}
