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
- **Foreign-key indexes.** Postgres does not index the referencing side of a foreign key, so
  every FK on a cascade path of run history needs its own non-partial index
  (`migrations/1790600000000-AddWorkflowRunHistoryForeignKeyIndexes.ts`: `parent_execution_id`,
  `parent_node_id`, `schedule_id`, approval `workflow_execution_id` / `execution_node_id`). The
  pending-only partial unique index cannot serve cascade lookups. Pinned by
  `e2e/workflow-foreign-key-indexes.spec.ts`; add new run-history FKs to both.
- **Execution status `waiting`** — a suspended run's DB `status` is `waiting`, non-terminal,
  `executed` stays `false`. Mapped to the frontend display state by `mapDbStatusToDisplayState`
  (`constants/queue-config.ts`).

## Control flow

1. **Configure** (frontend): the Human node stores, on `node.data`, its `outcomes[]`
   (named decision branches), `inputSchema` (structured fields the approver fills),
   `timeout`, `reminders[]`, `approvers`, and notification config.
2. **Execute → suspend**: `processHumanNode` (EE `services/workflow-executions.service.ts`)
   runs when the node is reached with no decision in state. Before dispatch,
   `validateReachedNodeConfiguration` requires at least one outcome and, when token bypass is
   explicitly disabled, a configured user, group, or non-blank dynamic approver expression.
   Failure is logged and persisted on the Human node and stops the run before any approval
   request, notification, timer, or waiting status is created. Valid configuration creates the approval request,
   dispatches the notification, schedules timeout+reminder timers, calls `saveSuspendedStatus`
   (`status='waiting'`, `executed=false`), disposes the shared isolate, and throws
   `WorkflowSuspendedSignal(executionId, requestId)`. The execution processor catches it and
   completes the BullMQ job as `waiting` (**not** failed).
3. **Notify**: dispatched at suspend and re-dispatched by each reminder job (see below). Every
   dispatch sends a product email through ToolJet's SMTP/whitelabel email system to the deduplicated
   approver-email snapshot, with a CTA to `/:workspaceSlug/workflows/approvals`. A configured webhook
   is sent in addition to that email.
4. **Resolve**: `POST workflow-approvals/:token/resolve` (`controllers/workflow-approvals.controller.ts`
   → `WorkflowApprovalsService.resolve`). Body `{ outcome, input }` (`dto/resolve-approval.dto.ts`).
   Re-enqueues via `enqueue(..., resumeOptions{ startNodeId, injectedState: { __humanDecision: { nodeId, outcome, input, resolvedBy } }, requestId })`
   under a **distinct** resume jobId `${executionId}-resume-${requestId}` (the original completed
   job is retained by `removeOnComplete`).
5. **Resume**: the Human node re-runs with the decision, marks every non-chosen outcome edge
   `skipped` (same mechanism as if-condition), and the run continues. The decision applies only
   to the node whose id it carries: injected state reaches every node of the resumed segment, so
   a second Human node later in the run suspends with its own approval request. Logs accumulate across the
   pause; resolve emits an `auditLogEntry` (`actionType: 'WORKFLOW_APPROVAL_RESOLVED'`,
   `resourceType: MODULES.WORKFLOWS`, so the Workflows audit filter includes it; the action is
   registered as `HUMAN_IN_THE_LOOP`'s `auditLogsKey` with `skipAuditLogs` so the interceptor does
   not log the approval routes a second time). An admin cancel emits `WORKFLOW_APPROVAL_CANCELLED`
   under the same resource; it is not yet an action-filter option, since each feature carries one key.

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
  **delayed** jobs — durable across restarts. Deterministic jobIds: `deadline-${id}`,
  `reminder-${id}-${i}`; handlers are idempotent.
- **BullMQ custom job ids must not contain `:`** — `add` throws "Custom Id cannot contain :".
  Every HITL job id (timers and the resume job) is hyphen-delimited. The scheduler test runs
  against a real queue so a colon id cannot pass behind a mocked `add`.
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
2. **Listed approvers** — the node's `approvers`: `users.id`, emails, or custom groups. Emails are
   stored trimmed and lowercased in the snapshot and compared the same way against the caller's email.
3. **Admin override** — `isWorkspaceAdmin(userId, orgId)` (queries default-admin
   `GroupPermissions` membership) → `via: 'workspace-admin'`; `isSuperAdmin(user)` →
   `via: 'super-admin'`. `ADMIN_OVERRIDE_CHANNELS = {'workspace-admin','super-admin'}`.
`via` and `adminOverride` are threaded into `resumeWithDecision` audit metadata.

Step 1 lives only in `authorizeResolver`, the token-aware wrapper: it applies the `tokenBypass`
short-circuit (which **defaults to `true`**) and is only correct for the public link route
`POST :token/resolve`, where possessing the unguessable token *is* the authorization. Steps 2–3
live in `authorizeResolverForUser`, which holds the identity paths (allowlist, groups, admin
overrides) and has **no** token branch. Every caller that presents no token — the approvals
list's per-row `canResolve` and `POST by-id/:id/resolve` — must call `authorizeResolverForUser`
directly; going through the wrapper would authorize every caller for every request in the
workspace.

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
| Endpoints | `controllers/workflow-approvals.controller.ts` — token channel: `GET :token`, `POST :token/resolve` (no `FeatureAbilityGuard`; possession of the token authorizes). Session channel: `GET /` (list), `POST by-id/:id/resolve` (listed approver or admin), `POST :id/cancel` (**admin only**). Session routes are workspace-scoped and 404 on a foreign id. |
| Entity / repo / dto | `@entities/workflow_approval_request.entity.ts`, `repositories/workflow-approval-request.repository.ts`, `dto/resolve-approval.dto.ts`, `interfaces/IWorkflowApprovalsService.ts` |

