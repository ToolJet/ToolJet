/** @group workflows */

import { withTriggerDetails } from '@modules/workflows/helpers/execution-log-trigger';

const schedules = new Map([['sch-1', { id: 'sch-1', name: 'Nightly sync', type: 'interval', details: {} }]]);
const sources = new Map([['app-1', { id: 'app-1', name: 'Sales dashboard', type: 'front-end' }]]);

describe('withTriggerDetails', () => {
  it('attaches the schedule name to a scheduled run', () => {
    const [row] = withTriggerDetails([{ id: 'e1', triggerType: 'schedule', scheduleId: 'sch-1' }], schedules, sources);

    expect(row).toMatchObject({ schedule: { id: 'sch-1', name: 'Nightly sync' }, triggerSource: null });
  });

  it('falls back to the cadence for an unnamed schedule', () => {
    const unnamed = new Map([
      ['sch-2', { id: 'sch-2', name: null, type: 'interval', details: { unit: 'hour', interval: 2 } }],
    ]);

    const [row] = withTriggerDetails([{ id: 'e1', scheduleId: 'sch-2' }], unnamed, sources);

    expect(row.schedule).toEqual({ id: 'sch-2', name: expect.any(String) });
    expect(row.schedule.name).not.toBe('');
  });

  it('attaches the calling app to an app-triggered run', () => {
    const [row] = withTriggerDetails(
      [{ id: 'e1', triggerType: 'app', triggerSourceAppId: 'app-1' }],
      schedules,
      sources
    );

    expect(row).toMatchObject({
      schedule: null,
      triggerSource: { id: 'app-1', name: 'Sales dashboard', type: 'front-end' },
    });
  });

  it('keeps the rest of the row unchanged', () => {
    const [row] = withTriggerDetails([{ id: 'e1', status: 'success', logs: [] }], schedules, sources);

    expect(row).toMatchObject({ id: 'e1', status: 'success', logs: [] });
  });

  it.each([
    ['a run that predates the column', { id: 'e1', triggerType: 'app', triggerSourceAppId: null }],
    ['a deleted or out-of-workspace source app', { id: 'e1', triggerType: 'app', triggerSourceAppId: 'gone' }],
    ['a deleted schedule', { id: 'e1', triggerType: 'schedule', scheduleId: 'gone' }],
  ])('returns null details for %s', (_label, execution) => {
    const [row] = withTriggerDetails([execution], schedules, sources);

    expect(row).toMatchObject({ schedule: null, triggerSource: null });
  });
});
