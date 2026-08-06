import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { InMemoryCacheModule } from '@modules/inMemoryCache/module';

@Module({})
export class AppConfigModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { ConfigController, ConfigService } = await this.getProviders(configs, 'configs', ['controller', 'service']);

    return {
      module: AppConfigModule,
      imports: [await InstanceSettingsModule.register(configs), await InMemoryCacheModule.register(configs)],
      controllers: isMainImport ? [ConfigController] : [],
      providers: [ConfigService],
    };
  }
}
