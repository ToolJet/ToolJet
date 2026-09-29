import { ApprovalRequestStatus, WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';

export interface ApprovalListFilters {
  statuses?: string[];
  appId?: string;
  /**
   * Narrow to the workflows filed under one dashboard folder.
   *
   * Matched on folder membership alone, ignoring `folder_apps.branch_id`: that column is scoped
   * per git branch, but workflows are not git-synced, so a workflow sits in the same folder
   * whichever branch is checked out — and the approvals list carries no branch context to match
   * against in the first place.
   */
  folderId?: string;
  environmentId?: string;
  /** Free-text match against the approvers snapshot (user id, group id or email). */
  approver?: string;
  from?: Date;
  to?: Date;
}

export interface ApprovalListRow extends WorkflowApprovalRequest {
  app?: App;
  node?: WorkflowExecutionNode;
  environment?: { id: string; name: string };
}

/** One party an approval can be addressed to, resolved to something a human can read. */
export interface ApprovalParty {
  /** The stored identifier: a user id, a group id, or — for an email approver — the email itself. */
  id: string;
  /** What the page renders. Never empty: falls back to the email, then to `id`. */
  label: string;
  kind: 'user' | 'email' | 'group';
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
  users: ApprovalParty[];
  emails: ApprovalParty[];
  groups: ApprovalParty[];
}

/** No token: the page authorizes by identity, not the link secret. */
export interface ApprovalListItem {
  id: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  expiresAt: Date | null;
  workflow: { id: string | null; name: string | null };
  environment: { id: string; name: string } | null;
  executionId: string;
  nodeName: string;
  description: string;
  outcomes: Array<{ key: string; label?: string }>;
  inputSchema: Array<Record<string, unknown>>;
  approversSnapshot: ApprovalListApprovers;
  resolvedOutcome: string | null;
  /**
   * Who resolved it, already labelled — or `null` when the timeout branch auto-resolved it, which
   * the page renders as a system decision rather than as an unnamed person.
   */
  resolvedBy: ApprovalParty | null;
  /**
   * Whether THIS caller can resolve THIS row *right now* — authorized by the user-only authorizer
   * AND still `pending`. It is actionability, not bare authorization, so that every consumer
   * (page, resolve-by-id) reads one field instead of re-deriving the same conjunction and one of
   * them forgetting the state half. `status` is still on the row for rendering closed states.
   */
  canResolve: boolean;
}

/** What the token link shows an approver: the decision to make, never who else can make it. */
export interface ApprovalTokenView {
  nodeName: string | undefined;
  description: string;
  outcomes: Array<{ key: string; label?: string }>;
  inputSchema: Array<Record<string, unknown>>;
  status: ApprovalRequestStatus;
  expiresAt: Date | null;
}
