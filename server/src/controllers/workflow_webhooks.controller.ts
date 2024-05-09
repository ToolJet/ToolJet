import { Controller, Post, Param, UseGuards, Body, Patch, Query } from '@nestjs/common';
import { WorkflowWebhooksService } from '@services/workflow_webhooks.service';
import { WebhookGuard } from '@ee/licensing/guards/webhook.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ValidateLicenseGuard } from '@ee/licensing/guards/validLicense.guard';

@Controller({
  path: 'webhooks',
  version: '2',
})
export class WorkflowWebhooksController {
  constructor(private workflowWebhookService: WorkflowWebhooksService) {}

  @UseGuards(ThrottlerGuard, ValidateLicenseGuard, WebhookGuard)
  @Post('workflows/:id/trigger')
  async triggerWorkflow(@Param('id') id: any, @Body() workflowParams, @Query('environment') environment: string) {
    const workflowApps = { executeUsing: 'app', appId: id };

    const result = await this.workflowWebhookService.triggerWorkflow(workflowApps, workflowParams, environment);
    return result;
  }

  @UseGuards(JwtAuthGuard, ValidateLicenseGuard)
  @Patch('workflows/:id')
  async updateWorkflow(@Param('id') id, @Body() workflowValuesToUpdate) {
    await this.workflowWebhookService.updateWorkflow(id, workflowValuesToUpdate);
    return {
      statusCode: 200,
      message: 'Updated Successfully',
    };
  }
}
