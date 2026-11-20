import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { FeatureAbilityFactory } from './ability';
import { SsrfUtilService } from './util.service';

/**
 * Outbound requests (SSRF) settings API and the runtime config publisher. AppModule leaves this module out of
 * the migration app context (IS_GET_CONTEXT); if something there ever imports it, the publisher is still left
 * out, because its boot read of instance_settings would wait on the migration transaction's lock forever.
 */
export class SsrfModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { SsrfService, SsrfController, SsrfRuntimeConfigService } = await this.getProviders(configs, 'ssrf', [
      'service',
      'controller',
      'runtime-config.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: SsrfModule,
      imports: [await InstanceSettingsModule.register(configs)],
      controllers: isMainImport ? [SsrfController] : [],
      providers: [
        SsrfService,
        SsrfUtilService,
        FeatureAbilityFactory,
        ...(configs.IS_GET_CONTEXT ? [] : [SsrfRuntimeConfigService]),
      ],
    });
  }
}