**Frontend (`frontend/ee/modules/Workflows/`):**
| Concern | File |
|---|---|
| Node config modal | `pages/WorkflowEditorPage/components/FlowBuilder/ModalContent/HumanNodeConfiguration.jsx` (+ `human-node-configuration-styles.scss`) |
| Canvas node | `pages/WorkflowEditorPage/components/FlowBuilder/Nodes/HumanNode/{index.jsx,styles.scss,human.svg}` |
| Node defaults / naming | `reducer/defaults.js`, `hooks/useNodeName.js`, `utils.js` |
| Waiting logs UI | `pages/WorkflowEditorPage/components/LogsPanel/index.jsx` + `OptionsColumn/index.jsx` (`.hitl-waiting-banner`, scoped off already-executed nodes) |
| Approvals page (route `/:workspaceId/workflows/approvals`, registered in `modules/Workflows/index.js`) | `pages/ApprovalsPage/index.jsx` (fetch, filters, pagination, selection) + `styles.scss` |
| Approvals filter bar | `pages/ApprovalsPage/ApprovalsFilterBar.jsx` (status chips, workflow picker, debounced approver search, date range) |
| Approvals table | `pages/ApprovalsPage/ApprovalsTable.jsx` |
| Approvals detail panel | `pages/ApprovalsPage/ApprovalDetailPanel.jsx` (outcome buttons, Cancel for admins) |
| `inputSchema` form | `pages/ApprovalsPage/ApprovalInputForm.jsx` (`text \| number \| boolean \| select`) |
| Nav shortcut | `frontend/ee/modules/common/components/LeftNavSideBar/LeftNavSideBar.jsx` (`approvalsEnabled` prop into CE's `BaseLeftNavSideBar`) |
| API client (CE) | `frontend/src/_services/workflow_approvals.service.js` (`getAll` / `resolveById` / `cancel`; converts date-only filters to local-day instants) |

**Tests (root `server/test/modules/workflows/`):**
`unit/approval-timeout-scheduler.spec.ts`, `unit/approval-timeout-processor.spec.ts`,
`unit/approval-notification-dispatch.spec.ts`, `unit/approvals-ability.spec.ts`,
`unit/approval-date-range.spec.ts`, `e2e/workflow-approvals-service.spec.ts`,
`e2e/workflow-approvals-controller.spec.ts`, `e2e/workflow-approvals-list-controller.spec.ts`,
`e2e/workflow-approvals-list-query.spec.ts`, `e2e/workflow-approvals-list-service.spec.ts`,
`e2e/workflow-approvals-resolve-by-id.spec.ts`, `e2e/workflow-approvals-cancel.spec.ts`,
`e2e/workflow-approval-{expire,cascade,request-entity}.spec.ts`.

Frontend: `frontend/ee/modules/Workflows/pages/ApprovalsPage/__tests__/` (filter bar, detail panel,
input form) and `frontend/src/_services/__tests__/workflow_approvals.service.spec.js`.

## Behavioral invariants

- **Validate on first entry.** Required configuration is checked only when an unexecuted node
  is reached. A Human resume carrying `__humanDecision` for that node skips first-entry configuration validation;
  timed Wait validation likewise runs only before initial suspension (its resume marker must
  match the current execution node). Fatal configuration failures never use Human outcomes or
  other business/failure branches. An evaluated dynamic approver expression and the person's
  decision remain separate runtime/business concerns.
- **Input ownership.** Start owns workflow-input validation logs and persisted input failures.
  Resuming at Human or Wait does not revisit Start or revalidate its input contract.
- **HITL suspends the whole run.** Parallel branches off Start that have not executed are NOT
  run before suspension — only nodes upstream of the Human node execute, then the run pauses.
- **Terminate ends a waiting run for good.** Terminating a `waiting`/`waiting_for_delay` run sets
  the termination flag (a resume already in flight keeps the waiting status until it finishes, so
  only the flag reaches it), cancels the run's pending approval requests and their timers, and
  removes delayed resume jobs. Resolve answers 409 and expiry only cancels the request when the
  execution is `terminated`, so no path resumes a stopped run.
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
- **The ability grant for `FEATURE_KEY.HUMAN_IN_THE_LOOP` was missing** (spec §6.2). The key was
  declared and registered with an empty `FeatureConfig`, but no `can(...)` in
  `server/ee/workflows/ability/app/index.ts` ever granted it, and `AbilityGuard` rejects a feature
  with no matching grant — so `POST /workflow-approvals/:id/cancel`, the only HITL route carrying
  `FeatureAbilityGuard`, returned **403 for every user including super admins**. It was dead code.
  Fixed alongside the new `LIST_APPROVAL_REQUESTS`: both are granted on the same workspace-wide,
  app-less shape as `WORKFLOW_PACKAGES` (`isAllAppsEditable`, at least one editable workflow, or
  super admin). `GET :token` / `POST :token/resolve` were never affected — they do not use that
  guard. No license gate was added: HITL's empty `FeatureConfig` is deliberate (spec decision #9).
- **Waking `cancel` up exposed that it had no authorization of its own.** With the grant in place
  the route became reachable, and the service method performed no approver check, no admin check
  and no organization comparison — any builder in any workspace could cancel any request id, and
  the approvals list hands out those ids. `cancel` now enforces workspace scope (404) then
  `isApprovalAdmin` (403) before its state check. Covered by
  `e2e/workflow-approvals-cancel.spec.ts`.
- **`resolveById` was not organization-scoped.** It looked the request up by id alone and
  authorized against the *request's* org, so anyone whose id or email appeared in a workspace's
  `approversSnapshot` — free text, trivially arranged — could resolve it from an unrelated
  session. Now rejected with 404 via `assertInCallersWorkspace`.
