import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class WorkflowWebhooksListener {
  constructor() {}

  @OnEvent('triggerWorkflow')
  async handleTriggerWorkflow(workflowInfo) {
    throw new Error('Method not implemented');
  }
}
