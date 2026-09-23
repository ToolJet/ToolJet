import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';

export interface ApprovalListFilters {
  statuses?: string[];
  appId?: string;
  /** Free-text match against the approvers snapshot (user id, group id or email). */
  approver?: string;
  from?: Date;
  to?: Date;
}

export interface ApprovalListRow extends WorkflowApprovalRequest {
  app?: App;
  node?: WorkflowExecutionNode;
}

/**
 * One approval request as the approvals page renders it. Deliberately does NOT carry `token`:
 * the token is the bearer credential for the public approval link, and the page authorizes by
 * identity instead — see `authorizeResolverForUser` in the EE approvals service.
 */
export interface ApprovalListItem {
  id: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  expiresAt: Date | null;
  workflow: { id: string | null; name: string | null };
  executionId: string;
  nodeName: string;
  description: string;
  outcomes: Array<{ key: string; label?: string }>;
  inputSchema: Array<Record<string, unknown>>;
  approversSnapshot: Record<string, unknown>;
  resolvedOutcome: string | null;
  resolvedBy: string | null;
  /** Whether THIS caller may resolve this row, computed per row by the user-only authorizer. */
  canResolve: boolean;
}
