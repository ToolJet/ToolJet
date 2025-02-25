import { FoldersModule } from '@modules/folders/module';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { getImportPath } from '@modules/app/constants';

export class FolderAppsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { FolderAppsController } = await import(`${importPath}/folder-apps/controller`);
    const { FolderAppsService } = await import(`${importPath}/folder-apps/service`);
    const { FolderAppsUtilService } = await import(`${importPath}/folder-apps/util.service`);
    return {
      module: FolderAppsModule,
      controllers: [FolderAppsController],
      imports: [await FoldersModule.register(configs)],
      providers: [FolderAppsService, FolderAppsUtilService, FeatureAbilityFactory],
      exports: [FolderAppsUtilService],
    };
  }
}
