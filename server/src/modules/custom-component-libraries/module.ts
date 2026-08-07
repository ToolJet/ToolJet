import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { StorageService } from './storage.service';
import { SubModule } from '@modules/app/sub-module';

export class CustomComponentLibrariesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const { CustomComponentLibrariesController, CustomComponentLibrariesService } = await this.getProviders(
      configs,
      'custom-component-libraries',
      ['controller', 'service']
    );

    return {
      module: CustomComponentLibrariesModule,
      imports: [],
      providers: [CustomComponentLibrariesService, FeatureAbilityFactory, StorageService],
      controllers: isMainImport ? [CustomComponentLibrariesController] : [],
      exports: [],
    };
  }
}
