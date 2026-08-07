import { DynamicModule } from '@nestjs/common';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { VersionRepository } from '@modules/versions/repository';
import { ThemesModule } from '@modules/organization-themes/module';
import { AppsModule } from '@modules/apps/module';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AppsRepository } from '@modules/apps/repository';
import { FeatureAbilityFactory } from './ability';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SubModule } from '@modules/app/sub-module';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';
import { AppHistoryModule } from '@modules/app-history/module';
import { ValidModuleByCorrelationGuard } from './guards/valid-module-by-correlation.guard';

export class VersionModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const {
      VersionController,
      VersionControllerV2,
      ComponentsController,
      EventsController,
      PagesController,
      VersionsCreateService,
      VersionService,
      VersionUtilService,
      GitSyncEditGuard,
    } = await this.getProviders(configs, 'versions', [
      'controller',
      'controller.v2',
      'controllers/components.controller',
      'controllers/events.controller',
      'controllers/pages.controller',
      'services/create.service',
      'service',
      'util.service',
      'guards/git-sync-edit.guard',
    ]);

    // Get apps related providers
    const { ComponentsService, EventsService, PageService, PageHelperService } = await this.getProviders(
      configs,
      'apps',
      ['services/component.service', 'services/event.service', 'services/page.service', 'services/page.util.service']
    );

    return this.cacheModule(cacheKey, {
      module: VersionModule,
      imports: [
        await AppsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await ThemesModule.register(configs),
        await AppPermissionsModule.register(configs),
        await AppHistoryModule.register(configs),
        await GitSyncConfigsModule.register(configs),
      ],
      controllers: isMainImport
        ? [ComponentsController, EventsController, PagesController, VersionController, VersionControllerV2]
        : [],
      providers: [
        ComponentsService,
        EventsService,
        PageService,
        PageHelperService,
        DataQueryRepository,
        DataSourcesRepository,
        VersionRepository,
        OrganizationGitSyncRepository,
        AppsRepository,
        VersionsCreateService,
        PageService,
        EventsService,
        VersionService,
        VersionUtilService,
        FeatureAbilityFactory,
        GroupPermissionsRepository,
        ValidModuleByCorrelationGuard,
        GitSyncEditGuard,
      ],
      exports: [VersionUtilService],
    });
  }
}
