import { Injectable } from '@nestjs/common';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { IWorkflowExecutionsService } from '../interfaces/IWorkflowExecutionsService';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';

@Injectable()
export class WorkflowExecutionsService implements IWorkflowExecutionsService {
  constructor() {}

  async create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution> {
    throw new Error('Method not implemented.');
  }

  async execute(workflowExecution: WorkflowExecution, params: any, envId: string, response: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getStatus(workflowExecutionId: string): Promise<{ logs: string[]; status: boolean; nodes: any[] }> {
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
    state: object,
    appVersion: AppVersion,
    user: User,
    response: Response
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
