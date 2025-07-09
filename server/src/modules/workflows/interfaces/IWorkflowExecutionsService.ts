import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';

export interface IWorkflowExecutionsService {
  create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution>;

  execute(workflowExecution: WorkflowExecution, params: any, envId: string, response: Response): Promise<any>;

  getStatus(id: string): Promise<{ logs: string[]; status: boolean; nodes: any[] }>;

  getWorkflowExecution(id: string): Promise<WorkflowExecution>;

  listWorkflowExecutions(appVersionId: string): Promise<WorkflowExecution[]>;

  previewQueryNode(
    queryId: string,
    nodeId: string,
    params: any,
    appVersion: any,
    user: any,
    response: any
  ): Promise<any>;
}
