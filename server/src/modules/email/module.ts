import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { WhiteLabellingModule } from '@modules/white-labelling/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DataSourcesModule } from '@modules/data-sources/module';

export class EmailModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { EmailService } = await import(`${importPath}/email/service`);
    const { EmailUtilService } = await import(`${importPath}/email/util.service`);
    const { EmailListener } = await import(`${importPath}/email/listener`);
    const { SMTPUtilService } = await import(`${importPath}/smtp/util.service`);
    return {
      module: EmailModule,
      imports: [
        await WhiteLabellingModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await DataSourcesModule.register(configs),
      ],
      providers: [EmailService, EmailListener, EmailUtilService, SMTPUtilService],
    };
  }
}
