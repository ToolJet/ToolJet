import { Module, DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { OrganizationsModule } from '@modules/organizations/module';
import { OrganizationThemesRepository } from './repository';
import { FeatureAbilityFactory } from './ability';

@Module({})
export class ThemesModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { OrganizationThemesService } = await import(`${importPath}/organization-themes/service`);
    const { OrganizationThemesController } = await import(`${importPath}/organization-themes/controller`);
    const { OrganizationThemesUtilService } = await import(`${importPath}/organization-themes/util.service`);

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
