import { FilesRepository } from '@modules/files/repository';
import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';

export class PluginsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { PluginsController } = await import(`${importPath}/plugins/controller`);
    const { PluginsService } = await import(`${importPath}/plugins/service`);
    const { PluginsUtilService } = await import(`${importPath}/plugins/util.service`);
    return {
      module: PluginsModule,
      controllers: [PluginsController],
      providers: [PluginsService, FilesRepository, PluginsUtilService, FeatureAbilityFactory],
      exports: [PluginsUtilService],
    };
  }
}
