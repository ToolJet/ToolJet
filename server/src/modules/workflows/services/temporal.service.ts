import { Injectable } from '@nestjs/common';
import { ITemporalService } from '../interfaces/ITemporalService';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

@Injectable()
export class TemporalService implements ITemporalService {
  async isTemporalConnected(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async runWorker(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createScheduleInTemporal(
    workflowScheduleId: string,
    settings: any,
    schedule: WorkflowSchedule,
    environmentId: string,
    timezone: string,
    userId: string,
    paused = true
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setScheduleState(scheduleId: string, paused: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async removeSchedule(scheduleId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateSchedule(
    updatedSchedule: WorkflowSchedule,
    settings: any,
    timezone: string,
    existingSchedule: WorkflowSchedule,
    userId: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  shutDownWorker(): void {
    throw new Error('Method not implemented.');
  }
}
