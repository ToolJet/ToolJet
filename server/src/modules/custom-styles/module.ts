import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { OrganizationsModule } from '@modules/organizations/module';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';

export class CustomStylesModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { CustomStylesController } = await import(`${importPath}/custom-styles/controller`);
    const { CustomStylesService } = await import(`${importPath}/custom-styles/service`);
    return {
      module: CustomStylesModule,
      imports: [await OrganizationsModule.register(configs)],
      providers: [CustomStylesService, FeatureAbilityFactory, OrganizationRepository, AppsRepository],
      controllers: [CustomStylesController],
      exports: [],
    };
  }
}
