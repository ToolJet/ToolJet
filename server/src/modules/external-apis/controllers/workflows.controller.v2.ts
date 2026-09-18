import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisWorkflowsControllerV2 } from '../Interfaces/IController';
import { CreateWorkflowV2Dto, RenameWorkflowV2Dto, ListWorkflowsV2QueryDto, ImportWorkflowV2Dto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisWorkflowsControllerV2 implements IExternalApisWorkflowsControllerV2 {
  createWorkflow(workspaceIdentifier: string, dto: CreateWorkflowV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  renameWorkflow(workspaceIdentifier: string, workflowIdentifier: string, dto: RenameWorkflowV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listWorkflows(workspaceIdentifier: string, query: ListWorkflowsV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  deleteWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  importWorkflow(workspaceIdentifier: string, dto: ImportWorkflowV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  exportWorkflow(
    workspaceIdentifier: string,
    workflowIdentifier: string,
    exportTjdb?: boolean,
    appVersion?: string,
    exportAllVersions?: boolean
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
