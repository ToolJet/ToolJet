import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { UsersModule } from '@modules/users/module';
import { EncryptionModule } from '@modules/encryption/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { ThemesModule } from '@modules/organization-themes/module';
import { OrganizationConstantModule } from '@modules/organization-constants/module';
import { FoldersModule } from '@modules/folders/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { AppsModule } from '@modules/apps/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppsRepository } from '@modules/apps/repository';
import { FilesRepository } from '@modules/files/repository';
import { RolesRepository } from '@modules/roles/repository';
import { FeatureAbilityFactory } from './ability';

export class TemplatesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { TemplatesService, TemplateAppsController } = await this.getProviders(configs, 'templates', [
      'service',
      'controller',
    ]);

    const { PageService, EventsService, ComponentsService, PageHelperService } = await this.getProviders(
      configs,
      'apps',
      ['services/page.service', 'services/event.service', 'services/component.service', 'services/page.util.service']
    );

    const { FilesService } = await this.getProviders(configs, 'files', ['service']);

    const { PluginsService, PluginsUtilService } = await this.getProviders(configs, 'plugins', [
      'service',
      'util.service',
    ]);

    return {
      module: TemplatesModule,
      imports: [
        await EncryptionModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await TooljetDbModule.register(configs),
        await UsersModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await ThemesModule.register(configs),
        await OrganizationConstantModule.register(configs),
        await FoldersModule.register(configs),
        await FolderAppsModule.register(configs),
        await AppsModule.register(configs),
        await DataSourcesModule.register(configs),
      ],
      providers: [
        AppsRepository,
        RolesRepository,
        DataSourcesRepository,
        FilesRepository,
        TemplatesService,
        FilesService,
        PageService,
        EventsService,
        ComponentsService,
        PageHelperService,
        PluginsService,
        PluginsUtilService,
        FeatureAbilityFactory,
      ],
      controllers: [TemplateAppsController],
    };
  }
}
