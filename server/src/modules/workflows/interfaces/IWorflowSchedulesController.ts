import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

export interface IWorkflowSchedulesController {
  create(
    user: any,
    createWorkflowScheduleDto: {
      workflowId: string;
      name: string;
      active: boolean;
      environmentId: string;
      type: string;
      timezone: string;
      details: {
        frequency: string;
        minutes: number;
        hour: string;
        date: string | number;
      };
    }
  ): Promise<WorkflowSchedule>;

  findAll(
    user: any,
    appId: string,
    page?: string,
    limit?: string,
    search?: string,
    environmentId?: string,
    workflowId?: string
  ): Promise<WorkflowSchedule[] | { data: WorkflowSchedule[]; total: number; page: number; limit: number }>;

  findOne(user: any, id: string): Promise<WorkflowSchedule>;

  update(
    user: any,
    id: string,
    updateWorkflowScheduleDto: Partial<{
      environmentId: string;
      name: string;
      workflowId: string;
      type: string;
      timezone: string;
      details: {
        frequency: string;
        minutes: number;
        hour: string;
        date: string | number;
      };
    }>
  ): Promise<WorkflowSchedule>;

  activate(
    user: any,
    id: string,
    updateWorkflowScheduleDto: Partial<{
      active: boolean;
    }>
  ): Promise<WorkflowSchedule>;

  remove(user: any, id: string): Promise<void>;
}
