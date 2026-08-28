import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisModulesControllerV2 } from '../Interfaces/IController';
import { CreateModuleV2Dto, RenameModuleV2Dto, ListModulesV2QueryDto, ImportModuleV2Dto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisModulesControllerV2 implements IExternalApisModulesControllerV2 {
  createModule(workspaceIdentifier: string, dto: CreateModuleV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  renameModule(workspaceIdentifier: string, moduleIdentifier: string, dto: RenameModuleV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listModules(workspaceIdentifier: string, query: ListModulesV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  deleteModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  importModule(workspaceIdentifier: string, dto: ImportModuleV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  exportModule(workspaceIdentifier: string, moduleIdentifier: string, exportTjdb?: boolean): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
