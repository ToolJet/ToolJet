import { AuditChanges } from '@modules/audit-logs/events/types';

// Shapes from the Git Sync audit spec. One entry per git operation, written when it finishes.

export type GitSyncAuditAction =
  | 'RESOURCE_PUSH_COMMIT'
  | 'RESOURCE_DELETE_PUSH_COMMIT'
  | 'RESOURCE_PULL_COMMIT'
  | 'WORKSPACE_PUSH_COMMIT'
  | 'WORKSPACE_PULL_COMMIT';

export type GitSyncStatus = 'success' | 'partial' | 'failed';

export type GitSyncTrigger =
  | 'manual'
  | 'auto_sync_branch_push'
  | 'auto_sync_pr_merge'
  | 'auto_sync_tag'
  | 'autocommit_on_delete';

export type GitSyncErrorCode =
  | 'AUTH_FAILED'
  // The credentials work but may not do this, e.g. push to a protected branch.
  | 'PERMISSION_DENIED'
  // The provider throttled the request; retrying later works.
  | 'RATE_LIMITED'
  | 'PUSH_CONFLICT'
  | 'PULL_CONFLICTS'
  | 'TAG_EXISTS'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export type GitSyncResourceType = 'app' | 'module' | 'workflow' | 'data_source';
export type GitSyncChange = 'added' | 'updated' | 'deleted';

export interface GitSyncResourceRef {
  id: string;
  name: string;
  type: GitSyncResourceType;
}

export interface GitSyncSource {
  git_author: { username: string | null; email: string | null } | null;
  pr_number: number | null;
  initiated_by_user_id: string | null;
}

export interface GitCommitRef {
  sha: string;
  message: string | null;
}

export interface GitTagRef {
  name: string;
  sha: string | null;
  message: string | null;
  version_name: string | null;
  previous_name: string | null;
}

export interface GitSyncCounts {
  added: number;
  updated: number;
  deleted: number;
  failed: number;
}

export interface ResourcePushDetails {
  resource: GitSyncResourceRef & { version_name: string | null };
  // null: filled with the entry's branch when it is written.
  target_branch: string | null;
  push_type: 'commit' | 'tag' | 'tag_rename';
}

export interface ResourceDeletePushDetails {
  resources_removed: GitSyncResourceRef[];
  target_branch: string;
}

export interface ResourcePullDetails {
  resource: GitSyncResourceRef;
  // null: filled with the entry's branch when it is written.
  source_branch: string | null;
  target_branch: string | null;
  pull_type: 'commit' | 'tag';
  resource_action: 'created' | 'updated' | null;
  version: { name: string; action: 'created' | 'replaced' } | null;
}

export interface WorkspacePushDetails {
  target_branch: string;
  scope: 'datasource' | 'app' | 'module' | 'workflow' | 'all';
  resources_pushed: Array<GitSyncResourceRef & { change: GitSyncChange }>;
  counts: GitSyncCounts;
}

export type GitSyncPullOutcome = 'applied' | 'conflict' | 'failed';

export interface GitSyncConflict {
  resource_id: string;
  resource: string;
  type: GitSyncResourceType;
  reason: string;
}

export interface WorkspacePullDetails {
  source_branch: string;
  target_branch: string;
  resulting_sha: string | null;
  resources_pulled: Array<GitSyncResourceRef & { change: GitSyncChange; outcome: GitSyncPullOutcome }>;
  conflicts: GitSyncConflict[];
  counts: GitSyncCounts;
}

export interface GitSyncDetailsByAction {
  RESOURCE_PUSH_COMMIT: ResourcePushDetails;
  RESOURCE_DELETE_PUSH_COMMIT: ResourceDeletePushDetails;
  RESOURCE_PULL_COMMIT: ResourcePullDetails;
  WORKSPACE_PUSH_COMMIT: WorkspacePushDetails;
  WORKSPACE_PULL_COMMIT: WorkspacePullDetails;
}

/** What the operation is: known before it runs. */
export interface GitSyncAuditContext<A extends GitSyncAuditAction = GitSyncAuditAction> {
  action: A;
  organizationId: string;
  trigger: GitSyncTrigger;
  // The user who clicked. Ignored for automatic triggers: those are attributed to the first workspace admin.
  actorUserId?: string | null;
  source?: Partial<GitSyncSource> | null;
  // Pass one when the operation was queued, so a retried job writes the same entry.
  operationId?: string;
  parentOperationId?: string | null;
  // The remote branch the operation pushed to or pulled from. Defaults to the workspace's configured branch.
  branch?: string | null;
  // Resource events: the resource. Workspace events: omit, the workspace is the target.
  resource?: GitSyncResourceRef | null;
  startedAt?: Date;
  // Defaults: the current request's id, IP and user agent. A queued job passes what the request that queued it saw.
  requestId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** How the operation ended. */
export interface GitSyncAuditOutcome<A extends GitSyncAuditAction = GitSyncAuditAction> {
  // Defaults to `failed` when `error` is set, else `success`.
  status?: GitSyncStatus;
  error?: unknown;
  errorCode?: GitSyncErrorCode;
  // A cleaned, readable message to store instead of the error's own (e.g. a partial pull summary).
  errorMessage?: string;
  commit?: GitCommitRef | null;
  tag?: GitTagRef | null;
  details: GitSyncDetailsByAction[A];
  // When the branch or the resource is only known once the operation ran (an import creates the app).
  branch?: string | null;
  resource?: GitSyncResourceRef;
  changes?: AuditChanges | null;
  completedAt?: Date;
}

/** Context set by an outer automatic operation (a webhook) for the git operations it runs. */
export type GitSyncAuditOverride = Pick<GitSyncAuditContext, 'trigger' | 'source' | 'parentOperationId'>;

/** A resource a pull applied, deleted or failed on, as noted by the pull code while it ran. */
export interface PulledResource {
  // The workspace id when the noting code has it; otherwise resolved from the git id when the entry is written.
  id?: string;
  // The resource's git id (co_relation_id).
  gitId: string;
  name: string;
  type: GitSyncResourceType;
  change: GitSyncChange;
  outcome: GitSyncPullOutcome;
}

export type PushedResource = Omit<PulledResource, 'outcome'>;

/** What the operation noted while it ran: the commit its clone landed on, and the resources it pulled or staged. */
export interface GitSyncAuditNotes {
  commit: GitCommitRef | null;
  pulled: PulledResource[];
  // Staged for a push; still listed when the push then fails.
  pushed: PushedResource[];
}

type MaybePromise<T> = T | Promise<T>;

export interface GitSyncAuditDescribe<A extends GitSyncAuditAction, T> {
  success: (result: T, notes: GitSyncAuditNotes) => MaybePromise<GitSyncAuditOutcome<A>>;
  failure: (error: unknown, notes: GitSyncAuditNotes) => MaybePromise<Omit<GitSyncAuditOutcome<A>, 'error'>>;
}

export interface GitSyncAuditRunOptions {
  // False on a queue job attempt that will be retried: only the last attempt records a failure.
  recordFailure?: boolean;
}

export const EMPTY_GIT_SYNC_COUNTS: GitSyncCounts = { added: 0, updated: 0, deleted: 0, failed: 0 };

/** Audit resource type for an `apps` row (front-end apps, modules and workflows share the table). */
export function gitSyncResourceTypeForApp(appType: string | null | undefined): GitSyncResourceType {
  if (appType === 'module') return 'module';
  if (appType === 'workflow') return 'workflow';
  return 'app';
}
