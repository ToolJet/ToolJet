import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowSchedule } from '../entities/workflow_schedule.entity';
import { AppVersion } from '../entities/app_version.entity';

@Injectable()
export class WorkflowSchedulesService {
  constructor(
    @InjectRepository(WorkflowSchedule)
    private workflowSchedulesRepository: Repository<WorkflowSchedule>
  ) {}

  async create(createWorkflowScheduleDto: {
    workflowId: string;
    active: boolean;
    environmentId: string;
    type: string;
    timezone: string;
    details: any;
  }): Promise<WorkflowSchedule> {
    const { workflowId, active, environmentId, type, timezone, details } = createWorkflowScheduleDto;
    const scheduleOptions = this.workflowSchedulesRepository.create({
      workflow: { id: workflowId } as AppVersion,
      active,
      environmentId,
      type,
      timezone,
      details,
    });
    const workflowSchedule = await this.workflowSchedulesRepository.save(scheduleOptions);

    return workflowSchedule;
  }

  async findOne(id: string): Promise<WorkflowSchedule> {
    const workflowSchedule = await this.workflowSchedulesRepository.findOne({
      where: { id },
      relations: ['workflow'],
    });
    if (!workflowSchedule) {
      throw new NotFoundException(`WorkflowSchedule with ID ${id} not found`);
    }
    return workflowSchedule;
  }

  async findAll(appVersionId: string): Promise<WorkflowSchedule[]> {
    return await this.workflowSchedulesRepository.find({
      where: { workflowId: appVersionId },
    });
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
    const workflowSchedule = await this.findOne(id);
    Object.assign(workflowSchedule, updateWorkflowScheduleDto);
    return await this.workflowSchedulesRepository.save(workflowSchedule);
  }

  async remove(id: string): Promise<void> {
    const result = await this.workflowSchedulesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`WorkflowSchedule with ID ${id} not found`);
    }
  }
}
