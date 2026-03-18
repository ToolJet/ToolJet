import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { SessionModule } from '@modules/session/module';
import { UserRepository } from '@modules/users/repositories/repository';
import { OrganizationRepository } from '@modules/organizations/repository';

export class SessionTransferModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const { SessionTransferController, SessionTransferService } = await this.getProviders(configs, 'session-transfer', [
      'controller',
      'service',
    ]);

    return {
      module: SessionTransferModule,
      imports: [await SessionModule.register(configs)],
      controllers: isMainImport ? [SessionTransferController] : [],
      providers: [SessionTransferService, UserRepository, OrganizationRepository],
      exports: [SessionTransferService],
    };
  }
}
