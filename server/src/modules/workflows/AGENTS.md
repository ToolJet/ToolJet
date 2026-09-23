# workflows module

Workflows are visual automations: a graph of nodes/edges stored as an app-version definition. A workflow IS an App with `type = APP_TYPES.WORKFLOW` (`@modules/apps/constants`), so it reuses app versioning, environments, permissions, and git-sync. Executions run as BullMQ jobs in an `isolated-vm` JS sandbox (or nsjail-sandboxed Python), node by node, persisting per-node results. EE-only feature: every CE service here is a `Method not implemented.` stub; real logic lives in `server/ee/workflows/` via `getImportPath()` inheritance.

## Domain terms
- **Trigger** — how an execution starts: `WORKFLOW_TRIGGER_TYPE` = `manual` | `schedule` | `webhook` (`types/index.ts`). Carried in job `ExecutionMetadata.triggeredBy`.
- **Event** — execution *lifecycle* progress, distinct from trigger: `WORKFLOW_EXECUTION_STATUS` = `triggered/running/completed/error/terminated` (`constants/index.ts`), emitted via `job.updateProgress` and streamed to clients over SSE by `WorkflowStreamService` (BullMQ QueueEvents / Redis pub-sub).
- **Execution** — `WorkflowExecution` entity (`@entities/workflow_execution.entity.ts`): one run of an app version; `executed` bool, `status` string, JSON `logs`, `startNodeId`, executing user. DB `status` stores `success/failure/terminated` (plus `waiting` for a run suspended at a Human node — non-terminal, `executed` stays false); frontend wants `completed/failed/terminated`/`waiting` — mapped by `mapDbStatusToDisplayState` (`constants/queue-config.ts`).
- **Execution Node / Edge** — `WorkflowExecutionNode` / `WorkflowExecutionEdge`: per-run snapshot of each graph node (definition, `idOnWorkflowDefinition`, `executed`, `result`, `state`).
- **Bundle** — `WorkflowBundle` entity: compiled dependency bundle per app version. `language` js|python, deps as JSON string (js) or requirements.txt text (python), `bundleBinary` bytea (`bundleContent` deprecated), `status`: `none | building | ready | failed`.
- **Response Node** — terminal node that writes the HTTP response for webhook-triggered runs (custom status code, may be fx-evaluated); `processResponseNode` + `buildResponseNodeMetadata` in the executions service.
- **Human node** (`type: 'human'`) — a node that suspends the run to await a person's decision (custom named outcomes + optional structured input). EE-only; handled by `processHumanNode` in the executions service.
- **Approval request** — `WorkflowApprovalRequest` (`@entities/workflow_approval_request.entity.ts`, table `workflow_approval_requests`): one `pending` row per (execution, node) enforced by a partial unique index. `token` is the bearer secret for the public resolve endpoint; holds `approversSnapshot`, `resolvedOutcome`, `input` (jsonb), `expiresAt`.

## Key files (CE path; EE twin under `server/ee/workflows/` unless noted)
| Concern | File |
|---|---|
| Execution engine | `services/workflow-executions.service.ts` (EE ~2.4k lines: isolate setup, node processors, audit logs) |
| Execution worker | `processors/workflow-execution.processor.ts` (BullMQ `WorkerHost`, `WORKFLOW_CONCURRENCY`) |
| Enqueue/terminate | `services/workflow-execution-queue.service.ts`, `services/workflow-termination-registry.ts` |
| Exec API | `controllers/workflow-executions.controller.ts` (`workflow_executions`), `controllers/workflows.controller.ts` (`workflows`) |
| Live status SSE | `services/workflow-stream.service.ts` |
| Schedules | `services/workflow-schedules.service.ts` (CRUD), `services/workflow-scheduler.service.ts` (BullMQ `upsertJobScheduler`/`removeJobScheduler`), `processors/workflow-schedule.processor.ts`, `services/schedule-bootstrap.service.ts`, `controllers/workflow-schedules.controller.ts`, entity `workflow_schedule.entity.ts` |
| Webhooks | `controllers/workflow-webhooks.controller.ts` (`v2 webhooks/workflows/:id/trigger`, throttled), `services/workflow-webhooks.service.ts`, EE-only `guards/workflow-trigger-auth.guard.ts` |
| Bundles (JS) | `services/bundle-generation.service.ts` (npm ci + esbuild), `services/npm-registry.service.ts`, `services/bundle-service.factory.ts` |
| Bundles/exec (Python) | `services/python-bundle-generation.service.ts`, `services/pypi-registry.service.ts`, `services/python-executor.service.ts`, `services/security-mode-detector.service.ts`, EE `nsjail/*.cfg` |
| Bundle API | `controllers/workflow-bundles.controller.ts`, `dto/workflow-bundle.dto.ts` |
| Config | `constants/index.ts` (queue/job names, statuses), `constants/queue-config.ts` (priority, retries, timeout, concurrency), `types/index.ts` |
| Access | `guards/workflow-access.guard.ts`, `ability/app/`, `constants/feature.ts` (`FEATURE_KEY`) |
| Misc | `listeners/app-actions.listener.ts` (app.deleted / maintenance-toggled → schedule cleanup), `services/agent-node.service.ts` (AI agent node), `services/workflow-version.util.service.ts` |

## Edition split
- CE = interface stubs (services throw `Method not implemented.`); controllers/DI wiring live in CE `module.ts`, implementations resolved from `ee/workflows` via `SubModule.getProviders`. Never import `@ee` from CE.
- Per-endpoint gating: `@InitFeature(FEATURE_KEY.*)` + `FeatureAbilityFactory`. License limits: `LICENSE_FIELD.WORKFLOWS` (`@modules/licensing/constants`) — execution/count limits, plus multi-env checks (schedules/webhooks force development env when multi-env unlicensed).
- EE-only extras: `workflow-trigger-auth.guard.ts`, nsjail configs.

