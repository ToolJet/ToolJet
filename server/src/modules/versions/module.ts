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
import { getImportPath } from '@modules/app/constants';

export class VersionModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { VersionController } = await import(`${importPath}/versions/controller`);
    const { VersionControllerV2 } = await import(`${importPath}/versions/controller.v2`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { PageService } = await import(`${importPath}/apps/services/page.service`);
    const { PageHelperService } = await import(`${importPath}/apps/services/page.util.service`);
    const { VersionsCreateService } = await import(`${importPath}/versions/services/create.service`);
    const { VersionService } = await import(`${importPath}/versions/service`);
    const { VersionUtilService } = await import(`${importPath}/versions/util.service`);
    const { ComponentsController } = await import(`${importPath}/versions/controllers/components.controller`);
    const { EventsController } = await import(`${importPath}/versions/controllers/events.controller`);
    const { PagesController } = await import(`${importPath}/versions/controllers/pages.controller`);

    return {
      module: VersionModule,
      imports: [
        await AppsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await ThemesModule.register(configs),
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
        VersionsCreateService,
        PageService,
        EventsService,
        VersionService,
        VersionUtilService,
        FeatureAbilityFactory,
      ],
    };
  }
}
