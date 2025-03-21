import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { FeatureAbilityFactory } from './ability';

export class MetaModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { MetadataService } = await import(`${importPath}/meta/service`);
    const { MetadataController } = await import(`${importPath}/meta/controller`);
    const { MetadataUtilService } = await import(`${importPath}/meta/util.service`);

    return {
      module: MetaModule,
      controllers: [MetadataController],
      providers: [MetadataService, MetadataUtilService, FeatureAbilityFactory],
      exports: [MetadataUtilService],
    };
  }
}
