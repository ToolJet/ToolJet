# Human-in-the-loop (HITL) — feature reference

Deep-dive companion to `AGENTS.md` (§ Human-in-the-loop). This is the cross-cutting
map — backend + frontend, semantics, auth, and operational gotchas — for the **Human
node**: a workflow node that suspends a run to await a person's decision. EE-only feature,
gated by `FEATURE_KEY.HUMAN_IN_THE_LOOP` (`constants/feature.ts`). CE services are
`Method not implemented.` stubs; real logic is in `server/ee/workflows/` via
`getImportPath()` inheritance. Paths below are CE unless prefixed; each has an EE twin.

## Data model

- **`WorkflowApprovalRequest`** — `@entities/workflow_approval_request.entity.ts`, table
  `workflow_approval_requests`. One `pending` row per (execution, node), enforced by a
  **partial unique index** on `status='pending'`. Migration:
  `migrations/1787000000000-CreateWorkflowApprovalRequestsAndExecutionLinkage.ts`.
  Key columns: `token` (bearer secret for the public resolve endpoint), `status`
  (`pending`/`resolved`/`expired`/…), `resolvedOutcome`, `input` (jsonb), `resolvedByUserId`,
  `approversSnapshot` (jsonb), `expiresAt`,
  `organization_id` / `app_id` (denormalized from the execution's app version so the approvals
  list can filter and paginate on an index rather than through three joins; written at request
  creation, backfilled by `migrations/1787800000000-AddOrganizationAndAppToApprovalRequests.ts`).
  Repository:
  `repositories/workflow-approval-request.repository.ts`.
- **Execution status `waiting`** — a suspended run's DB `status` is `waiting`, non-terminal,
  `executed` stays `false`. Mapped to the frontend display state by `mapDbStatusToDisplayState`
  (`constants/queue-config.ts`).

## Control flow

1. **Configure** (frontend): the Human node stores, on `node.data`, its `outcomes[]`
   (named decision branches), `inputSchema` (structured fields the approver fills),
   `timeout`, `reminders[]`, `approvers`, and notification config.
2. **Execute → suspend**: `processHumanNode` (EE `services/workflow-executions.service.ts`)
   runs when the node is reached with no decision in state. It creates the approval request,
   dispatches the notification, schedules timeout+reminder timers, calls `saveSuspendedStatus`
   (`status='waiting'`, `executed=false`), disposes the shared isolate, and throws
   `WorkflowSuspendedSignal(executionId, requestId)`. The execution processor catches it and
   completes the BullMQ job as `waiting` (**not** failed).
3. **Notify**: dispatched at suspend and re-dispatched by each reminder job (see below).
4. **Resolve**: `POST workflow-approvals/:token/resolve` (`controllers/workflow-approvals.controller.ts`
   → `WorkflowApprovalsService.resolve`). Body `{ outcome, input }` (`dto/resolve-approval.dto.ts`).
   Re-enqueues via `enqueue(..., resumeOptions{ startNodeId, injectedState: { __humanDecision }, requestId })`
   under a **distinct** resume jobId `${executionId}:resume:${requestId}` (the original completed
   job is retained by `removeOnComplete`).
5. **Resume**: the Human node re-runs with the decision, marks every non-chosen outcome edge
   `skipped` (same mechanism as if-condition), and the run continues. Logs accumulate across the
   pause; resolve emits an `auditLogEntry`.

## Semantics

- **Outcome vs input.** The approver passes exactly **one** `outcome` — validated against the
  node's outcome keys (unknown → 400). The chosen outcome selects the branch (its `sourceHandle`);
  all other outcome edges are skipped. Everything else the reviewer submits is `input`, validated
  against `inputSchema`. Exposed downstream as `{{node.data.outcome}}`,
  `{{node.data.input.<field>}}`, `{{node.data.resolvedBy}}`.
- **Timeout** = deadline for the approval to be **resolved** (`timeout = { enabled,
  durationSeconds, onExpire: 'fail' | 'branch', timeoutOutcome, ... }`). On deadline the
  processor calls `expire()` (atomic conditional update on `status='pending'`). `branch`
  auto-resolves with `timeoutOutcome` as a **system** decision (`resolvedBy = null`) when it is a
  valid outcome key; otherwise it falls back to `fail` (marks expired + fails the run).
