import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { EncryptionModule } from '@modules/encryption/module';
import { UsersModule } from '@modules/users/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { OrganizationConstantModule } from '@modules/organization-constants/module';
import { InternalTableRepository } from '@modules/tooljet-db/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppsRepository } from '@modules/apps/repository';
import { FeatureAbilityFactory } from './ability/app';
import { FeatureAbilityFactory as DataSourceFeatureAbility } from './ability/data-source';

export class ImportExportResourcesModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AppImportExportService } = await import(`${importPath}/apps/services/app-import-export.service`);
    const { ImportExportResourcesService } = await import(`${importPath}/import-export-resources/service`);
    const { ImportExportResourcesController } = await import(`${importPath}/import-export-resources/controller`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);

    return {
      module: ImportExportResourcesModule,
      imports: [
        await EncryptionModule.register(configs),
        await TooljetDbModule.register(configs),
        await UsersModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await OrganizationConstantModule.register(configs),
      ],
      controllers: [ImportExportResourcesController],
      providers: [
        AppsRepository,
        ImportExportResourcesService,
        AppImportExportService,
        InternalTableRepository,
        DataSourcesRepository,
        FeatureAbilityFactory,
        DataSourceFeatureAbility,
        ComponentsService,
        EventsService,
      ],
      exports: [ImportExportResourcesService, AppImportExportService],
    };
  }
}
