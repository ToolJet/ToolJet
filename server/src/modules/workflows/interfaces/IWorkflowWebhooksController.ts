import { Response } from 'express';

export interface IWorkflowWebhooksController {
  triggerWorkflow(id: any, workflowParams: any, environment: string, version: string, response: Response, req: Request): Promise<any>;

  updateWorkflow(id: any, workflowValuesToUpdate: any): Promise<any>;
}
