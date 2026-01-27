import { Injectable } from '@nestjs/common';
import { IWorkflowScheduler } from '../interfaces/IWorkflowScheduler';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

@Injectable()
export class WorkflowSchedulerService implements IWorkflowScheduler {
  async isConnected(): Promise<boolean> {
    throw new Error('Workflow scheduling is an Enterprise feature. Please upgrade to use workflow scheduling.');
  }

  async createSchedule(
    workflowScheduleId: string,
    settings: any,
    schedule: WorkflowSchedule,
    environmentId: string,
    timezone: string,
    userId: string,
    paused = true
  ): Promise<void> {
    throw new Error('Workflow scheduling is an Enterprise feature. Please upgrade to use workflow scheduling.');
  }

  async setScheduleState(scheduleId: string, paused: boolean): Promise<void> {
    throw new Error('Workflow scheduling is an Enterprise feature. Please upgrade to use workflow scheduling.');
  }

  async removeSchedule(scheduleId: string): Promise<void> {
    throw new Error('Workflow scheduling is an Enterprise feature. Please upgrade to use workflow scheduling.');
  }

  async updateSchedule(
    updatedSchedule: WorkflowSchedule,
    settings: any,
    timezone: string,
    existingSchedule: WorkflowSchedule,
    userId: string
  ): Promise<void> {
    throw new Error('Workflow scheduling is an Enterprise feature. Please upgrade to use workflow scheduling.');
  }

  shutdown(): void {
    throw new Error('Workflow scheduling is an Enterprise feature. Please upgrade to use workflow scheduling.');
  }
}