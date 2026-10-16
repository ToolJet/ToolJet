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
