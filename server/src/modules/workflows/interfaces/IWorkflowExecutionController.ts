import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { PreviewWorkflowNodeDto } from '@dto/preview-workflow-node.dto';
import { Response } from 'express';

export interface IWorkflowExecutionController {
  create(
    user: any,
    createWorkflowExecutionDto: CreateWorkflowExecutionDto,
    response: Response
  ): Promise<{ workflowExecution: WorkflowExecution; result: any }>;

  status(id: any, user: any): Promise<any>;

  show(id: any, user: any): Promise<WorkflowExecution>;

  index(appVersionId: any, user: any): Promise<WorkflowExecution[]>;

  getExecutions(appVersionId: string, page: any, perPage: any, user: any): Promise<any>;

  getExecutionNodes(id: string, user: any, page: any, perPage: any): Promise<any>;

  previewQueryNode(user: any, previewNodeDto: PreviewWorkflowNodeDto, response: Response): Promise<{ result: any }>;
}
