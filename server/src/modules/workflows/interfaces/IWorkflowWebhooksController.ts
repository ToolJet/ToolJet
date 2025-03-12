import { Response } from 'express';

export interface IWorkflowWebhooksController {
  triggerWorkflow(id: any, workflowParams: any, environment: string, response: Response): Promise<any>;

  updateWorkflow(id: any, workflowValuesToUpdate: any): Promise<any>;
}
