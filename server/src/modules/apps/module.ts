import { DynamicModule, Module } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '@entities/app.entity';
import { ThemesModule } from '@modules/organization-themes/module';
import { FoldersModule } from '@modules/folders/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { Page } from '@entities/page.entity';
import { EventHandler } from '@entities/event_handler.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationsModule } from '@modules/organizations/module';
import { Component } from '@entities/component.entity';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from './repository';
import { FeatureAbilityFactory } from './ability';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AppsSubscriber } from './subscribers/apps.subscriber';
import { AiModule } from '@modules/ai/module';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { RolesRepository } from '@modules/roles/repository';
import { UsersModule } from '@modules/users/module';
import { AppGitRepository } from '@modules/app-git/repository';
@Module({})
export class AppsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { AppsController } = await import(`${importPath}/apps/controller`);
    const { AppsService } = await import(`${importPath}/apps/service`);
    const { AppsUtilService } = await import(`${importPath}/apps/util.service`);
    const { AppEnvironmentUtilService } = await import(`${importPath}/app-environments/util.service`);
    const { PageService } = await import(`${importPath}/apps/services/page.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { AppImportExportService } = await import(`${importPath}/apps/services/app-import-export.service`);
    const { PageHelperService } = await import(`${importPath}/apps/services/page.util.service`);

    return {
      module: AppsModule,
      imports: [
        TypeOrmModule.forFeature([App, Page, EventHandler, Organization, Component, VersionRepository]),
        await FolderAppsModule.register(configs),
        await ThemesModule.register(configs),
        await FoldersModule.register(configs),
        await OrganizationsModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AiModule.register(configs),
        await AppPermissionsModule.register(configs),
        await UsersModule.register(configs),
      ],
      controllers: [AppsController],
      providers: [
        AppsService,
        VersionRepository,
        AppsRepository,
        AppGitRepository,
        AppEnvironmentUtilService,
        PageService,
        EventsService,
        AppsUtilService,
        ComponentsService,
        PageHelperService,
        FeatureAbilityFactory,
        OrganizationRepository,
        AppsSubscriber,
        DataSourcesRepository,
        AppImportExportService,
        RolesRepository,
      ],
      exports: [AppsUtilService, AppImportExportService],
    };
  }
}
