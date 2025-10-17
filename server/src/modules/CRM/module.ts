import { Module, DynamicModule } from '@nestjs/common';
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
      controllers: isMainImport ? [CrmController] : [],
      providers: isMainImport ? [CRMService, CrmListenerService] : [], // Register CRM Listener service
      exports: [], // Export the CRM Listener if needed elsewhere
    };
  }
}
