import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { QueryResult } from '@tooljet/plugins/dist/packages/common/lib';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';

export interface ResponseNodeMetadata {
  status: 'ok' | 'failed';
  request?: Record<string, unknown>;
  response: {
    statusCode?: number;
    headers?: {
      'X-Workflow-Response-Status-Set': boolean;
    };
  };
}

export interface IWorkflowExecutionsService {
  create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution>;

  execute(
    workflowExecution: WorkflowExecution,
    params: Record<string, any>,
    envId: string,
    response: Response,
    throwOnError?: boolean,
    executeUsing?: string,
    executionStartTime?: Date,
    extraOptions?: {
      startNodeId?: string;
      injectedState?: object;
    }
  ): Promise<QueryResult>;

  getStatus(id: string): Promise<{
    logs: unknown;
    status: boolean;
    nodes: Array<{
      id: string;
      idOnDefinition: string;
      executed: boolean;
      result: unknown;
    }>;
  }>;

  getWorkflowExecution(id: string): Promise<WorkflowExecution>;

  listWorkflowExecutions(appVersionId: string): Promise<WorkflowExecution[]>;

  findOne(id: string, relations?: string[]): Promise<WorkflowExecution>;

  buildResponseNodeMetadata(
    statusText: 'ok' | 'failed',
    statusCode: number,
    setHeader?: boolean
  ): Promise<ResponseNodeMetadata>;

  previewQueryNode(
    queryId: string,
    nodeId: string,
    state: Record<string, any>,
    appVersion: AppVersion,
    user: User,
    response: Response
  ): Promise<any>;

  getWorkflowExecutionsLogs(
    appVersionId: string,
    page?: number,
    limit?: number
  ): Promise<{
    data: WorkflowExecution[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }>;

  getWorkflowExecutionNodes(
    workflowExecutionId: string,
    page?: number,
    limit?: number
  ): Promise<{
    data: WorkflowExecutionNode[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }>;
}
