import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { AppsRepository } from '@modules/apps/repository';
import { StorageService } from '@modules/custom-component-libraries/storage.service';
import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';
import { FeatureAbilityFactory } from './ability';
import { DEV_TRACK_UPLOADER, GIT_SYNC_DETAILS } from './constants';
import { CodeModeSourceService as CodeModeSourceServiceBase } from './service';

export class CodeModeSourceModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;
    const { CodeModeSourceController, CodeModeSourceService, CodeModeCliController } = await this.getProviders(
      configs,
      'code-mode-source',
      ['controller', 'service', 'cli.controller']
    );
    const { CustomComponentLibrariesService, DevBundleEventsService } = await this.getProviders(
      configs,
      'custom-component-libraries',
      ['service', 'dev-bundle-events.service']
    );
    const { GitSyncConfigsUtilService } = await this.getProviders(configs, 'git-sync-configs', ['util.service']);
    return this.cacheModule(cacheKey, {
      module: CodeModeSourceModule,
      imports: [await GitSyncConfigsModule.register(configs)],
      providers: [
        // The edition's service, under the public class as its token.
        { provide: CodeModeSourceServiceBase, useClass: CodeModeSourceService },
        FeatureAbilityFactory,
        AppsRepository,
        StorageService,
        DevBundleEventsService,
        CustomComponentLibrariesService,
        { provide: DEV_TRACK_UPLOADER, useExisting: CustomComponentLibrariesService },
        { provide: GIT_SYNC_DETAILS, useExisting: GitSyncConfigsUtilService },
      ],
      controllers: isMainImport ? [CodeModeSourceController, CodeModeCliController] : [],
      exports: [CodeModeSourceServiceBase],
    });
  }
}
