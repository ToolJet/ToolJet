import { Module, DynamicModule } from '@nestjs/common';
import { EmailModule } from '@modules/email/module';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class CrmModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { CrmListenerService } = await this.getProviders(configs, 'CRM', ['listener']);

    return {
      module: CrmModule,
      imports: [await EmailModule.register(configs)],
      providers: [CrmListenerService], // Register CRM Listener service
      exports: [CrmListenerService], // Export the CRM Listener if needed elsewhere
    };
  }
}