- **Reminders** are **independent of the timeout** (decoupled — see history below). Each reminder
  `{ afterSeconds }` fires `afterSeconds` **after the request was created** (not after the
  deadline) and re-dispatches the notification. They schedule whether or not a timeout is enabled.
  - **Storage:** current location is **top-level `node.data.reminders`**. The scheduler still
    reads the legacy `timeout.reminders` shape as a fallback:
    `definition?.reminders ?? timeout.reminders ?? []` (EE `services/workflow-approval-timeout.service.ts`).
  - The frontend "fires after the timeout" warning only shows when a timeout is actually enabled.

## Scheduling (BullMQ / Redis)

- Dedicated queue **`workflow-approval-timeout`** (name in `constants/index.ts`) holds one-shot
  **delayed** jobs — durable across restarts. Deterministic jobIds: `deadline:${id}`,
  `reminder:${id}:${i}`; handlers are idempotent.
- Producer: `WorkflowApprovalTimeoutService.scheduleTimers` (EE
  `services/workflow-approval-timeout.service.ts`). Consumer:
  `WorkflowApprovalTimeoutProcessor` (`processors/workflow-approval-timeout.processor.ts`,
  `@Processor` + `WorkerHost`).
- `cancelTimers(requestId)` removes delayed/waiting jobs for a request on resolve/cancel.
- `ApprovalTimeoutBootstrapService` (`services/approval-timeout-bootstrap.service.ts`) re-arms
  timers for all `pending` requests on worker boot (per-item isolation).
- Processors + bootstrap register only on a worker instance (`process.env.WORKER === 'true'` +
  `isMainImport`); an HTTP-only instance enqueues but never fires timers.

## Approver authorization

In `WorkflowApprovalsService` (EE `services/workflow-approvals.service.ts`),
`authorizeResolver()` returns `{ authorized, via }`, checked in order:
1. **Token** — a valid `:token` bypasses user checks (the public link).
2. **Listed approvers** — the node's `approvers`: `users.id`, emails, or custom groups.
3. **Admin override** — `isWorkspaceAdmin(userId, orgId)` (queries default-admin
   `GroupPermissions` membership) → `via: 'workspace-admin'`; `isSuperAdmin(user)` →
   `via: 'super-admin'`. `ADMIN_OVERRIDE_CHANNELS = {'workspace-admin','super-admin'}`.
`via` and `adminOverride` are threaded into `resumeWithDecision` audit metadata.

Step 1 lives only in `authorizeResolver`, the token-aware wrapper used by the public
`POST :token/resolve` route. Steps 2–3 live in `authorizeResolverForUser`, which has **no**
token branch. `tokenBypass` defaults to `true` on every request, so any caller that did not
present a token — the approvals list's per-row `canResolve`, resolve-by-id — must call
`authorizeResolverForUser` directly; going through the wrapper would authorize every caller
for every request in the workspace.

`authorizeResolver` is a thin wrapper: it applies the `tokenBypass` short-circuit and then
delegates to **`authorizeResolverForUser`**, which holds the identity paths (allowlist, groups,
admin overrides) and has no token branch. Callers that present no token — the approvals list's
`canResolve` and `POST by-id/:id/resolve` — must use `authorizeResolverForUser` directly;
`tokenBypass` defaults to `true`, so going through the wrapper would authorize everyone.

The approvals list's `canResolve` is **actionability, not authorization**:
`authorized && status === 'pending'`. Consumers render the resolve control on that single
field rather than re-deriving the conjunction, so no consumer can forget the state half and
show a live Approve control on a closed row. The list also projects only the identity fields
of the approvers snapshot (`users`/`emails`/`groups`) — `tokenBypass` never goes on the wire,
so no client can write `canResolve || approversSnapshot.tokenBypass`.

