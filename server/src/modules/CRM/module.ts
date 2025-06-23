import { Module, DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { EmailModule } from '@modules/email/module';

@Module({})
export class CrmModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { CrmListenerService } = await import(`${importPath}/CRM/listener`);

    return {
      module: CrmModule,
      imports: [await EmailModule.register(configs)],
      providers: [CrmListenerService], // Register CRM Listener service
      exports: [CrmListenerService], // Export the CRM Listener if needed elsewhere
    };
  }
}
