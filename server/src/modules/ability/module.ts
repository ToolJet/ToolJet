import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { RolesRepository } from '@modules/roles/repository';
import { AbilityUtilService } from './util.service';
import { AbilityService } from './interfaces/IService';

export class AbilityModule {
  static async forRoot(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AbilityService: AbilityServiceImport } = await import(`${importPath}/ability/service`);

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
