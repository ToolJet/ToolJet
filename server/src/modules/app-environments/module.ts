import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class AppEnvironmentsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { AppEnvironmentsController, AppEnvironmentService, AppEnvironmentUtilService } = await this.getProviders(
      configs,
      'app-environments',
      ['controller', 'service', 'util.service']
    );

    return {
      module: AppEnvironmentsModule,
      controllers: !isMainImport ? [] : [AppEnvironmentsController],
      providers: !isMainImport
        ? [AppEnvironmentUtilService]
        : [AppEnvironmentService, AppEnvironmentUtilService, FeatureAbilityFactory],
      exports: isMainImport ? [] : [AppEnvironmentUtilService],
    };
  }
}
