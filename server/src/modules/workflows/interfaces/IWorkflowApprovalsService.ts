import { User } from '@entities/user.entity';
import { ApprovalListFilters, ApprovalListItem, ApprovalTokenView } from '../types/approval-list';

export interface IWorkflowApprovalsService {
  getByToken(token: string): Promise<ApprovalTokenView>;
  resolve(
    token: string,
    dto: { outcome: string; input?: Record<string, unknown> },
    user?: User
  ): Promise<{ status: 'resolved' }>;
  resolveById(
    id: string,
    dto: { outcome: string; input?: Record<string, unknown> },
    user: User
  ): Promise<{ status: 'resolved' }>;
  cancel(id: string, user: User): Promise<{ status: 'cancelled' }>;
  list(
    user: User,
    filters: ApprovalListFilters,
    page: number,
    perPage: number
  ): Promise<{ requests: ApprovalListItem[]; meta: { page: number; perPage: number; total: number } }>;
}
