import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';
import { DataQueryFolderRepository, DataQueryFolderMappingRepository } from './repository';

export class DataQueryFoldersModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { DataQueryFoldersController, DataQueryFoldersService, DataQueryFoldersUtilService } =
      await this.getProviders(configs, 'data-query-folders', ['controller', 'service', 'util.service']);

    return {
      module: DataQueryFoldersModule,
      controllers: isMainImport ? [DataQueryFoldersController] : [],
      providers: [
        DataQueryFoldersService,
        DataQueryFoldersUtilService,
        DataQueryFolderRepository,
        DataQueryFolderMappingRepository,
        FeatureAbilityFactory,
      ],
      exports: [DataQueryFoldersUtilService],
    };
  }
}
