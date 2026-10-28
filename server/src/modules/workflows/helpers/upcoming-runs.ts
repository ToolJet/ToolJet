import { ScheduleRow, UpcomingRun } from '../types/upcoming-runs';
import { describeCadence, nextRuns, scheduleToCron } from './schedule-cron';

export function toUpcomingRun(row: ScheduleRow, registered: boolean, now: Date, count: number): UpcomingRun {
  const cron = scheduleToCron({ type: row.type, details: row.details });

  return {
    scheduleId: row.id,
    name: row.name,
    workflow: { id: row.appId, name: row.appName },
    environment: row.environmentId ? { id: row.environmentId, name: row.environmentName } : null,
    cadence: describeCadence({ type: row.type, details: row.details }),
    timezone: row.timezone,
    nextRuns: nextRuns(cron, row.timezone, count, now).map((date) => date.toISOString()),
    registered,
  };
}

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
