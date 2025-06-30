import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule, Module } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class SMTPModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { SMTPService, SmtpController, SMTPUtilService } = await this.getProviders(configs, 'smtp', [
      'service',
      'util.service',
      'controller',
    ]);
    return {
      module: SMTPModule,
      imports: [await InstanceSettingsModule.register(configs)],
      controllers: [SmtpController],
      providers: [SMTPService, FeatureAbilityFactory, SMTPUtilService, OrganizationRepository],
      exports: [SMTPUtilService],
    };
  }
}
