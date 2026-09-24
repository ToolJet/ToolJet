/** @group workflows */

import { toExecutionListItem, describeSchedule } from '@modules/workflows/helpers/execution-list-item';

const baseRow: any = {
  id: 'exec-1',
  status: 'success',
  executed: true,
  triggerType: 'schedule',
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  startedAt: new Date('2026-01-01T10:00:01.000Z'),
  finishedAt: new Date('2026-01-01T10:00:31.000Z'),
  app: { id: 'app-1', name: 'Daily Data Sync' },
  appVersion: { id: 'ver-1', name: 'v2.3' },
  environment: { id: 'env-1', name: 'production' },
  schedule: { id: 'sch-1', name: 'Every Monday', details: {} },
};

describe('toExecutionListItem', () => {
  it('maps a decorated row onto the response shape', () => {
    expect(toExecutionListItem(baseRow)).toEqual({
      id: 'exec-1',
      workflow: { id: 'app-1', name: 'Daily Data Sync' },
      status: 'success',
      executed: true,
      triggerType: 'schedule',
      schedule: { id: 'sch-1', name: 'Every Monday' },
      startedAt: '2026-01-01T10:00:01.000Z',
      finishedAt: '2026-01-01T10:00:31.000Z',
      createdAt: '2026-01-01T10:00:00.000Z',
      version: { id: 'ver-1', name: 'v2.3' },
      environment: { id: 'env-1', name: 'production' },
    });
  });

  it('reports unknown rather than guessing when history has no trigger type', () => {
    expect(toExecutionListItem({ ...baseRow, triggerType: null }).triggerType).toBe('unknown');
  });

  it('tolerates a run whose environment was never resolved', () => {
    expect(toExecutionListItem({ ...baseRow, environment: undefined }).environment).toBeNull();
  });

  it('tolerates a manual run with no schedule', () => {
    expect(toExecutionListItem({ ...baseRow, schedule: undefined }).schedule).toBeNull();
  });

  it('leaves an unfinished run without a finish time', () => {
    expect(toExecutionListItem({ ...baseRow, finishedAt: null }).finishedAt).toBeNull();
  });
});

describe('describeSchedule', () => {
  it('prefers the schedule name when one was given', () => {
    expect(describeSchedule({ name: 'Every Monday', details: { cron: '0 9 * * 1' } })).toBe('Every Monday');
  });

  it('falls back to the raw cron expression for an unnamed schedule', () => {
    expect(describeSchedule({ name: null, details: { cron: '0 9 * * 1' } })).toBe('0 9 * * 1');
  });

  it('returns null when there is no schedule at all', () => {
    expect(describeSchedule(null)).toBeNull();
  });
});
