import { Module, DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { WhiteLabellingModule } from '../white-labelling/module';
import { EmailModule } from '@modules/email/module';
import { CrmModule } from '@modules/CRM/module';

@Module({})
export class OrganizationPaymentModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    // Dynamically import services and controllers
    const { OrganizationPaymentController } = await import(`${importPath}/organization-payment/controller`);
    const { OrganizationPaymentService } = await import(`${importPath}/organization-payment/service`);

    return {
      module: OrganizationPaymentModule,
      imports: [
        await WhiteLabellingModule.register(configs),
        await EmailModule.register(configs),
        await CrmModule.register(configs),
      ],
      controllers: [OrganizationPaymentController],
      providers: [OrganizationPaymentService],
      exports: [],
    };
  }
}
