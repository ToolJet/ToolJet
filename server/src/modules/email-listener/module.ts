import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { EmailModule } from '@modules/email/module';
import { getImportPath } from '@modules/app/constants';

export class EmailListenerModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { EmailListener } = await import(`${importPath}/email-listener/listener`);
    return {
      module: EmailListenerModule,
      imports: [await EmailModule.register(configs)],
      providers: [EmailListener],
      exports: [],
    };
  }
}
