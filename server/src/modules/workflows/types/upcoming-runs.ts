/**
 * The Executions dashboard's "upcoming runs" panel: what is scheduled to happen, as opposed to
 * `execution-list.ts`, which is what already did.
 *
 * A row here is a *schedule*, not an execution — no `workflow_executions` row exists yet for a run
 * that has not started, so nothing in the execution list can represent it.
 */

/** One active schedule, flattened out of the joins the listing query performs. */
export type ScheduleRow = {
  id: string;
  name: string | null;
  type: string;
  details: Record<string, unknown>;
  timezone: string;
  appId: string;
  appName: string | null;
  environmentId: string | null;
  environmentName: string | null;
};

/**
 * How the panel is narrowed.
 *
 * Only the executions list's *scope* selectors appear here. Status, trigger and date range are
 * properties of a run that already happened and have no meaning for one that has not.
 */
export type UpcomingRunFilters = {
  environmentId?: string;
  appId?: string;
  folderId?: string;
};

/** One row of the panel. */
export type UpcomingRun = {
  scheduleId: string;
  name: string | null;
  workflow: { id: string; name: string | null };
  environment: { id: string; name: string | null } | null;
  /** The cadence in words — "Every minute", "Daily at 8:00 AM" — or the raw cron for cron schedules. */
  cadence: string;
  timezone: string;
  /** Up to `count` future fire times as ISO strings. Empty when the schedule cannot be resolved. */
  nextRuns: string[];
  /**
   * Whether BullMQ actually holds a job scheduler for this schedule.
   *
   * A schedule can be `active` in Postgres and absent from the queue — registration happens
   * separately and can fail or be lost — in which case it will never fire despite looking healthy.
   * Surfacing it is the difference between a panel that reports intent and one that reports truth.
   */
  registered: boolean;
};
