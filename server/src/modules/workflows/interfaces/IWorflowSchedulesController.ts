import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { ListSchedulesDto } from '@modules/workflows/dto/list-schedules.dto';

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
    query: ListSchedulesDto
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
