import { Module, DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { SMTPModule } from '@modules/smtp/module';
import { WhiteLabellingModule } from '@modules/white-labelling/module';

@Module({})
export class CrmModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { CrmListenerService } = await this.getProviders(configs, 'CRM', ['listener']);
    const { EmailUtilService } = await this.getProviders(configs, 'email', ['util.service']);

    return {
      module: CrmModule,
      imports: [await SMTPModule.register(configs), await WhiteLabellingModule.register(configs)],
      providers: [EmailUtilService, CrmListenerService], // Register CRM Listener service
      exports: [CrmListenerService], // Export the CRM Listener if needed elsewhere
    };
  }
}
