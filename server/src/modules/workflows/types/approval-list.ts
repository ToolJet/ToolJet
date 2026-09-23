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
 * The identity half of an approvals snapshot, as projected onto the wire.
 *
 * Closed on purpose: the stored snapshot also carries `tokenBypass`, which defaults to `true` and
 * is only meaningful to the public-link route. A consumer that could read it would be one
 * `canResolve || approversSnapshot.tokenBypass` away from re-opening the hole the authorizer
 * split closes, so it is not part of this type and must not be added to it.
 */
export interface ApprovalListApprovers {
  users: string[];
  emails: string[];
  groups: string[];
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
  approversSnapshot: ApprovalListApprovers;
  resolvedOutcome: string | null;
  resolvedBy: string | null;
  /**
   * Whether THIS caller can resolve THIS row *right now* — authorized by the user-only authorizer
   * AND still `pending`. It is actionability, not bare authorization, so that every consumer
   * (page, resolve-by-id) reads one field instead of re-deriving the same conjunction and one of
   * them forgetting the state half. `status` is still on the row for rendering closed states.
   */
  canResolve: boolean;
}
