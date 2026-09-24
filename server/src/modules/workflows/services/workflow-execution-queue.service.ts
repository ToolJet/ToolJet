import { Injectable } from '@nestjs/common';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowTriggerType } from '../types';

export interface WorkflowResumeOptions {
  startNodeId?: string;
  injectedState?: object;
  requestId?: string;
  delayMs?: number;
}

@Injectable()
export class WorkflowExecutionQueueService {
  constructor() {}

  async enqueue(
    workflowExecution: WorkflowExecution,
    createWorkflowExecutionDto: CreateWorkflowExecutionDto,
    triggeredBy: WorkflowTriggerType = 'manual',
    priority: number = 0,
    timeout?: number,
    resumeOptions?: WorkflowResumeOptions
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async terminate(executionId: string): Promise<{
    success: boolean;
    previousState: string;
  }> {
    throw new Error('Method not implemented.');
  }
}
