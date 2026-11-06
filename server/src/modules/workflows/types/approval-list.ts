import { ApprovalRequestStatus, WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';

export interface ApprovalListFilters {
  statuses?: string[];
  appId?: string;
  /** Folder membership only; folder_apps.branch_id ignored (workflows are not git-synced). */
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

export interface ApprovalParty {
  /** The stored identifier: a user id, a group id, or — for an email approver — the email itself. */
  id: string;
  /** What the page renders. Never empty: falls back to the email, then to `id`. */
  label: string;
  kind: 'user' | 'email' | 'group';
}

/** No tokenBypass: public-link-only flag, never sent to page consumers. */
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
  /** null = timeout auto-resolve (system decision). */
  resolvedBy: ApprovalParty | null;
  /** Authorized AND pending; consumers must not re-derive. */
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
