import { FilesRepository } from '@modules/files/repository';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { SubModule } from '@modules/app/sub-module';

export class PluginsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { PluginsController, PluginsService, PluginsUtilService } = await this.getProviders(configs, 'plugins', [
      'controller',
      'service',
      'util.service',
    ]);
    return {
      module: PluginsModule,
      controllers: [PluginsController],
      providers: [PluginsService, FilesRepository, PluginsUtilService, FeatureAbilityFactory, DataSourcesRepository],
      exports: [PluginsUtilService],
    };
  }
}