## Invariants & gotchas
- Two queues, module-owned (NOT background-processor): `workflow-schedule-queue` and `workflow-execution-queue`. Processors + `ScheduleBootstrapService` register only when `process.env.WORKER === 'true'` and `isMainImport` — an HTTP-only instance enqueues but never executes.
- Priority: manual/webhook 0, scheduled 1; retries default 0 attempts (`WORKFLOW_JOB_RETRY_CONFIG`).
- Timeout: `WORKFLOW_TIMEOUT_SECONDS` env (default 60s), checked cooperatively between nodes (`stopCheck`) — timeout/termination logged as `failure`, then execution status set to `failure`/`terminated`. `WorkflowTerminationError` (`types/index.ts`) marks user-initiated kills so the processor skips job-completion and cleans up isolates.
- Bundle lifecycle: `none → building → ready | failed` (`error` column holds failure reason). JS build = `npm install --package-lock-only` → `npm ci --production --ignore-scripts` → esbuild; `findExistingBundle` (dep-hash reuse) is stubbed — always returns null, every build is fresh. Isolate memory capped by `WORKFLOW_JS_MEMORY_LIMIT_MB` (default 20).
- Python: nsjail sandbox mandatory when detected (`SecurityModeDetectorService`; no silent fallback — bypass only via explicit env opt-in or nsjail absent).
- Schedules are BullMQ job schedulers keyed by schedule id; DB (`workflow_schedules`) is source of truth, reconciled on worker boot by `ScheduleBootstrapService`. Cron validated with `cron-validator`.
- Job payload carries a serialized `WorkflowExecution` + dto; default params come from `appVersion.definition.defaultParams` merged with call params at process time.
- Webhook endpoint is versioned (`version: '2'`) and throttled via `WEBHOOK_THROTTLE_TTL`/`WEBHOOK_THROTTLE_LIMIT`.

## Human-in-the-loop (HITL)
> Full cross-cutting reference (backend + frontend, semantics, approver auth, dev gotchas): `HITL.md`.
- **Suspend/resume.** At a Human node with no decision in state, `processHumanNode` creates the approval request, dispatches the notification, schedules timeout timers, calls `saveSuspendedStatus` (`status='waiting'`, `executed=false`), disposes the shared isolate, and throws `WorkflowSuspendedSignal(executionId, requestId)`; the processor catches it and completes the job as `waiting` (not failed). Resolve (`controllers/workflow-approvals.controller.ts` → `WorkflowApprovalsService.resolve`) re-enqueues via `enqueue(..., resumeOptions{ startNodeId, injectedState: { __humanDecision }, requestId })` under a **distinct** resume jobId `${executionId}:resume:${requestId}` (the original completed job is retained by `removeOnComplete`). On resume the Human node re-runs with the decision, marks every non-chosen outcome edge `skipped` (same mechanism as if-condition), and the run continues. Logs accumulate across the pause; resolve emits an `auditLogEntry`.
- **Timeout & reminders.** Dedicated `workflow-approval-timeout` queue holds delayed deadline + reminder jobs (`constants/index.ts`); `ApprovalTimeoutBootstrapService` re-arms pending timers on worker boot (per-item isolation). On deadline the processor calls `expire()` (atomic conditional update on `status='pending'`); per node config the run fails or branches to a timeout outcome. **Reminders are independent of the timeout** — they fire `afterSeconds` after request creation and schedule whether or not a timeout is enabled; read from top-level `definition.reminders` with legacy `timeout.reminders` fallback (`workflow-approval-timeout.service.ts`).
- **Resolver authorization is split in two, deliberately.** `authorizeResolver` is the *token-aware* wrapper: it short-circuits on `approversSnapshot.tokenBypass` (which **defaults to `true`**) and is only correct for the public link route `POST :token/resolve`, where possessing the unguessable token *is* the authorization. `authorizeResolverForUser` is the identity-only half — listed approver (user id / email / custom group), then workspace-admin and super-admin overrides — and has **no token branch**. Every token-less caller (the approvals list's per-row `canResolve`, resolve-by-id) must use `authorizeResolverForUser`; routing one through the wrapper would authorize every caller for every request in the workspace.
- **Schedule overlap guard.** Runs carry `schedule_id`; the schedule processor skips enqueuing while a prior run of the same schedule is non-terminal (`waiting` counts as non-terminal) — a schedule cannot stack behind a run awaiting input.
- **Gating & files (EE):** `FEATURE_KEY.HUMAN_IN_THE_LOOP`; `services/workflow-approvals.service.ts`, `services/workflow-approval-timeout.service.ts`, `processors/workflow-approval-timeout.processor.ts`, `services/approval-timeout-bootstrap.service.ts`, `controllers/workflow-approvals.controller.ts`, plus `processHumanNode`/`saveSuspendedStatus` in `services/workflow-executions.service.ts`.
- **Nested chains** (a sub-workflow suspending its parent, spec §7) are a **separate follow-up plan** — not implemented here.

## Related modules
- `apps` — workflow is an App (`APP_TYPES.WORKFLOW`); versions/environments come from apps/versions modules.
- `data-queries` / `data-sources` — query nodes execute real data queries through `DataQueriesModule`.
- `external-apis` — `'workflows'` is a `DefaultDataSourceKind`: front-end apps trigger workflows as queries (`FEATURE_KEY.EXECUTE_WORKFLOW_FROM_APP`).
- `background-processor` — unrelated; contains no workflow code. Workflow workers live in this module behind `WORKER=true`.
- `licensing` — `LICENSE_FIELD.WORKFLOWS` limits; `ai` module backs `AgentNodeService`.
