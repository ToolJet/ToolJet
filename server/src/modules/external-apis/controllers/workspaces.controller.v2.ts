import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisWorkspacesControllerV2 } from '../Interfaces/IController';
import { CreateWorkspaceV2Dto, UpdateWorkspaceV2Dto, ListWorkspacesV2QueryDto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisWorkspacesControllerV2 implements IExternalApisWorkspacesControllerV2 {
  createWorkspace(dto: CreateWorkspaceV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listWorkspaces(query: ListWorkspacesV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getWorkspace(workspaceIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateWorkspace(workspaceIdentifier: string, dto: UpdateWorkspaceV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  archiveWorkspace(workspaceIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  unarchiveWorkspace(workspaceIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  setDefaultWorkspace(workspaceIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
