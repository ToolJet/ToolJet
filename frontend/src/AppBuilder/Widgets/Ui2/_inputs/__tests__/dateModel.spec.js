import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import dayjs from 'dayjs';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';

const JUNK = [undefined, null, '', '  ', {}, [], [1, 'a', null], NaN, Infinity, -1e308, 1e308, true, 'zzz', () => 1];

describe('time', () => {
  it('parses and formats times', () => {
    expect(M.parseTime('14:30')).toBe(870);
    expect(M.parseTime('2:30 pm')).toBe(870);
    expect(M.parseTime('12am')).toBe(0);
    expect(M.parseTime('12:15 PM')).toBe(735);
    expect(M.parseTime('2026-10-09T08:05:00Z')).toBe(485);
    ['25:00', '13pm', '10:75', 'noon', null, {}, -5, NaN].forEach((v) => expect(M.parseTime(v)).toBeNull());
    expect(M.toHHmm(870)).toBe('14:30');
    expect(M.formatTime(870)).toBe('2:30 PM');
    expect(M.formatTime(0)).toBe('12:00 AM');
    expect(M.formatTime(870, true)).toBe('14:30');
    expect(M.is24h('24h')).toBe(true);
    expect(M.is24h('HH:mm')).toBe(true);
    expect(M.is24h('hh:mm a')).toBe(false);
    expect(M.is24h(undefined)).toBe(false);
  });

  it('lists slots within bounds', () => {
    expect(M.timeSlots(30, '09:00', '10:30').map(M.toHHmm)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    expect(M.timeSlots(15, '11:00', '09:00')[0]).toBe(540);
    expect(M.timeSlots('junk')).toHaveLength(96);
    expect(M.minuteOptions(20)).toEqual([0, 20, 40]);
    expect(M.clampTime(100, M.timeBounds('09:00', '17:00'))).toBe(540);
  });
});

describe('date and time', () => {
  it('parses many shapes', () => {
    expect(M.parseDateTime('2026-10-09 14:30').format('YYYY-MM-DDTHH:mm')).toBe('2026-10-09T14:30');
    expect(M.parseDateTime('2026-10-09T14:30').hour()).toBe(14);
    expect(M.parseDateTime('09 Oct 2026 2:30 PM', 'DD MMM YYYY h:mm A').format('HH:mm')).toBe('14:30');
    const ms = dayjs('2026-10-09T14:30').valueOf();
    expect(M.parseDateTime(ms).valueOf()).toBe(ms);
    expect(M.parseDateTime(ms / 1000).valueOf()).toBe(ms);
    ['nope', {}, [], true, NaN, '2026-13-45'].forEach((v) => expect(M.parseDateTime(v)).toBeNull());
  });

  it('exposes value, date, time and timestamp', () => {
    const d = M.parseDateTime('2026-10-09 14:30');
    expect(M.dateTimeExposed(d, 'DD MMM YYYY h:mm A')).toEqual({
      value: '2026-10-09T14:30',
      selectedDate: '2026-10-09',
      selectedTime: '14:30',
      unixTimestamp: d.valueOf(),
      displayValue: '09 Oct 2026 2:30 PM',
    });
    expect(M.dateTimeExposed(null).value).toBe('');
    expect(M.safeFormat(d, {})).toBe('09 Oct 2026 2:30 PM');
  });

  it('checks dates against min, max and disabled dates', () => {
    const rules = M.dateRules({ minDate: '2026-10-05', maxDate: '2026-10-20', disabledDates: ['2026-10-10', 'junk'] });
    expect(M.dateProblem(M.parseDateTime('2026-10-09 23:00'), rules)).toBe('');
    expect(M.dateProblem(M.parseDateTime('2026-10-01'), rules)).toMatch(/on or after/);
    expect(M.dateProblem(M.parseDateTime('2026-10-21'), rules)).toMatch(/on or before/);
    expect(M.dateProblem(M.parseDateTime('2026-10-10 12:00'), rules)).toMatch(/not available/);
    JUNK.forEach((v) =>
      expect(() => M.dateRules({ minDate: v, maxDate: v, disabledDates: v, format: v })).not.toThrow()
    );
    expect(M.atTime(dayjs('2026-10-09'), 870).format('YYYY-MM-DD HH:mm')).toBe('2026-10-09 14:30');
  });
});

// Audit 76: the rules once kept only the first 1,000 disabled dates. Every one is a rule.
describe('disabled dates', () => {
  const days = (n) => Array.from({ length: n }, (_, i) => dayjs('2020-01-01').add(i, 'day').format('YYYY-MM-DD'));

  it('keeps every disabled date, however long the list', () => {
    const rules = M.dateRules({ disabledDates: [...days(5000), '2040-05-05'] });
    expect(M.dateProblem(M.parseDateTime('2040-05-05'), rules)).toMatch(/not available/);
    expect(M.dateProblem(M.parseDateTime('2040-05-06'), rules)).toBe('');
  });

  it('gives the calendar one matcher that blocks each of them', () => {
    const rules = M.dateRules({ minDate: '2019-01-01', disabledDates: [...days(5000), '2040-05-05'] });
    const matchers = M.dayMatchers(rules);
    expect(matchers).toHaveLength(2);
    const blocks = matchers.find((m) => typeof m === 'function');
    expect(blocks(new Date(2040, 4, 5))).toBe(true);
    expect(blocks(new Date(2040, 4, 6))).toBe(false);
    expect(M.dayMatchers(M.dateRules({}))).toEqual([]);
  });
});

// Audit 48: text naming a day or time that does not exist became another date (30 February as 2 March, hour 25 as
// 01:00 the next day). It is not a date.
describe('impossible dates', () => {
  it.each([
    '2026-02-29T09:30',
    '2026-02-30T09:30',
    '2026-13-01T09:30',
    '2026-10-09T25:30',
    '2026-10-09T09:60',
    '2026-10-32',
    '2026-00-10',
  ])('%s is not a date', (text) => {
    expect(M.parseDateTime(text)).toBeNull();
  });

  it.each([
    ['2028-02-29T09:30', '2028-02-29T09:30'],
    ['2026-10-09T14:30:15', '2026-10-09T14:30'],
    ['2026-10-09', '2026-10-09T00:00'],
  ])('%s still is', (text, local) => {
    expect(M.parseDateTime(text).format('YYYY-MM-DDTHH:mm')).toBe(local);
  });

  it('still reads an offset or a fraction of a second', () => {
    expect(M.parseDateTime('2026-10-09T14:30:00.000Z').valueOf()).toBe(Date.UTC(2026, 9, 9, 14, 30));
    expect(M.parseDateTime('2026-10-09T14:30:00+05:30').valueOf()).toBe(Date.UTC(2026, 9, 9, 9, 0));
  });
});

// Audit 69: the display format was tried before ISO, so under 'YYYY-DD-MM' the ISO text 2026-10-09 14:30 read as
// 10 September. ISO text is ISO; a format given with the value (an action's argument) still wins.
describe('which format reads a value', () => {
  it('reads ISO text as ISO whatever the display format', () => {
    expect(M.parseDateTime('2026-10-09 14:30', 'YYYY-DD-MM HH:mm').format('YYYY-MM-DD')).toBe('2026-10-09');
    expect(M.parseDateTime('2026-21-10 14:30', 'YYYY-DD-MM HH:mm').format('YYYY-MM-DD')).toBe('2026-10-21');
    expect(M.parseDateTime('21/10/2026', 'DD/MM/YYYY').format('YYYY-MM-DD')).toBe('2026-10-21');
  });

  it('reads a value in the format given with it first', () => {
    expect(M.parseDateTime('2026-10-09 14:30', 'YYYY-DD-MM HH:mm', true).format('YYYY-MM-DD')).toBe('2026-09-10');
  });
});

// One meaning for a minute step: a time every that many minutes from midnight.
describe('minute steps', () => {
  it('offers each hour the minutes that fall on the step', () => {
    expect(M.minuteOptions(45, 9)).toEqual([0, 45]);
    expect(M.minuteOptions(45, 10)).toEqual([30]);
    expect(M.minuteOptions(45, 11)).toEqual([15]);
    expect(M.minuteOptions(15, 13)).toEqual([0, 15, 30, 45]);
    expect(M.minuteOptions(60, 7)).toEqual([0]);
    expect(M.minuteOptions(20)).toEqual([0, 20, 40]);
  });

  it('agrees with the list of times', () => {
    const fromColumns = [9, 10, 11].flatMap((h) => M.minuteOptions(45, h).map((m) => h * 60 + m));
    expect(fromColumns.filter((t) => t <= 690)).toEqual(M.timeSlots(45, '09:00', '11:30'));
  });
});
