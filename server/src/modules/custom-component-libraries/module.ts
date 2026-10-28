import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { StorageService } from './storage.service';
import { SubModule } from '@modules/app/sub-module';
import { BuiltinPacksController } from './builtin-packs.controller';

export class CustomComponentLibrariesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const { CustomComponentLibrariesController, CustomComponentLibrariesService, DevBundleEventsService } =
      await this.getProviders(configs, 'custom-component-libraries', [
        'controller',
        'service',
        'dev-bundle-events.service',
      ]);

    return {
      module: CustomComponentLibrariesModule,
      imports: [],
      providers: [CustomComponentLibrariesService, FeatureAbilityFactory, StorageService, DevBundleEventsService],
      // Built-in packs are served in every edition, so their controller is the CE one everywhere.
      controllers: isMainImport ? [CustomComponentLibrariesController, BuiltinPacksController] : [],
      exports: [],
    };
  }
}
