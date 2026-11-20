import { WorkflowLimits } from '@modules/workflows/limits/workflow-limits';

/** The HTTP routes that start a workflow run, or other workflow work, each with its own limits. */
export type RunEntry = 'editor' | 'preview' | 'app' | 'webhook' | 'approval' | 'build';

/** Entries that start a run: their payload becomes job data and they join the queue's backlog. */
export const RUN_STARTING_ENTRIES: ReadonlySet<RunEntry> = new Set(['editor', 'app', 'webhook']);

/** Who is starting the run, as far as the earlier guards on the route resolved it. */
export interface RunCaller {
  userId?: string | null;
  ip?: string | null;
  workflowId?: string | null;
  organizationId?: string | null;
}

/** One counter a run start is charged to: `limit` starts per minute, keyed by `key`. */
export interface RateBucket {
  key: string;
  limit: number;
}

export const RUN_RATE_WINDOW_MS = 60_000;

/*
 * Which per-minute counters a run start is charged to. Signed-in callers are limited per user;
 * anonymous public-app callers per workflow, per workspace and per IP, so neither one IP nor many
 * IPs can flood one workspace. Webhooks are limited per workflow, on top of the per-IP throttle
 * every webhook route already has. A scope that can't be resolved shares one 'unknown' counter,
 * so leaving an id out never escapes the limit.
 */
export function runRateBuckets(entry: RunEntry, caller: RunCaller, limits: WorkflowLimits): RateBucket[] {
  const rates = limits.ratesPerMinute;
  const id = (value?: string | null) => value || 'unknown';

  switch (entry) {
    case 'editor':
    case 'preview':
      return [{ key: `${entry}:user:${id(caller.userId)}`, limit: rates.editorPerUser }];
    case 'app':
      if (caller.userId) {
        return [{ key: `app:user:${caller.userId}:wf:${id(caller.workflowId)}`, limit: rates.appPerUserPerWorkflow }];
      }
      return [
        { key: `anon:wf:${id(caller.workflowId)}`, limit: rates.anonymousPerWorkflow },
        { key: `anon:ws:${id(caller.organizationId)}`, limit: rates.anonymousPerWorkspace },
        { key: `anon:ip:${id(caller.ip)}`, limit: rates.anonymousPerIp },
        // Many workspaces' public apps together (R3)
        { key: 'anon:instance', limit: rates.anonymousPerInstance },
      ];
    case 'webhook':
      return [{ key: `webhook:wf:${id(caller.workflowId)}`, limit: rates.webhookPerWorkflow }];
    case 'approval':
      // The public approval link resumes a paused run (R17)
      return [{ key: `approval:ip:${id(caller.ip)}`, limit: rates.approvalLinkPerIp }];
    case 'build':
      // Saving packages or rebuilding runs npm/pip on the web pod (R17)
      return [{ key: `build:user:${id(caller.userId)}`, limit: rates.rebuildsPerUser }];
  }
}
