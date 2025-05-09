import { FeatureAbilityFactory } from './ability';
import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';

export class FoldersModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { FoldersController } = await import(`${importPath}/folders/controller`);
    const { FoldersService } = await import(`${importPath}/folders/service`);
    const { FoldersUtilService } = await import(`${importPath}/folders/util.service`);
    return {
      module: FoldersModule,
      controllers: [FoldersController],
      providers: [FoldersUtilService, FoldersService, FeatureAbilityFactory],
      exports: [FoldersUtilService],
    };
  }
}
