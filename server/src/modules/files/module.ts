import { DynamicModule } from '@nestjs/common';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';
import { getImportPath } from '@modules/app/constants';
export class FilesModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { FilesController } = await import(`${importPath}/files/controller`);
    const { FilesService } = await import(`${importPath}/files/service`);
    return {
      module: FilesModule,
      providers: [FilesService, FilesRepository, FeatureAbilityFactory],
      controllers: [FilesController],
    };
  }
}
