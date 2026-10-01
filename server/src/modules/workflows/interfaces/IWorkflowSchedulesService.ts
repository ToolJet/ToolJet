import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

export interface IWorkflowSchedulesService {
  create(createWorkflowScheduleDto: {
    workflowId: string;
    name: string;
    active: boolean;
    environmentId: string;
    type: string;
    timezone: string;
    details: any;
  }): Promise<WorkflowSchedule>;

  findOne(id: string): Promise<WorkflowSchedule>;

  findAll(appId: string): Promise<WorkflowSchedule[]>;

  update(
    id: string,
    updateWorkflowScheduleDto: Partial<{
      active: boolean;
      name: string;
      environmentId: string;
      workflowId: string;
      type: string;
      timezone: string;
      details: any;
    }>
  ): Promise<WorkflowSchedule>;

  remove(id: string): Promise<void>;
}
