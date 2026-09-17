import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class AppConfigModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { ConfigController, ConfigService } = await this.getProviders(configs, 'configs', ['controller', 'service']);

    return this.cacheModule(cacheKey, {
      module: AppConfigModule,
      imports: [await InstanceSettingsModule.register(configs)],
      controllers: isMainImport ? [ConfigController] : [],
      providers: [ConfigService],
    });
  }
}
