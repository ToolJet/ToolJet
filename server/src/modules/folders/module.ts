import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';

export class FoldersModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { FoldersController, FoldersService, FoldersUtilService } = await this.getProviders(configs, 'folders', [
      'controller',
      'service',
      'util.service',
    ]);

    return {
      module: FoldersModule,
      controllers: [FoldersController],
      providers: [FoldersUtilService, FoldersService, FeatureAbilityFactory],
      exports: [FoldersUtilService],
    };
  }
}
