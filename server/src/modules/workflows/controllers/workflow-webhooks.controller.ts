import { Controller, Post, Param, Body, Patch, Query, Res, Get, Sse, Req } from '@nestjs/common';
import { Response } from 'express';
import { IWorkflowWebhooksController } from '../interfaces/IWorkflowWebhooksController';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/workflows/constants';

@Controller({
  path: 'webhooks',
  version: '2',
})
@InitModule(MODULES.WORKFLOWS)
export class WorkflowWebhooksController implements IWorkflowWebhooksController {
  constructor() {}

  @InitFeature(FEATURE_KEY.WEBHOOK_TRIGGER_WORKFLOW)
  @Post('workflows/:id/trigger')
  async triggerWorkflow(
    @Param('id') id: any,
    @Body() workflowParams,
    @Query('environment') environment: string,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.WEBHOOK_TRIGGER_WORKFLOW)
  @Post('workflows/:idOrName/trigger-async')
  async triggerWorkflowAsync(
    @Param('app') app: any,
    @Param('idOrName') idOrName: string,
    @Body() workflowParams: Record<string, unknown>,
    @Query('environment') environment: string,
    @Req() req: Request
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.WEBHOOK_TRIGGER_WORKFLOW)
  @Get('workflows/:idOrName/status/:executionId')
  async getExecutionStatus(@Param('executionId') executionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.WEBHOOK_TRIGGER_WORKFLOW)
  @Sse('workflows/:idOrName/execution/:executionId/stream')
  async triggerWorkflowStream(@Param('executionId') executionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE_WORKFLOW_WEBHOOK_DETAILS)
  @Patch('workflows/:id')
  async updateWorkflow(@Param('id') id, @Body() workflowValuesToUpdate): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
