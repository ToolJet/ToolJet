import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { ModuleImportRequestDto, WorkspaceModulesResponseDto } from '../dto';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisModulesController {
  getAllWorkspaceModules(workspaceId: string): Promise<WorkspaceModulesResponseDto> {
    throw new Error('Method not implemented.');
  }

  exportModule(moduleId: string, workspaceId: string, exportTjdb: boolean): Promise<any> {
    throw new Error('Method not implemented.');
  }

  importModule(workspaceId: string, importresources: ModuleImportRequestDto): Promise<{ message: string }> {
    throw new Error('Method not implemented.');
  }
}
