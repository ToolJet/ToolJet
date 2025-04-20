import { getImportPath } from '@modules/app/constants';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule, Module } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';

@Module({})
export class SMTPModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { SMTPService } = await import(`${importPath}/smtp/service`);
    const { SmtpController } = await import(`${importPath}/smtp/controller`);
    const { SMTPUtilService } = await import(`${importPath}/smtp/util.service`)
    return {
      module: SMTPModule,
      imports: [await InstanceSettingsModule.register(configs)],
      controllers: [SmtpController],
      providers: [SMTPService, FeatureAbilityFactory, SMTPUtilService],
    };
  }
}
