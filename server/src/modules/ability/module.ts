import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { RolesRepository } from '@modules/roles/repository';
import { AbilityUtilService } from './util.service';
import { AbilityService } from './interfaces/IService';

export class AbilityModule extends SubModule {
  static async forRoot(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AbilityService: AbilityServiceImport } = await this.getProviders(configs, 'ability', ['service']);

    const abilityServiceProvider = {
      provide: AbilityService,
      useClass: AbilityServiceImport,
    };

    return {
      global: true,
      module: AbilityModule,
      providers: [abilityServiceProvider, AbilityUtilService, RolesRepository],
      exports: [abilityServiceProvider],
    };
  }
}
