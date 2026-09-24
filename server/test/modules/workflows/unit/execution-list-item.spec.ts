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

  it('leaves an unfinished run without a finish time', () => {
    expect(toExecutionListItem({ ...baseRow, finishedAt: null }).finishedAt).toBeNull();
  });

  // The repository's `listForOrganization` resolves app/appVersion/environment/schedule via
  // `leftJoinAndMapOne`. TypeORM's RawSqlResultsToEntityTransformer sets an unmatched mapped
  // one-to-one join to `null`, never `undefined` — so `null` is the case that must be pinned here.
  // `undefined` is kept too, cheaply, in case a hand-built row or a future change produces one.
  describe.each([
    ['app', 'workflow'],
    ['appVersion', 'version'],
    ['environment', 'environment'],
    ['schedule', 'schedule'],
  ] as const)('when %s is missing', (rowKey, resultKey) => {
    it(`yields a null ${resultKey} for the real runtime case (${rowKey}: null)`, () => {
      expect(toExecutionListItem({ ...baseRow, [rowKey]: null })[resultKey]).toBeNull();
    });

    it(`also yields a null ${resultKey} for ${rowKey}: undefined`, () => {
      expect(toExecutionListItem({ ...baseRow, [rowKey]: undefined })[resultKey]).toBeNull();
    });
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
