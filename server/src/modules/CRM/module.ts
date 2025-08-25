import { Module, DynamicModule } from '@nestjs/common';
import { EmailModule } from '@modules/email/module';
import { SubModule } from '@modules/app/sub-module';

@Module({})
export class CrmModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    if (configs?.IS_GET_CONTEXT === true) {
      // If this module is being used to get context, we don't need to import any other modules
      // Used on migrations
      return {
        module: CrmModule,
        imports: [],
        providers: [],
      };
    }
    const { CrmListenerService } = await this.getProviders(configs, 'CRM', ['listener']);

    return {
      module: CrmModule,
      imports: [await EmailModule.register(configs)],
      providers: [CrmListenerService], // Register CRM Listener service
    };
  }
}
