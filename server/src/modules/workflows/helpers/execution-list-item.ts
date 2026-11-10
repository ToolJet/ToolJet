import { ExecutionListItem, ExecutionListRow } from '../types/execution-list';
import { WORKFLOW_TRIGGER_TYPE } from '../types';
import { describeCadence } from './schedule-cron';
import { AppVersionType } from '@entities/app_version.entity';

type ScheduleLike = { name?: string | null; type: string; details?: Record<string, unknown> | null } | null | undefined;

/** The schedule's name, or its cadence as the upcoming-runs panel words it. */
export const describeSchedule = (schedule: ScheduleLike): string | null => {
  if (!schedule) return null;
  return schedule.name || describeCadence({ type: schedule.type, details: schedule.details ?? {} });
};

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const versionDisplayName = (version: NonNullable<ExecutionListRow['appVersion']>): string =>
  version.versionType === AppVersionType.BRANCH && version.branch?.name ? version.branch.name : version.name;

/** Raw DB status plus executed; display state needs live job state, so the browser derives it. */
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
  version: row.appVersion ? { id: row.appVersion.id, name: versionDisplayName(row.appVersion) } : null,
  environment: row.environment ? { id: row.environment.id, name: row.environment.name } : null,
});
