import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';

export class FoldersModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { FoldersController, FoldersService, FoldersUtilService } = await this.getProviders(configs, 'folders', [
      'controller',
      'service',
      'util.service',
    ]);

    return {
      module: FoldersModule,
      controllers: !isMainImport ? [] : [FoldersController],
      providers: !isMainImport ? [FoldersUtilService] : [FoldersUtilService, FoldersService, FeatureAbilityFactory],
      exports: [FoldersUtilService],
    };
  }
}
