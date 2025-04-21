import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { WhiteLabellingModule } from '@modules/white-labelling/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { SMTPModule } from '@modules/smtp/module';

export class EmailModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { EmailService } = await import(`${importPath}/email/service`);
    const { EmailUtilService } = await import(`${importPath}/email/util.service`);
    const { EmailListener } = await import(`${importPath}/email/listener`);
    return {
      module: EmailModule,
      imports: [
        await WhiteLabellingModule.register(configs),
        await DataSourcesModule.register(configs),
        await SMTPModule.register(configs),
      ],
      providers: [EmailService, EmailListener, EmailUtilService],
    };
  }
}
