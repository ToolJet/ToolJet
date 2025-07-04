import { FoldersModule } from '@modules/folders/module';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class FolderAppsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { FolderAppsController, FolderAppsService, FolderAppsUtilService } = await this.getProviders(
      configs,
      'folder-apps',
      ['controller', 'service', 'util.service']
    );

    return {
      module: FolderAppsModule,
      controllers: [FolderAppsController],
      imports: [await FoldersModule.register(configs)],
      providers: [FolderAppsService, FolderAppsUtilService, FeatureAbilityFactory],
      exports: [FolderAppsUtilService],
    };
  }
}
