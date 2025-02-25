import { Controller, Post, Param, Body, Patch, Query, Res } from '@nestjs/common';
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
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE_WORKFLOW_WEBHOOK_DETAILS)
  @Patch('workflows/:id')
  async updateWorkflow(@Param('id') id, @Body() workflowValuesToUpdate): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
