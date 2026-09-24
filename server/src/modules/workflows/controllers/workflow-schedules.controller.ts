import { Controller, Param, Body, Query, Get, Post, Put, Delete } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { IWorkflowSchedulesController } from '../interfaces/IWorflowSchedulesController';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/workflows/constants';

@InitModule(MODULES.WORKFLOWS)
@Controller('workflow-schedules')
export class WorkflowSchedulesController implements IWorkflowSchedulesController {
  constructor() {}

  @InitFeature(FEATURE_KEY.CREATE_WORKFLOW_SCHEDULE)
  @Post()
  async create(
    @User() user,
    @Body()
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
  ): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.LIST_WORKFLOW_SCHEDULES)
  @Get()
  async findAll(
    @User() user,
    @Query('app_id') appId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('environment_id') environmentId?: string,
    @Query('workflow_id') workflowId?: string
  ): Promise<WorkflowSchedule[] | { data: WorkflowSchedule[]; total: number; page: number; limit: number }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.FIND_WORKFLOW_SCHEDULE)
  @Get(':id')
  async findOne(@User() user, @Param('id') id: string): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE_SCHEDULED_WORKFLOW)
  @Put(':id')
  async update(
    @User() user,
    @Param('id') id: string,
    @Body()
    updateWorkflowScheduleDto: Partial<{
      environmentId: string;
      name: string;
      /* workflow id = versionId */
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
  ): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.ACTIVATE_SCHEDULED_WORKFLOW)
  @Put('activate/:id')
  async activate(
    @User() user,
    @Param('id') id: string,
    @Body()
    updateWorkflowScheduleDto: Partial<{
      active: boolean;
    }>
  ): Promise<WorkflowSchedule> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.REMOVE_SCHEDULED_WORKFLOW)
  @Delete(':id')
  async remove(@User() user, @Param('id') id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
