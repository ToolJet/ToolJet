import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class MetaModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { MetadataService, MetadataController, MetadataUtilService } = await this.getProviders(configs, 'meta', [
      'service',
      'controller',
      'util.service',
    ]);

    return {
      module: MetaModule,
      controllers: [MetadataController],
      providers: [MetadataService, MetadataUtilService, FeatureAbilityFactory],
      exports: [MetadataUtilService],
    };
  }
}
