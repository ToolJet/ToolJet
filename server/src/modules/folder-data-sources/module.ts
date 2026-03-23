import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class FolderDataSourcesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { FolderDataSourcesController, FolderDataSourcesService, FolderDataSourcesUtilService } =
      await this.getProviders(configs, 'folder-data-sources', ['controller', 'service', 'util.service']);

    return {
      module: FolderDataSourcesModule,
      controllers: isMainImport ? [FolderDataSourcesController] : [],
      providers: [FolderDataSourcesUtilService, FolderDataSourcesService, FeatureAbilityFactory],
      exports: [FolderDataSourcesUtilService],
    };
  }
}
