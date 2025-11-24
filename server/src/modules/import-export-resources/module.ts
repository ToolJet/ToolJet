import { DynamicModule } from '@nestjs/common';
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
import { SubModule } from '@modules/app/sub-module';

export class ImportExportResourcesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { ImportExportResourcesService, ImportExportResourcesController } = await this.getProviders(
      configs,
      'import-export-resources',
      ['service', 'controller']
    );

    const { AppImportExportService, ComponentsService, EventsService } = await this.getProviders(configs, 'apps', [
      'services/app-import-export.service',
      'services/component.service',
      'services/event.service',
    ]);

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
