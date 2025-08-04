import { DynamicModule, Module } from '@nestjs/common';
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
import { UserSessionRepository } from '@modules/session/repository';
import { UserRepository } from '@modules/users/repositories/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SubModule } from '@modules/app/sub-module';
@Module({})
export class AppsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      AppsController,
      WorkflowController,
      AppsService,
      AppsUtilService,
      PageService,
      EventsService,
      ComponentsService,
      WorkflowService,
      AppImportExportService,
      PageHelperService,
    } = await this.getProviders(configs, 'apps', [
      'controller',
      'controllers/workflow.controller',
      'service',
      'util.service',
      'services/page.service',
      'services/event.service',
      'services/component.service',
      'services/workflow.service',
      'services/app-import-export.service',
      'services/page.util.service',
    ]);

    const { AppsActionsListener, TemporalService } = await this.getProviders(configs, 'workflows', [
      'listeners/app-actions.listener',
      'services/temporal.service',
    ]);

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
        await AppEnvironmentsModule.register(configs),
      ],
      controllers: [AppsController, WorkflowController],
      providers: [
        AppsService,
        WorkflowService,
        VersionRepository,
        AppsRepository,
        AppGitRepository,
        AppsActionsListener,
        TemporalService,
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
        UserSessionRepository,
        UserRepository,
        GroupPermissionsRepository,
      ],
      exports: [AppsUtilService, AppImportExportService],
    };
  }
}
