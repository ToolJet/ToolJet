import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowExecutionsService } from '../services/workflow-executions.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { Response } from 'express';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { EntityManager } from 'typeorm';

export const WORKFLOW_EXECUTION_STATUS = {
  TRIGGERED: 'workflow_execution_triggered',
  RUNNING: 'workflow_execution_running',
  COMPLETED: 'workflow_execution_completed',
  ERROR: 'workflow_execution_error',
};

@Injectable()
export class WorkflowTriggersListener {
  constructor(
    protected workflowExecutionsService: WorkflowExecutionsService,
    protected readonly logger: Logger,
    protected readonly eventEmitter: EventEmitter2
  ) {}

  @OnEvent('triggerWorkflow')
  async handleTriggerWorkflow({
    createWorkflowExecutionDto,
    workflowExecution,
    response,
  }: {
    createWorkflowExecutionDto: CreateWorkflowExecutionDto;
    workflowExecution: WorkflowExecution;
    response: Response;
  }): Promise<void> {
    throw new Error('Not implemented.');
  }
}
