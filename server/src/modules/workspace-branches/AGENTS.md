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
| `constants/index.ts` | `FEATURE_KEY` enum; `GIT_SYNC_QUEUE`/`GIT_SYNC_JOBS`; `ORG_LEASE_TTL_MS`/`orgLeaseKey` (shared by the inline path and the worker's lease) |
| `dto/index.ts` | `CreateBranchDto`; `CreateBranchResponseDto`/`BranchSummaryDto` (api-design response contract) |

## Edition split

- `server/ee/workspace-branches/service.ts` (`WorkspaceBranchService extends WorkspaceBranchServiceBase`) implements everything: `createBranch`, `executeCreateBranch` (worker body), `deleteWorkspaceBranch`, `pushWorkspace`, `pullWorkspace`, `pullApp`/`pullModule`, `resolveConflicts`, remote-branch listing, PR listing.
- `server/ee/workspace-branches/git-sync-queue.service.ts` / `git-sync-queue.processor.ts`: BullMQ job add/dispatch for create/pull/delete-branch and push-app-deletion; git jobs are serialized per organization.

## Create branch — inline vs queued

`POST /workspace-branches` is threshold-gated by workspace size: small workspaces create the branch inline and return it immediately; large workspaces run as a background job instead.

- Below threshold, with the org's git lease free → runs inline, returns `{ enqueued: false, branch }`.
- Over threshold, or the git lease is busy → queued, returns `{ enqueued: true }`.
- An inline failure surfaces as an HTTP error (never falls back to queuing); a busy lease queues the job rather than blocking the request.

### Response contract

`CreateBranchResponseDto` (`dto/index.ts`): `{ enqueued, isImport, branch? }` — `branch` (`{ id, name }`) present iff `enqueued === false`. Accepts an optional `Idempotency-Key` header (`server/src/modules/idempotency/AGENTS.md`).

## Invariants & gotchas

- `POST /workspace-branches` accepts an optional `Idempotency-Key` header (`server/src/modules/idempotency/AGENTS.md`), scoped per user — a retried request with the same key replays the first response instead of creating a second branch/job.
- CE stubs throw `NotFoundException` (404) for every method, not 501/403 per api-design rule 4 — pre-existing, tracked as follow-up, not changed here (`ce-service.spec.ts` asserts 404 for all methods).
- Deterministic BullMQ `jobId` per job type dedupes double submits; `removeOnComplete`/`removeOnFail` frees the id for the next real request.

## Related modules

- `versions` — mirrors the same inline-vs-background pattern for `POST /apps/:id/versions`; shares `BACKGROUND_JOB_THRESHOLDS` and the `idempotency` interceptor.
- `idempotency` — `IdempotencyInterceptor` applied to the create endpoint.
- `notifications` — `toast:false` panel rows for inline success; queued-job started/completed/failed notifications from the processor.
