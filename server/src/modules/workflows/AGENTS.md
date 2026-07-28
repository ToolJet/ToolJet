# workflows module

Workflows are visual automations: a graph of nodes/edges stored as an app-version definition. A workflow IS an App with `type = APP_TYPES.WORKFLOW` (`@modules/apps/constants`), so it reuses app versioning, environments, permissions, and git-sync. Executions run as BullMQ jobs in an `isolated-vm` JS sandbox (or nsjail-sandboxed Python), node by node, persisting per-node results. EE-only feature: every CE service here is a `Method not implemented.` stub; real logic lives in `server/ee/workflows/` via `getImportPath()` inheritance.

## Domain terms
- **Trigger** — how an execution starts: `WORKFLOW_TRIGGER_TYPE` = `manual` | `schedule` | `webhook` (`types/index.ts`). Carried in job `ExecutionMetadata.triggeredBy`.
- **Event** — execution *lifecycle* progress, distinct from trigger: `WORKFLOW_EXECUTION_STATUS` = `triggered/running/completed/error/terminated` (`constants/index.ts`), emitted via `job.updateProgress` and streamed to clients over SSE by `WorkflowStreamService` (BullMQ QueueEvents / Redis pub-sub).
- **Execution** — `WorkflowExecution` entity (`@entities/workflow_execution.entity.ts`): one run of an app version; `executed` bool, `status` string, JSON `logs`, `startNodeId`, executing user. DB `status` stores `success/failure/terminated`; frontend wants `completed/failed/terminated` — mapped by `mapDbStatusToDisplayState` (`constants/queue-config.ts`).
- **Execution Node / Edge** — `WorkflowExecutionNode` / `WorkflowExecutionEdge`: per-run snapshot of each graph node (definition, `idOnWorkflowDefinition`, `executed`, `result`, `state`).
- **Bundle** — `WorkflowBundle` entity: compiled dependency bundle per app version. `language` js|python, deps as JSON string (js) or requirements.txt text (python), `bundleBinary` bytea (`bundleContent` deprecated), `status`: `none | building | ready | failed`.
- **Response Node** — terminal node that writes the HTTP response for webhook-triggered runs (custom status code, may be fx-evaluated); `processResponseNode` + `buildResponseNodeMetadata` in the executions service.

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

## Related modules
- `apps` — workflow is an App (`APP_TYPES.WORKFLOW`); versions/environments come from apps/versions modules.
- `data-queries` / `data-sources` — query nodes execute real data queries through `DataQueriesModule`.
- `external-apis` — `'workflows'` is a `DefaultDataSourceKind`: front-end apps trigger workflows as queries (`FEATURE_KEY.EXECUTE_WORKFLOW_FROM_APP`).
- `background-processor` — unrelated; contains no workflow code. Workflow workers live in this module behind `WORKER=true`.
- `licensing` — `LICENSE_FIELD.WORKFLOWS` limits; `ai` module backs `AgentNodeService`.
