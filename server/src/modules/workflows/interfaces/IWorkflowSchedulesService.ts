import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

export interface IWorkflowSchedulesService {
  create(createWorkflowScheduleDto: {
    workflowId: string;
    active: boolean;
    environmentId: string;
    type: string;
    timezone: string;
    details: any;
  }): Promise<WorkflowSchedule>;

  findOne(id: string): Promise<WorkflowSchedule>;

  findAll(appVersionId: string): Promise<WorkflowSchedule[]>;

  update(
    id: string,
    updateWorkflowScheduleDto: Partial<{
      active: boolean;
      environmentId: string;
      type: string;
      timezone: string;
      details: any;
    }>
  ): Promise<WorkflowSchedule>;

  remove(id: string): Promise<void>;
}
