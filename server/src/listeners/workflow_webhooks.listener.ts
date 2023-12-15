import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowExecutionsService } from '@services/workflow_executions.service';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WorkflowWebhooksListener {
  constructor(private workflowExecutionsService: WorkflowExecutionsService, private readonly logger: Logger) {}

  @OnEvent('triggerWorkflow')
  async handleTriggerWorkflow(workflowInfo) {
    const { workflowApps, sanitisedWorkflowParams, webhookEnvironmentId } = workflowInfo;
    this.logger.log('Workflow triggered: ' + workflowApps.appId);
    this.logger.log('Workflow params: ' + JSON.stringify(sanitisedWorkflowParams || {}));

    const workflowExecution = await this.workflowExecutionsService.create(workflowApps);
    await this.workflowExecutionsService.execute(workflowExecution, sanitisedWorkflowParams, webhookEnvironmentId);

    this.logger.log('Workflow completed: ' + workflowApps.appId);
  }
}
