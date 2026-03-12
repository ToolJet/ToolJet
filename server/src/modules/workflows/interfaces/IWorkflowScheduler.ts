import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

export interface IWorkflowScheduler {
  isConnected(): Promise<boolean>;

  createSchedule(
    workflowScheduleId: string,
    settings: any,
    schedule: WorkflowSchedule,
    environmentId: string,
    timezone: string,
    userId: string,
    paused?: boolean
  ): Promise<void>;

  setScheduleState(scheduleId: string, paused: boolean): Promise<void>;

  removeSchedule(scheduleId: string): Promise<void>;

  updateSchedule(
    updatedSchedule: WorkflowSchedule,
    settings: any,
    timezone: string,
    existingSchedule: WorkflowSchedule,
    userId: string
  ): Promise<void>;

  shutdown(): void;
}
