import { Injectable } from '@nestjs/common';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowTriggerType } from '../types';

@Injectable()
export class WorkflowExecutionQueueService {
    constructor() { }

    async enqueue(
        workflowExecution: WorkflowExecution,
        createWorkflowExecutionDto: CreateWorkflowExecutionDto,
        triggeredBy: WorkflowTriggerType = 'manual',
        priority: number = 0,
        timeout?: number
    ): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }> {
        throw new Error('Method not implemented.');
    }

    async pauseQueue(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async resumeQueue(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async clearQueue(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
