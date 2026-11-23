# git-sync-audit module

One Audit Log entry per Git Sync push or pull, written to `audit_logs` when the git operation finishes
(success, partial or failed), through the `auditLogEntry` event, so the Audit Logs page shows it. The spec's
`{ git, details }` go in `resource_data`. EE only; CE binds a no-op service.

## Events

| Action | Written by (EE) |
|---|---|
| `RESOURCE_PUSH_COMMIT` | `AppGitOperationsUtil.gitPushApp` (commit), `AppGitService.createGitTag` (save version → tag), `AppVersionRenameListener` (tag rename) |
| `RESOURCE_DELETE_PUSH_COMMIT` | `WorkspaceBranchService.executePushAppDeletion` (queue job) |
| `RESOURCE_PULL_COMMIT` | `AppGitOperationsUtil.createGitApp` / `pullGitAppChanges`, `WorkspaceBranchService.pullApp` / `pullModule`, tag webhook via `pullTagVersion` |
| `WORKSPACE_PUSH_COMMIT` | `WorkspaceBranchService.pushWorkspace` (not `deletionOnly`) |
| `WORKSPACE_PULL_COMMIT` | `pullWorkspace` (skips and failures before queueing), `executePullBranch` (queue job) |

## Key files

| File | Role |
|---|---|
| `types.ts` | Spec shapes: `git` block parts, `details` per action, `GitSyncAuditContext` / `Outcome` |
| `ee/git-sync-audit/service.ts` | `run(context, work, describe)`, `record`, `asAutomatic`, `resolveNotedResources`, `findTagPush` |
| `ee/git-sync-audit/entry.ts` | Pure: entry → `audit_logs` fields; error code mapping and cleaning |
| `ee/git-sync-audit/audit-scope.ts` | AsyncLocalStorage notes: the commit a clone landed on, resources a pull applied or a push staged |
| `ee/git-sync-audit/first-admin.ts` | Earliest-joined active workspace admin (actor for automatic work) |

## Invariants & gotchas

- Recording never throws: a failed audit write must not fail the git operation.
- Only git work is recorded. Checks that refuse a request before it (git off, unknown resource, app already exists, no branch) run outside `run()`, like the app push's pre-clone checks.
- Git Sync push/pull routes set `skipAuditLogs: true`: the import/export they run sets request audit fields as a side effect, and the per-request row would duplicate the entry under a raw feature key.
- A queued pull carries the queueing request's IP and user agent in `job.data.audit`. A deletion commit has no IP: it can cover several users' deletes.
- Deleted apps' workspace ids and deleting users are kept in Redis with their git ids when the deletion is queued (`recordPendingAppDeletion`): the app row may be gone when the commit runs.
- Deletes a few seconds apart share one deletion commit, so one entry lists them all in `resources_removed`. An app deleted while that commit runs gets the next one: the processor's `completed` hook calls `sweepPendingAppDeletions`. The sweep can't run inside the job, because BullMQ ignores a new job with the id of an active one.
- Id lookups by git id only use uuid-shaped ids (`apps.co_relation_id` is uuid); a data source folder known only by name keeps its name.
- A tag pull's `branch`/`source_branch` is the branch the tag was cut from (`findTagPush` on the tag-save entry), its `target_branch` where it lands. A tag made outside ToolJet falls back to the target.
- `version_name` on a feature-branch push is the branch name: those drafts are named by an internal uuid.
- Error messages drop git's `Cloning into '…'` line and any server working directory.
- Error codes: the spec's set plus `PERMISSION_DENIED` (protected branch, no write access) and `RATE_LIMITED` (provider throttling), so neither is reported as bad credentials. Patterns are in `ERROR_PATTERNS` (`ee/git-sync-audit/entry.ts`), checked before the shared git classifier.
- Secrets: `scrubSecrets` (`src/helpers/secret-scrub.helper.ts`) removes GitHub and GitLab tokens, URL credentials, auth headers and PEM keys. Audit messages, `sanitizeGitError` and every API error response (`AllExceptionsFilter`) go through it.
- `run()` records the failure and rethrows the original error. Queue jobs pass `recordFailure: attempt.isFinal`, so retries write one entry; the processor computes `isFinal` from `attemptsMade` and `opts.attempts`.
- Queued work carries its `operationId` (`git.operation_id`) in the job payload, so a retried job reports the same operation.
- Automatic work (`trigger` other than `manual`) is attributed to `findFirstActiveAdmin` with `on_behalf: true`; the webhook's author/PR or the deleting user goes in `source`. Webhook code wraps the import in `asAutomatic(...)` so nested operations take that trigger.
- Pull code reports what it did through `noteCheckedOutCommit` / `notePulledResources` / `notePushedResources`. They are no-ops outside an audited operation. The first clone sets the commit; an explicit checkout (tag pull) overrides it.
- Error messages go through `sanitizeGitError` + `scrubGitCredentials`; `repository` is `owner/repo` from the clone URL, never the URL.
- Old endpoint keys `GIT_SYNC_PUSH`, `GIT_SYNC_APP_CREATE`, `MASTER_PULL_COMMIT` and the push/pull `setLocals` calls were removed; filtering on the new names also finds old rows.
- Not recorded: Git Sync settings changes, conflict-resolution choices, branch switch. Branch-push webhooks are skipped upstream, so `auto_sync_branch_push` has no writer yet. The External API's save-version tag (`external-apis/service.ts`) calls the provider directly and is not audited.

## Related modules

- `audit-logs`: the `auditLogEntry` writer and the Actions filter.
- `app-git`, `workspace-branches`, `platform-git-sync`, `git-sync-webhooks`: where the hooks live.
