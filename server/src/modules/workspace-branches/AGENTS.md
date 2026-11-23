# workspace-branches module

Owns git-branch operations for a workspace: list/create/switch/delete branches, push/pull the workspace repo, conflict resolution, remote-branch/PR listing, and per-app/module pull+tag flows. CE ships interface + stubs only — git sync is EE-licensed.

## Domain terms

- **Branch** — `WorkspaceBranch` entity; a git branch tracked for the org's workspace repo. One is the default branch (`isDefault`).
- **Org lease** — a per-organization Redis lock (`tj:git-sync:lease:<orgId>`) serializing git operations across web + worker pods, since the repo clone is per-org, not per-request.

## Key files

| File | Role |
|---|---|
| `module.ts` | `WorkspaceBranchModule extends SubModule`; on EE/Cloud registers the `git-sync-queue` BullMQ queue, `GitSyncQueueProcessor` only when `WORKER=true` |
| `service.ts` | CE `WorkspaceBranchService`: every method throws `NotFoundException` (no-op stub) |
| `controller.ts` | `/workspace-branches` — list, create, `:id/activate` (switch), delete, push, pull, resolve-conflicts, pull-app, pull-module, ensure-draft, remote, pull-requests, entity-tags |
| `constants/index.ts` | `FEATURE_KEY` enum; `GIT_SYNC_QUEUE`/`GIT_SYNC_JOBS` |
| `dto/index.ts` | `CreateBranchDto`; `CreateBranchResponseDto` (api-design response contract) |

## Edition split

- `server/ee/workspace-branches/service.ts` (`WorkspaceBranchService extends WorkspaceBranchServiceBase`) implements everything: `createBranch`, `executeCreateBranch` (worker body), `deleteWorkspaceBranch`, `pushWorkspace`, `pullWorkspace`, `pullApp`/`pullModule`, `resolveConflicts`, remote-branch listing, PR listing.
- `server/ee/workspace-branches/git-sync-queue.service.ts` / `git-sync-queue.processor.ts`: BullMQ job add/dispatch for create/pull/delete-branch and push-app-deletion; git jobs are serialized per organization.

## Create branch — always queued

`POST /workspace-branches` validates (source branch, duplicate name, remote conflict pre-check, import confirmation) in the request, then enqueues the create and returns `CreateBranchResponseDto` `{ enqueued: true, isImport }`. The branch has no id until the job runs; the completion notification carries `metadata.branchId` so the frontend can switch onto it. Accepts an optional `Idempotency-Key` header (`server/src/modules/idempotency/AGENTS.md`).

## Invariants & gotchas

- `POST /workspace-branches` accepts an optional `Idempotency-Key` header (`server/src/modules/idempotency/AGENTS.md`), scoped per user — a retried request with the same key replays the first response instead of creating a second branch/job.
- CE stubs throw `NotFoundException` (404) for every method, not 501/403 per api-design rule 4 — pre-existing, tracked as follow-up, not changed here (`ce-service.spec.ts` asserts 404 for all methods).
- Deterministic BullMQ `jobId` per job type dedupes double submits; `removeOnComplete`/`removeOnFail` frees the id for the next real request.

## Related modules

- `versions` — same background pattern for `POST /apps/:id/versions`; shares the `idempotency` interceptor.
- `idempotency` — `IdempotencyInterceptor` applied to the create endpoint.
- `notifications` — queued-job started/completed/failed notifications from the processor.
