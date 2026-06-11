export interface IWorkflowService {
  getWorkflows(organizationId: string): Promise<{ id: string; name: string }[]>;
}
