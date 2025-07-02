import { Module, DynamicModule } from '@nestjs/common';
import { WhiteLabellingModule } from '../white-labelling/module';
import { CrmModule } from '@modules/CRM/module';
import { SubModule } from '@modules/app/sub-module';
import { SMTPModule } from '@modules/smtp/module';

@Module({})
export class OrganizationPaymentModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { OrganizationPaymentController, OrganizationPaymentService } = await this.getProviders(
      configs,
      'organization-payments',
      ['controller', 'service']
    );
    const { EmailUtilService } = await this.getProviders(configs, 'email', ['util.service']);
    return {
      module: OrganizationPaymentModule,
      imports: [
        await WhiteLabellingModule.register(configs),
        await SMTPModule.register(configs),
        await CrmModule.register(configs),
      ],
      controllers: [OrganizationPaymentController],
      providers: [EmailUtilService, OrganizationPaymentService],
      exports: [],
    };
  }
}
