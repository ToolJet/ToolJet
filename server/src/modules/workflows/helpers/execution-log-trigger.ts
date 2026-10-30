import { describeSchedule } from './execution-list-item';

type ScheduleRecord = { id: string; name?: string | null; type: string; details?: Record<string, unknown> | null };
type SourceAppRecord = { id: string; name: string; type: string };

type ExecutionLike = { id: string; scheduleId?: string | null; triggerSourceAppId?: string | null };

export type ExecutionTriggerDetails = {
  schedule: { id: string; name: string } | null;
  triggerSource: SourceAppRecord | null;
};

// Adds schedule and source-app names to each run; a missing lookup gives null.
export const withTriggerDetails = <T extends ExecutionLike>(
  executions: T[],
  schedulesById: Map<string, ScheduleRecord>,
  sourceAppsById: Map<string, SourceAppRecord>
): (T & ExecutionTriggerDetails)[] =>
  executions.map((execution) => {
    const schedule = execution.scheduleId ? schedulesById.get(execution.scheduleId) : undefined;
    const source = execution.triggerSourceAppId ? sourceAppsById.get(execution.triggerSourceAppId) : undefined;
    return {
      ...execution,
      schedule: schedule ? { id: schedule.id, name: describeSchedule(schedule) } : null,
      triggerSource: source ? { id: source.id, name: source.name, type: source.type } : null,
    };
  });
