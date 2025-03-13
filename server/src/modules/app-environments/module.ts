import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { FeatureAbilityFactory } from './ability';

export class AppEnvironmentsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AppEnvironmentsController } = await import(`${importPath}/app-environments/controller`);
    const { AppEnvironmentService } = await import(`${importPath}/app-environments/service`);
    const { AppEnvironmentUtilService } = await import(`${importPath}/app-environments/util.service`);

    return {
      module: AppEnvironmentsModule,
      controllers: [AppEnvironmentsController],
      providers: [AppEnvironmentService, AppEnvironmentUtilService, FeatureAbilityFactory],
      exports: [AppEnvironmentUtilService],
    };
  }
}
