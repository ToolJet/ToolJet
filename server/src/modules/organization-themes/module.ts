import { Module, DynamicModule } from '@nestjs/common';
import { OrganizationsModule } from '@modules/organizations/module';
import { OrganizationThemesRepository } from './repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class ThemesModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { OrganizationThemesService, OrganizationThemesController, OrganizationThemesUtilService } =
      await this.getProviders(configs, 'organization-themes', ['service', 'controller', 'util.service']);

    return {
      module: ThemesModule,
      imports: [await OrganizationsModule.register(configs)],
      controllers: [OrganizationThemesController],
      providers: [
        OrganizationThemesService,
        OrganizationThemesUtilService,
        OrganizationThemesRepository,
        FeatureAbilityFactory,
      ],
      exports: [OrganizationThemesUtilService],
    };
  }
}