`list()` resolves the caller's custom-group membership and workspace-admin role **once per
page** and passes them into `authorizeResolverForUser` as an optional identity context. Both
are functions of `(user, organizationId)` only. This matters because `isWorkspaceAdmin` calls
`dbTransactionWrap` with no manager, which opens a fresh pooled connection and transaction on
every call, and it sits on the default path (any row where the caller is not a listed
approver). Single-request callers such as `resolve()` pass no context and each lookup runs on
demand.

## File map

**Backend (EE twins under `server/ee/workflows/`):**
| Concern | File |
|---|---|
| Suspend/resume engine | `services/workflow-executions.service.ts` (`processHumanNode`, `saveSuspendedStatus`) |
| Approval lifecycle + auth | `services/workflow-approvals.service.ts` |
| Timeout/reminder producer | `services/workflow-approval-timeout.service.ts` |
| Timeout/reminder consumer | `processors/workflow-approval-timeout.processor.ts` |
| Timer bootstrap on boot | `services/approval-timeout-bootstrap.service.ts` |
| Public endpoints | `controllers/workflow-approvals.controller.ts` (`GET :token`, `POST :token/resolve`, `POST by-id/:id/resolve`, `POST :id/cancel`) |
| Entity / repo / dto | `@entities/workflow_approval_request.entity.ts`, `repositories/workflow-approval-request.repository.ts`, `dto/resolve-approval.dto.ts`, `interfaces/IWorkflowApprovalsService.ts` |

**Frontend (`frontend/ee/modules/Workflows/`):**
| Concern | File |
|---|---|
| Node config modal | `pages/WorkflowEditorPage/components/FlowBuilder/ModalContent/HumanNodeConfiguration.jsx` (+ `human-node-configuration-styles.scss`) |
| Canvas node | `pages/WorkflowEditorPage/components/FlowBuilder/Nodes/HumanNode/{index.jsx,styles.scss,human.svg}` |
| Node defaults / naming | `reducer/defaults.js`, `hooks/useNodeName.js`, `utils.js` |
| Waiting logs UI | `pages/WorkflowEditorPage/components/LogsPanel/index.jsx` + `OptionsColumn/index.jsx` (`.hitl-waiting-banner`, scoped off already-executed nodes) |

**Tests (root `server/test/modules/workflows/`):**
`unit/approval-timeout-scheduler.spec.ts`, `unit/approval-timeout-processor.spec.ts`,
`unit/approval-notification-dispatch.spec.ts`, `e2e/workflow-approvals-service.spec.ts`,
`e2e/workflow-approvals-controller.spec.ts`, `e2e/workflow-approval-{expire,cascade,request-entity}.spec.ts`.

## Behavioral invariants

- **HITL suspends the whole run.** Parallel branches off Start that have not executed are NOT
  run before suspension — only nodes upstream of the Human node execute, then the run pauses.
- **Schedule overlap guard.** A scheduled workflow will not stack a new run while a prior run of
  the same schedule is non-terminal — and `waiting` counts as non-terminal.
- Frontend `save()` serializes `nodes`/`edges` **raw** (no key whitelist), so any `node.data.*`
  key (e.g. `reminders`) persists without server-side schema changes.

## Operational notes (developer gotchas)

- **Restart the backend after any `server/ee` change** — dev server does not hot-reload the
  submodule. Stop the running server first (port 3002 held → `EADDRINUSE`), then
  `cd server && npm run start:dev`.
- **Browser HMR does not reliably reflect submodule (`frontend/ee`) component edits** — do a full
  navigation to the editor URL rather than trusting F5/hard-reload.
- **Cross-node `{{...}}` refs are not resolved inside a workflow JS node's code** — use plain JS
  returns in test workflows.
- Run the HITL unit tests from `server/`:
  `npx jest --config jest.config.ts test/modules/workflows/unit/approval-timeout-scheduler.spec.ts`.

## Not implemented

- **Nested chains** — a sub-workflow suspending its parent (spec §7) is a separate follow-up
  plan, not built here.

## History

- Reminders were **decoupled from timeout** so they can be configured with the timeout disabled
  (moved to top-level `node.data.reminders`; scheduler reads it independently, legacy
  `timeout.reminders` still honored). Backend: `feat: decouple approval reminders from timeout`.
