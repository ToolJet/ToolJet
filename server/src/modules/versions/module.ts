import { DynamicModule } from '@nestjs/common';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { VersionRepository } from '@modules/versions/repository';
import { ThemesModule } from '@modules/organization-themes/module';
import { AppsModule } from '@modules/apps/module';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AppsRepository } from '@modules/apps/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { FeatureAbilityFactory } from './ability';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SubModule } from '@modules/app/sub-module';

export class VersionModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      VersionController,
      VersionControllerV2,
      ComponentsController,
      EventsController,
      PagesController,
      VersionsCreateService,
      VersionService,
      VersionUtilService,
    } = await this.getProviders(configs, 'versions', [
      'controller',
      'controller.v2',
      'controllers/components.controller',
      'controllers/events.controller',
      'controllers/pages.controller',
      'services/create.service',
      'service',
      'util.service',
    ]);

    // Get apps related providers
    const { ComponentsService, EventsService, PageService, PageHelperService } = await this.getProviders(
      configs,
      'apps',
      ['services/component.service', 'services/event.service', 'services/page.service', 'services/page.util.service']
    );

    return {
      module: VersionModule,
      imports: [
        await AppsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await ThemesModule.register(configs),
        await AppPermissionsModule.register(configs),
      ],
      controllers: [ComponentsController, EventsController, PagesController, VersionController, VersionControllerV2],
      providers: [
        ComponentsService,
        EventsService,
        PageService,
        PageHelperService,
        DataQueryRepository,
        DataSourcesRepository,
        VersionRepository,
        AppsRepository,
        AppGitRepository,
        VersionsCreateService,
        PageService,
        EventsService,
        VersionService,
        VersionUtilService,
        FeatureAbilityFactory,
        GroupPermissionsRepository,
      ],
      exports: [VersionUtilService],
    };
  }
}
