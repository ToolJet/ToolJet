/** @group workflows */

import { scheduleToCron, describeCadence, nextRuns } from '@modules/workflows/helpers/schedule-cron';

describe('scheduleToCron', () => {
  it('maps the minute frequency to every minute', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'minute' } })).toBe('* * * * *');
  });

  it('maps the hour frequency to the chosen minute past every hour', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'hour', minutes: 15 } })).toBe('15 * * * *');
  });

  it('maps the day frequency to a fixed hour', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'day', hour: '8:00 AM' } })).toBe('0 8 * * *');
  });

  it('reads a PM hour as its 24-hour equivalent', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'day', hour: '9:00 PM' } })).toBe('0 21 * * *');
  });

  it('maps the week frequency to a day of the week', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'week', day: 'Monday', hour: '8:00 AM' } })).toBe(
      '0 8 * * 1'
    );
  });

  it('maps the month frequency to a day of the month', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'month', date: 14, hour: '8:00 AM' } })).toBe(
      '0 8 14 * *'
    );
  });

  it('assembles a cron-type schedule from its five stored fields', () => {
    expect(
      scheduleToCron({
        type: 'cron',
        details: { minute: '30', hours: '2', dayOfMonth: '*', month: '*', dayOfWeek: '1' },
      })
    ).toBe('30 2 * * 1');
  });

  it('reproduces the half-hour offset quirk rather than papering over it', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'day', hour: '8:30 AM' } })).toBe('0 8.5 * * *');
  });

  it('returns null for a frequency it does not recognise', () => {
    expect(scheduleToCron({ type: 'interval', details: { frequency: 'fortnight' } })).toBeNull();
  });
});

describe('describeCadence', () => {
  it.each([
    [{ frequency: 'minute' }, 'Every minute'],
    [{ frequency: 'hour', minutes: 15 }, 'Hourly at :15'],
    [{ frequency: 'day', hour: '8:00 AM' }, 'Daily at 8:00 AM'],
    [{ frequency: 'week', day: 'Monday', hour: '8:00 AM' }, 'Weekly on Monday at 8:00 AM'],
    [{ frequency: 'month', date: 14, hour: '8:00 AM' }, 'Monthly on day 14 at 8:00 AM'],
  ])('describes %o in words', (details, expected) => {
    expect(describeCadence({ type: 'interval', details })).toBe(expected);
  });

  it('falls back to the raw expression for a cron schedule', () => {
    expect(
      describeCadence({
        type: 'cron',
        details: { minute: '30', hours: '2', dayOfMonth: '*', month: '*', dayOfWeek: '1' },
      })
    ).toBe('30 2 * * 1');
  });

  it('does not throw on an unrecognisable schedule', () => {
    expect(describeCadence({ type: 'interval', details: {} })).toBe('Unknown schedule');
  });
});

describe('nextRuns', () => {
  const from = new Date('2026-09-25T00:00:00.000Z');

  it('returns the requested number of future occurrences', () => {
    const runs = nextRuns('* * * * *', 'UTC', 3, from);
    expect(runs.map((run) => run.toISOString())).toEqual([
      '2026-09-25T00:01:00.000Z',
      '2026-09-25T00:02:00.000Z',
      '2026-09-25T00:03:00.000Z',
    ]);
  });

  it('resolves occurrences in the schedule timezone, not the server one', () => {
    const [first] = nextRuns('0 8 * * *', 'Asia/Kolkata', 1, from);
    expect(first.toISOString()).toBe('2026-09-25T02:30:00.000Z');
  });

  it('returns nothing for an invalid expression instead of throwing', () => {
    expect(nextRuns('0 8.5 * * *', 'UTC', 3, from)).toEqual([]);
  });

  it('returns nothing when there is no expression at all', () => {
    expect(nextRuns(null, 'UTC', 3, from)).toEqual([]);
  });

  // cron-parser, and so BullMQ registration, rejects an unknown zone: such a schedule never fires.
  it('returns nothing when the timezone is unusable', () => {
    expect(nextRuns('0 8 * * *', 'Not/AZone', 3, from)).toEqual([]);
  });

  it('resolves in UTC when no timezone is stored', () => {
    const runs = nextRuns('0 8 * * *', '', 1, from);
    expect(runs.map((run) => run.toISOString())).toEqual(['2026-09-25T08:00:00.000Z']);
  });
});
