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

export type UpcomingRunFilters = {
  environmentId?: string;
  appId?: string;
  folderId?: string;
};

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
  /** False when Postgres has it active but BullMQ holds no scheduler: it will never fire. */
  registered: boolean;
};
