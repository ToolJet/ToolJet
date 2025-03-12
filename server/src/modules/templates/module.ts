import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppsRepository } from '@modules/apps/repository';
import { FilesRepository } from '@modules/files/repository';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { UsersModule } from '@modules/users/module';
import { EncryptionModule } from '@modules/encryption/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { ThemesModule } from '@modules/organization-themes/module';
import { OrganizationConstantModule } from '@modules/organization-constants/module';
import { FoldersModule } from '@modules/folders/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { RolesRepository } from '@modules/roles/repository';
import { AppsModule } from '@modules/apps/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { FeatureAbilityFactory } from './ability';

export class TemplatesModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { FilesService } = await import(`${importPath}/files/service`);
    const { PageService } = await import(`${importPath}/apps/services/page.service`);
    const { TemplatesService } = await import(`${importPath}/templates/service`);
    const { TemplateAppsController } = await import(`${importPath}/templates/controller`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { PageHelperService } = await import(`${importPath}/apps/services/page.util.service`);
    const { PluginsService } = await import(`${importPath}/plugins/service`);
    const { PluginsUtilService } = await import(`${importPath}/plugins/util.service`);

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
