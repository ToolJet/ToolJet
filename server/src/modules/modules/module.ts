import { DynamicModule, Module } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { ThemesModule } from '@modules/organization-themes/module';
import { FoldersModule } from '@modules/folders/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { OrganizationsModule } from '@modules/organizations/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { VersionRepository } from '@modules/versions/repository';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AiModule } from '@modules/ai/module';
import { AppsRepository } from '@modules/apps/repository';
@Module({})
export class ModulesModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { ModulesController } = await import(`${importPath}/modules/modules.controller`);
    const { AppsService } = await import(`${importPath}/apps/service`);
    const { AppsUtilService } = await import(`${importPath}/apps/util.service`);
    const { PageService } = await import(`${importPath}/apps/services/page.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { PageHelperService } = await import(`${importPath}/apps/services/page.util.service`);

    return {
      module: ModulesModule,
      imports: [
        await FolderAppsModule.register(configs),
        await ThemesModule.register(configs),
        await FoldersModule.register(configs),
        await OrganizationsModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AiModule.register(configs),
      ],
      controllers: [ModulesController],
      providers: [
        AppsService,
        VersionRepository,
        AppsRepository,
        PageService,
        EventsService,
        AppsUtilService,
        ComponentsService,
        PageHelperService,
        OrganizationRepository,
        DataSourcesRepository,
      ],
    };
  }
}
