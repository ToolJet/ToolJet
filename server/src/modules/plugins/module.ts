import { FilesRepository } from '@modules/files/repository';
import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { DataSourcesRepository } from '@modules/data-sources/repository';

export class PluginsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { PluginsController } = await import(`${importPath}/plugins/controller`);
    const { PluginsService } = await import(`${importPath}/plugins/service`);
    const { PluginsUtilService } = await import(`${importPath}/plugins/util.service`);
    return {
      module: PluginsModule,
      controllers: [PluginsController],
      providers: [PluginsService, FilesRepository, PluginsUtilService, FeatureAbilityFactory, DataSourcesRepository],
      exports: [PluginsUtilService],
    };
  }
}
