import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { AppsRepository } from '@modules/apps/repository';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { WorkspaceContextController } from './controller';
import { WorkspaceContextService } from './service';

export class WorkspaceContextModule extends SubModule {
  static async register(
    _configs?: { IS_GET_CONTEXT: boolean },
    isMainImport: boolean = false
  ): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(_configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    return this.cacheModule(cacheKey, {
      module: WorkspaceContextModule,
      imports: [],
      controllers: isMainImport ? [WorkspaceContextController] : [],
      providers: [
        WorkspaceContextService,
        AppsRepository,
        DataQueryRepository,
        DataSourcesRepository,
        OrganizationRepository,
      ],
      exports: [],
    });
  }
}
