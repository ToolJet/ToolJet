import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';

export class AppPermissionsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { AppPermissionsController } = await import(`${importPath}/app-permissions/controller`);
    const { AppPermissionsService } = await import(`${importPath}/app-permissions/service`);

    return {
      module: AppPermissionsModule,
      imports: [],
      controllers: [AppPermissionsController],
      providers: [AppPermissionsService, FeatureAbilityFactory],
      exports: [],
    };
  }
}
