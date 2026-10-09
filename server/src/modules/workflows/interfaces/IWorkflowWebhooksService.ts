export interface IWorkflowWebhooksService {
  triggerWorkflow(
    workflowApps: any,
    workflowParams: any,
    environment: string,
    version: string,
    response: any
  ): Promise<any>;

  updateWorkflow(id: string, workflowValuesToUpdate: any, branchId?: string): Promise<any>;
}
