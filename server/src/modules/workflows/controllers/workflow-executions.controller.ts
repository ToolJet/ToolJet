import { Body, Controller, Get, Param, Post, Query, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { IWorkflowExecutionController } from '../interfaces/IWorkflowExecutionController';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { PreviewWorkflowNodeDto } from '@dto/preview-workflow-node.dto';
import { User } from '@modules/app/decorators/user.decorator';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { Observable } from 'rxjs';
import { ListExecutionsDto } from '@modules/workflows/dto/list-executions.dto';
import { ExecutionListItem } from '@modules/workflows/types/execution-list';
import { UpcomingRun } from '@modules/workflows/types/upcoming-runs';

@InitModule(MODULES.WORKFLOWS)
@Controller('workflow_executions')
export class WorkflowExecutionsController implements IWorkflowExecutionController {
  constructor() {}

  // Declared before @Get(':id') on purpose — see the note in the plan/spec. Moving this below the
  // parameterised route silently breaks it: NestJS matches routes in declaration order, so a
  // single-segment 'workspace' path declared after ':id' would be shadowed and
  // /workflow_executions/workspace would resolve as "fetch the execution with id 'workspace'".
  @InitFeature(FEATURE_KEY.LIST_WORKSPACE_EXECUTIONS)
  @Get('workspace')
  // Explicit return type to match the EE override, or the EE subclass trips TS2416 (its concrete
  // return isn't assignable to an inferred Promise<void>).
  async listForWorkspace(
    @Query() query: ListExecutionsDto,
    @User() user?: any
  ): Promise<{ executions: ExecutionListItem[]; meta: { page: number; perPage: number; total: number } }> {
    throw new Error('Method not implemented.');
  }

  // Upcoming runs are derived from schedules, not from workflow_executions rows — a run that has
  // not started has no row — but they answer the same page's question and are gated by the same
  // grant, so they live beside the other workspace routes rather than on the schedules controller.
  @InitFeature(FEATURE_KEY.LIST_WORKSPACE_EXECUTIONS)
  @Get('workspace/upcoming')
  // Explicit return type to match the EE override, or the EE subclass trips TS2416 (its concrete
  // return isn't assignable to an inferred Promise<void>).
  async upcomingForWorkspace(
    @Query('environment_id') environmentId?: string,
    @Query('app_id') appId?: string,
    @Query('folder_id') folderId?: string,
    @User() user?: any
  ): Promise<{ upcoming: UpcomingRun[] }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.LIST_WORKSPACE_EXECUTIONS)
  @Post('workspace/states')
  // Explicit return type to match the EE override, or the EE subclass trips TS2416 (its concrete
  // return isn't assignable to an inferred Promise<void>).
  async workspaceStates(
    @Body() body: { executionIds: string[] },
    @User() user?: any
  ): Promise<Record<string, { terminationRequested: boolean; jobState: string }>> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.EXECUTE_WORKFLOW)
  @Post()
  async create(
    @User() user,
    @Body() createWorkflowExecutionDto: CreateWorkflowExecutionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ workflowExecution: WorkflowExecution; result: any }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.WORKFLOW_EXECUTION_STATUS)
  @Get(':id/status')
  async status(@Param('id') id: any, @User() user): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.WORKFLOW_EXECUTION_DETAILS)
  @Get(':id')
  async show(@Param('id') id: any, @User() user): Promise<WorkflowExecution> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.LIST_WORKFLOW_EXECUTIONS)
  @Get('all/:appVersionId')
  async index(@Param('appVersionId') appVersionId: any, @User() user): Promise<WorkflowExecution[]> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.FETCH_EXECUTION_LOGS)
  @Get()
  async getExecutions(
    @Query('appVersionId') appVersionId: string,
    @Query('page') page = '1',
    @Query('per_page') perPage = '10',
    @User() user
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.FETCH_EXECUTION_NODES)
  @Get(':id/nodes')
  async getExecutionNodes(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('per_page') perPage = '10',
    @User() user
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.PREVIEW_QUERY_NODE)
  @Post('previewQueryNode')
  async previewQueryNode(
    @User() user,
    @Body() previewNodeDto: PreviewWorkflowNodeDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ result: any }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.EXECUTE_WORKFLOW_FROM_APP)
  @Post(':id/trigger')
  async trigger(
    @Param('id') id: string,
    @Body() createWorkflowExecutionDto: CreateWorkflowExecutionDto,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ result: any }> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.WORKFLOW_EXECUTION_STATUS)
  @Sse(':id/stream')
  async streamWorkflowExecution(@Param('id') id: string): Promise<Observable<MessageEvent>> {
    throw new Error('Method not implemented.');
  }
}
