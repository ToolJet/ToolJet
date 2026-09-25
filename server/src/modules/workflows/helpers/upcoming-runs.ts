import { ScheduleRow, UpcomingRun } from '../types/upcoming-runs';
import { describeCadence, nextRuns, scheduleToCron } from './schedule-cron';

/**
 * Turning a stored schedule into a panel row.
 *
 * Pure on purpose: the two things that make this awkward to test — a Postgres join and a Redis
 * read — happen in the caller, so everything decided here (cadence wording, timezone handling,
 * what an unresolvable schedule looks like) is testable against a plain object.
 */
export function toUpcomingRun(row: ScheduleRow, registered: boolean, now: Date, count: number): UpcomingRun {
  const cron = scheduleToCron({ type: row.type, details: row.details });

  return {
    scheduleId: row.id,
    name: row.name,
    workflow: { id: row.appId, name: row.appName },
    // Null rather than a half-filled object: a schedule from before multi-environment support has
    // no environment, and `{ id: null }` would invite the UI to render an empty chip.
    environment: row.environmentId ? { id: row.environmentId, name: row.environmentName } : null,
    cadence: describeCadence({ type: row.type, details: row.details }),
    timezone: row.timezone,
    nextRuns: nextRuns(cron, row.timezone, count, now).map((date) => date.toISOString()),
    registered,
  };
}

/**
 * Soonest first, with unresolvable schedules last.
 *
 * A schedule with no computable next run still belongs in the panel — it is the one worth looking
 * at — but it has no position on a timeline, so it sinks instead of sorting as epoch zero and
 * pushing the actual answer off the top. Returns a new array; callers may hold the input.
 */
export function sortByNextRun<T extends { nextRuns: string[] }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    const leftNext = left.nextRuns[0];
    const rightNext = right.nextRuns[0];
    if (!leftNext && !rightNext) return 0;
    if (!leftNext) return 1;
    if (!rightNext) return -1;
    return leftNext.localeCompare(rightNext);
  });
}
