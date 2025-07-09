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

@InitModule(MODULES.WORKFLOWS)
@Controller('workflow_executions')
export class WorkflowExecutionsController implements IWorkflowExecutionController {
  constructor() {}

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

  @InitFeature(FEATURE_KEY.EXECUTE_WORKFLOW)
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
