import { DynamicModule } from '@nestjs/common';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
export class FilesModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { FilesController, FilesService } = await this.getProviders(configs, 'files', ['controller', 'service']);

    return {
      module: FilesModule,
      providers: [FilesService, FilesRepository, FeatureAbilityFactory],
      controllers: isMainImport ? [FilesController] : [],
    };
  }
}
