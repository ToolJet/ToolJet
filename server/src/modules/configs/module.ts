import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule, Module } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';

@Module({})
export class AppConfigModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { ConfigService } = await import(`${importPath}/configs/service`);
    const { ConfigController } = await import(`${importPath}/configs/controller`);

    return {
      module: AppConfigModule,
      imports: [await InstanceSettingsModule.register(configs)],
      controllers: [ConfigController],
      providers: [ConfigService],
    };
  }
}
