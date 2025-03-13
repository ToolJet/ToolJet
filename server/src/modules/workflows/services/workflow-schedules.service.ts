import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWorkflowSchedulesService } from '../interfaces/IWorkflowSchedulesService';

@Injectable()
export class WorkflowSchedulesService implements IWorkflowSchedulesService {
  constructor(
    @InjectRepository(WorkflowSchedule)
    protected workflowSchedulesRepository: Repository<WorkflowSchedule>
  ) {}

  async create(createWorkflowScheduleDto: {
    workflowId: string;
    active: boolean;
    environmentId: string;
    type: string;
    timezone: string;
    details: any;
  }): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  async findOne(id: string): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  async findAll(appVersionId: string): Promise<WorkflowSchedule[]> {
    throw new Error('Method not implemented.');
  }

  async update(
    id: string,
    updateWorkflowScheduleDto: Partial<{
      active: boolean;
      environmentId: string;
      type: string;
      timezone: string;
      details: any;
    }>
  ): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  async remove(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
