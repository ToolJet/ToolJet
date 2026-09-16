export interface IWorkflowApprovalsService {
  getByToken(token: string): Promise<any>;
  resolve(
    token: string,
    dto: { outcome: string; input?: Record<string, unknown> },
    user?: any
  ): Promise<{ status: 'resolved' }>;
  cancel(id: string, user: any): Promise<{ status: 'cancelled' }>;
}
