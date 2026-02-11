import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { QueryResult, QueryError } from '@tooljet/plugins/dist/packages/common/lib';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';

export class NodeQueryError {
  name = 'NodeQueryError' as const;
  status = 'failed' as const;
  statusCode?: number;
  message: string;
  description: string;
  node_failed: string;
  data: Record<string, unknown>;
  is_response_code_error?: boolean;

  constructor({
    message,
    description,
    data,
    node_failed,
    exception,
    statusCode,
    is_response_code_error,
  }: {
    message: string;
    description?: string;
    data?: Record<string, unknown>;
    node_failed?: string;
    exception?: QueryError;
    statusCode?: number;
    is_response_code_error?: boolean;
  }) {
    if (statusCode) this.statusCode = statusCode;
    const errorMessage = message ?? exception?.message ?? 'Node query failed';
    this.message = errorMessage;
    this.description = description ?? exception?.description ?? undefined;
    this.data = data ?? exception?.data ?? {};
    this.node_failed = node_failed;
    if (is_response_code_error) this.is_response_code_error = is_response_code_error;
  }
}


export type AddLogFunction = (
  message: string,
  queryName?: string,
  status?: 'normal' | 'success' | 'failure',
  exception?: NodeQueryError
) => void;

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
