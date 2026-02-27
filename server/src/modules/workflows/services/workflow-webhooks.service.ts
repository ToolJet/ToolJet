import { Injectable } from '@nestjs/common';
import { IWorkflowWebhooksService } from '../interfaces/IWorkflowWebhooksService';

@Injectable()
export class WorkflowWebhooksService implements IWorkflowWebhooksService {
  constructor() {}

  async triggerWorkflow(workflowApps, workflowParams, environment, version, response): Promise<any> {
    return;
  }

  async updateWorkflow(workflowId, workflowValuesToUpdate): Promise<any> {
    return;
  }

  async resolveVersionId(app: any, versionName: string, environmentId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getEnvironmentId(app: any, environment: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
