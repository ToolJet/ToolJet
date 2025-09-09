import { Injectable } from '@nestjs/common';
import { InstrumentService } from '../../../otel/service-instrumentation';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { IWorkflowExecutionsService } from '../interfaces/IWorkflowExecutionsService';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { QueryResult } from '@tooljet/plugins/dist/packages/common/lib';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';

@Injectable()
export class WorkflowExecutionsService implements IWorkflowExecutionsService {
  constructor() {}

  async create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution> {
    throw new Error('Method not implemented.');
  }

  @InstrumentService('WorkflowExecutionsService', { 
    attributes: { 'operation.type': 'execute' },
    tags: { 'business_operation': 'workflow_execution' }
  })
  async execute(
    workflowExecution: WorkflowExecution,
    params: Record<string, any>,
    envId: string,
    response: Response,
    throwOnError?: boolean,
    executionStartTime?: Date,
    extraOptions?: {
      startNodeId?: string;
      injectedState?: object;
    }
  ): Promise<QueryResult> {
    throw new Error('Method not implemented.');
  }

  async getStatus(workflowExecutionId: string): Promise<{
    logs: unknown;
    status: boolean;
    nodes: Array<{
      id: string;
      idOnDefinition: string;
      executed: boolean;
      result: unknown;
    }>;
  }> {
    throw new Error('Method not implemented.');
  }

  async getWorkflowExecution(workflowExecutionId: string): Promise<WorkflowExecution> {
    throw new Error('Method not implemented.');
  }

  async listWorkflowExecutions(appVersionId: string): Promise<WorkflowExecution[]> {
    throw new Error('Method not implemented.');
  }

  async previewQueryNode(
    queryId: string,
    nodeId: string,
    state: Record<string, any>,
    appVersion: AppVersion,
    user: User,
    response: Response
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async findOne(id: string, relations?: string[]): Promise<WorkflowExecution> {
    throw new Error('Method not implemented.');
  }

  async getWorkflowExecutionsLogs(
    appVersionId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: WorkflowExecution[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }> {
    throw new Error('Method not implemented.');
  }

  async getWorkflowExecutionNodes(
    workflowExecutionId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: WorkflowExecutionNode[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }> {
    throw new Error('Method not implemented.');
  }
}
