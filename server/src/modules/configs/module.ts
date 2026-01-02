import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class AppConfigModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { ConfigController, ConfigService } = await this.getProviders(configs, 'configs', ['controller', 'service']);

    return {
      module: AppConfigModule,
      imports: [await InstanceSettingsModule.register(configs)],
      controllers: [ConfigController],
      providers: [ConfigService],
    };
  }
}
