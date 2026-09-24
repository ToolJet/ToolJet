import { ExecutionListItem, ExecutionListRow } from '../types/execution-list';
import { WORKFLOW_TRIGGER_TYPE } from '../types';

type ScheduleLike = { name?: string | null; details?: any } | null | undefined;

/**
 * A human label for the schedule that fired a run. Named schedules win; otherwise fall back to the
 * raw cron so the column says something true rather than nothing. Humanizing the cron into prose is
 * deliberately not done here — that is a presentation concern and belongs in the browser.
 */
export const describeSchedule = (schedule: ScheduleLike): string | null => {
  if (!schedule) return null;
  if (schedule.name) return schedule.name;
  const cron = schedule.details?.cron;
  return typeof cron === 'string' && cron.length > 0 ? cron : null;
};

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

/**
 * Maps a decorated repository row onto the wire shape.
 *
 * Note this returns the raw DB `status` plus `executed`, NOT a display state. The browser derives
 * the display state with `getExecutionDisplayState`, which also needs live BullMQ job state — so
 * resolving it here would produce a second, subtly different status vocabulary that drifts from the
 * editor's logs panel.
 */
export const toExecutionListItem = (row: ExecutionListRow): ExecutionListItem => ({
  id: row.id,
  workflow: row.app ? { id: row.app.id, name: row.app.name } : null,
  status: row.status ?? null,
  executed: !!row.executed,
  triggerType: row.triggerType ?? WORKFLOW_TRIGGER_TYPE.UNKNOWN,
  schedule: row.schedule ? { id: row.schedule.id, name: describeSchedule(row.schedule) } : null,
  startedAt: iso(row.startedAt),
  finishedAt: iso(row.finishedAt),
  createdAt: iso(row.createdAt),
  version: row.appVersion ? { id: row.appVersion.id, name: row.appVersion.name } : null,
  environment: row.environment ? { id: row.environment.id, name: row.environment.name } : null,
});
