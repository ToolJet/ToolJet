/** @group workflows */

import { toUpcomingRun, sortByNextRun } from '@modules/workflows/helpers/upcoming-runs';
import { ScheduleRow } from '@modules/workflows/types/upcoming-runs';

const now = new Date('2026-09-25T00:00:00.000Z');

const row = (overrides: Partial<ScheduleRow> = {}): ScheduleRow => ({
  id: 'sched-1',
  name: 'Nightly sweep',
  type: 'interval',
  details: { frequency: 'day', hour: '8:00 AM' },
  timezone: 'UTC',
  appId: 'app-1',
  appName: 'Expense Approval',
  environmentId: 'env-1',
  environmentName: 'production',
  ...overrides,
});

describe('toUpcomingRun', () => {
  it('describes the schedule and lists its next runs', () => {
    const result = toUpcomingRun(row(), true, now, 3);

    expect(result).toMatchObject({
      scheduleId: 'sched-1',
      name: 'Nightly sweep',
      workflow: { id: 'app-1', name: 'Expense Approval' },
      environment: { id: 'env-1', name: 'production' },
      cadence: 'Daily at 8:00 AM',
      timezone: 'UTC',
      registered: true,
    });
    expect(result.nextRuns).toEqual([
      '2026-09-25T08:00:00.000Z',
      '2026-09-26T08:00:00.000Z',
      '2026-09-27T08:00:00.000Z',
    ]);
  });

  it('marks a schedule the queue does not actually hold', () => {
    expect(toUpcomingRun(row(), false, now, 3).registered).toBe(false);
  });

  // A schedule predating multi-environment support carries no environment at all. It still runs,
  // so it still belongs in the panel — it just has nothing to show in that column.
  it('tolerates a schedule with no environment', () => {
    const result = toUpcomingRun(row({ environmentId: null, environmentName: null }), true, now, 3);
    expect(result.environment).toBeNull();
  });

  // The half-hour quirk in schedule-cron produces an unparseable expression. The row must still
  // render -- with no times and, because it is unresolvable, visibly not fine.
  it('returns a row with no times when the schedule cannot be resolved', () => {
    const result = toUpcomingRun(row({ details: { frequency: 'day', hour: '8:30 AM' } }), true, now, 3);
    expect(result.nextRuns).toEqual([]);
    expect(result.cadence).toBe('Daily at 8:30 AM');
  });

  it('honours the schedule timezone when computing times', () => {
    const result = toUpcomingRun(row({ timezone: 'Asia/Kolkata' }), true, now, 1);
    expect(result.nextRuns).toEqual(['2026-09-25T02:30:00.000Z']);
  });

  it('returns exactly the number of runs asked for', () => {
    expect(toUpcomingRun(row({ details: { frequency: 'minute' } }), true, now, 3).nextRuns).toHaveLength(3);
  });
});

describe('sortByNextRun', () => {
  const at = (iso: string | null) => ({ nextRuns: iso ? [iso] : [] }) as any;

  it('orders by soonest first', () => {
    const sorted = sortByNextRun([
      at('2026-09-25T10:00:00.000Z'),
      at('2026-09-25T08:00:00.000Z'),
      at('2026-09-25T09:00:00.000Z'),
    ]);
    expect(sorted.map((entry) => entry.nextRuns[0])).toEqual([
      '2026-09-25T08:00:00.000Z',
      '2026-09-25T09:00:00.000Z',
      '2026-09-25T10:00:00.000Z',
    ]);
  });

  // An unresolvable schedule has no time to sort by. It sinks rather than being dropped: it is
  // precisely the row someone needs to see, and sorting it to the top would bury the real answer.
  it('sinks schedules with no resolvable next run to the bottom', () => {
    const sorted = sortByNextRun([at(null), at('2026-09-25T08:00:00.000Z')]);
    expect(sorted.map((entry) => entry.nextRuns[0])).toEqual(['2026-09-25T08:00:00.000Z', undefined]);
  });

  it('does not mutate the array it is given', () => {
    const input = [at('2026-09-25T10:00:00.000Z'), at('2026-09-25T08:00:00.000Z')];
    sortByNextRun(input);
    expect(input[0].nextRuns[0]).toBe('2026-09-25T10:00:00.000Z');
  });
});
