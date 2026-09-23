import { ApprovalListFilters, ApprovalListItem } from '../types/approval-list';

export interface IWorkflowApprovalsService {
  getByToken(token: string): Promise<any>;
  resolve(
    token: string,
    dto: { outcome: string; input?: Record<string, unknown> },
    user?: any
  ): Promise<{ status: 'resolved' }>;
  resolveById(
    id: string,
    dto: { outcome: string; input?: Record<string, unknown> },
    user: any
  ): Promise<{ status: 'resolved' }>;
  cancel(id: string, user: any): Promise<{ status: 'cancelled' }>;
  list(
    user: any,
    filters: ApprovalListFilters,
    page: number,
    perPage: number
  ): Promise<{ requests: ApprovalListItem[]; meta: { page: number; perPage: number; total: number } }>;
}
