import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisWorkflowsControllerV2 } from '../Interfaces/IController';
import {
  CreateWorkflowV2Dto,
  RenameWorkflowV2Dto,
  ListWorkflowsV2QueryDto,
  ImportWorkflowV2Dto,
  WorkflowV2ResponseDto,
  ListWorkflowsV2ResponseDto,
  ResourceExportV2ResponseDto,
} from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisWorkflowsControllerV2 implements IExternalApisWorkflowsControllerV2 {
  createWorkflow(workspaceIdentifier: string, dto: CreateWorkflowV2Dto): Promise<WorkflowV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  renameWorkflow(
    workspaceIdentifier: string,
    workflowIdentifier: string,
    dto: RenameWorkflowV2Dto
  ): Promise<WorkflowV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  listWorkflows(workspaceIdentifier: string, query: ListWorkflowsV2QueryDto): Promise<ListWorkflowsV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  getWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<WorkflowV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  deleteWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  importWorkflow(workspaceIdentifier: string, dto: ImportWorkflowV2Dto): Promise<WorkflowV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  exportWorkflow(
    workspaceIdentifier: string,
    workflowIdentifier: string,
    exportTjdb?: boolean,
    appVersion?: string,
    exportAllVersions?: boolean
  ): Promise<ResourceExportV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
}
