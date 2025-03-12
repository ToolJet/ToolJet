import { Injectable } from '@nestjs/common';
import { IWorkflowWebhooksService } from '../interfaces/IWorkflowWebhooksService';

@Injectable()
export class WorkflowWebhooksService implements IWorkflowWebhooksService {
  constructor() {}

  async triggerWorkflow(workflowApps, workflowParams, environment, response): Promise<any> {
    return;
  }

  async updateWorkflow(workflowId, workflowValuesToUpdate): Promise<any> {
    return;
  }
}
