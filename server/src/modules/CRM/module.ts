import { Module, DynamicModule } from '@nestjs/common';
import { EmailModule } from '@modules/email/module';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class CrmModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { CrmListenerService, CrmController, CRMService } = await this.getProviders(configs, 'CRM', [
      'listener',
      'controller',
      'service',
    ]);
    return {
      module: CrmModule,
      imports: [await EmailModule.register(configs)],
      controllers: isMainImport ? [CrmController] : [],
      providers: isMainImport ? [CRMService, CrmListenerService] : [], // Register CRM Listener service
      exports: [CrmListenerService], // Export the CRM Listener if needed elsewhere
    };
  }
}
